import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

        // Buscar el acuse en la tabla acuse_cancelacions donde comprobante_id == id
        const acuse = await prisma.acuse_cancelacions.findFirst({
            where: { comprobante_id: BigInt(id) },
            select: { acuse_base64: true, uuid: true, folio_fiscal: true }
        });

        if (!acuse) {
            return NextResponse.json({ error: 'Acuse de cancelación no encontrado para esta factura' }, { status: 404 });
        }

        if (!acuse.acuse_base64) {
            return NextResponse.json({ error: 'La factura no tiene el archivo PDF del acuse' }, { status: 404 });
        }

        // El base64 podría tener el prefijo de data URI (ej. data:application/pdf;base64,...)
        let base64Data = acuse.acuse_base64;
        if (base64Data.includes('base64,')) {
            base64Data = base64Data.split('base64,')[1];
        }

        const pdfBuffer = Buffer.from(base64Data, 'base64');
        const filename = acuse.folio_fiscal ? `acuse_cancelacion_${acuse.folio_fiscal}.pdf` : `acuse_cancelacion_${acuse.uuid}.pdf`;

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        });
    } catch (error) {
        console.error('Error al obtener el acuse de cancelación:', error);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
