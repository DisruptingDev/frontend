import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeBigIntsAndDecimals } from '@/lib/services/servicioFacturacion';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

        const comprobante = await prisma.comprobantes.findUnique({
            where: { id: BigInt(id) },
            select: {
                id: true,
                serie: true,
                folio: true,
                fecha: true,
                tipo_de_comprobante: true,
                metodo_pago: true,
                forma_pago: true,
                uso_cfdi: true,
                sub_total_string: true,
                total_string: true,
                descuento_string: true,
                descripcion: true,
                xml_timbrado: true,
                emisors: true,
                receptors: true,
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
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        const emisorObj = comprobante.emisors || {
            id: 1,
            rfc: '',
            nombre: 'Razón Social Emisora',
            regimen_fiscal: '601',
            lugar_expedicion: '01000'
        };

        const receptorObj = comprobante.receptors || {
            id: 1,
            rfc: 'XAXX010101000',
            nombre: 'PUBLICO EN GENERAL',
            domicilio_fiscal_receptor: '01000',
            regimen_fiscal_receptor: '616',
            uso_cfdi: 'S01'
        };

        const conceptosHeader = comprobante.Conceptos?.[0];
        const conceptosList = conceptosHeader?.Concepto || [];

        let itemsLista = conceptosList.map(c => {
            const retenciones = [];
            const traslados = [];

            if (c.impuestos && c.impuestos.length > 0) {
                c.impuestos.forEach(imp => {
                    if (imp.retencions) {
                        imp.retencions.forEach(ret => {
                            retenciones.push({
                                Base: Number(ret.base || c.importe || 0),
                                ImpuestoCatalogoID: ret.impuesto_catalogo_id || 1,
                                ImpuestoClave: ret.impuesto_clave || '001',
                                TasaCatalogoID: ret.tasa_catalogo_id || 1,
                                TasaOCuota: Number(ret.tasa_o_cuota || 0),
                                Importe: Number(ret.importe || 0),
                                TipoFactor: ret.tipo_factor || 'Tasa',
                                ImpuestoCatalogo: { Impuesto: 'ISR', Tipo: 'Federal' }
                            });
                        });
                    }
                    if (imp.traslados) {
                        imp.traslados.forEach(tras => {
                            traslados.push({
                                Base: Number(tras.base || c.importe || 0),
                                ImpuestoCatalogoID: tras.impuesto_catalogo_id || 2,
                                ImpuestoClave: tras.impuesto_clave || '002',
                                TasaCatalogoID: tras.tasa_catalogo_id || (tras.tipo_factor === 'Exento' ? 4 : 21),
                                TasaOCuota: Number(tras.tasa_o_cuota || 0),
                                Importe: Number(tras.importe || 0),
                                Tipo: tras.tipo_factor || 'Tasa',
                                TipoFactor: tras.tipo_factor || 'Tasa',
                                ImpuestoCatalogo: { Impuesto: 'IVA', Tipo: 'Federal' }
                            });
                        });
                    }
                });
            }

            return {
                ID: c.id?.toString(),
                Cantidad: Number(c.cantidad || 1),
                ClaveProdServ: c.clave_prod_serv || '',
                ClaveUnidad: c.clave_unidad || 'E48',
                Unidad: c.unidad || 'Servicio',
                Descripcion: c.descripcion || 'Colegiatura y Servicios Educativos Integrales',
                ValorUnitario: Number(c.valor_unitario || c.importe || comprobante.total_string || 0),
                Importe: Number(c.importe || comprobante.total_string || 0),
                Descuento: 0,
                ObjetoImpuesto: c.objeto_imp || '02',
                Impuestos: { Retenciones: retenciones, Traslados: traslados }
            };
        });

        if (itemsLista.length === 0) {
            itemsLista = [{
                ID: '1',
                Cantidad: 1,
                ClaveProdServ: '',
                ClaveUnidad: 'E48',
                Unidad: 'Servicio',
                Descripcion: 'Colegiatura y Servicios Educativos Integrales',
                ValorUnitario: Number(comprobante.total_string || 0),
                Importe: Number(comprobante.total_string || 0),
                Descuento: 0,
                ObjetoImpuesto: '02',
                Impuestos: { Retenciones: [], Traslados: [] }
            }];
        }

        const extraerClaveSAT = (str, def = '') => {
            if (!str) return def;
            const clean = String(str).trim();
            return clean.split(' ')[0] || clean.substring(0, 4) || def;
        };

        let complementosImpuestosLocales = null;
        try {
            const impLocRows = await prisma.$queryRaw`
                SELECT il.id, il.version, il.totalde_retenciones, il.totalde_traslados
                FROM complementos c
                JOIN impuestos_locales il ON il.complemento_id = c.id
                WHERE c.comprobante_id = ${BigInt(id)}
                LIMIT 1
            `;
            if (impLocRows && impLocRows.length > 0) {
                const ilId = impLocRows[0].id;
                const trasladosRows = await prisma.$queryRaw`
                    SELECT imp_loc_trasladado, tasade_traslado, importe
                    FROM traslado_locals
                    WHERE impuestos_locales_id = ${ilId}
                `;
                const retencionesRows = await prisma.$queryRaw`
                    SELECT imp_loc_retenido, tasade_retencion, importe
                    FROM retencion_locals
                    WHERE impuestos_locales_id = ${ilId}
                `;
                const trasladosLocales = trasladosRows.map((t, idx) => ({
                    id: `tras_${ilId}_${t.id || idx}_${Date.now()}`,
                    Tipo: 'Traslado',
                    Nombre: t.imp_loc_trasladado || 'ISH',
                    ImpLocTrasladado: t.imp_loc_trasladado || 'ISH',
                    Tasa: Number(t.tasade_traslado || 0),
                    TasaString: String(t.tasade_traslado || '0.00'),
                    TasadeTraslado: Number(t.tasade_traslado || 0),
                    Importe: Number(t.importe || 0),
                    ImporteString: String(Number(t.importe || 0).toFixed(2))
                }));

                const retencionesLocales = retencionesRows.map((r, idx) => ({
                    id: `ret_${ilId}_${r.id || idx}_${Date.now()}`,
                    Tipo: 'Retencion',
                    Nombre: r.imp_loc_retenido || 'Impuesto Cedular',
                    ImpLocRetenido: r.imp_loc_retenido || 'Impuesto Cedular',
                    Tasa: Number(r.tasade_retencion || 0),
                    TasaString: String(r.tasade_retencion || '0.00'),
                    TasadeRetencion: Number(r.tasade_retencion || 0),
                    Importe: Math.abs(Number(r.importe || 0)),
                    ImporteString: String(Math.abs(Number(r.importe || 0)).toFixed(2))
                }));

                complementosImpuestosLocales = {
                    Version: impLocRows[0].version || "1.0",
                    TotaldeRetenciones: Number(impLocRows[0].totalde_retenciones || 0),
                    TotaldeTraslados: Number(impLocRows[0].totalde_traslados || 0),
                    TrasladosLocales: trasladosLocales,
                    RetencionesLocales: retencionesLocales
                };
            }
        } catch (dbErr) {
            console.warn("No se pudieron cargar impuestos locales de DB:", dbErr.message);
        }

        const flatImpuestosLocales = complementosImpuestosLocales
            ? [...(complementosImpuestosLocales.TrasladosLocales || []), ...(complementosImpuestosLocales.RetencionesLocales || [])]
            : [];

        const descComprobante = comprobante.descripcion || '';

        const responseData = {
            factura: {
                ID: comprobante.id.toString(),
                EmisorID: emisorObj.id?.toString(),
                Emisor: {
                    Rfc: emisorObj.rfc || '',
                    Nombre: emisorObj.nombre || 'Razón Social Emisora',
                    RegimenFiscal: extraerClaveSAT(emisorObj.regimen_fiscal, '601'),
                    LugarExpedicion: emisorObj.lugar_expedicion || '01000',
                    Calle: emisorObj.calle || '',
                    NumeroExterior: emisorObj.numero_exterior || '',
                    NumeroInterior: emisorObj.numero_interior || '',
                    Colonia: emisorObj.colonia || '',
                    Municipio: emisorObj.municipio || '',
                    Estado: emisorObj.estado || ''
                },
                ReceptorID: receptorObj.id?.toString(),
                Receptor: {
                    Rfc: receptorObj.rfc || 'XAXX010101000',
                    Nombre: receptorObj.nombre || 'PUBLICO EN GENERAL',
                    DomicilioFiscalReceptor: receptorObj.domicilio_fiscal_receptor || emisorObj.lugar_expedicion || '01000',
                    RegimenFiscalReceptor: extraerClaveSAT(receptorObj.regimen_fiscal_receptor, '616'),
                    LugarExpedicion: emisorObj.lugar_expedicion || '01000'
                },
                Serie: comprobante.serie || 'F',
                Folio: comprobante.folio || comprobante.id.toString(),
                Fecha: comprobante.fecha ? new Date(comprobante.fecha).toISOString() : new Date().toISOString(),
                TipoDeComprobante: comprobante.tipo_comprobante || 'I',
                MetodoPago: extraerClaveSAT(comprobante.metodo_pago, 'PUE'),
                FormaPago: extraerClaveSAT(comprobante.forma_pago, '03'),
                UsoCFDI: extraerClaveSAT(comprobante.uso_cfdi || receptorObj.uso_cfdi, 'S01'),
                Descripcion: descComprobante,
                Observaciones: descComprobante,
                Conceptos: {
                    ListaConceptos: itemsLista
                },
                Complemento: complementosImpuestosLocales ? {
                    ImpuestosLocales: complementosImpuestosLocales
                } : undefined,
                impuestosLocales: flatImpuestosLocales,
                ImpuestosLocales: flatImpuestosLocales,
                xml_timbrado: comprobante.xml_timbrado || undefined,
                InformacionGlobal: {
                    Anio: '',
                    Meses: '',
                    Periodicidad: ''
                }
            },
            uso_cfdi: { Descripcion: comprobante.uso_cfdi || 'Sin efectos fiscales' },
            metodo_pago: { Descripcion: 'Pago en una sola exhibición' },
            forma_pago: { Descripcion: 'Transferencia electrónica de fondos' }
        };

        return NextResponse.json(serializeBigIntsAndDecimals(responseData));
    } catch (error) {
        console.error('Error en GET /api/facturas/ObtenerFactura/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
