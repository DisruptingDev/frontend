import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (obj && typeof obj.toNumber === 'function') return obj.toNumber();
    if (obj instanceof Date) return isNaN(obj.getTime()) ? null : obj.toISOString();
    if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
    if (typeof obj === 'object') {
        const res = {};
        for (const [key, val] of Object.entries(obj)) {
            res[key] = serializeBigIntsAndDecimals(val);
        }
        return res;
    }
    return obj;
}


function extraerPagosDeXML(xml) {
    if (!xml || typeof xml !== 'string') return null;
    const getAttr = (str, attr) => {
        if (!str) return '';
        const m = str.match(new RegExp('\\b' + attr + '=["\']([^"\']*)["\']', 'i'));
        return m ? m[1] : '';
    };

    let totales = {
        TotalTrasladosBaseIVA16: '0.00',
        TotalTrasladosBaseIVA16String: '0.00',
        TotalTrasladosImpuestoIVA16: '0.00',
        TotalTrasladosImpuestoIVA16String: '0.00',
        TotalRetencionesISR: '0.00',
        TotalRetencionesISRString: '0.00',
        TotalRetencionesIVA: '0.00',
        TotalRetencionesIVAString: '0.00',
        MontoTotalPagos: '0.00',
        MontoTotalPagosString: '0.00'
    };

    const totalesMatch = xml.match(/<(?:\w+:)?Totales\b([^>]*)\/?>/i);
    if (totalesMatch) {
        const tAttrs = totalesMatch[1] || '';
        totales = {
            TotalTrasladosBaseIVA16: getAttr(tAttrs, 'TotalTrasladosBaseIVA16') || '0.00',
            TotalTrasladosBaseIVA16String: getAttr(tAttrs, 'TotalTrasladosBaseIVA16') || '0.00',
            TotalTrasladosImpuestoIVA16: getAttr(tAttrs, 'TotalTrasladosImpuestoIVA16') || '0.00',
            TotalTrasladosImpuestoIVA16String: getAttr(tAttrs, 'TotalTrasladosImpuestoIVA16') || '0.00',
            TotalRetencionesISR: getAttr(tAttrs, 'TotalRetencionesISR') || '0.00',
            TotalRetencionesISRString: getAttr(tAttrs, 'TotalRetencionesISR') || '0.00',
            TotalRetencionesIVA: getAttr(tAttrs, 'TotalRetencionesIVA') || '0.00',
            TotalRetencionesIVAString: getAttr(tAttrs, 'TotalRetencionesIVA') || '0.00',
            MontoTotalPagos: getAttr(tAttrs, 'MontoTotalPagos') || '0.00',
            MontoTotalPagosString: getAttr(tAttrs, 'MontoTotalPagos') || '0.00'
        };
    }

    const pagoMatches = xml.match(/<(?:\w+:)?Pago\b[^>]*>([\s\S]*?)<\/(?:\w+:)?Pago>/gi) ||
                        xml.match(/<(?:\w+:)?Pago\b[^>]*\/>/gi) || [];

    const listaPagos = [];

    for (const pMatch of pagoMatches) {
        const openTagMatch = pMatch.match(/<(?:\w+:)?Pago\b([^>]*)>/i) || [pMatch, pMatch];
        const openAttrs = openTagMatch[1] || pMatch;

        const fechaPago = getAttr(openAttrs, 'FechaPago');
        const formaPago = getAttr(openAttrs, 'FormaDePagoP') || getAttr(openAttrs, 'FormaPago') || '03';
        const monedaP = getAttr(openAttrs, 'MonedaP') || getAttr(openAttrs, 'Moneda') || 'MXN';
        const monto = parseFloat(getAttr(openAttrs, 'Monto') || '0');

        const doctoMatches = pMatch.match(/<(?:\w+:)?DoctoRelacionado\b[^>]*>([\s\S]*?)<\/(?:\w+:)?DoctoRelacionado>/gi) ||
                             pMatch.match(/<(?:\w+:)?DoctoRelacionado\b[^>]*\/>/gi) || [];
        const doctosRel = doctoMatches.map(dStr => {
            const impPag = parseFloat(getAttr(dStr, 'ImpPagado') || monto.toString());
            const saldoAnt = parseFloat(getAttr(dStr, 'ImpSaldoAnt') || '0');
            const saldoIns = parseFloat(getAttr(dStr, 'ImpSaldoInsoluto') || Math.max(0, saldoAnt - impPag).toString());
            return {
                IdDocumento: getAttr(dStr, 'IdDocumento'),
                Serie: getAttr(dStr, 'Serie'),
                Folio: getAttr(dStr, 'Folio'),
                MonedaDR: getAttr(dStr, 'MonedaDR') || 'MXN',
                NumParcialidad: parseInt(getAttr(dStr, 'NumParcialidad') || '1'),
                ImpSaldoAnt: saldoAnt,
                ImpSaldoAntString: saldoAnt.toFixed(2),
                ImpPagado: impPag,
                ImpPagadoString: impPag.toFixed(2),
                ImpSaldoInsoluto: saldoIns,
                ImpSaldoInsolutoString: saldoIns.toFixed(2),
                ObjetoImpDR: getAttr(dStr, 'ObjetoImpDR') || '01'
            };
        });

        if (doctosRel.length === 0) {
            doctosRel.push({
                IdDocumento: '',
                Serie: '',
                Folio: '',
                MonedaDR: 'MXN',
                NumParcialidad: 1,
                ImpSaldoAnt: monto,
                ImpSaldoAntString: monto.toFixed(2),
                ImpPagado: monto,
                ImpPagadoString: monto.toFixed(2),
                ImpSaldoInsoluto: 0,
                ImpSaldoInsolutoString: '0.00',
                ObjetoImpDR: '01'
            });
        }

        const traslados = [];
        const retenciones = [];
        const trasMatches = pMatch.match(/<(?:\w+:)?(?:TrasladoP|TrasladoDR)\b([^>]*)\/?>/gi) || [];
        trasMatches.forEach(tStr => {
            const base = parseFloat(getAttr(tStr, 'BaseP') || getAttr(tStr, 'BaseDR') || '0');
            const imp = parseFloat(getAttr(tStr, 'ImporteP') || getAttr(tStr, 'ImporteDR') || '0');
            traslados.push({
                Base: base,
                BaseString: base.toFixed(2),
                ImpuestoClave: getAttr(tStr, 'ImpuestoP') || getAttr(tStr, 'ImpuestoDR') || '002',
                TipoFactor: getAttr(tStr, 'TipoFactorP') || getAttr(tStr, 'TipoFactorDR') || 'Tasa',
                TasaOCuota: getAttr(tStr, 'TasaOCuotaP') || getAttr(tStr, 'TasaOCuotaDR') || '0.160000',
                Importe: imp,
                ImporteString: imp.toFixed(2)
            });
        });

        const retMatches = pMatch.match(/<(?:\w+:)?(?:RetencionP|RetencionDR)\b([^>]*)\/?>/gi) || [];
        retMatches.forEach(rStr => {
            const imp = parseFloat(getAttr(rStr, 'ImporteP') || getAttr(rStr, 'ImporteDR') || '0');
            retenciones.push({
                ImpuestoClave: getAttr(rStr, 'ImpuestoP') || getAttr(rStr, 'ImpuestoDR') || '001',
                Importe: imp,
                ImporteString: imp.toFixed(2)
            });
        });

        listaPagos.push({
            FechaPago: fechaPago || new Date().toISOString(),
            FormaDePagoP: formaPago,
            MonedaP: monedaP,
            Monto: monto,
            MontoString: monto.toFixed(2),
            DoctoRelacionados: doctosRel,
            DoctosRelacionados: doctosRel,
            Impuestos: {
                Traslados: traslados,
                Retenciones: retenciones
            }
        });
    }

    if (listaPagos.length === 0) return null;

    if (!totales.MontoTotalPagos || parseFloat(totales.MontoTotalPagos) === 0) {
        const sumaMonto = listaPagos.reduce((acc, p) => acc + (parseFloat(p.Monto) || 0), 0);
        totales.MontoTotalPagos = sumaMonto.toFixed(2);
        totales.MontoTotalPagosString = sumaMonto.toFixed(2);
    }

    return {
        Version: '2.0',
        Totales: totales,
        Pagos: listaPagos
    };
}

