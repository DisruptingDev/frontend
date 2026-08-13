import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
    try {
        // 1. Asegurar sección de permisos de Cobranza
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
        }

        // 2. Asegurar permisos del módulo
        const permisosCobranza = [
            { clave: 'PAGOS_VER', descripcion: 'Ver Dashboard de Cobranza y Consultar Pagos' },
            { clave: 'ALUMNOS_ADMINISTRAR', descripcion: 'Administrar Alumnos/Clientes y Perfil Fiscal' },
            { clave: 'CARGOS_GENERAR', descripcion: 'Generar Cargos, Colegiaturas y Referencias Bancarias Únicas' },
            { clave: 'CONCILIACION_EJECUTAR', descripcion: 'Subir y Procesar Archivos/Layouts Bancarios' },
            { clave: 'FACTURACION_AUTOMATICA', descripcion: 'Disparar Facturación Automática (CFDI 4.0)' },
            { clave: 'REPORTES_EXPORTAR', descripcion: 'Exportar Reportes Financieros y Cartera Vencida (Excel/PDF)' }
        ];

        for (const item of permisosCobranza) {
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

        // 3. Obtener todos los permisos de la sección formateados para la UI de Roles y Permisos
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
        console.error('Error seeding/fetching permisos cobranza:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
