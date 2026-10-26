import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Asegurar sección de permisos de Descarga Masiva
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
        }

        // 2. Asegurar permisos del módulo
        const permisosModulo = [
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
            }
        }

        // 3. Obtener todos los permisos de la sección formateados para el panel de Roles y Permisos
        const permisosFormateados = await prisma.permisos.findMany({
            where: { seccion_id: seccion.id },
            include: { seccion: true },
            orderBy: { id: 'asc' }
        });

        const dataFinal = permisosFormateados.map(p => ({
            ID: Number(p.id),
            Clave: p.clave,
            Descripcion: p.descripcion,
            SeccionID: Number(p.seccion_id),
            Seccion: {
                ID: Number(p.seccion.id),
                Clave: p.seccion.clave,
                Descripcion: p.seccion.descripcion
            }
        }));

        return NextResponse.json(dataFinal, { status: 200 });

    } catch (error) {
        console.error('Error seeding/fetching permisos descarga masiva:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
