import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDescripcionRegimen, getDescripcionUsoCFDI } from '@/utils/catalogoSAT';
import { construirDescripcionConcepto } from '@/lib/services/servicioFacturacion';
import { generarHtmlFactura } from '@/lib/services/facturaHtmlService';

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (obj instanceof Date) {
        return isNaN(obj.getTime()) ? null : obj.toISOString();
    }
    if (typeof obj === 'object') {
        if (obj.d && Array.isArray(obj.d) && obj.s !== undefined) {
            return obj.toString();
        }
        if (typeof obj.toNumber === 'function') {
            return obj.toString();
        }
        if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigIntsAndDecimals(value)])
        );
    }
    return obj;
}

// Convertidor numérico a texto en español para el Importe con Letra
function numeroALetras(monto) {
    const num = Math.floor(monto);
    const centavos = Math.round((monto - num) * 100);
    const centavosText = centavos < 10 ? `0${centavos}` : `${centavos}`;

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const cientos = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (num === 0) return `CERO PESOS ${centavosText}/100 M.N.`;

    let letras = '';

    function convertirGrupo(n) {
        let output = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (n === 100) return 'CIEN ';

        if (c > 0) output += cientos[c] + ' ';

        if (d === 1 && u >= 0) {
            output += diezA19[u] + ' ';
        } else if (d > 1) {
            if (u > 0) {
                output += decenas[d] + ' Y ' + unidades[u] + ' ';
            } else {
                output += decenas[d] + ' ';
            }
        } else if (u > 0) {
            output += unidades[u] + ' ';
        }

        return output;
    }

    const miles = Math.floor(num / 1000);
    const resto = num % 1000;

    if (miles > 0) {
        if (miles === 1) letras += 'UN MIL ';
        else letras += convertirGrupo(miles) + 'MIL ';
    }

    if (resto > 0) {
        letras += convertirGrupo(resto);
    }

    return `${letras.trim()} PESOS ${centavosText}/100 M.N.`;
}

// GET: Descargar XML o Renderizar PDF Oficial CFDI 4.0 utilizando la Plantilla asociada al Emisor
export async function GET(request, context) {
    try {
        const resolvedParams = context?.params ? await context.params : {};
        const id = resolvedParams.id;
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'xml';

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

        if (!comprobante) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        const emisor = comprobante.emisors || {
            nombre: 'Razón Social Emisora',
            rfc: '',
            regimen_fiscal: '601',
            lugar_expedicion: '01000'
        };

        const receptor = comprobante.receptors || {
            nombre: 'PUBLICO EN GENERAL',
            rfc: 'XAXX010101000',
            regimen_fiscal_receptor: '616',
            uso_cfdi: 'S01'
        };

        // =========================================================================
        // OPCIÓN A: DESCARGAR ARCHIVO XML TIMBRADO
        // =========================================================================
        if (tipo === 'xml') {
            const xmlContent = comprobante.xml_timbrado || `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${comprobante.serie}" Folio="${comprobante.folio}" Fecha="${comprobante.fecha}" SubTotal="${comprobante.sub_total}" Total="${comprobante.total}" Moneda="MXN" TipoDeComprobante="I" LugarExpedicion="${emisor.lugar_expedicion || '01000'}">
  <cfdi:Emisor Rfc="${emisor.rfc}" Nombre="${emisor.nombre}" RegimenFiscal="${emisor.regimen_fiscal || '601'}"/>
  <cfdi:Receptor Rfc="${receptor.rfc}" Nombre="${receptor.nombre}" RegimenFiscalReceptor="${receptor.regimen_fiscal_receptor || '616'}" UsoCFDI="${receptor.uso_cfdi || 'S01'}"/>
</cfdi:Comprobante>`;

            return new Response(xmlContent, {
                status: 200,
                headers: {
                    'Content-Type': 'application/xml',
                    'Content-Disposition': `attachment; filename="Factura_${comprobante.serie}_${comprobante.folio}.xml"`
                }
            });
        }

        // =========================================================================
        // OPCIÓN B: RENDEREAR PDF USANDO LA PLANTILLA CONFIGURADA EN EL EMISOR
        // =========================================================================
        const pdfHtml = await generarHtmlFactura(comprobante);

        return new Response(pdfHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

    } catch (error) {
        console.error('Error al generar documentos de factura:', error);
        return NextResponse.json({ error: 'Error al generar documento: ' + error.message }, { status: 500 });
    }
}

// POST: Enviar PDF y XML por correo electrónico con la plantilla de la empresa
export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json().catch(() => ({}));
        const { email_destino } = body;

        const { enviarFacturaIndividual } = await import('@/lib/services/envioFacturaService');
        const resultado = await enviarFacturaIndividual({ facturaId: id, emailDestino: email_destino });

        return NextResponse.json({
            mensaje: `Los archivos PDF y XML de la factura ${resultado.serie || 'F'}-${resultado.folio || '0'} han sido enviados exitosamente a ${resultado.destinatario}.`,
            ...resultado
        }, { status: 200 });

    } catch (error) {
        console.error('Error al enviar factura por correo:', error);
        return NextResponse.json({ error: 'Error al enviar correo: ' + error.message }, { status: 500 });
    }
}
