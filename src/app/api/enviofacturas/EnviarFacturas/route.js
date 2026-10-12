import { NextResponse } from 'next/server';
import { enviarFacturasEnLote } from '@/lib/services/envioFacturaService';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        
        // Puede recibir un arreglo de IDs directo [1, 2] o un objeto { Facturas_ID: [1, 2] } o { ids: [1, 2] }
        let ids = [];
        if (Array.isArray(body)) {
            ids = body;
        } else if (body && Array.isArray(body.Facturas_ID)) {
            ids = body.Facturas_ID;
        } else if (body && Array.isArray(body.ids)) {
            ids = body.ids;
        } else if (body && body.id) {
            ids = [body.id];
        }

        if (!ids || ids.length === 0) {
            return NextResponse.json({ error: 'No se enviaron IDs de facturas válidos.' }, { status: 400 });
        }

        const resultado = await enviarFacturasEnLote(ids);

        if (resultado.fallidos > 0 && resultado.enviados === 0) {
            return NextResponse.json({
                error: `No se pudo enviar ninguna factura: ${resultado.errores.map(e => e.error).join(', ')}`,
                detalles: resultado
            }, { status: 500 });
        }

        return NextResponse.json({
            message: `Se enviaron exitosamente ${resultado.enviados} de ${resultado.total} facturas por correo.`,
            ...resultado
        }, { status: 200 });

    } catch (error) {
        console.error('Error en POST /api/enviofacturas/EnviarFacturas:', error);
        return NextResponse.json({ error: error.message || 'Error interno al enviar facturas' }, { status: 500 });
    }
}
