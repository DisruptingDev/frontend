import QRCode from 'qrcode';
import prisma from '@/lib/prisma';
import { getDescripcionRegimen, getDescripcionUsoCFDI } from '@/utils/catalogoSAT';

// Paletas de diseño según el ID de plantilla registrado en la BD
const PALETAS_PLANTILLAS = {
    1: { // Default
        nombre: 'Default',
        primario: '#1b384a',
        secundario: '#2a9d8f',
        acento: '#e76f51',
        fondoHeader: '#f1f5f9',
        borde: '#cbd5e1',
        tablaHeaderBg: '#1b384a',
        tablaHeaderColor: '#ffffff',
        estilo: 'moderno'
    },
    2: { // Default Azul
        nombre: 'Default Azul',
        primario: '#003a6c',
        secundario: '#0284c7',
        acento: '#0369a1',
        fondoHeader: '#eff6ff',
        borde: '#bfdbfe',
        tablaHeaderBg: '#003a6c',
        tablaHeaderColor: '#ffffff',
        estilo: 'azul'
    },
    3: { // Minimalista
        nombre: 'Minimalista',
        primario: '#18181b',
        secundario: '#52525b',
        acento: '#71717a',
        fondoHeader: '#fafafa',
        borde: '#e4e4e7',
        tablaHeaderBg: '#27272a',
        tablaHeaderColor: '#ffffff',
        estilo: 'minimalista'
    },
    4: { // Minimalista Compact
        nombre: 'Minimalista Compact',
        primario: '#27272a',
        secundario: '#3f3f46',
        acento: '#71717a',
        fondoHeader: '#ffffff',
        borde: '#d4d4d8',
        tablaHeaderBg: '#3f3f46',
        tablaHeaderColor: '#ffffff',
        estilo: 'compact'
    },
    5: { // Formal
        nombre: 'Formal',
        primario: '#0f172a',
        secundario: '#334155',
        acento: '#94a3b8',
        fondoHeader: '#f8fafc',
        borde: '#94a3b8',
        tablaHeaderBg: '#0f172a',
        tablaHeaderColor: '#ffffff',
        estilo: 'formal'
    },
    6: { // Default Naranja
        nombre: 'Default Naranja',
        primario: '#c2410c',
        secundario: '#ea580c',
        acento: '#fb923c',
        fondoHeader: '#fff7ed',
        borde: '#fed7aa',
        tablaHeaderBg: '#c2410c',
        tablaHeaderColor: '#ffffff',
        estilo: 'naranja'
    },
    7: { // Default Amarillo / Dorado
        nombre: 'Default Amarillo',
        primario: '#854d0e',
        secundario: '#ca8a04',
        acento: '#eab308',
        fondoHeader: '#fefce8',
        borde: '#fef08a',
        tablaHeaderBg: '#854d0e',
        tablaHeaderColor: '#ffffff',
        estilo: 'dorado'
    },
    8: { // Default Marine
        nombre: 'Default Marine',
        primario: '#0c4a6e',
        secundario: '#0284c7',
        acento: '#38bdf8',
        fondoHeader: '#f0f9ff',
        borde: '#bae6fd',
        tablaHeaderBg: '#0c4a6e',
        tablaHeaderColor: '#ffffff',
        estilo: 'marine'
    }
};

function numeroALetras(monto) {
    const num = Math.floor(monto);
    const centavos = Math.round((monto - num) * 100);
    const centavosText = centavos < 10 ? `0${centavos}` : `${centavos}`;

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const cientos = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (num === 0) return `CERO PESOS ${centavosText}/100 M.N.`;

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
            output += (u > 0) ? `${decenas[d]} Y ${unidades[u]} ` : `${decenas[d]} `;
        } else if (u > 0) {
            output += unidades[u] + ' ';
        }
        return output;
    }

    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    let letras = '';

    if (miles > 0) {
        letras += (miles === 1) ? 'UN MIL ' : `${convertirGrupo(miles)}MIL `;
    }
    if (resto > 0) {
        letras += convertirGrupo(resto);
    }

    return `${letras.trim()} PESOS ${centavosText}/100 M.N.`;
}

/**
 * Genera el HTML completo para representación impresa de un CFDI 4.0
 * adaptado a la plantilla configurada en la empresa emisora.
 */
