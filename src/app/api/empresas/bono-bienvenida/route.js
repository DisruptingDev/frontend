import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Decodifica un JWT básico para extraer claims de sesión en caso de ser necesario
 */
function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    const parts = raw.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

/**
 * POST /api/empresas/bono-bienvenida
 *
 * Otorga de forma automática 5 folios de bienvenida al registrar la PRIMERA empresa de un grupo.
 * Aplica:
 *  1) Validación estricta para que SOLO se otorgue a la primera empresa del grupo.
 *  2) Creación / asignación directa de 5 timbres a la Serie predeterminada de la empresa (lista para timbrar).
 *  3) Suma de 5 timbres al saldo de paquetes del Grupo (timbres_disponibles_paquetes).
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const authHeader = request.headers.get('authorization') || '';
    const payload = decodeJwtPayload(authHeader);

    // Intentar resolver grupoId desde el cuerpo, header o token
    let grupoId = body.grupoId || body.grupo_id;
    if (!grupoId && payload) {
      grupoId = payload.grupo_id || payload.grupoId || payload.GrupoID;
    }

    const emisorRfc = body.rfc || body.Rfc;
    const emisorNombre = body.nombre || body.Nombre;

    // Si aún no tenemos grupoId pero tenemos el email en el payload del token
    if (!grupoId && payload?.email) {
      const user = await prisma.usuarios.findFirst({
        where: { email: payload.email },
        select: { grupo_id: true }
      });
      if (user?.grupo_id) {
        grupoId = user.grupo_id;
      }
    }

    // Si no tenemos grupoId pero tenemos RFC de la empresa creada, buscar el grupo del emisor
    let emisor = null;
    if (body.emisorId) {
      emisor = await prisma.emisors.findUnique({
        where: { id: BigInt(body.emisorId) }
      });
      if (emisor && !grupoId) {
        grupoId = emisor.grupo_id;
      }
    } else if (emisorRfc) {
      emisor = await prisma.emisors.findFirst({
        where: { rfc: emisorRfc },
        orderBy: { id: 'desc' }
      });
      if (emisor && !grupoId) {
        grupoId = emisor.grupo_id;
      }
    }

    if (!grupoId) {
      return NextResponse.json(
        { error: 'No se pudo determinar el grupo para asignar el bono.' },
        { status: 400 }
      );
    }

    const gId = BigInt(grupoId);

    // 1. Contar cuántas empresas (emisores) tiene este grupo
    const totalEmisoresGrupo = await prisma.emisors.count({
      where: { grupo_id: gId }
    });

    // REGLA CLAVE: Solo se otorga si es la PRIMERA empresa del grupo (<= 1)
    if (totalEmisoresGrupo > 1) {
      return NextResponse.json({
        bonoAplicado: false,
        message: 'El bono de bienvenida aplica únicamente a la primera empresa registrada del grupo.',
        totalEmisores: totalEmisoresGrupo
      });
    }

    // Si no encontramos emisor anteriormente, obtener la única empresa del grupo
    if (!emisor) {
      emisor = await prisma.emisors.findFirst({
        where: { grupo_id: gId },
        orderBy: { id: 'asc' }
      });
    }

    if (!emisor) {
      return NextResponse.json(
        { error: 'No se encontró la empresa recién registrada en el grupo.' },
        { status: 404 }
      );
    }

    // 2. Buscar prioritariamente la Serie 'F' (serie predeterminada generada en automático al dar de alta la empresa)
    let serieExistente = await prisma.series.findFirst({
      where: {
        emisor_id: emisor.id,
        clave: 'F'
      }
    });

    // Si aún no estuviera creada la serie F, buscar si existe alguna otra serie del emisor
    if (!serieExistente) {
      serieExistente = await prisma.series.findFirst({
        where: { emisor_id: emisor.id }
      });
    }

    if (serieExistente && (serieExistente.timbres_disponibles || 0) >= 5) {
      return NextResponse.json({
        bonoAplicado: false,
        message: 'La empresa ya cuenta con folios asignados previamente en la serie ' + serieExistente.clave,
        serie: serieExistente.clave,
        timbres: serieExistente.timbres_disponibles
      });
    }

    const FOLIOS_REGALO = 5;

    // 3. Transacción para asegurar consistencia atómica:
    //    a) Asignar 5 folios a la Serie 'F' del emisor (o crearla con clave 'F' si aún no existía)
    //    b) Incrementar timbres_disponibles_paquetes del grupo (+5)
    const resultado = await prisma.$transaction(async (tx) => {
      let serieFinal;
      if (serieExistente) {
        serieFinal = await tx.series.update({
          where: { id: serieExistente.id },
          data: {
            timbres_disponibles: (serieExistente.timbres_disponibles || 0) + FOLIOS_REGALO
          }
        });
      } else {
        serieFinal = await tx.series.create({
          data: {
            clave: 'F',
            descripcion: 'F',
            ultimo_folio: BigInt(0),
            timbres_disponibles: FOLIOS_REGALO,
            emisor_id: emisor.id,
            tipo_comprobante: 'I'
          }
        });
      }

      // Actualizar contador global del grupo
      const grupoActual = await tx.grupos.findUnique({
        where: { id: gId },
        select: { timbres_disponibles_paquetes: true }
      });

      const nuevoSaldoGrupo = (grupoActual?.timbres_disponibles_paquetes || 0) + FOLIOS_REGALO;
      await tx.grupos.update({
        where: { id: gId },
        data: {
          timbres_disponibles_paquetes: nuevoSaldoGrupo
        }
      });

      return {
        serie: serieFinal,
        saldoGrupo: nuevoSaldoGrupo
      };
    });

    return NextResponse.json({
      bonoAplicado: true,
      foliosOtorgados: FOLIOS_REGALO,
      empresaId: emisor.id.toString(),
      empresaNombre: emisor.nombre,
      empresaRfc: emisor.rfc,
      serieClave: resultado.serie.clave,
      timbresSerie: resultado.serie.timbres_disponibles,
      saldoGrupo: resultado.saldoGrupo,
      message: '¡Felicidades! Se han asignado 5 folios sin costo a tu primera empresa y cuenta.'
    });

  } catch (error) {
    console.error('Error en /api/empresas/bono-bienvenida:', error);
    return NextResponse.json(
      { error: 'Error interno al procesar el bono de bienvenida', detalle: error.message },
      { status: 500 }
    );
  }
}
