import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generarHtmlFactura } from '@/lib/services/facturaHtmlService';

// Proxy / Fallback para VerPDF: Permite renderizar el PDF oficial con plantilla y con impuestos locales (Traslados y Retenciones)
export async function GET(request, context) {
    const resolvedParams = context?.params ? await context.params : {};
    const id = resolvedParams.id;

    if (!id) {
        return NextResponse.json({ error: 'ID de factura no proporcionado' }, { status: 400 });
    }

    try {
        let idBigInt = null;
        try {
            idBigInt = BigInt(id);
        } catch {
            idBigInt = null;
        }

        const orConditions = [];
        if (idBigInt !== null) {
            orConditions.push({ id: idBigInt });
        }
        orConditions.push({ folio: String(id) });

        // 1. Buscar comprobante en la base de datos local
        const comprobante = await prisma.comprobantes.findFirst({
            where: {
                OR: orConditions
            },
            include: {
                emisors: true,
                receptors: true,
                PagoAlumno: {
                    include: {
                        alumno: {
                            include: { programa_academico: true }
                        },
                        cargo: { include: { concepto: true, producto: true } }
                    }
                },
                Conceptos: {
                    include: {
                        Concepto: {
                            include: {
                                impuestos: {
                                    include: {
                                        traslados: true,
                                        retencions: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (comprobante) {
            const pdfHtml = await generarHtmlFactura(comprobante);
            return new Response(pdfHtml, {
                status: 200,
                headers: {
                    'Content-Type': 'text/html; charset=utf-8',
                    'Cache-Control': 'no-store'
                }
            });
        }

        // 2. Si no se encuentra en BD local, intentar redirigir o consultar al backend externo de respaldo
        const baseRaw = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.sandbox.wisefacturacion.com';
        const baseUrl = (baseRaw.startsWith('http') ? baseRaw : `https://${baseRaw}`).replace(/\/+$/, '');
        const targetUrl = `${baseUrl}/api/descargararchivos/VerPDF/${id}`;

        const authHeader = request.headers.get('authorization') || '';
        const headers = {};
        if (authHeader) headers['Authorization'] = authHeader;

        const backendRes = await fetch(targetUrl, { method: 'GET', headers });
        if (backendRes.ok) {
            const blob = await backendRes.blob();
            const contentType = backendRes.headers.get('content-type') || 'application/pdf';
            return new Response(blob, {
                status: 200,
                headers: {
                    'Content-Type': contentType,
                    'Content-Disposition': backendRes.headers.get('content-disposition') || `inline; filename="Factura_${id}.pdf"`
                }
            });
        }

        let backendErrorMsg = 'Factura no encontrada para generar vista previa PDF.';
        try {
            const errData = await backendRes.json();
            backendErrorMsg = errData?.error || errData?.message || errData?.Error || backendErrorMsg;
        } catch {
            try {
                const errTxt = await backendRes.text();
                if (errTxt && errTxt.length < 200) backendErrorMsg = errTxt;
            } catch {}
        }

        return NextResponse.json({ error: backendErrorMsg }, { status: backendRes.status || 404 });
    } catch (error) {
        console.error(`[VerPDF Error] ID ${id}:`, error);
        return NextResponse.json({ error: 'Error al generar la vista previa PDF: ' + error.message }, { status: 500 });
    }
}
