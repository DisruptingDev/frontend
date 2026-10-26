import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding Permisos Módulo Descarga Masiva SAT ---');

    // 1. Obtener o crear la sección
    let seccion = await prisma.seccion_permisos.findFirst({
        where: { clave: 'DESCARGA_MASIVA' }
    });

    if (!seccion) {
        seccion = await prisma.seccion_permisos.create({
            data: {
                clave: 'DESCARGA_MASIVA',
                descripcion: 'Módulo de Descarga Masiva de Facturas SAT'
            }
        });
        console.log('Sección DESCARGA_MASIVA creada exitosamente.');
    } else {
        console.log('Sección DESCARGA_MASIVA ya existe:', seccion.id.toString());
    }

    // 2. Permisos
    const permisos = [
        {
            clave: 'DESCARGA_MASIVA_ACCESO',
            descripcion: 'Acceso general y consulta de peticiones de Descarga Masiva SAT'
        },
        {
            clave: 'DESCARGA_MASIVA_SOLICITAR',
            descripcion: 'Solicitar descargas masivas de CFDI y Metadata al SAT'
        },
        {
            clave: 'DESCARGA_MASIVA_FIEL',
            descripcion: 'Gestionar empresas, subir y configurar archivos FIEL (.cer/.key)'
        }
    ];

    for (const p of permisos) {
        const existe = await prisma.permisos.findFirst({
            where: { clave: p.clave }
        });

        if (!existe) {
            const nuevo = await prisma.permisos.create({
                data: {
                    clave: p.clave,
                    descripcion: p.descripcion,
                    seccion_id: seccion.id
                }
            });
            console.log(`Permiso creado: ${nuevo.clave} (ID: ${nuevo.id.toString()})`);
        } else {
            console.log(`Permiso ya registrado: ${existe.clave} (ID: ${existe.id.toString()})`);
        }
    }

    console.log('--- Fin Seeding Permisos Descarga Masiva ---');
}

main()
    .catch((err) => {
        console.error('Error al sembrar permisos:', err);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
