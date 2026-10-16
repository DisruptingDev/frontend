import prisma from '@/lib/prisma';
import { sendEmailViaMailgun } from '@/lib/services/mailgunService';
import { generarHtmlFactura } from '@/lib/services/facturaHtmlService';
import { generarPdfDesdeHtml } from '@/lib/services/pdfGeneratorService';

/**
 * Plantilla de correo para el cuerpo del mensaje
 */
function generarCuerpoCorreo({ emisor, receptor, serie, folio, total, uuid, moneda }) {
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #1e293b;">
        <div style="text-align: center; border-bottom: 2px solid #1b384a; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="color: #1b384a; margin: 0;">${emisor.nombre || 'Comprobante Fiscal Digital'}</h2>
            <p style="color: #64748b; font-size: 13px; margin: 4px 0 0 0;">Facturación Electrónica CFDI 4.0</p>
        </div>

        <p>Estimado(a) <strong>${receptor.nombre || 'Cliente'}</strong>,</p>

        <p>Le informamos que se ha generado su comprobante fiscal correspondiente a los servicios contratados:</p>

        <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Serie y Folio:</strong></td>
                    <td style="padding: 4px 0; text-align: right; font-weight: bold;">${serie || 'F'}-${folio || '0'}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Folio Fiscal (UUID):</strong></td>
                    <td style="padding: 4px 0; text-align: right; font-family: monospace; font-size: 11px;">${uuid || 'N/A'}</td>
                </tr>
                <tr>
                    <td style="padding: 4px 0; color: #64748b;"><strong>Monto Total:</strong></td>
                    <td style="padding: 4px 0; text-align: right; font-weight: bold; color: #1b384a; font-size: 15px;">$${Number(total || 0).toFixed(2)} ${moneda || 'MXN'}</td>
                </tr>
            </table>
        </div>

        <p style="font-size: 13px; color: #475569;">
            Adjunto a este correo encontrará su archivo <strong>XML</strong> oficial debidamente timbrado y su representación impresa en formato <strong>PDF</strong>.
        </p>

        <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            Este es un correo automático generado por el sistema de Facturación. Por favor, no responda a este mensaje.<br/>
            ${emisor.nombre || ''} - RFC: ${emisor.rfc || ''}
        </div>
    </div>
    `;
}

/**
 * Envía una sola factura por correo con su PDF y XML adjuntos
 * @param {object} params { facturaId, emailDestino }
 */
export async function enviarFacturaIndividual({ facturaId, emailDestino = null }) {
    const idBigInt = BigInt(facturaId);

    const comprobante = await prisma.comprobantes.findUnique({
        where: { id: idBigInt },
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
        throw new Error(`La factura con ID ${facturaId} no fue encontrada en la base de datos.`);
    }

    const emisor = comprobante.emisors || {};
    const receptor = comprobante.receptors || {};

    // Determinar destinatario
    let correoDestino = emailDestino;
    if (!correoDestino) {
        if (comprobante.PagoAlumno && comprobante.PagoAlumno.length > 0) {
            correoDestino = comprobante.PagoAlumno[0].alumno?.email;
        }
    }
    if (!correoDestino) {
        correoDestino = receptor.email;
    }

    if (!correoDestino || !correoDestino.includes('@')) {
        throw new Error(`La factura ${comprobante.serie}-${comprobante.folio} no tiene un correo de receptor válido registrado.`);
    }

    // 1. Obtener o construir el XML timbrado
    let xmlContent = comprobante.xml_timbrado;
    if (!xmlContent) {
        xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${comprobante.serie || 'F'}" Folio="${comprobante.folio || '0'}" Fecha="${comprobante.fecha || new Date().toISOString()}" SubTotal="${comprobante.sub_total_string || comprobante.sub_total || 0}" Total="${comprobante.total_string || comprobante.total || 0}" Moneda="${comprobante.moneda || 'MXN'}" TipoDeComprobante="${comprobante.tipo_de_comprobante || 'I'}" LugarExpedicion="${comprobante.lugar_expedicion || emisor.lugar_expedicion || '01000'}">
  <cfdi:Emisor Rfc="${emisor.rfc || ''}" Nombre="${emisor.nombre || ''}" RegimenFiscal="${emisor.regimen_fiscal || '601'}"/>
  <cfdi:Receptor Rfc="${receptor.rfc || ''}" Nombre="${receptor.nombre || ''}" RegimenFiscalReceptor="${receptor.regimen_fiscal_receptor || '616'}" UsoCFDI="${receptor.uso_cfdi || 'S01'}"/>
</cfdi:Comprobante>`;
    }

    // 2. Generar el HTML con la plantilla correspondiente de la empresa
    const htmlFactura = await generarHtmlFactura(comprobante);

    // 3. Generar el PDF Buffer usando Puppeteer singleton
    const pdfBuffer = await generarPdfDesdeHtml(htmlFactura);

    // 4. Preparar archivos adjuntos
    const serieFolio = `${comprobante.serie || 'F'}_${comprobante.folio || '0'}`;
    const attachments = [
        {
            filename: `Factura_${serieFolio}.pdf`,
            content: pdfBuffer,
            contentType: 'application/pdf'
        },
        {
            filename: `Factura_${serieFolio}.xml`,
            content: Buffer.from(xmlContent, 'utf-8'),
            contentType: 'application/xml'
        }
    ];

    // 5. Preparar correo
    const totalNum = parseFloat(comprobante.total_string || comprobante.total || 0) || 0;
    const subject = `Factura Electrónica ${comprobante.serie || 'F'}-${comprobante.folio || '0'} - ${emisor.nombre || 'CFDI'}`;
    const cuerpoHtml = generarCuerpoCorreo({
        emisor,
        receptor,
        serie: comprobante.serie,
        folio: comprobante.folio,
        total: totalNum,
        uuid: comprobante.uuid,
        moneda: comprobante.moneda
    });

    const remitente = emisor.nombre ?
        `${emisor.nombre} <facturacion@mg.wisefacturacion.com>` :
        `Facturación Electrónica <facturacion@mg.wisefacturacion.com>`;

    // 6. Enviar vía Mailgun
    await sendEmailViaMailgun({
        to: correoDestino.trim(),
        subject,
        html: cuerpoHtml,
        attachments,
        from: remitente,
        replyTo: emisor.email || undefined
    });

    return {
        id: comprobante.id.toString(),
        serie: comprobante.serie,
        folio: comprobante.folio,
        destinatario: correoDestino,
        status: 'enviado'
    };
}

