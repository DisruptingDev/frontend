/**
 * Parser de comprobantes fiscales CFDI (XML 3.3 y 4.0)
 * Extrae emisor, receptor, totales e impuestos (IVA 16, 8, 0, Exento, Retenciones de IVA e ISR)
 */

export function parseCFDIXml(xmlContent) {
  if (!xmlContent || typeof xmlContent !== 'string') {
    throw new Error('Contenido XML no válido o vacío');
  }

  // 1. Datos del Comprobante
  const uuidMatch =
    xmlContent.match(/UUID=["']([0-9a-fA-F-]{36})["']/i) ||
    xmlContent.match(/UUID=["']([^"']+)["']/i);
  const uuid = uuidMatch ? uuidMatch[1].toUpperCase().trim() : null;

  const fechaMatch = xmlContent.match(/Fecha=["']([^"']+)["']/i);
  const fechaStr = fechaMatch ? fechaMatch[1] : new Date().toISOString();

  const fechaTimbradoMatch = xmlContent.match(/FechaTimbrado=["']([^"']+)["']/i);
  const fechaTimbradoStr = fechaTimbradoMatch ? fechaTimbradoMatch[1] : null;

  const serieMatch = xmlContent.match(/Serie=["']([^"']+)["']/i);
  const folioMatch = xmlContent.match(/Folio=["']([^"']+)["']/i);
  const tipoCompMatch = xmlContent.match(/TipoDeComprobante=["']([^"']+)["']/i);
  const metodoPagoMatch = xmlContent.match(/MetodoPago=["']([^"']+)["']/i);
  const formaPagoMatch = xmlContent.match(/FormaPago=["']([^"']+)["']/i);
  const monedaMatch = xmlContent.match(/Moneda=["']([^"']+)["']/i);
  const tipoCambioMatch = xmlContent.match(/TipoCambio=["']([^"']+)["']/i);

  const subtotalMatch = xmlContent.match(/SubTotal=["']([^"']+)["']/i);
  const descuentoMatch = xmlContent.match(/Descuento=["']([^"']+)["']/i);
  const totalMatch = xmlContent.match(/Total=["']([^"']+)["']/i);

  // 2. Emisor
  const emisorMatch = xmlContent.match(/<cfdi:Emisor[^>]*>/i);
  const rfcEmisorMatch = emisorMatch
    ? emisorMatch[0].match(/Rfc=["']([^"']+)["']/i)
    : xmlContent.match(/Rfc=["']([^"']+)["']/i);
  const nomEmisorMatch = emisorMatch
    ? emisorMatch[0].match(/Nombre=["']([^"']+)["']/i)
    : null;

  // 3. Receptor
  const receptorMatch = xmlContent.match(/<cfdi:Receptor[^>]*>/i);
  const rfcReceptorMatch = receptorMatch
    ? receptorMatch[0].match(/Rfc=["']([^"']+)["']/i)
    : null;
  const nomReceptorMatch = receptorMatch
    ? receptorMatch[0].match(/Nombre=["']([^"']+)["']/i)
    : null;

  // 4. Impuestos Globales y por Concepto
  let base_16 = 0;
  let iva_16 = 0;
  let base_8 = 0;
  let iva_8 = 0;
  let base_0 = 0;
  let base_exento = 0;
  let iva_retenido = 0;
  let isr_retenido = 0;
  let ieps = 0;

  // Buscar todos los bloques de Traslados (Conceptos y Globales)
  // Traslado: Base, Impuesto="002", TipoFactor="Tasa", TasaOCuota="0.160000", Importe="160.00"
  const trasladosRegex = /<cfdi:Traslado\s+([^>]+)>/gi;
  let matchTraslado;
  const trasladosEncontrados = [];

  while ((matchTraslado = trasladosRegex.exec(xmlContent)) !== null) {
    const attrStr = matchTraslado[1];
    const impMatch = attrStr.match(/Impuesto=["']([^"']+)["']/i);
    const tasaMatch = attrStr.match(/TasaOCuota=["']([^"']+)["']/i);
    const factorMatch = attrStr.match(/TipoFactor=["']([^"']+)["']/i);
    const importeMatch = attrStr.match(/Importe=["']([^"']+)["']/i);
    const baseMatch = attrStr.match(/Base=["']([^"']+)["']/i);

    const impuesto = impMatch ? impMatch[1] : '';
    const tipoFactor = factorMatch ? factorMatch[1] : 'Tasa';
    const tasa = tasaMatch ? parseFloat(tasaMatch[1]) : 0;
    const importe = importeMatch ? parseFloat(importeMatch[1]) : 0;
    const base = baseMatch ? parseFloat(baseMatch[1]) : 0;

    trasladosEncontrados.push({ impuesto, tipoFactor, tasa, importe, base });
  }

  // Si hay traslados en partidas de Concepto, priorizarlos para sumar bases exactas
  if (trasladosEncontrados.length > 0) {
    for (const t of trasladosEncontrados) {
      if (t.impuesto === '002' || !t.impuesto) {
        // IVA
        if (t.tipoFactor === 'Exento') {
          base_exento += t.base;
        } else if (Math.abs(t.tasa - 0.16) < 0.001) {
          base_16 += t.base;
          iva_16 += t.importe;
        } else if (Math.abs(t.tasa - 0.08) < 0.001) {
          base_8 += t.base;
          iva_8 += t.importe;
        } else if (Math.abs(t.tasa - 0) < 0.001) {
          base_0 += t.base;
        }
      } else if (t.impuesto === '003') {
        // IEPS
        ieps += t.importe;
      }
    }
  }

  // Buscar Retenciones (002 = IVA, 001 = ISR)
  const retencionesRegex = /<cfdi:Retencion\s+([^>]+)>/gi;
  let matchRetencion;
  while ((matchRetencion = retencionesRegex.exec(xmlContent)) !== null) {
    const attrStr = matchRetencion[1];
    const impMatch = attrStr.match(/Impuesto=["']([^"']+)["']/i);
    const importeMatch = attrStr.match(/Importe=["']([^"']+)["']/i);
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
    const totalImpTrasladadosMatch = xmlContent.match(/TotalImpuestosTrasladados=["']([^"']+)["']/i);
    if (totalImpTrasladadosMatch) {
      const impTot = parseFloat(totalImpTrasladadosMatch[1]);
      if (Math.abs(impTot - (subtotalVal * 0.16)) < 1.0) {
        iva_16 = impTot;
        base_16 = subtotalVal;
      }
    }
  }

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