export async function generarHtmlFactura(comprobante) {
    const emisor = comprobante.emisors || {};
    const receptor = comprobante.receptors || {};

    const plantillaId = Number(emisor.plantilla_id || 1);
    const paleta = PALETAS_PLANTILLAS[plantillaId] || PALETAS_PLANTILLAS[1];

    const xml = comprobante.xml_timbrado || '';
    const getXmlAttr = (pattern) => {
        const m = xml.match(pattern);
        return m ? m[1] : '';
    };

    const xmlUuid = getXmlAttr(/UUID=["']([^"']+)["']/i);
    const uuidFiscal = comprobante.uuid || xmlUuid || 'PENDIENTE DE TIMBRADO FISCAL';
    const esTimbrado = Boolean(uuidFiscal && uuidFiscal.trim().length > 10 && !uuidFiscal.includes('PENDIENTE'));

    const xmlFechaEmision = getXmlAttr(/Fecha=["']([^"']+)["']/i);
    const xmlFechaTimbrado = getXmlAttr(/FechaTimbrado=["']([^"']+)["']/i);

    const fechaEmision = comprobante.fecha ? new Date(comprobante.fecha).toLocaleString('es-MX') : (xmlFechaEmision ? new Date(xmlFechaEmision).toLocaleString('es-MX') : new Date().toLocaleString('es-MX'));
    const fechaCertificacion = comprobante.fecha_timbrado ? new Date(comprobante.fecha_timbrado).toLocaleString('es-MX') : (xmlFechaTimbrado ? new Date(xmlFechaTimbrado).toLocaleString('es-MX') : (esTimbrado ? fechaEmision : 'SIN TIMBRAR'));

    const xmlTotal = parseFloat(getXmlAttr(/Total=["']([^"']+)["']/i) || '0');
    const xmlSubTotal = parseFloat(getXmlAttr(/SubTotal=["']([^"']+)["']/i) || '0');
    const xmlDescuento = parseFloat(getXmlAttr(/Descuento=["']([^"']+)["']/i) || '0');

    const totalNum = parseFloat(comprobante.total_string || comprobante.total || xmlTotal || 0) || 0;
    const subtotalNum = parseFloat(comprobante.sub_total_string || comprobante.sub_total || xmlSubTotal || totalNum) || totalNum;
    const descuentoNum = parseFloat(comprobante.descuento_string || comprobante.descuento || xmlDescuento || 0) || 0;
    const importeLetra = numeroALetras(totalNum);

    // =========================================================================
    // TIPO DE COMPROBANTE (I: Ingreso, E: Egreso/Nota Crédito, P: Pago)
    // =========================================================================
    const rawTipo = (comprobante.tipo_de_comprobante || getXmlAttr(/TipoDeComprobante=["']([^"']+)["']/i) || 'I').toUpperCase();
    const esComprobantePago = rawTipo === 'P';
    const esComprobanteEgreso = rawTipo === 'E';

    let tipoComprobanteDesc = 'I - Ingreso';
    if (esComprobantePago) tipoComprobanteDesc = 'P - Pago (Complemento de Recepción de Pagos)';
    else if (esComprobanteEgreso) tipoComprobanteDesc = 'E - Egreso (Nota de Crédito)';
    else if (rawTipo === 'T') tipoComprobanteDesc = 'T - Traslado';
    else if (rawTipo === 'N') tipoComprobanteDesc = 'N - Nómina';

    // =========================================================================
    // DOCUMENTOS RELACIONADOS (CFDIRelacionados para Egresos/Notas de Crédito y Facturas)
    // =========================================================================
    const cfdiRelacionados = [];
    let tipoRelacionSAT = '';

    if (xml) {
        const relGroupMatch = xml.match(/<cfdi:CfdiRelacionados[^>]*TipoRelacion=["']([^"']+)["'][^>]*>([\s\S]*?)<\/cfdi:CfdiRelacionados>/i);
        if (relGroupMatch) {
            tipoRelacionSAT = relGroupMatch[1];
            const relUuidMatches = relGroupMatch[2].match(/<cfdi:CfdiRelacionado[^>]*UUID=["']([^"']+)["']/gi) || [];
            for (const rMatch of relUuidMatches) {
                const u = rMatch.match(/UUID=["']([^"']+)["']/i);
                if (u && u[1]) cfdiRelacionados.push(u[1]);
            }
        }
    }

    // =========================================================================
    // COMPLEMENTO DE RECEPCIÓN DE PAGOS (Tipo P)
    // =========================================================================
    const pagosRecibidos = [];
    const doctosRelacionadosPago = [];

    if (esComprobantePago && xml) {
        // 1. Extraer cada nodo <pago20:Pago> o <pago10:Pago>
        const pagoMatches = xml.match(/<pago[12]0:Pago[^>]*>([\s\S]*?)<\/pago[12]0:Pago>/gi) || [];
        for (const pMatch of pagoMatches) {
            const getPAttr = (attr) => {
                const m = pMatch.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
                return m ? m[1] : '';
            };

            pagosRecibidos.push({
                fechaPago: getPAttr('FechaPago'),
                formaPago: getPAttr('FormaDePagoP') || getPAttr('FormaPago') || '03',
                moneda: getPAttr('MonedaP') || getPAttr('Moneda') || 'MXN',
                monto: parseFloat(getPAttr('Monto') || '0'),
                tipoCambio: getPAttr('TipoCambioP') || '1',
                numOperacion: getPAttr('NumOperacion') || ''
            });

            // 2. Extraer los doctos relacionados dentro de este pago
            const doctoMatches = pMatch.match(/<pago[12]0:DoctoRelacionado[^>]+(\/>|>[\s\S]*?<\/pago[12]0:DoctoRelacionado>)/gi) || [];
            for (const dMatch of doctoMatches) {
                const getDAttr = (attr) => {
                    const m = dMatch.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
                    return m ? m[1] : '';
                };
                doctosRelacionadosPago.push({
                    idDocumento: getDAttr('IdDocumento'),
                    serie: getDAttr('Serie'),
                    folio: getDAttr('Folio'),
                    monedaDR: getDAttr('MonedaDR') || 'MXN',
                    numParcialidad: getDAttr('NumParcialidad') || '1',
                    saldoAnterior: parseFloat(getDAttr('ImpSaldoAnt') || '0'),
                    importePagado: parseFloat(getDAttr('ImpPagado') || '0'),
                    saldoInsoluto: parseFloat(getDAttr('ImpSaldoInsoluto') || '0'),
                    objetoImpDR: getDAttr('ObjetoImpDR') || '01'
                });
            }
        }
    }
    let partidas = [];

    // 1. Si existe xml_timbrado, extraer TODOS los conceptos directamente del XML
    if (comprobante.xml_timbrado) {
        try {
            const conceptoMatches = comprobante.xml_timbrado.match(/<cfdi:Concepto[^>]+(\/>|>[\s\S]*?<\/cfdi:Concepto>)/gi) || [];
            for (const cMatch of conceptoMatches) {
                const getAttr = (attr) => {
                    const m = cMatch.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
                    return m ? m[1] : '';
                };
                partidas.push({
                    clave_prod_serv: getAttr('ClaveProdServ') || '',
                    clave_unidad: getAttr('ClaveUnidad') || '',
                    unidad: getAttr('Unidad') || '',
                    cantidad: parseFloat(getAttr('Cantidad') || '1'),
                    descripcion: getAttr('Descripcion') || '',
                    valor_unitario: parseFloat(getAttr('ValorUnitario') || '0'),
                    importe: parseFloat(getAttr('Importe') || '0'),
                    objeto_imp: getAttr('ObjetoImp') || '02'
                });
            }
        } catch (xmlErr) {
            console.warn('[generarHtmlFactura] Error al extraer conceptos de XML:', xmlErr.message);
        }
    }

    // 2. Si no hay XML pero hay conceptos en la base de datos (prefactura o borrador)
    if (partidas.length === 0 && comprobante.Conceptos && Array.isArray(comprobante.Conceptos)) {
        for (const cGroup of comprobante.Conceptos) {
            if (cGroup.Concepto && Array.isArray(cGroup.Concepto)) {
                for (const item of cGroup.Concepto) {
                    partidas.push({
                        clave_prod_serv: item.clave_prod_serv || '01010101',
                        clave_unidad: item.clave_unidad || 'E48',
                        unidad: item.unidad || 'Servicio',
                        cantidad: Number(item.cantidad || 1),
                        descripcion: item.descripcion || '',
                        valor_unitario: parseFloat(item.valor_unitario_string || item.valor_unitario || 0) || 0,
                        importe: parseFloat(item.importe_string || item.importe || 0) || 0,
                        objeto_imp: item.objeto_imp || '02'
                    });
                }
            }
        }
    }

    // 3. Si no hay XML ni tabla Conceptos, pero existe PagoAlumno (módulo cobranza)
    if (partidas.length === 0 && comprobante.PagoAlumno && Array.isArray(comprobante.PagoAlumno)) {
        for (const p of comprobante.PagoAlumno) {
            const nombreAlumno = p.alumno ? `${p.alumno.nombre} ${p.alumno.apellido_paterno} ${p.alumno.apellido_materno || ''}`.trim() : '';
            const desc = `${p.cargo?.concepto?.nombre || 'Servicio'}${nombreAlumno ? ' - ' + nombreAlumno : ''}${p.alumno?.matricula ? ' (Matrícula: ' + p.alumno.matricula + ')' : ''}`;
            partidas.push({
                clave_prod_serv: p.cargo?.producto?.clave_prod_sat || p.cargo?.concepto?.clave_prod_serv || '86121500',
                clave_unidad: 'E48',
                unidad: 'Servicio',
                cantidad: 1,
                descripcion: desc,
                valor_unitario: Number(p.monto || totalNum),
                importe: Number(p.monto || totalNum),
                objeto_imp: '02'
            });
        }
    }

    // Si la factura no contiene ninguna partida legítima, lanzar error en lugar de inventar conceptos
    if (partidas.length === 0) {
        throw new Error(`La factura ${comprobante.serie || 'F'}-${comprobante.folio || '0'} no contiene conceptos válidos en el XML timbrado ni en la base de datos.`);
    }

    // =========================================================================
    // IMPUESTOS FEDERALES (Traslados y Retenciones): XML COMO FUENTE DE VERDAD
    // =========================================================================
    const trasladosFederales = [];
    const retencionesFederales = [];

    // 1. Extraer impuestos directamente del XML timbrado oficial
    if (comprobante.xml_timbrado) {
        try {
            const trasMatch = comprobante.xml_timbrado.match(/<cfdi:Traslados>([\s\S]*?)<\/cfdi:Traslados>/i);
            if (trasMatch) {
                const trasItems = trasMatch[1].match(/<cfdi:Traslado[^>]+>/gi) || [];
                for (const t of trasItems) {
                    const getAttr = (attr) => {
                        const m = t.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
                        return m ? m[1] : '';
                    };
                    const imp = getAttr('Impuesto');
                    const nom = imp === '002' ? 'IVA' : (imp === '003' ? 'IEPS' : 'Traslado');
                    const tasa = parseFloat(getAttr('TasaOCuota') || '0.16');
                    const importe = parseFloat(getAttr('Importe') || '0');
                    trasladosFederales.push({ nombre: nom, tasa, importe });
                }
            }

            const retMatch = comprobante.xml_timbrado.match(/<cfdi:Retenciones>([\s\S]*?)<\/cfdi:Retenciones>/i);
            if (retMatch) {
                const retItems = retMatch[1].match(/<cfdi:Retencion[^>]+>/gi) || [];
                for (const r of retItems) {
                    const getAttr = (attr) => {
                        const m = r.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
                        return m ? m[1] : '';
                    };
                    const imp = getAttr('Impuesto');
                    const nom = imp === '001' ? 'ISR' : (imp === '002' ? 'IVA' : 'Retención');
                    const tasa = parseFloat(getAttr('TasaOCuota') || '0');
                    const importe = parseFloat(getAttr('Importe') || '0');
                    retencionesFederales.push({ nombre: nom, tasa, importe });
                }
            }
        } catch (taxXmlErr) {
            console.warn('[generarHtmlFactura] Error al extraer impuestos de XML:', taxXmlErr.message);
        }
    }

    // 2. Si no hay XML pero hay tablas relacionales en BD (prefacturas)
    if (trasladosFederales.length === 0 && retencionesFederales.length === 0 && comprobante.Conceptos && Array.isArray(comprobante.Conceptos)) {
        for (const cGroup of comprobante.Conceptos) {
            if (cGroup.Concepto && Array.isArray(cGroup.Concepto)) {
                for (const item of cGroup.Concepto) {
                    if (item.impuestos && Array.isArray(item.impuestos)) {
                        for (const imp of item.impuestos) {
                            if (imp.traslados && Array.isArray(imp.traslados)) {
                                for (const t of imp.traslados) {
                                    trasladosFederales.push({
                                        nombre: 'IVA',
                                        tasa: Number(t.tasa_o_cuota != null ? t.tasa_o_cuota : (t.tasa != null ? t.tasa : 0.16)),
                                        importe: Number(t.importe != null ? t.importe : 0)
                                    });
                                }
                            }
                            if (imp.retencions && Array.isArray(imp.retencions)) {
                                for (const r of imp.retencions) {
                                    retencionesFederales.push({
                                        nombre: r.impuesto_clave === '001' ? 'ISR' : (r.impuesto_clave === '002' ? 'IVA' : 'Retención'),
                                        tasa: Number(r.tasa_o_cuota != null ? r.tasa_o_cuota : (r.tasa != null ? r.tasa : 0)),
                                        importe: Number(r.importe != null ? r.importe : 0)
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // =========================================================================
    // IMPUESTOS LOCALES (Traslados y Retenciones)
    // =========================================================================
    let trasladosLocales = [];
    let retencionesLocales = [];

    // 1. Verificar si ya vienen en comprobante (p. ej. comprobante.Complemento?.ImpuestosLocales o comprobante.impuestosLocales)
    const rawImpLoc = comprobante.Complemento?.ImpuestosLocales || comprobante.impuestos_locales || comprobante.ImpuestosLocales || comprobante.impuestosLocales;
    if (rawImpLoc) {
        if (Array.isArray(rawImpLoc)) {
            rawImpLoc.forEach(item => {
                const tipo = (item.Tipo || '').toLowerCase();
                if (tipo.includes('traslado')) {
                    trasladosLocales.push({
                        nombre: item.Nombre || item.ImpLocTrasladado || 'ISH',
                        tasa: Number(item.Tasa != null ? item.Tasa : (item.TasadeTraslado != null ? item.TasadeTraslado : 0)),
                        importe: Math.abs(Number(item.Importe || 0))
                    });
                } else if (tipo.includes('retencion') || tipo.includes('retención')) {
                    retencionesLocales.push({
                        nombre: item.Nombre || item.ImpLocRetenido || 'Retención Local',
                        tasa: Number(item.Tasa != null ? item.Tasa : (item.TasadeRetencion != null ? item.TasadeRetencion : 0)),
                        importe: Math.abs(Number(item.Importe || 0))
                    });
                }
            });
        } else if (typeof rawImpLoc === 'object') {
            const tras = rawImpLoc.TrasladosLocales || rawImpLoc.traslado_locals || [];
            const ret = rawImpLoc.RetencionesLocales || rawImpLoc.retencion_locals || [];
            if (Array.isArray(tras)) {
                tras.forEach(t => trasladosLocales.push({
                    nombre: t.ImpLocTrasladado || t.imp_loc_trasladado || t.Nombre || 'ISH',
                    tasa: Number(t.TasadeTraslado != null ? t.TasadeTraslado : (t.tasade_traslado != null ? t.tasade_traslado : (t.Tasa != null ? t.Tasa : 0))),
                    importe: Math.abs(Number(t.Importe != null ? t.Importe : (t.importe != null ? t.importe : 0)))
                }));
            }
            if (Array.isArray(ret)) {
                ret.forEach(r => retencionesLocales.push({
                    nombre: r.ImpLocRetenido || r.imp_loc_retenido || r.Nombre || 'Retención Local',
                    tasa: Number(r.TasadeRetencion != null ? r.TasadeRetencion : (r.tasade_retencion != null ? r.tasade_retencion : (r.Tasa != null ? r.Tasa : 0))),
                    importe: Math.abs(Number(r.Importe != null ? r.Importe : (r.importe != null ? r.importe : 0)))
                }));
            }
        }
    }

    // 2. Si no vinieron adjuntos en el objeto comprobante pero tenemos comprobante.id, consultar la base de datos
    if (trasladosLocales.length === 0 && retencionesLocales.length === 0 && comprobante.id) {
        try {
            const compId = BigInt(comprobante.id);
            const impLocRows = await prisma.$queryRaw`
                SELECT il.id, il.version, il.totalde_retenciones, il.totalde_traslados
                FROM complementos c
                JOIN impuestos_locales il ON il.complemento_id = c.id
                WHERE c.comprobante_id = ${compId}
                LIMIT 1
            `;
            if (impLocRows && impLocRows.length > 0) {
                const ilId = impLocRows[0].id;
                const dbTraslados = await prisma.$queryRaw`
                    SELECT imp_loc_trasladado, tasade_traslado, importe
                    FROM traslado_locals
                    WHERE impuestos_locales_id = ${ilId}
                `;
                const dbRetenciones = await prisma.$queryRaw`
                    SELECT imp_loc_retenido, tasade_retencion, importe
                    FROM retencion_locals
                    WHERE impuestos_locales_id = ${ilId}
                `;
                (dbTraslados || []).forEach(t => {
                    trasladosLocales.push({
                        nombre: t.imp_loc_trasladado || 'ISH',
                        tasa: Number(t.tasade_traslado || 0),
                        importe: Math.abs(Number(t.importe || 0))
                    });
                });
                (dbRetenciones || []).forEach(r => {
                    retencionesLocales.push({
                        nombre: r.imp_loc_retenido || 'Retención Local',
                        tasa: Number(r.tasade_retencion || 0),
                        importe: Math.abs(Number(r.importe || 0))
                    });
                });
            }
        } catch (dbErr) {
            console.warn('[generarHtmlFactura] No se pudieron cargar impuestos locales de BD:', dbErr.message);
        }
    }

    // Sellos y QR
    const xmlSelloEmisor = getXmlAttr(/Sello=["']([^"']+)["']/i);
    const xmlSelloSAT = getXmlAttr(/SelloSAT=["']([^"']+)["']/i);
    const xmlNoCertSat = getXmlAttr(/NoCertificadoSAT=["']([^"']+)["']/i);
    const xmlNoCertEmisor = getXmlAttr(/NoCertificado=["']([^"']+)["']/i);

    const selloEmisor = comprobante.sello || xmlSelloEmisor || 'SELLO DIGITAL DEL EMISOR';
    const selloSAT = comprobante.sello_sat || xmlSelloSAT || 'SELLO DIGITAL DEL SAT';
    const noCertificadoFinal = comprobante.no_certificado || emisor.no_certificado || xmlNoCertEmisor || '00001000000504465028';
    const cadenaOriginal = comprobante.cadena_original_sat || (esTimbrado ? `||1.1|${uuidFiscal}|${fechaCertificacion}|SAT970701NN3|${selloEmisor}|${xmlNoCertSat || noCertificadoFinal}||` : 'CADENA ORIGINAL DISPONIBLE AL TIMBRAR');

    let qrCodeDataUrl = '';
    if (esTimbrado) {
        try {
            const qrText = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuidFiscal}&re=${emisor.rfc || ''}&rr=${receptor.rfc || ''}&tt=${totalNum.toFixed(6)}&fe=${selloEmisor.slice(-8)}`;
            qrCodeDataUrl = await QRCode.toDataURL(qrText, { width: 140, margin: 1 });
        } catch (e) {
            console.error('Error generando QR code:', e);
        }
    }

    const logoHtml = (emisor.logo_url || emisor.logo_path) ?
        `<img src="${emisor.logo_url || emisor.logo_path}" alt="Logo" style="max-height: 75px; max-width: 220px; object-fit: contain; margin-bottom: 6px;"/>` :
        `<div style="font-size: 18px; font-weight: bold; color: ${paleta.primario}; border: 2px solid ${paleta.primario}; padding: 6px 14px; display: inline-block; border-radius: 4px; margin-bottom: 6px;">${emisor.nombre || 'EMISOR'}</div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CFDI 4.0 - ${comprobante.serie || 'F'}-${comprobante.folio || '0'}</title>
    <style>
        * { box-sizing: border-box; }
        @page {
            size: letter portrait;
            margin: 8mm 8mm 8mm 8mm;
        }
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 10px 14px;
            font-size: 10px;
            line-height: 1.35;
            background: #ffffff;
            width: 100%;
            max-width: 216mm;
        }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .header-table td { vertical-align: top; }
        .emisor-title { font-size: 14px; font-weight: bold; color: ${paleta.primario}; margin-bottom: 2px; }
        
        .factura-badge-box {
            background: ${paleta.fondoHeader};
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            padding: 8px 12px;
            text-align: right;
        }
        .factura-folio-title { font-size: 13px; font-weight: bold; color: ${paleta.primario}; }
        .factura-folio-num { font-size: 14px; font-weight: bold; color: ${paleta.acento}; margin-top: 1px; }
        .uuid-code { font-family: monospace; font-size: 9px; font-weight: bold; color: ${esTimbrado ? paleta.secundario : '#dc2626'}; word-break: break-all; }
        
        .badge-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9px;
            margin-top: 4px;
            background: ${esTimbrado ? '#dcfce7' : '#fee2e2'};
            color: ${esTimbrado ? '#15803d' : '#b91c1c'};
        }

        .cards-row { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .cards-row td { vertical-align: top; width: 50%; }
        .info-card {
            border: 1px solid ${paleta.borde};
            background: ${paleta.fondoHeader};
            border-radius: 6px;
            padding: 8px 12px;
            margin-right: 6px;
            min-height: 90px;
        }
        .info-card.last { margin-right: 0; margin-left: 6px; }
        .card-title {
            font-size: 10px;
            font-weight: bold;
            color: ${paleta.primario};
            border-bottom: 1px solid ${paleta.borde};
            padding-bottom: 3px;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        /* Cuadro especial de CFDI Relacionados / Egresos / Notas de Crédito */
        .cuadro-relacionados {
            border: 1.5px solid ${paleta.secundario};
            background: #f8fafc;
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 10px;
        }
        .cuadro-relacionados-title {
            font-size: 10.5px;
            font-weight: bold;
            color: ${paleta.secundario};
            text-transform: uppercase;
            border-bottom: 1px dashed ${paleta.borde};
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        /* Cuadro especial de Complemento de Recepción de Pagos */
        .cuadro-pagos {
            border: 1.5px solid ${paleta.primario};
            background: ${paleta.fondoHeader};
            border-radius: 6px;
            padding: 8px 12px;
            margin-bottom: 10px;
        }
        .cuadro-pagos-title {
            font-size: 11px;
            font-weight: bold;
            color: ${paleta.primario};
            text-transform: uppercase;
            border-bottom: 1px solid ${paleta.borde};
            padding-bottom: 4px;
            margin-bottom: 6px;
        }

        .table-custom { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 8px; }
        .table-custom th {
            background: ${paleta.tablaHeaderBg};
            color: ${paleta.tablaHeaderColor};
            padding: 5px 6px;
            text-align: left;
            font-size: 9px;
            font-weight: bold;
        }
        .table-custom td {
            padding: 5px 6px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9px;
        }
        .table-custom tr:nth-child(even) td { background: #ffffff; }

        .table-conceptos { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 10px; }
        .table-conceptos th {
            background: ${paleta.tablaHeaderBg};
            color: ${paleta.tablaHeaderColor};
            padding: 5px 7px;
            text-align: left;
            font-size: 9.5px;
            font-weight: bold;
        }
        .table-conceptos td {
            padding: 5px 7px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 9.5px;
        }
        .table-conceptos tr:nth-child(even) td { background: #f8fafc; }

        .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
        .totals-table td { vertical-align: top; }
        .letra-box {
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            padding: 8px 12px;
            background: ${paleta.fondoHeader};
        }
        .totals-box {
            width: 250px;
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            background: ${paleta.fondoHeader};
            padding: 6px 10px;
            float: right;
        }
        .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10px; }
        .totals-final {
            font-size: 12px;
            font-weight: bold;
            color: ${paleta.primario};
            border-top: 2px solid ${paleta.primario};
            margin-top: 4px;
            padding-top: 4px;
        }

        .fiscal-section {
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            padding: 8px;
            background: #ffffff;
            margin-top: 8px;
            page-break-inside: avoid;
        }
        .stamp-label { font-size: 8.5px; font-weight: bold; color: ${paleta.primario}; margin-top: 2px; }
        .stamp-val { font-family: monospace; font-size: 7.5px; color: #475569; word-break: break-all; margin-bottom: 2px; line-height: 1.15; }
        
        .footer-sat {
            text-align: center;
            margin-top: 10px;
            font-size: 8px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 6px;
        }
        .badge-plantilla {
            display: inline-block;
            font-size: 8px;
            color: #94a3b8;
            margin-top: 2px;
        }
    </style>
</head>
<body>
    <!-- ENCABEZADO -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                ${logoHtml}
                <div class="emisor-title">${emisor.nombre || 'EMISOR'}</div>
                <div><strong>RFC Emisor:</strong> ${emisor.rfc || 'N/A'}</div>
                <div><strong>Régimen Fiscal:</strong> ${emisor.regimen_fiscal ? getDescripcionRegimen(emisor.regimen_fiscal) : '601 - General de Ley'}</div>
                <div><strong>Lugar de Expedición:</strong> C.P. ${comprobante.lugar_expedicion || emisor.lugar_expedicion || '01000'}</div>
                <div><strong>Tipo de Comprobante:</strong> ${tipoComprobanteDesc}</div>
                <div class="badge-plantilla">Diseño Aplicado: ${paleta.nombre}</div>
            </td>
            <td style="width: 45%;">
                <div class="factura-badge-box">
                    <div class="factura-folio-title">COMPROBANTE FISCAL DIGITAL (CFDI 4.0)</div>
                    <div class="factura-folio-num">SERIE Y FOLIO: ${comprobante.serie || 'F'}-${comprobante.folio || '0'}</div>
                    <div style="margin-top: 4px;"><strong>Folio Fiscal (UUID):</strong></div>
                    <div class="uuid-code">${uuidFiscal}</div>
                    <div style="margin-top: 3px;"><strong>Fecha Emisión:</strong> ${fechaEmision}</div>
                    <div><strong>Certificación SAT:</strong> ${fechaCertificacion}</div>
                    <div>
                        <span class="badge-status">${esTimbrado ? '✔ TIMBRADO SAT OFICIAL' : '⚠️ PRE-FACTURA BORRADOR'}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- DATOS RECEPTOR Y CONDICIONES -->
    <table class="cards-row">
        <tr>
            <td>
                <div class="info-card">
                    <div class="card-title">Datos del Receptor / Cliente</div>
                    <div><strong>Nombre:</strong> ${receptor.nombre || 'PÚBLICO EN GENERAL'}</div>
                    <div><strong>RFC:</strong> ${receptor.rfc || 'XAXX010101000'}</div>
                    <div><strong>Régimen Fiscal:</strong> ${receptor.regimen_fiscal_receptor ? getDescripcionRegimen(receptor.regimen_fiscal_receptor) : '616 - Sin obligaciones'}</div>
                    <div><strong>Domicilio Fiscal:</strong> C.P. ${receptor.domicilio_fiscal_receptor || '01000'}</div>
                    <div><strong>Uso de CFDI:</strong> ${receptor.uso_cfdi ? getDescripcionUsoCFDI(receptor.uso_cfdi) : 'S01 - Sin efectos fiscales'}</div>
                </div>
            </td>
            <td>
                <div class="info-card last">
                    <div class="card-title">Detalles de Emisión y Pago</div>
                    <div><strong>Forma de Pago:</strong> ${comprobante.forma_pago || '03 - Transferencia electrónica'}</div>
                    <div><strong>Método de Pago:</strong> ${comprobante.metodo_pago || 'PUE - Pago en una sola exhibición'}</div>
                    <div><strong>Moneda:</strong> ${comprobante.moneda || 'MXN'} (Tipo de Cambio: ${comprobante.tipo_cambio || '1'})</div>
                    <div><strong>No. Certificado Emisor:</strong> ${comprobante.no_certificado || emisor.no_certificado || '00001000000504465028'}</div>
                    <div><strong>Exportación:</strong> ${comprobante.exportacion || '01 - No aplica'}</div>
                </div>
            </td>
        </tr>
    </table>

    ${cfdiRelacionados.length > 0 ? `
    <!-- CUADRO ESPECIAL: DOCUMENTOS RELACIONADOS (EGRESOS / NOTAS DE CRÉDITO) -->
    <div class="cuadro-relacionados">
        <div class="cuadro-relacionados-title">
            📄 CFDI Relacionados / Documentos Vinculados (Tipo Relación SAT: ${tipoRelacionSAT || '01 - Nota de crédito de los documentos relacionados'})
        </div>
        <table class="table-custom">
            <thead>
                <tr>
                    <th style="width: 10%;">#</th>
                    <th style="width: 90%;">Folio Fiscal (UUID) Relacionado</th>
                </tr>
            </thead>
            <tbody>
                ${cfdiRelacionados.map((uuidRel, idx) => `
                <tr>
                    <td><strong>${idx + 1}</strong></td>
                    <td style="font-family: monospace; font-size: 9.5px; font-weight: bold; color: ${paleta.primario};">${uuidRel}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
    </div>
    ` : ''}

    ${esComprobantePago && (pagosRecibidos.length > 0 || doctosRelacionadosPago.length > 0) ? `
    <!-- CUADRO ESPECIAL: COMPLEMENTO DE RECEPCIÓN DE PAGOS (TIPO P) -->
    <div class="cuadro-pagos">
        <div class="cuadro-pagos-title">💰 Complemento de Recepción de Pagos 2.0</div>
        
        ${pagosRecibidos.length > 0 ? `
        <div style="font-weight: bold; font-size: 9.5px; margin-bottom: 4px; color: ${paleta.primario};">Información General del Pago Recibido:</div>
        <table class="table-custom" style="margin-bottom: 8px;">
            <thead>
                <tr>
                    <th>Fecha de Pago</th>
                    <th>Forma de Pago</th>
                    <th>Moneda</th>
                    <th>Tipo Cambio</th>
                    <th>Monto Pagado</th>
                    <th>No. Operación</th>
                </tr>
            </thead>
            <tbody>
                ${pagosRecibidos.map(p => `
                <tr>
                    <td>${p.fechaPago || 'N/A'}</td>
                    <td>${p.formaPago}</td>
                    <td>${p.moneda}</td>
                    <td>${p.tipoCambio}</td>
                    <td style="font-weight: bold; color: ${paleta.primario};">$${p.monto.toFixed(2)}</td>
                    <td>${p.numOperacion || 'N/A'}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}

        ${doctosRelacionadosPago.length > 0 ? `
        <div style="font-weight: bold; font-size: 9.5px; margin-top: 6px; margin-bottom: 4px; color: ${paleta.primario};">Documentos Relacionados y Liquidación de Saldos:</div>
        <table class="table-custom">
            <thead>
                <tr>
                    <th style="width: 32%;">UUID Documento Relacionado</th>
                    <th style="width: 10%;">Serie-Folio</th>
                    <th style="width: 8%;">Parcialidad</th>
                    <th style="width: 15%; text-align: right;">Saldo Anterior</th>
                    <th style="width: 15%; text-align: right;">Importe Pagado</th>
                    <th style="width: 15%; text-align: right;">Saldo Insoluto</th>
                    <th style="width: 5%;">Obj.</th>
                </tr>
            </thead>
            <tbody>
                ${doctosRelacionadosPago.map(dr => `
                <tr>
                    <td style="font-family: monospace; font-size: 8.5px;">${dr.idDocumento}</td>
                    <td>${dr.serie || ''}${dr.folio ? '-' + dr.folio : ''}</td>
                    <td style="text-align: center;">${dr.numParcialidad}</td>
                    <td style="text-align: right;">$${dr.saldoAnterior.toFixed(2)}</td>
                    <td style="text-align: right; font-weight: bold; color: ${paleta.primario};">$${dr.importePagado.toFixed(2)}</td>
                    <td style="text-align: right;">$${dr.saldoInsoluto.toFixed(2)}</td>
                    <td style="text-align: center;">${dr.objetoImpDR}</td>
                </tr>
                `).join('')}
            </tbody>
        </table>
        ` : ''}
    </div>
    ` : ''}

    <!-- TABLA DE CONCEPTOS -->
    <table class="table-conceptos">
        <thead>
            <tr>
                <th style="width: 12%;">Clave SAT</th>
                <th style="width: 8%;">Cant.</th>
                <th style="width: 12%;">Unidad</th>
                <th style="width: 44%;">Descripción</th>
                <th style="width: 12%; text-align: right;">Unitario</th>
                <th style="width: 12%; text-align: right;">Importe</th>
            </tr>
        </thead>
        <tbody>
            ${partidas.map(p => `
            <tr>
                <td><strong>${p.clave_prod_serv}</strong></td>
                <td>${p.cantidad}</td>
                <td>${p.clave_unidad} - ${p.unidad}</td>
                <td>${p.descripcion} <br/><span style="color:#64748b; font-size: 8.5px;">ObjetoImp: ${p.objeto_imp}</span></td>
                <td style="text-align: right;">$${p.valor_unitario.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${p.importe.toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- TOTALES -->
    <table class="totals-table">
        <tr>
            <td style="width: 60%; padding-right: 10px;">
                <div class="letra-box">
                    <div style="font-weight: bold; color: ${paleta.primario}; font-size: 10px; text-transform: uppercase;">Importe Total con Letra</div>
                    <div style="font-weight: bold; margin-top: 2px;">*** ${importeLetra} ***</div>
                </div>
            </td>
            <td style="width: 40%;">
                <div class="totals-box">
                    <div class="totals-row">
                        <span>Subtotal:</span>
                        <span>$${subtotalNum.toFixed(2)}</span>
                    </div>
                    ${descuentoNum > 0 ? `
                    <div class="totals-row" style="color: #dc2626;">
                        <span>Descuento:</span>
                        <span>-$${descuentoNum.toFixed(2)}</span>
                    </div>` : ''}
                    ${trasladosFederales.map(tf => `
                    <div class="totals-row">
                        <span>${tf.nombre} (${(tf.tasa * 100).toFixed(2)}% Traslado Federal):</span>
                        <span>$${tf.importe.toFixed(2)}</span>
                    </div>
                    `).join('')}
                    ${trasladosLocales.map(tl => `
                    <div class="totals-row" style="color: ${paleta.primario}; font-weight: 500;">
                        <span>${tl.nombre} (${tl.tasa.toFixed(2)}% Traslado Local):</span>
                        <span>+$${tl.importe.toFixed(2)}</span>
                    </div>
                    `).join('')}
                    ${retencionesFederales.map(rf => `
                    <div class="totals-row" style="color: #b91c1c;">
                        <span>${rf.nombre} (${(rf.tasa * 100).toFixed(2)}% Retención Federal):</span>
                        <span>-$${rf.importe.toFixed(2)}</span>
                    </div>
                    `).join('')}
                    ${retencionesLocales.map(rl => `
                    <div class="totals-row" style="color: #b91c1c;">
                        <span>${rl.nombre} (${rl.tasa.toFixed(2)}% Retención Local):</span>
                        <span>-$${rl.importe.toFixed(2)}</span>
                    </div>
                    `).join('')}
                    <div class="totals-row totals-final">
                        <span>TOTAL:</span>
                        <span>$${totalNum.toFixed(2)} ${comprobante.moneda || 'MXN'}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- SELLOS DIGITALES Y QR -->
    <div class="fiscal-section">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 125px; text-align: center; vertical-align: top; padding-right: 8px;">
                    ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR SAT" style="width: 115px; height: 115px;"/>` : '<div style="width:110px; height:110px; border:1px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:9px;">QR SAT</div>'}
                </td>
                <td style="vertical-align: top;">
                    <div class="stamp-label">CADENA ORIGINAL DEL COMPLEMENTO DE CERTIFICACIÓN DIGITAL DEL SAT:</div>
                    <div class="stamp-val">${cadenaOriginal}</div>

                    <div class="stamp-label">SELLO DIGITAL DEL CFDI (EMISOR):</div>
                    <div class="stamp-val">${selloEmisor}</div>

                    <div class="stamp-label">SELLO DIGITAL DEL SAT:</div>
                    <div class="stamp-val">${selloSAT}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- PIE DE PÁGINA SAT -->
    <div class="footer-sat">
        Este documento es una representación impresa de un CFDI Versión 4.0 expedido por ${emisor.nombre || 'el Emisor'}.<br/>
        RFC Emisor: ${emisor.rfc || 'N/A'} | Régimen: ${emisor.regimen_fiscal || '601'} | RFC Prov. Certif.: SAT970701NN3
    </div>
</body>
</html>`;
}
