import prisma from '@/lib/prisma';

export function serializeBigIntsAndDecimals(obj) {
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

// Invocación oficial al microservicio Go de Timbrado Corporativo con fallback inteligente de endpoints
export async function invocarServicioGoTimbrado(facturasIds, token = null) {
    const baseUrl = process.env.GO_TIMBRADO_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8088';
    const numIds = facturasIds.map(id => Number(id));

    // Determinar la URL del endpoint según la configuración de Nginx / API
    let endpointUrl = `${baseUrl}/api/timbradocorporativo/TimbradoCorporativo`;
    if (process.env.GO_TIMBRADO_URL || baseUrl.includes(':8088')) {
        endpointUrl = `${baseUrl}/TimbradoCorporativo`;
    }

    try {
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        console.log(`[Go Microservice Integration] Invocando Go Timbrador en ${endpointUrl} para Facturas_ID:`, numIds);

        let res = await fetch(endpointUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ Facturas_ID: numIds })
        });

        // Si la ruta inicial devolvió 404, reintentar automáticamente en la ruta alternativa
        if (res.status === 404) {
            const fallbackUrl = endpointUrl.includes('/api/timbradocorporativo') 
                ? `${baseUrl}/TimbradoCorporativo`
                : `${baseUrl}/api/timbradocorporativo/TimbradoCorporativo`;
            
            console.log(`[Go Microservice Integration] Endpoint principal dio 404. Reintentando en fallback: ${fallbackUrl}`);
            res = await fetch(fallbackUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ Facturas_ID: numIds })
            });
        }

        if (res.ok) {
            const data = await res.json();
            console.log('[Go Microservice Integration] Respuesta de éxito Go:', data);
            return { success: true, data };
        } else {
            const errText = await res.text();
            console.warn('[Go Microservice Integration] Respuesta con error del microservicio Go:', res.status, errText);

            let mensajeLimpio = errText;
            if (errText.includes('<html>') || errText.includes('404 Not Found')) {
                mensajeLimpio = `Ruta del microservicio Go no encontrada (HTTP 404). Verifique que Nginx / Servidor Go esté corriendo.`;
            }

            return { success: false, error: mensajeLimpio };
        }
    } catch (e) {
        console.warn(`[Go Microservice Integration] Fallo al contactar el microservicio Go en ${endpointUrl}: ${e.message}`);
        return { success: false, error: e.message };
    }
}

// Obtener o auto-generar Emisor predeterminado de un grupo
export async function obtenerOGenerarEmisorPredeterminado(emisorId = null, grupoId = null) {
    if (emisorId) {
        const emisorEncontrado = await prisma.emisors.findUnique({
            where: { id: BigInt(emisorId) }
        });
        if (emisorEncontrado) return emisorEncontrado;
    }

    const whereBase = { NOT: { rfc: 'UHI950412XX1' } };
    if (grupoId) whereBase.grupo_id = BigInt(grupoId);

    let emisor = null;
    try {
        emisor = await prisma.emisors.findFirst({
            where: { ...whereBase, es_predeterminado: true }
        });
    } catch (e) {
        console.warn('[obtenerOGenerarEmisorPredeterminado] Warning searching by es_predeterminado:', e.message);
    }

    if (!emisor) {
        emisor = await prisma.emisors.findFirst({
            where: whereBase,
            orderBy: { id: 'asc' }
        });
    }

    if (!emisor && grupoId) {
        // Retry without es_predeterminado constraint for that grupo_id
        emisor = await prisma.emisors.findFirst({
            where: { grupo_id: BigInt(grupoId) },
            orderBy: { id: 'asc' }
        });
    }

    if (!emisor) {
        throw new Error('No existe ninguna Razón Social Emisora registrada para esta cuenta o grupo. Por favor configure su empresa en la plataforma.');
    }
    return emisor;
}

// Obtener Receptor Genérico para Público en General
export async function obtenerOGenerarReceptorGenerico() {
    let receptorGenerico = await prisma.receptors.findFirst({ where: { rfc: 'XAXX010101000' } });
    if (!receptorGenerico) {
        receptorGenerico = await prisma.receptors.create({
            data: {
                rfc: 'XAXX010101000',
                nombre: 'PUBLICO EN GENERAL',
                domicilio_fiscal_receptor: '01000',
                regimen_fiscal_receptor: '616',
                uso_cfdi: 'S01'
            }
        });
    }
    return receptorGenerico;
}