export async function GET(request, context) {
    try {
        const resolvedParams = context?.params ? await context.params : {};
        const id = resolvedParams.id;
        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

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
                informacion_globals: true,
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
                },
                complementos: {
                    include: {
                        Pagos: {
                            include: {
                                totales: true,
                                Pago: {
                                    include: {
                                        docto_relacionados: true,
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
                WHERE c.comprobante_id = ${comprobante.id}
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

        let pagosEstructurados = null;

        // A. Intentar extraer pagos de la relación en BD complementos -> Pagos -> Pago
        if (comprobante.complementos && comprobante.complementos.length > 0) {
            for (const c of comprobante.complementos) {
                if (c.Pagos && c.Pagos.length > 0) {
                    for (const pHeader of c.Pagos) {
                        const tot = pHeader.totales?.[0] || {};
                        const listaP = (pHeader.Pago || []).map(p => {
                            const doctos = (p.docto_relacionados || []).map(dr => {
                                const impPag = parseFloat(dr.imp_pagado_string || dr.imp_pagado || 0);
                                const saldoAnt = parseFloat(dr.imp_saldo_ant_string || dr.imp_saldo_ant || 0);
                                const saldoIns = parseFloat(dr.imp_saldo_insoluto_string || dr.imp_saldo_insoluto || Math.max(0, saldoAnt - impPag));
                                return {
                                    IdDocumento: dr.id_documento || '',
                                    Serie: dr.serie || '',
                                    Folio: dr.folio || '',
                                    MonedaDR: dr.moneda_dr || 'MXN',
                                    NumParcialidad: Number(dr.num_parcialidad || 1),
                                    ImpSaldoAnt: saldoAnt,
                                    ImpSaldoAntString: saldoAnt.toFixed(2),
                                    ImpPagado: impPag,
                                    ImpPagadoString: impPag.toFixed(2),
                                    ImpSaldoInsoluto: saldoIns,
                                    ImpSaldoInsolutoString: saldoIns.toFixed(2),
                                    ObjetoImpDR: dr.objeto_imp_dr || '01'
                                };
                            });

                            const traslados = [];
                            const retenciones = [];
                            if (p.impuestos) {
                                p.impuestos.forEach(imp => {
                                    if (imp.traslados) {
                                        imp.traslados.forEach(t => {
                                            traslados.push({
                                                Base: parseFloat(t.base || 0),
                                                BaseString: parseFloat(t.base || 0).toFixed(2),
                                                ImpuestoClave: t.impuesto_clave || '002',
                                                TipoFactor: t.tipo_factor || 'Tasa',
                                                TasaOCuota: parseFloat(t.tasa_o_cuota || 0.16).toFixed(6),
                                                Importe: parseFloat(t.importe || 0),
                                                ImporteString: parseFloat(t.importe || 0).toFixed(2)
                                            });
                                        });
                                    }
                                    if (imp.retencions) {
                                        imp.retencions.forEach(r => {
                                            retenciones.push({
                                                ImpuestoClave: r.impuesto_clave || '001',
                                                Importe: parseFloat(r.importe || 0),
                                                ImporteString: parseFloat(r.importe || 0).toFixed(2)
                                            });
                                        });
                                    }
                                });
                            }

                            return {
                                FechaPago: p.fecha_pago || comprobante.fecha || new Date().toISOString(),
                                FormaDePagoP: p.forma_de_pago_p || comprobante.forma_pago || '03',
                                MonedaP: p.moneda_p || 'MXN',
                                Monto: parseFloat(p.monto_string || p.monto || comprobante.total_string || 0),
                                MontoString: parseFloat(p.monto_string || p.monto || comprobante.total_string || 0).toFixed(2),
                                DoctoRelacionados: doctos.length > 0 ? doctos : [{
                                    IdDocumento: '',
                                    Serie: '',
                                    Folio: '',
                                    MonedaDR: 'MXN',
                                    NumParcialidad: 1,
                                    ImpSaldoAnt: parseFloat(comprobante.total_string || 0),
                                    ImpSaldoAntString: parseFloat(comprobante.total_string || 0).toFixed(2),
                                    ImpPagado: parseFloat(comprobante.total_string || 0),
                                    ImpPagadoString: parseFloat(comprobante.total_string || 0).toFixed(2),
                                    ImpSaldoInsoluto: 0,
                                    ImpSaldoInsolutoString: '0.00',
                                    ObjetoImpDR: '01'
                                }],
                                DoctosRelacionados: doctos,
                                Impuestos: {
                                    Traslados: traslados,
                                    Retenciones: retenciones
                                }
                            };
                        });

                        if (listaP.length > 0) {
                            pagosEstructurados = {
                                Version: pHeader.version || '2.0',
                                Totales: {
                                    TotalTrasladosBaseIVA16: String(tot.total_traslados_base_iva16 ?? '0.00'),
                                    TotalTrasladosBaseIVA16String: String(tot.total_traslados_base_iva16 ?? '0.00'),
                                    TotalTrasladosImpuestoIVA16: String(tot.total_traslados_impuesto_iva16 ?? '0.00'),
                                    TotalTrasladosImpuestoIVA16String: String(tot.total_traslados_impuesto_iva16 ?? '0.00'),
                                    TotalRetencionesISR: String(tot.total_retenciones_isr_string || tot.total_retenciones_isr || '0.00'),
                                    TotalRetencionesISRString: String(tot.total_retenciones_isr_string || tot.total_retenciones_isr || '0.00'),
                                    TotalRetencionesIVA: String(tot.total_retenciones_iva_string || tot.total_retenciones_iva || '0.00'),
                                    TotalRetencionesIVAString: String(tot.total_retenciones_iva_string || tot.total_retenciones_iva || '0.00'),
                                    MontoTotalPagos: String(tot.monto_total_pagos || comprobante.total_string || '0.00'),
                                    MontoTotalPagosString: String(tot.monto_total_pagos || comprobante.total_string || '0.00')
                                },
                                Pagos: listaP
                            };
                            break;
                        }
                    }
                }
                if (pagosEstructurados) break;
            }
        }

        // B. Si no hubo en la relación DB, extraer de xml_timbrado
        if (!pagosEstructurados && comprobante.xml_timbrado) {
            pagosEstructurados = extraerPagosDeXML(comprobante.xml_timbrado);
        }

        // C. Si es comprobante de pago (P) y aún no tiene pagos, construir borrador con los datos del comprobante
        const esTipoPago = (comprobante.tipo_de_comprobante || comprobante.tipo_comprobante || '').toUpperCase() === 'P';
        if (!pagosEstructurados && esTipoPago) {
            const totalNum = parseFloat(comprobante.total_string || 0);
            pagosEstructurados = {
                Version: '2.0',
                Totales: {
                    TotalTrasladosBaseIVA16: '0.00',
                    TotalTrasladosBaseIVA16String: '0.00',
                    TotalTrasladosImpuestoIVA16: '0.00',
                    TotalTrasladosImpuestoIVA16String: '0.00',
                    TotalRetencionesISR: '0.00',
                    TotalRetencionesISRString: '0.00',
                    TotalRetencionesIVA: '0.00',
                    TotalRetencionesIVAString: '0.00',
                    MontoTotalPagos: totalNum.toFixed(2),
                    MontoTotalPagosString: totalNum.toFixed(2)
                },
                Pagos: [{
                    FechaPago: comprobante.fecha ? new Date(comprobante.fecha).toISOString() : new Date().toISOString(),
                    FormaDePagoP: extraerClaveSAT(comprobante.forma_pago, '03'),
                    MonedaP: 'MXN',
                    Monto: totalNum,
                    MontoString: totalNum.toFixed(2),
                    DoctoRelacionados: [{
                        IdDocumento: '',
                        Serie: '',
                        Folio: '',
                        MonedaDR: 'MXN',
                        NumParcialidad: 1,
                        ImpSaldoAnt: totalNum,
                        ImpSaldoAntString: totalNum.toFixed(2),
                        ImpPagado: totalNum,
                        ImpPagadoString: totalNum.toFixed(2),
                        ImpSaldoInsoluto: 0,
                        ImpSaldoInsolutoString: '0.00',
                        ObjetoImpDR: '01'
                    }],
                    DoctosRelacionados: [{
                        IdDocumento: '',
                        Serie: '',
                        Folio: '',
                        MonedaDR: 'MXN',
                        NumParcialidad: 1,
                        ImpSaldoAnt: totalNum,
                        ImpSaldoAntString: totalNum.toFixed(2),
                        ImpPagado: totalNum,
                        ImpPagadoString: totalNum.toFixed(2),
                        ImpSaldoInsoluto: 0,
                        ImpSaldoInsolutoString: '0.00',
                        ObjetoImpDR: '01'
                    }],
                    Impuestos: {
                        Traslados: [],
                        Retenciones: []
                    }
                }]
            };
        }

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
                TipoDeComprobante: comprobante.tipo_de_comprobante || comprobante.tipo_comprobante || 'I',
                MetodoPago: extraerClaveSAT(comprobante.metodo_pago, 'PUE'),
                FormaPago: extraerClaveSAT(comprobante.forma_pago, '03'),
                UsoCFDI: extraerClaveSAT(comprobante.uso_cfdi || receptorObj.uso_cfdi, 'S01'),
                SubTotal: parseFloat(comprobante.sub_total_string || 0),
                Total: parseFloat(comprobante.total_string || 0),
                Descripcion: descComprobante,
                Observaciones: descComprobante,
                Conceptos: {
                    ListaConceptos: itemsLista
                },
                Complemento: (() => {
                    const comp = {};
                    if (complementosImpuestosLocales) comp.ImpuestosLocales = complementosImpuestosLocales;
                    if (pagosEstructurados) comp.Pagos = pagosEstructurados;
                    return Object.keys(comp).length > 0 ? comp : undefined;
                })(),
                Pagos: pagosEstructurados || undefined,
                XMLTimbrado: comprobante.xml_timbrado || undefined,
                impuestosLocales: flatImpuestosLocales,
                ImpuestosLocales: flatImpuestosLocales,
                xml_timbrado: comprobante.xml_timbrado || undefined,
                InformacionGlobal: {
                    Anio: comprobante.informacion_globals?.[0]?.anio || '',
                    Meses: comprobante.informacion_globals?.[0]?.meses || '',
                    Periodicidad: comprobante.informacion_globals?.[0]?.periodicidad || ''
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
