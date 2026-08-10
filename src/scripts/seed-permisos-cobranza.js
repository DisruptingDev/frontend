import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando seeding de permisos para el módulo de Cobranza y Conciliación...');

    // 1. Crear o recuperar la sección de permisos
    let seccion = await prisma.seccion_permisos.findFirst({
        where: { clave: 'COBRANZA_CONCILIACION' }
    });

    if (!seccion) {
        seccion = await prisma.seccion_permisos.create({
            data: {
                clave: 'COBRANZA_CONCILIACION',
                descripcion: 'Módulo de Cobranza, Conciliación Bancaria y Alumnos'
            }
        });
        console.log('Sección COBRANZA_CONCILIACION creada.');
    } else {
        console.log('Sección COBRANZA_CONCILIACION ya existe.');
    }

    // 2. Permisos granulares del módulo
    const permisosModulo = [
        { clave: 'PAGOS_VER', descripcion: 'Ver Dashboard de Cobranza y Consultar Pagos' },
        { clave: 'ALUMNOS_ADMINISTRAR', descripcion: 'Administrar Alumnos/Clientes y Perfil Fiscal (RFC vs Público en General)' },
        { clave: 'CARGOS_GENERAR', descripcion: 'Generar Cargos, Colegiaturas y Referencias Bancarias Únicas' },
        { clave: 'CONCILIACION_EJECUTAR', descripcion: 'Subir y Procesar Archivos/Layouts Bancarios (BBVA, Banamex, Santander, etc.)' },
        { clave: 'FACTURACION_AUTOMATICA', descripcion: 'Disparar Facturación Automática (CFDI 4.0 individual o Factura Global)' },
        { clave: 'REPORTES_EXPORTAR', descripcion: 'Exportar Reportes Financieros y Cartera Vencida (Excel/PDF)' },
    ];

    for (const item of permisosModulo) {
        const existe = await prisma.permisos.findFirst({
            where: { clave: item.clave }
        });

        if (!existe) {
            await prisma.permisos.create({
                data: {
                    clave: item.clave,
                    descripcion: item.descripcion,
                    seccion_id: seccion.id
                }
            });
            console.log(`Permiso ${item.clave} creado.`);
        } else {
            console.log(`Permiso ${item.clave} ya existe.`);
        }
    }

    console.log('Seeding de permisos completado exitosamente.');
}

main()
    .catch((e) => {
        console.error('Error durante el seeding:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
