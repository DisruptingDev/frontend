import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generarPdfBufferFicha, generarYEnviarFichaPorCorreo, generarHtmlFichaCargo } from '@/lib/services/fichaPdfEmailService';

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (obj instanceof Date) return isNaN(obj.getTime()) ? null : obj.toISOString();
    if (typeof obj === 'object') {
        if (obj.d && Array.isArray(obj.d) && obj.s !== undefined) return obj.toString();
        if (typeof obj.toNumber === 'function') return obj.toString();
        if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigIntsAndDecimals(value)])
        );
    }
    return obj;
}

// GET: Obtener Ficha de Cargo en PDF o JSON
export async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const format = searchParams.get('format');

        const cargo = await prisma.cargoAlumno.findUnique({
            where: { id: BigInt(id) },
            include: {
                alumno: { include: { receptor: true, emisor: true } },
                concepto: true
            }
        });

        if (!cargo) {
            return NextResponse.json({ error: 'Ficha de cargo no encontrada.' }, { status: 404 });
        }

        // Obtener detalles_items si existen en DB
        try {
            const raw = await prisma.$queryRawUnsafe(`SELECT detalles_items FROM "CargoAlumno" WHERE id = $1`, BigInt(id));
            if (raw && raw[0] && raw[0].detalles_items) {
                cargo.detalles_items = raw[0].detalles_items;
            }
        } catch (e) {
            console.warn('No se pudo obtener detalles_items:', e.message);
        }

        if (format === 'json') {
            return NextResponse.json(serializeBigIntsAndDecimals(cargo), { status: 200 });
        }

        if (format === 'html') {
            const html = generarHtmlFichaCargo(cargo);
            return new Response(html, {
                status: 200,
                headers: { 'Content-Type': 'text/html; charset=utf-8' }
            });
        }

        // Por defecto: Generar y devolver el PDF oficial
        const pdfBuffer = await generarPdfBufferFicha(cargo);
        const codigo = cargo.codigo_ficha || `F-${cargo.id}`;
        
        return new Response(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Ficha_Cargo_${codigo}.pdf"`
            }
        });

    } catch (error) {
        console.error('Error al generar PDF de Ficha:', error);
        return NextResponse.json({ error: 'Error al generar el documento PDF de la ficha: ' + error.message }, { status: 500 });
    }
}

// POST: Enviar / Re-enviar Ficha de Cargo en PDF por Correo Electrónico
export async function POST(request, { params }) {
    try {
        const { id } = params;
        let emailDestino = null;

        try {
            const body = await request.json();
            if (body && body.email_destino) {
                emailDestino = body.email_destino;
            }
        } catch (e) {
            // Body opcional
        }

        const cargo = await prisma.cargoAlumno.findUnique({
            where: { id: BigInt(id) },
            include: {
                alumno: { include: { receptor: true, emisor: true } },
                concepto: true
            }
        });

        if (!cargo) {
            return NextResponse.json({ error: 'Ficha de cargo no encontrada.' }, { status: 404 });
        }

        try {
            const raw = await prisma.$queryRawUnsafe(`SELECT detalles_items FROM "CargoAlumno" WHERE id = $1`, BigInt(id));
            if (raw && raw[0] && raw[0].detalles_items) {
                cargo.detalles_items = raw[0].detalles_items;
            }
        } catch (e) {}

        const resultado = await generarYEnviarFichaPorCorreo(cargo, emailDestino);

        if (resultado.correoEnviado) {
            return NextResponse.json({
                mensaje: `La ficha ${cargo.codigo_ficha || cargo.id} ha sido enviada exitosamente en PDF al correo ${resultado.email}.`,
                resultado
            }, { status: 200 });
        } else {
            return NextResponse.json({
                error: resultado.motivo || resultado.error || 'No se pudo enviar el correo electrónico.',
                resultado
            }, { status: 400 });
        }

    } catch (error) {
        console.error('Error al reenviar correo de Ficha:', error);
        return NextResponse.json({ error: 'Error al enviar correo de la ficha: ' + error.message }, { status: 500 });
    }
}

// DELETE: Eliminar Ficha de Cargo
export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        const cargo = await prisma.cargoAlumno.findUnique({
            where: { id: BigInt(id) }
        });

        if (!cargo) {
            return NextResponse.json({ error: 'Cargo/Ficha no encontrada.' }, { status: 404 });
        }

        if (cargo.estatus !== 'PENDIENTE') {
            return NextResponse.json({ error: 'Solo se pueden eliminar fichas con estatus PENDIENTE.' }, { status: 400 });
        }

        await prisma.cargoAlumno.delete({
            where: { id: BigInt(id) }
        });

        return NextResponse.json({ mensaje: 'Ficha eliminada exitosamente.' }, { status: 200 });
    } catch (error) {
        console.error('Error al eliminar cargo:', error);
        return NextResponse.json({ error: 'Error al eliminar el cargo: ' + error.message }, { status: 500 });
    }
}
