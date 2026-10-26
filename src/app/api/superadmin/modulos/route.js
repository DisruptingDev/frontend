import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// Módulos del sistema y sus claves de permisos correspondientes
const MODULOS_SISTEMA = {
  FACTURACION: {
    nombre: 'Facturación CFDI 4.0',
    descripcion: 'Emisión, timbrado, cancelación, nóminas y complementos',
    color: '#0288d1',
    permisos: [
      'ver_facturas', 'crear_facturas', 'editar_facturas', 'timbrar_facturas',
      'cancelar_facturas', 'enviar_facturas', 'importar_facturas', 'importar_xml',
      'ver_nominas', 'crear_nominas', 'eliminar_facturas', 'ver_doctos_relacionados',
      'crear_emisores', 'editar_emisores', 'ver_emisores',
      'crear_receptores', 'editar_receptores', 'ver_receptores',
      'crear_conceptos', 'ver_conceptos',
      'ver_series', 'crear_series',
      'subir_csd', 'editar_csd'
    ]
  },
  DESCARGA_MASIVA: {
    nombre: 'Descarga Masiva SAT',
    descripcion: 'Peticiones masivas XML y Metadata al SAT, gestión de FIEL',
    color: '#7b1fa2',
    permisos: [
      'DESCARGA_MASIVA_ACCESO',
      'DESCARGA_MASIVA_SOLICITAR',
      'DESCARGA_MASIVA_FIEL'
    ]
  },
  CONTABILIDAD_FISCAL: {
    nombre: 'Contabilidad Fiscal e IVA',
    descripcion: 'Cálculo de IVA (Trasladado vs Acreditable), DIOT y facturas recibidas',
    color: '#2e7d32',
    permisos: [
      'CONTABILIDAD_ACCESO',
      'CONTABILIDAD_CALCULO_IVA',
      'CONTABILIDAD_DIOT_GENERAR',
      'CONTABILIDAD_IMPORTAR_XML'
    ]
  },
  COBRANZA: {
    nombre: 'Cobranza y Conciliación',
    descripcion: 'Alumnos, cargos, layouts bancarios y conciliación',
    color: '#e65100',
    permisos: [
      'PAGOS_VER',
      'ALUMNOS_ADMINISTRAR',
      'CARGOS_GENERAR',
      'CONCILIACION_EJECUTAR',
      'FACTURACION_AUTOMATICA',
      'REPORTES_EXPORTAR'
    ]
  }
};

/**
 * GET: Obtener lista de cuentas / grupos con el estado de sus módulos habilitados
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const grupoIdParam = searchParams.get('grupoId');

    // 1. Obtener catálogo de todos los permisos con su clave
    const todosPermisos = await prisma.permisos.findMany({
      select: { id: true, clave: true }
    });
    const permisoMap = new Map();
    todosPermisos.forEach(p => permisoMap.set(p.clave, p.id));

    // Si se pide un grupo específico
    let whereGrupo = '';
    if (grupoIdParam) {
      whereGrupo = `WHERE g.id = ${parseInt(grupoIdParam)}`;
    }

    // 2. Obtener grupos y sus usuarios propietarios/admin
    const grupos = await prisma.$queryRawUnsafe(`
      SELECT 
        g.id as grupo_id,
        g.nombre as grupo_nombre,
        u.id as usuario_id,
        u.nombre as usuario_nombre,
        u.email as usuario_email,
        r.id as rol_admin_id,
        r.clave as rol_admin_clave
      FROM grupos g
      LEFT JOIN usuarios u ON u.grupo_id = g.id
      LEFT JOIN rols r ON r.grupo_id = g.id AND r.clave = 'Admin' AND r.deleted_at IS NULL
      ${whereGrupo}
      ORDER BY g.id DESC;
    `);

    // Agrupar por grupo_id para consolidar usuarios y rol Admin
    const gruposMap = new Map();
    for (const row of grupos) {
      const gId = row.grupo_id.toString();
      if (!gruposMap.has(gId)) {
        gruposMap.set(gId, {
          grupoId: Number(row.grupo_id),
          grupoNombre: row.grupo_nombre || `Grupo #${gId}`,
          usuarios: [],
          rolAdminId: row.rol_admin_id ? Number(row.rol_admin_id) : null,
          modulos: {
            FACTURACION: false,
            DESCARGA_MASIVA: false,
            CONTABILIDAD_FISCAL: false,
            COBRANZA: false
          }
        });
      }
      const gObj = gruposMap.get(gId);
      if (row.usuario_id && !gObj.usuarios.some(u => u.id === Number(row.usuario_id))) {
        gObj.usuarios.push({
          id: Number(row.usuario_id),
          nombre: row.usuario_nombre,
          email: row.usuario_email
        });
      }
    }

    // 3. Para cada grupo que tiene rol Admin, consultar qué permisos tiene asignados
    const rolAdminIds = Array.from(gruposMap.values())
      .map(g => g.rolAdminId)
      .filter(Boolean);

    let rolPermisos = [];
    if (rolAdminIds.length > 0) {
      rolPermisos = await prisma.$queryRawUnsafe(`
        SELECT rp.rol_id, p.clave
        FROM rol_permisos rp
        JOIN permisos p ON p.id = rp.permiso_id
        WHERE rp.rol_id IN (${rolAdminIds.join(',')});
      `);
    }

    // Mapear qué roles tienen qué claves
    const rolPermisosSet = new Map();
    rolPermisos.forEach(rp => {
      const rId = Number(rp.rol_id);
      if (!rolPermisosSet.has(rId)) {
        rolPermisosSet.set(rId, new Set());
      }
      rolPermisosSet.get(rId).add(rp.clave);
    });

    // Determinar si cada módulo está habilitado para el grupo
    for (const g of gruposMap.values()) {
      const permisosAsignados = g.rolAdminId ? (rolPermisosSet.get(g.rolAdminId) || new Set()) : new Set();

      for (const [modClave, modDef] of Object.entries(MODULOS_SISTEMA)) {
        // Un módulo se considera habilitado si tiene al menos la clave principal o la mitad de sus permisos
        const clavePrincipal = modDef.permisos[0];
        const tienePrincipal = permisosAsignados.has(clavePrincipal);
        
        // También checamos si tiene permisos del módulo
        const count = modDef.permisos.filter(p => permisosAsignados.has(p)).length;
        g.modulos[modClave] = tienePrincipal || count > 0;
      }
    }

    return NextResponse.json({
      success: true,
      modulosDefinicion: MODULOS_SISTEMA,
      grupos: Array.from(gruposMap.values())
    });

  } catch (error) {
    console.error('Error al listar modulos de grupos:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Activar o Desactivar un módulo completo para un grupo (o todos sus roles)
 * Body: { grupoId, moduloClave, habilitar: true/false }
 */
