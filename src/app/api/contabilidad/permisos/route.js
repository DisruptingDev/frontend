import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Asegurar sección de permisos de Contabilidad Fiscal
        let seccion = await prisma.seccion_permisos.findFirst({
            where: { clave: 'CONTABILIDAD_FISCAL' }
        });

        if (!seccion) {
            seccion = await prisma.seccion_permisos.create({
                data: {
                    clave: 'CONTABILIDAD_FISCAL',
                    descripcion: 'Módulo de Contabilidad Fiscal, IVA y DIOT'
                }
            });
        }

        // 2. Permisos granulares del módulo de Contabilidad
        const permisosContabilidad = [
            {
                clave: 'CONTABILIDAD_ACCESO',
                descripcion: 'Acceso general al módulo de Contabilidad Fiscal e IVA'
            },
            {
                clave: 'CONTABILIDAD_CALCULO_IVA',
                descripcion: 'Consultar cálculo de IVA (Trasladado vs Acreditable, a Favor o a Pagar)'
            },
            {
                clave: 'CONTABILIDAD_DIOT_GENERAR',
                descripcion: 'Generar y exportar la declaración informativa DIOT (.txt oficial SAT)'
            },
            {
                clave: 'CONTABILIDAD_IMPORTAR_XML',
                descripcion: 'Sincronizar y procesar facturas recibidas de gastos desde el SAT'
            }
        ];

        for (const item of permisosContabilidad) {
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
        console.error('Error seeding/fetching permisos contabilidad:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
