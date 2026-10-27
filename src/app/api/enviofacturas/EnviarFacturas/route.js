import { NextResponse } from 'next/server';
import { enviarFacturasEnLote } from '@/lib/services/envioFacturaService';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Hasta 60 segundos para procesar descargas de plantillas, PDF y envío de correos en Vercel

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

        // Si se configura delegar al servicio en Go (USE_BACKEND_ENVIO=true), reenviar la petición al backend central
        if (process.env.USE_BACKEND_ENVIO === 'true') {
            const baseRaw = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.sandbox.wisefacturacion.com';
            const baseUrl = (baseRaw.startsWith('http') ? baseRaw : `https://${baseRaw}`).replace(/\/+$/, '');
            const targetUrl = `${baseUrl}/api/enviofacturas/EnviarFacturas`;

            const authHeader = request.headers.get('authorization') || '';
            const headers = { 'Content-Type': 'application/json' };
            if (authHeader) headers['Authorization'] = authHeader;

            const backendRes = await fetch(targetUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify(ids)
            });

            const data = await backendRes.json().catch(() => ({}));
            return NextResponse.json(data, { status: backendRes.status });
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
