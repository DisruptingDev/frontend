import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { sincronizarImpuestosLocales } from '@/lib/services/servicioImpuestosLocales';

export async function POST(request) {
    try {
        const body = await request.json();
        let comprobanteId = body.comprobante_id || body.id || body.ID;

        // Si no viene comprobante_id directo, buscar por serie, folio y emisor_id
        if (!comprobanteId && body.folio && body.emisor_id) {
            const comp = await prisma.comprobantes.findFirst({
                where: {
                    folio: String(body.folio),
                    emisor_id: BigInt(body.emisor_id),
                    ...(body.serie ? { serie: String(body.serie) } : {})
                },
                orderBy: { id: 'desc' }
            });
            if (comp) {
                comprobanteId = comp.id;
            }
        }

        // Si aún no se encuentra, intentar buscar el último comprobante creado para este emisor
        if (!comprobanteId && body.emisor_id) {
            const lastComp = await prisma.comprobantes.findFirst({
                where: { emisor_id: BigInt(body.emisor_id) },
                orderBy: { id: 'desc' }
            });
            if (lastComp) {
                comprobanteId = lastComp.id;
            }
        }

        if (!comprobanteId) {
            return NextResponse.json({ error: 'No se pudo determinar el comprobante para asociar los impuestos locales' }, { status: 400 });
        }

        const listaImpuestos = body.impuestosLocales || body.ImpuestosLocales || [];
        await sincronizarImpuestosLocales(comprobanteId, listaImpuestos);

        return NextResponse.json({ 
            success: true, 
            comprobante_id: comprobanteId.toString(),
            message: 'Impuestos locales guardados correctamente' 
        });
    } catch (error) {
        console.error('Error en POST /api/facturas/ImpuestosLocales/guardar:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