// Obtener y reservar el siguiente Folio y Serie
export async function obtenerSiguienteFolioSerie(emisorId, clavePreferida = null) {
    let serie = null;
    
    if (clavePreferida) {
        serie = await prisma.series.findFirst({
            where: {
                emisor_id: BigInt(emisorId),
                tipo_comprobante: 'I',
                clave: clavePreferida
            }
        });
    }

    if (!serie) {
        serie = await prisma.series.findFirst({
            where: {
                emisor_id: BigInt(emisorId),
                tipo_comprobante: 'I'
            },
            orderBy: { id: 'asc' }
        });
    }

    if (!serie) {
        serie = await prisma.series.create({
            data: {
                clave: 'F',
                descripcion: 'Serie Facturación Colegiaturas',
                ultimo_folio: 0n,
                emisor_id: BigInt(emisorId),
                tipo_comprobante: 'I'
            }
        });
    }

    const ultimoFolioNum = Number(serie.ultimo_folio || 0);
    const nuevoFolioNum = ultimoFolioNum + 1;

    await prisma.series.update({
        where: { id: serie.id },
        data: { ultimo_folio: BigInt(nuevoFolioNum) }
    });

    return {
        serie: serie.clave || 'F',
        folio: nuevoFolioNum.toString()
    };
}

// Helper para construir la descripción estandarizada del concepto por producto
export function construirDescripcionConcepto({ producto, carrera, fechaPago, nombreAlumno, curp, matricula, rvoe }) {
    const dateObj = fechaPago ? (fechaPago instanceof Date ? fechaPago : new Date(fechaPago)) : new Date();
    const monthYear = isNaN(dateObj.getTime())
        ? new Date().toLocaleString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase()
        : dateObj.toLocaleString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();

    const prodStr = (producto || 'MENSUALIDAD').toUpperCase();
    const carreraStr = (carrera || 'GENERAL').toUpperCase();
    const nombreStr = (nombreAlumno || 'ESTUDIANTE GENERAL').toUpperCase().trim();
    const curpStr = (curp || 'N/A').toUpperCase();
    const matStr = (matricula || 'N/A').toUpperCase();
    const rvoeStr = (rvoe || 'N/A').toUpperCase();

    return `PAGO A ${prodStr} DE ${carreraStr} REALIZADO EL MES DE ${monthYear} DEL ESTUDIANTE ${nombreStr} CURP ${curpStr} Matricula ${matStr} Programa con RVOE SEP NO. ${rvoeStr}`;
}

