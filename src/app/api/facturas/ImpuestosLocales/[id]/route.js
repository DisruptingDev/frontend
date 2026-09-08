import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeBigIntsAndDecimals } from '@/lib/services/servicioFacturacion';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

        const compId = BigInt(id);

        const impLocRows = await prisma.$queryRaw`
            SELECT il.id, il.version, il.totalde_retenciones, il.totalde_traslados, il.complemento_id
            FROM complementos c
            JOIN impuestos_locales il ON il.complemento_id = c.id
            WHERE c.comprobante_id = ${compId}
            LIMIT 1
        `;

        if (!impLocRows || impLocRows.length === 0) {
            return NextResponse.json({
                ImpuestosLocales: null,
                impuestosLocales: []
            });
        }

        const il = impLocRows[0];
        const ilId = il.id;

        const trasladosRows = await prisma.$queryRaw`
            SELECT id, imp_loc_trasladado, tasade_traslado, importe
            FROM traslado_locals
            WHERE impuestos_locales_id = ${ilId}
        `;

        const retencionesRows = await prisma.$queryRaw`
            SELECT id, imp_loc_retenido, tasade_retencion, importe
            FROM retencion_locals
            WHERE impuestos_locales_id = ${ilId}
        `;

        const trasladosLocales = (trasladosRows || []).map((t, idx) => ({
            id: `tras_${t.id || idx}_${Date.now()}`,
            Tipo: 'Traslado',
            Nombre: t.imp_loc_trasladado || 'ISH',
            ImpLocTrasladado: t.imp_loc_trasladado || 'ISH',
            Tasa: Number(t.tasade_traslado || 0),
            TasaString: String(t.tasade_traslado || '0.00'),
            TasadeTraslado: Number(t.tasade_traslado || 0),
            Importe: Number(t.importe || 0),
            ImporteString: String(Number(t.importe || 0).toFixed(2))
        }));

        const retencionesLocales = (retencionesRows || []).map((r, idx) => ({
            id: `ret_${r.id || idx}_${Date.now()}`,
            Tipo: 'Retencion',
            Nombre: r.imp_loc_retenido || 'Impuesto Cedular',
            ImpLocRetenido: r.imp_loc_retenido || 'Impuesto Cedular',
            Tasa: Number(r.tasade_retencion || 0),
            TasaString: String(r.tasade_retencion || '0.00'),
            TasadeRetencion: Number(r.tasade_retencion || 0),
            Importe: Math.abs(Number(r.importe || 0)),
            ImporteString: String(Math.abs(Number(r.importe || 0)).toFixed(2))
        }));

        const normalizedList = [...trasladosLocales, ...retencionesLocales];

        const responseData = {
            ImpuestosLocales: {
                Version: il.version || '1.0',
                TotaldeRetenciones: String(il.totalde_retenciones || '0.00'),
                TotaldeTraslados: String(il.totalde_traslados || '0.00'),
                TrasladosLocales: trasladosLocales,
                RetencionesLocales: retencionesLocales
            },
            impuestosLocales: normalizedList
        };

        return NextResponse.json(serializeBigIntsAndDecimals(responseData));
    } catch (error) {
        console.error('Error en GET /api/facturas/ImpuestosLocales/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