/**
 * Procesa el envío de múltiples facturas con concurrencia controlada
 * @param {Array<number|string>} facturaIds
 */
export async function enviarFacturasEnLote(facturaIds, emailDestino = null) {
    const cleanIds = (Array.isArray(facturaIds) ? facturaIds : [facturaIds])
        .map(id => (typeof id === 'object' && id !== null ? (id.ID ?? id.id ?? id.Id ?? id.facturaID) : id))
        .filter(id => id !== undefined && id !== null && id !== '' && !isNaN(Number(id)))
        .map(id => Number(id));

    if (cleanIds.length === 0) {
        throw new Error('No se proporcionaron IDs válidos de facturas para enviar.');
    }

    const resultados = [];
    const errores = [];

    // Procesar con concurrencia máxima de 4 para no saturar memoria
    const CONCURRENCIA_MAX = 4;
    for (let i = 0; i < cleanIds.length; i += CONCURRENCIA_MAX) {
        const lote = cleanIds.slice(i, i + CONCURRENCIA_MAX);
        const promesas = lote.map(async (id) => {
            try {
                const res = await enviarFacturaIndividual({ facturaId: id, emailDestino });
                resultados.push(res);
            } catch (err) {
                console.error(`Error enviando factura ${id}:`, err);
                errores.push({ id, error: err.message });
            }
        });
        await Promise.all(promesas);
    }

    return {
        total: cleanIds.length,
        enviados: resultados.length,
        fallidos: errores.length,
        resultados,
        errores
    };
}