export async function POST(req) {
  try {
    const body = await req.json();
    const { grupoId, moduloClave, habilitar } = body;

    if (!grupoId || !moduloClave || typeof habilitar !== 'boolean') {
      return NextResponse.json({ error: 'Parámetros inválidos' }, { status: 400 });
    }

    const modDef = MODULOS_SISTEMA[moduloClave];
    if (!modDef) {
      return NextResponse.json({ error: `Módulo desconocido: ${moduloClave}` }, { status: 400 });
    }

    // 1. Obtener los IDs de los permisos del módulo
    const permisosModulo = await prisma.permisos.findMany({
      where: {
        clave: { in: modDef.permisos }
      },
      select: { id: true, clave: true }
    });

    if (permisosModulo.length === 0) {
      return NextResponse.json({ error: 'No se encontraron permisos registrados para este módulo' }, { status: 404 });
    }

    const permisoIds = permisosModulo.map(p => p.id);

    // 2. Obtener todos los roles de este grupo (o al menos el rol Admin)
    const rolesGrupo = await prisma.rols.findMany({
      where: {
        grupo_id: BigInt(grupoId),
        deleted_at: null
      }
    });

    if (rolesGrupo.length === 0) {
      return NextResponse.json({ error: 'No se encontraron roles activos para este grupo' }, { status: 404 });
    }

    const rolAdmin = rolesGrupo.find(r => r.clave === 'Admin') || rolesGrupo[0];

    if (habilitar) {
      // HABILITAR: Asignar todos los permisos del módulo al rol Admin del grupo
      for (const pId of permisoIds) {
        const existe = await prisma.rol_permisos.findUnique({
          where: {
            rol_id_permiso_id: {
              rol_id: rolAdmin.id,
              permiso_id: pId
            }
          }
        });

        if (!existe) {
          await prisma.rol_permisos.create({
            data: {
              rol_id: rolAdmin.id,
              permiso_id: pId
            }
          });
        }
      }
    } else {
      // DESHABILITAR: Revocar todos los permisos del módulo de TODOS los roles del grupo
      // Para que ningún usuario del grupo tenga acceso al módulo deshabilitado
      const rolIds = rolesGrupo.map(r => r.id);
      
      await prisma.rol_permisos.deleteMany({
        where: {
          rol_id: { in: rolIds },
          permiso_id: { in: permisoIds }
        }
      });
    }

    return NextResponse.json({
      success: true,
      mensaje: `Módulo ${modDef.nombre} ${habilitar ? 'habilitado' : 'deshabilitado'} exitosamente para el grupo #${grupoId}`,
      grupoId,
      moduloClave,
      habilitar
    });

  } catch (error) {
    console.error('Error al actualizar módulo para el grupo:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
