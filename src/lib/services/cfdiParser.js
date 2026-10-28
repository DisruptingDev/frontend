/**
 * Parser de comprobantes fiscales CFDI (XML 3.3 y 4.0)
 * Extrae emisor, receptor, totales e impuestos (IVA 16, 8, 0, Exento, Retenciones de IVA e ISR)
 */

export function parseCFDIXml(xmlContent) {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Contenido XML no válido o vacío');
  }

  // 1. Datos del Comprobante (extraídos de la etiqueta <cfdi:Comprobante>)
  const comprobanteTagMatch = xmlContent.match(/<cfdi:Comprobante[^>]*>/i);
  const comprobanteTag = comprobanteTagMatch ? comprobanteTagMatch[0] : xmlContent;

  const fechaMatch = comprobanteTag.match(/\bFecha=["']([^"']+)["']/i);
  const fechaStr = fechaMatch ? fechaMatch[1] : new Date().toISOString();

  const serieMatch = comprobanteTag.match(/\bSerie=["']([^"']+)["']/i);
  const folioMatch = comprobanteTag.match(/\bFolio=["']([^"']+)["']/i);
  const tipoCompMatch = comprobanteTag.match(/\bTipoDeComprobante=["']([^"']+)["']/i);
  const metodoPagoMatch = comprobanteTag.match(/\bMetodoPago=["']([^"']+)["']/i);
  const formaPagoMatch = comprobanteTag.match(/\bFormaPago=["']([^"']+)["']/i);
  const monedaMatch = comprobanteTag.match(/\bMoneda=["']([^"']+)["']/i);
  const tipoCambioMatch = comprobanteTag.match(/\bTipoCambio=["']([^"']+)["']/i);

  const subtotalMatch = comprobanteTag.match(/\bSubTotal=["']([^"']+)["']/i);
  const descuentoMatch = comprobanteTag.match(/\bDescuento=["']([^"']+)["']/i);
  const totalMatch = comprobanteTag.match(/\bTotal=["']([^"']+)["']/i);

  // Timbre Fiscal Digital (UUID y FechaTimbrado)
  const timbreMatch = xmlContent.match(/<(?:tfd:)?TimbreFiscalDigital[^>]*>/i);
  const timbreTag = timbreMatch ? timbreMatch[0] : xmlContent;
  const uuidMatch =
    timbreTag.match(/\bUUID=["']([0-9a-fA-F-]{36})["']/i) ||
    xmlContent.match(/\bUUID=["']([0-9a-fA-F-]{36})["']/i);
  const uuid = uuidMatch ? uuidMatch[1].toUpperCase().trim() : null;

  const fechaTimbradoMatch = timbreTag.match(/\bFechaTimbrado=["']([^"']+)["']/i);
  const fechaTimbradoStr = fechaTimbradoMatch ? fechaTimbradoMatch[1] : null;

  // 2. Emisor
  const emisorMatch = xmlContent.match(/<cfdi:Emisor[^>]*>/i);
  const emisorTag = emisorMatch ? emisorMatch[0] : '';
  const rfcEmisorMatch = emisorTag.match(/\bRfc=["']([^"']+)["']/i);
  const nomEmisorMatch = emisorTag.match(/\bNombre=["']([^"']+)["']/i);

  // 3. Receptor
  const receptorMatch = xmlContent.match(/<cfdi:Receptor[^>]*>/i);
  const receptorTag = receptorMatch ? receptorMatch[0] : '';
  const rfcReceptorMatch = receptorTag.match(/\bRfc=["']([^"']+)["']/i);
  const nomReceptorMatch = receptorTag.match(/\bNombre=["']([^"']+)["']/i);

  // 4. Impuestos Globales y por Concepto
  // En CFDI 4.0, el SAT desglosa los traslados y retenciones en cada <cfdi:Concepto>
  // Y ADEMÁS los acumula en el nodo global <cfdi:Impuestos>.
  // Para evitar duplicar bases e importes, aislamos <cfdi:Conceptos>.
  const conceptosMatch = xmlContent.match(/<cfdi:Conceptos[\s\S]*?<\/cfdi:Conceptos>/i);
  const conceptosXml = conceptosMatch ? conceptosMatch[0] : '';

  const xmlSinConceptos = xmlContent.replace(/<cfdi:Conceptos[\s\S]*?<\/cfdi:Conceptos>/gi, '');
  const globalImpuestosMatch = xmlSinConceptos.match(/<cfdi:Impuestos[\s\S]*?<\/cfdi:Impuestos>/i);
  const globalImpuestosXml = globalImpuestosMatch ? globalImpuestosMatch[0] : '';

  let base_16 = 0;
  let iva_16 = 0;
  let base_8 = 0;
  let iva_8 = 0;
  let base_0 = 0;
  let base_exento = 0;
  let iva_retenido = 0;
  let isr_retenido = 0;
  let ieps = 0;

  // Priorizar traslados a nivel de conceptos si existen; de lo contrario, tomar el nodo global
  const hasConceptTraslados = /<cfdi:Traslado/i.test(conceptosXml);
  const trasladosSource = hasConceptTraslados ? conceptosXml : globalImpuestosXml;

  const trasladosRegex = /<cfdi:Traslado\s+([^>]+)>/gi;
  let matchTraslado;

  while ((matchTraslado = trasladosRegex.exec(trasladosSource)) !== null) {
    const attrStr = matchTraslado[1];
    const impMatch = attrStr.match(/\bImpuesto=["']([^"']+)["']/i);
    const tasaMatch = attrStr.match(/\bTasaOCuota=["']([^"']+)["']/i) || attrStr.match(/\bTasa=["']([^"']+)["']/i);
    const factorMatch = attrStr.match(/\bTipoFactor=["']([^"']+)["']/i);
    const importeMatch = attrStr.match(/\bImporte=["']([^"']+)["']/i);
    const baseMatch = attrStr.match(/\bBase=["']([^"']+)["']/i);

    const impuesto = impMatch ? impMatch[1] : '002';
    const tipoFactor = factorMatch ? factorMatch[1] : 'Tasa';
    const tasa = tasaMatch ? parseFloat(tasaMatch[1]) : 0;
    const importe = importeMatch ? parseFloat(importeMatch[1]) : 0;
    let base = baseMatch ? parseFloat(baseMatch[1]) : 0;

    // Si por estructura de XML 3.3 no venía la Base en el nodo pero sí Tasa e Importe
    if (base === 0 && tasa > 0 && importe > 0) {
      base = parseFloat((importe / tasa).toFixed(2));
    }

    if (impuesto === '002' || !impuesto) {
      // IVA
      if (tipoFactor === 'Exento') {
        base_exento += base;
      } else if (Math.abs(tasa - 0.16) < 0.005) {
        base_16 += base;
        iva_16 += importe;
      } else if (Math.abs(tasa - 0.08) < 0.005) {
        base_8 += base;
        iva_8 += importe;
      } else if (Math.abs(tasa - 0) < 0.001) {
        base_0 += base;
      }
    } else if (impuesto === '003') {
      // IEPS
      ieps += importe;
    }
  }

  // Priorizar retenciones a nivel de conceptos si existen; de lo contrario, tomar el nodo global
  const hasConceptRetenciones = /<cfdi:Retencion/i.test(conceptosXml);
  const retencionesSource = hasConceptRetenciones ? conceptosXml : globalImpuestosXml;

  const retencionesRegex = /<cfdi:Retencion\s+([^>]+)>/gi;
  let matchRetencion;
  while ((matchRetencion = retencionesRegex.exec(retencionesSource)) !== null) {
    const attrStr = matchRetencion[1];
    const impMatch = attrStr.match(/\bImpuesto=["']([^"']+)["']/i);
    const importeMatch = attrStr.match(/\bImporte=["']([^"']+)["']/i);
    const importe = importeMatch ? parseFloat(importeMatch[1]) : 0;
    const impuesto = impMatch ? impMatch[1] : '';

    if (impuesto === '002') {
      iva_retenido += importe;
    } else if (impuesto === '001') {
      isr_retenido += importe;
    }
  }

  const subtotalVal = subtotalMatch ? parseFloat(subtotalMatch[1]) : 0;
  const totalVal = totalMatch ? parseFloat(totalMatch[1]) : 0;

  // Si por estructura de XML 3.3 no venía la Base en el nodo pero sí el Importe de IVA:
  if (iva_16 > 0 && base_16 === 0) {
    base_16 = parseFloat((iva_16 / 0.16).toFixed(2));
  }
  if (iva_8 > 0 && base_8 === 0) {
    base_8 = parseFloat((iva_8 / 0.08).toFixed(2));
  }
  if (base_16 === 0 && base_8 === 0 && base_0 === 0 && base_exento === 0 && subtotalVal > 0) {
    // Si no hubo desglose explícito de partidas pero hay IVA en totales
    const totalImpTrasladadosMatch = xmlContent.match(/\bTotalImpuestosTrasladados=["']([^"']+)["']/i);
    if (totalImpTrasladadosMatch) {
      const impTot = parseFloat(totalImpTrasladadosMatch[1]);
      if (Math.abs(impTot - (subtotalVal * 0.16)) < 1.0) {
        iva_16 = impTot;
        base_16 = subtotalVal;
      }
    }
  }

  // Redondear a 2 decimales para evitar imprecisiones de coma flotante
  base_16 = parseFloat(base_16.toFixed(2));
  iva_16 = parseFloat(iva_16.toFixed(2));
  base_8 = parseFloat(base_8.toFixed(2));
  iva_8 = parseFloat(iva_8.toFixed(2));
  base_0 = parseFloat(base_0.toFixed(2));
  base_exento = parseFloat(base_exento.toFixed(2));
  iva_retenido = parseFloat(iva_retenido.toFixed(2));
  isr_retenido = parseFloat(isr_retenido.toFixed(2));
  ieps = parseFloat(ieps.toFixed(2));

  return {
    uuid,
    rfc_receptor: rfcReceptorMatch ? rfcReceptorMatch[1].toUpperCase().trim() : '',
    nombre_receptor: nomReceptorMatch ? nomReceptorMatch[1].trim() : '',
    rfc_emisor: rfcEmisorMatch ? rfcEmisorMatch[1].toUpperCase().trim() : '',
    nombre_emisor: nomEmisorMatch ? nomEmisorMatch[1].trim() : '',
    fecha: new Date(fechaStr),
    fecha_timbrado: fechaTimbradoStr ? new Date(fechaTimbradoStr) : null,
    serie: serieMatch ? serieMatch[1] : null,
    folio: folioMatch ? folioMatch[1] : null,
    tipo_comprobante: tipoCompMatch ? tipoCompMatch[1] : 'I',
    metodo_pago: metodoPagoMatch ? metodoPagoMatch[1] : 'PUE',
    forma_pago: formaPagoMatch ? formaPagoMatch[1] : null,
    moneda: monedaMatch ? monedaMatch[1] : 'MXN',
    tipo_cambio: tipoCambioMatch ? parseFloat(tipoCambioMatch[1]) : 1.0,
    subtotal: subtotalVal,
    descuento: descuentoMatch ? parseFloat(descuentoMatch[1]) : 0,
    total: totalVal,
    base_16,
    iva_16,
    base_8,
    iva_8,
    base_0,
    base_exento,
    iva_retenido,
    isr_retenido,
    ieps,
    estatus: 'Vigente',
    xml_content: xmlContent
  };
}