// Helper para poblar estructura completa de Conceptos y XML Base CFDI 4.0
export async function crearEstructuraCompletaCFDI({ comprobante, emisor, receptor, descripcionConcepto, monto, grupoId, claveProdServ, items }) {
    // 1. Limpiar conceptos anteriores si existen (para permitir ediciones)
    const prevHeaders = await prisma.conceptos.findMany({
        where: { comprobante_id: comprobante.id },
        select: { id: true }
    });

    if (prevHeaders.length > 0) {
        const prevHeaderIds = prevHeaders.map(h => h.id);
        await prisma.concepto.deleteMany({
            where: { conceptos_id: { in: prevHeaderIds } }
        });
        await prisma.conceptos.deleteMany({
            where: { id: { in: prevHeaderIds } }
        });
    }

    const conceptosHeader = await prisma.conceptos.create({
        data: {
            comprobante_id: comprobante.id,
            grupo_id: grupoId || emisor.grupo_id,
            total_impuestos_trasladados: 0,
            total_impuestos_trasladados_string: '0.00',
            total_impuestos_retenidos: 0,
            total_impuestos_retenidos_string: '0.00'
        }
    });

    let listaItemsFinal = [];
    if (Array.isArray(items) && items.length > 0) {
        listaItemsFinal = items.map(it => ({
            descripcion: (it.concepto || it.descripcion || 'Servicios Educativos').trim(),
            monto: parseFloat(it.monto || it.valor_unitario || 0),
            clave_prod_serv: it.clave_prod_serv || claveProdServ || ''
        })).filter(it => it.monto > 0);
    }

    if (listaItemsFinal.length === 0) {
        listaItemsFinal = [{
            descripcion: descripcionConcepto || 'Colegiatura y Servicios Educativos Integrales',
            monto: Number(monto || 0),
            clave_prod_serv: claveProdServ || ''
        }];
    }

    let subtotalAcumulado = 0;
    let ivaTotalAcumulado = 0;
    let totalAcumulado = 0;
    let xmlConceptosList = '';

    for (const item of listaItemsFinal) {
        const montoNetoTotal = item.monto;
        const baseSubtotalItem = Number(montoNetoTotal.toFixed(2));
        const ivaItem = 0;

        subtotalAcumulado += baseSubtotalItem;
        ivaTotalAcumulado += ivaItem;
        totalAcumulado += montoNetoTotal;

        const descSat = (item.descripcion || 'Servicios Educativos').trim();

        const conceptoDB = await prisma.concepto.create({
            data: {
                conceptos_id: conceptosHeader.id,
                clave_prod_serv: item.clave_prod_serv,
                clave_unidad: 'E48',
                unidad: 'Servicio',
                cantidad: 1n,
                descripcion: descSat,
                valor_unitario: baseSubtotalItem,
                valor_unitario_string: String(baseSubtotalItem.toFixed(2)),
                importe: baseSubtotalItem,
                importe_string: String(baseSubtotalItem.toFixed(2)),
                descuento: 0,
                descuento_string: '0',
                objeto_imp: '02'
            }
        });

        // Crear registro del impuesto Exento en BD
        const impuestoConcepto = await prisma.impuestos.create({
            data: {
                concepto_id: conceptoDB.id
            }
        });

        await prisma.traslados.create({
            data: {
                impuestos_id: impuestoConcepto.id,
                base: baseSubtotalItem,
                base_string: String(baseSubtotalItem.toFixed(2)),
                impuesto_clave: '002',
                tipo_factor: 'Exento'
            }
        });

        xmlConceptosList += `<cfdi:Concepto ClaveProdServ="${item.clave_prod_serv}" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="${descSat}" ValorUnitario="${baseSubtotalItem.toFixed(2)}" Importe="${baseSubtotalItem.toFixed(2)}" ObjetoImp="02">
    <cfdi:Impuestos>
        <cfdi:Traslados>
            <cfdi:Traslado Base="${baseSubtotalItem.toFixed(2)}" Impuesto="002" TipoFactor="Exento"/>
        </cfdi:Traslados>
    </cfdi:Impuestos>
</cfdi:Concepto>\n`;
    }

    subtotalAcumulado = Number(subtotalAcumulado.toFixed(2));
    totalAcumulado = Number(totalAcumulado.toFixed(2));

    await prisma.conceptos.update({
        where: { id: conceptosHeader.id },
        data: { total_impuestos_trasladados: 0 }
    });

    const xmlBase = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${comprobante.serie}" Folio="${comprobante.folio}" Fecha="${comprobante.fecha}" FormaPago="03" MetodoPago="PUE" Moneda="MXN" SubTotal="${subtotalAcumulado.toFixed(2)}" Total="${totalAcumulado.toFixed(2)}" TipoDeComprobante="I" LugarExpedicion="${emisor.lugar_expedicion || '01000'}">
  <cfdi:Emisor Rfc="${emisor.rfc}" Nombre="${emisor.nombre}" RegimenFiscal="${emisor.regimen_fiscal || '601'}"/>
  <cfdi:Receptor Rfc="${receptor.rfc}" Nombre="${receptor.nombre}" DomicilioFiscalReceptor="${receptor.domicilio_fiscal_receptor || emisor.lugar_expedicion || '01000'}" RegimenFiscalReceptor="${receptor.regimen_fiscal_receptor || '616'}" UsoCFDI="${receptor.uso_cfdi || 'S01'}"/>
  <cfdi:Conceptos>
    ${xmlConceptosList.trim()}
  </cfdi:Conceptos>
</cfdi:Comprobante>`;

    await prisma.comprobantes.update({
        where: { id: comprobante.id },
        data: {
            sub_total: String(subtotalAcumulado),
            sub_total_string: subtotalAcumulado.toFixed(2),
            total: String(totalAcumulado),
            total_string: totalAcumulado.toFixed(2),
            descuento: '0',
            descuento_string: '0',
            exportacion: '01',
            tipo_cambio: '1',
            xml_timbrado: xmlBase
        }
    });
}
