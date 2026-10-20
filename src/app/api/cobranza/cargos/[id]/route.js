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
        let opcionesEnvio = {};

        try {
            const body = await request.json();
            if (body) {
                if (body.email_destino) emailDestino = body.email_destino;
                if (body.remitente_nombre) opcionesEnvio.remitenteNombre = body.remitente_nombre;
                if (body.remitente_email) opcionesEnvio.remitenteEmail = body.remitente_email;
                if (body.reply_to) opcionesEnvio.replyTo = body.reply_to;
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

        const resultado = await generarYEnviarFichaPorCorreo(cargo, emailDestino, opcionesEnvio);


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
            where: { id: BigInt(id) },
            include: {
                PagoAlumno: {
                    include: {
                        comprobante: {
                            select: {
                                id: true,
                                uuid: true,
                                estatus: true,
                                serie: true,
                                folio: true
                            }
                        }
                    }
                }
            }
        });

        if (!cargo) {
            return NextResponse.json({ error: 'Cargo/Ficha no encontrada.' }, { status: 404 });
        }

        // 1. Candado crítico de Facturación: Si tiene pagos con facturas timbradas ante el SAT
        const pagosConComprobante = cargo.PagoAlumno || [];
        const tieneFacturaTimbrada = pagosConComprobante.some(p => {
            if (!p.comprobante) return false;
            const tieneUuid = Boolean(p.comprobante.uuid && String(p.comprobante.uuid).trim().length > 10);
            const estatusUpper = String(p.comprobante.estatus || '').trim().toUpperCase();
            return tieneUuid || estatusUpper === 'TIMBRADO' || estatusUpper === 'TIMBRADA';
        });

        if (tieneFacturaTimbrada) {
            return NextResponse.json({
                error: 'No se puede eliminar la ficha porque tiene facturas timbradas ante el SAT asociadas. Por regla fiscal y de negocio, un comprobante timbrado no puede eliminarse.'
            }, { status: 400 });
        }

        // 2. Candado de pagos realizados
        const montoPagadoNum = Number(cargo.monto_pagado || 0);
        if (montoPagadoNum > 0 || cargo.estatus === 'PAGADO' || cargo.estatus === 'PARCIAL') {
            return NextResponse.json({
                error: 'No se puede eliminar una ficha que ya cuenta con pagos registrados o conciliados.'
            }, { status: 400 });
        }

        if (cargo.estatus !== 'PENDIENTE' && cargo.estatus !== 'VENCIDO') {
            return NextResponse.json({ error: 'Solo se pueden eliminar fichas con estatus PENDIENTE o VENCIDO sin pagos.' }, { status: 400 });
        }

        // 3. Si existen pagos en borrador o huérfanos sin timbrar, desvincular o limpiar con seguridad
        if (pagosConComprobante.length > 0) {
            await prisma.pagoAlumno.deleteMany({
                where: { cargo_id: BigInt(id) }
            });
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
