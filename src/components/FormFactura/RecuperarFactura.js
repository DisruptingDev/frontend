const parseImpuestosLocales = (f, fParent) => {
    const target = f || fParent;
    if (!target) return [];

    const complemento = target.Complemento || target.complemento || 
                        fParent?.Complemento || fParent?.complemento ||
                        (Array.isArray(target.Complementos) ? target.Complementos[0] : null) || 
                        (Array.isArray(target.complementos) ? target.complementos[0] : null) ||
                        (Array.isArray(fParent?.complementos) ? fParent.complementos[0] : null);

    const directArray = (Array.isArray(target.impuestosLocales) && target.impuestosLocales.length > 0) ? target.impuestosLocales :
                        (Array.isArray(fParent?.impuestosLocales) && fParent?.impuestosLocales.length > 0) ? fParent.impuestosLocales : null;

    const imploc = directArray ||
                  complemento?.ImpuestosLocales || complemento?.impuestos_locales || 
                  target.ImpuestosLocales || target.impuestos_locales ||
                  fParent?.ImpuestosLocales || fParent?.impuestos_locales;

    const result = [];

    if (Array.isArray(imploc)) {
        imploc.forEach((item, idx) => {
            const tipo = item.Tipo || (item.ImpLocRetenido || item.TasadeRetencion || item.imp_loc_retenido ? 'Retencion' : 'Traslado');
            const nombre = item.Nombre || item.ImpLocTrasladado || item.ImpLocRetenido || item.imp_loc_trasladado || item.imp_loc_retenido || (tipo === 'Traslado' ? 'ISH' : 'Impuesto Cedular');
            const tasa = Number(item.Tasa ?? item.TasadeTraslado ?? item.TasadeRetencion ?? item.tasade_traslado ?? item.tasade_retencion ?? 0);
            const importe = Number(item.Importe ?? item.importe ?? item.Monto ?? 0);
            result.push({
                id: item.id || `rec_arr_${idx}_${Date.now()}`,
                Tipo: tipo,
                Nombre: nombre,
                Tasa: tasa,
                TasaString: String(tasa),
                Importe: Math.abs(importe),
                ImporteString: Math.abs(importe).toFixed(2)
            });
        });
    } else if (imploc) {
        const traslados = imploc.TrasladosLocales || imploc.traslado_locals || imploc.TrasladoLocals || imploc.traslados_locales;
        if (Array.isArray(traslados)) {
            traslados.forEach((tras, idx) => {
                const nombre = tras.ImpLocTrasladado || tras.imp_loc_trasladado || tras.Nombre || 'ISH';
                const tasa = Number(tras.TasadeTraslado ?? tras.tasade_traslado ?? tras.Tasa ?? 0);
                const importe = Number(tras.Importe ?? tras.importe ?? tras.Monto ?? 0);
                result.push({
                    id: `rec_tras_${idx}_${Date.now()}`,
                    Tipo: 'Traslado',
                    Nombre: nombre,
                    Tasa: tasa,
                    TasaString: String(tasa),
                    Importe: importe,
                    ImporteString: String(importe.toFixed(2))
                });
            });
        }

        const retenciones = imploc.RetencionesLocales || imploc.retencion_locals || imploc.RetencionLocals || imploc.retenciones_locales;
        if (Array.isArray(retenciones)) {
            retenciones.forEach((ret, idx) => {
                const nombre = ret.ImpLocRetenido || ret.imp_loc_retenido || ret.Nombre || 'Impuesto Cedular';
                const tasa = Number(ret.TasadeRetencion ?? ret.tasade_retencion ?? ret.Tasa ?? 0);
                const importe = Number(ret.Importe ?? ret.importe ?? ret.Monto ?? 0);
                result.push({
                    id: `rec_ret_${idx}_${Date.now()}`,
                    Tipo: 'Retencion',
                    Nombre: nombre,
                    Tasa: tasa,
                    TasaString: String(tasa),
                    Importe: importe,
                    ImporteString: String(importe.toFixed(2))
                });
            });
        }
    }

    // Fallback: Si no viene en el JSON, parsear desde XML timbrado si existe
    if (result.length === 0) {
        const xmlStr = target.xml_timbrado || target.XML || target.xml || fParent?.xml_timbrado;
        if (typeof xmlStr === 'string' && xmlStr.includes('ImpuestosLocales')) {
            const trasRegex = /<[^:]*:?TrasladosLocales\s+([^>]+)\/?>/gi;
            let match;
            let idx = 0;
            while ((match = trasRegex.exec(xmlStr)) !== null) {
                const attrs = match[1];
                const nombreMatch = attrs.match(/ImpLocTrasladado=["']([^"']+)["']/i);
                const tasaMatch = attrs.match(/TasadeTraslado=["']([^"']+)["']/i);
                const importeMatch = attrs.match(/Importe=["']([^"']+)["']/i);
                if (importeMatch) {
                    const nombre = nombreMatch ? nombreMatch[1] : 'ISH';
                    const tasa = tasaMatch ? Number(tasaMatch[1]) : 0;
                    const importe = Number(importeMatch[1]);
                    result.push({
                        id: `rec_xml_tras_${idx++}_${Date.now()}`,
                        Tipo: 'Traslado',
                        Nombre: nombre,
                        Tasa: tasa,
                        TasaString: String(tasa),
                        Importe: importe,
                        ImporteString: String(importe.toFixed(2))
                    });
                }
            }

            const retRegex = /<[^:]*:?RetencionesLocales\s+([^>]+)\/?>/gi;
            while ((match = retRegex.exec(xmlStr)) !== null) {
                const attrs = match[1];
                const nombreMatch = attrs.match(/ImpLocRetenido=["']([^"']+)["']/i);
                const tasaMatch = attrs.match(/TasadeRetencion=["']([^"']+)["']/i);
                const importeMatch = attrs.match(/Importe=["']([^"']+)["']/i);
                if (importeMatch) {
                    const nombre = nombreMatch ? nombreMatch[1] : 'Impuesto Cedular';
                    const tasa = tasaMatch ? Number(tasaMatch[1]) : 0;
                    const importe = Number(importeMatch[1]);
                    result.push({
                        id: `rec_xml_ret_${idx++}_${Date.now()}`,
                        Tipo: 'Retencion',
                        Nombre: nombre,
                        Tasa: tasa,
                        TasaString: String(tasa),
                        Importe: importe,
                        ImporteString: String(importe.toFixed(2))
                    });
                }
            }
        }
    }

    return result;
};

export default function RecuperarFactura(FacturaRecuperada) {
    if (!FacturaRecuperada) {
        return { conceptos: [], emisor: {}, receptor: {}, impuestosLocales: [] };
    }
    const Factura = FacturaRecuperada.factura || FacturaRecuperada;
    if (Factura && Factura.Conceptos && Factura.Conceptos.ListaConceptos) {
        // Mapea los conceptos a la estructura deseada
        const ListaConceptos = Factura.Conceptos.ListaConceptos.map((concepto) => {

            // Calcula el subtotal como ValorUnitario * Cantidad
            const Subtotal = Number(concepto.ValorUnitario || 0) * Number(concepto.Cantidad || 1);

            // Mapea los impuestos para la estructura deseada
            const Impuestos = [
                ...(concepto.Impuestos?.Retenciones || []), // Incluye las retenciones si existen
                ...(concepto.Impuestos?.Traslados || [])   // Incluye los traslados si existen
            ];
            const Retenciones = [
                ...(concepto.Impuestos?.Retenciones || [])
            ];
            const Traslados = [
                ...(concepto.Impuestos?.Traslados || [])
            ];

            // Calcula los totales de retenciones y traslados
            const TotalRetenciones = concepto.Impuestos?.Retenciones?.reduce((acc, ret) => acc + (Number(ret.Importe) || 0), 0) || 0;
            const TotalTraslados = concepto.Impuestos?.Traslados?.reduce((acc, tras) => acc + (Number(tras.Importe) || 0), 0) || 0;

            return {
                ID: concepto.ID,
                Cantidad: Number(concepto.Cantidad || 1),
                ClaveProdServ: concepto.ClaveProdServ || '',
                ClaveUnidad: concepto.ClaveUnidad || 'E48',
                Unidad: concepto.Unidad || 'Servicio',
                Descripcion: concepto.Descripcion || '',
                Descuento: Number(concepto.Descuento || 0),
                DescuentoString: concepto.DescuentoString || String(Number(concepto.Descuento || 0).toFixed(2)),
                ObjetoImpuesto: concepto.ObjetoImpuesto || concepto.ObjetoImp || '02',
                Impuestos: Impuestos.map(impuesto => ({
                    NombreImpuesto: impuesto.ImpuestoCatalogo?.Impuesto || 'IVA',
                    Impuesto: impuesto.ImpuestoCatalogoID,
                    ImpuestoClave: impuesto.ImpuestoClave,
                    Tasa: impuesto.TasaCatalogoID,
                    TasaOCuota: impuesto.TasaOCuota,
                    TasaOCuotaString: impuesto.TasaOCuotaString || String(impuesto.TasaOCuota || 0),
                    BaseImpuesto: impuesto.Base || Subtotal,
                    BaseString: impuesto.BaseString || String(Number(impuesto.Base || Subtotal).toFixed(2)),
                    Monto: impuesto.Importe,
                    ImporteString: impuesto.ImporteString || String(Number(impuesto.Importe || 0).toFixed(2)),
                    Tipo: impuesto.TipoFactor || impuesto.Tipo || 'Exento',
                    TipoImpuesto: impuesto.ImpuestoCatalogo?.Tipo || 'Federal'
                })),
                Retenciones: Retenciones.map(retencion => ({
                    NombreImpuesto: retencion.ImpuestoCatalogo?.Impuesto || 'ISR',
                    BaseImpuesto: retencion.Base,
                    BaseString: retencion.BaseString || String(Number(retencion.Base || Subtotal).toFixed(2)),
                    Impuesto: retencion.ImpuestoCatalogoID,
                    ImpuestoClave: retencion.ImpuestoClave,
                    Tasa: retencion.TasaCatalogoID,
                    TasaOCuota: retencion.TasaOCuota,
                    TasaOCuotaString: retencion.TasaOCuotaString || String(retencion.TasaOCuota || 0),
                    Monto: retencion.Importe,
                    ImporteString: retencion.ImporteString || String(Number(retencion.Importe || 0).toFixed(2)),
                    Tipo: retencion.TipoFactor || 'Tasa'
                })),
                Traslados: Traslados.map(traslado => ({
                    NombreImpuesto: traslado.ImpuestoCatalogo?.Impuesto || 'IVA',
                    BaseImpuesto: traslado.Base,
                    BaseString: traslado.BaseString || String(Number(traslado.Base || Subtotal).toFixed(2)),
                    Impuesto: traslado.ImpuestoCatalogoID,
                    ImpuestoClave: traslado.ImpuestoClave,
                    Tasa: traslado.TasaCatalogoID,
                    TasaOCuota: traslado.TasaOCuota,
                    TasaOCuotaString: traslado.TasaOCuotaString || String(traslado.TasaOCuota || 0),
                    Monto: traslado.Importe,
                    ImporteString: traslado.ImporteString || String(Number(traslado.Importe || 0).toFixed(2)),
                    Tipo: traslado.Tipo || traslado.TipoFactor || 'Exento'
                })),
                Subtotal: Subtotal,
                SubTotalString: concepto.ImporteString || String(Subtotal.toFixed(2)),
                TotalRetenciones: TotalRetenciones,
                TotalTraslados: TotalTraslados,
                ValorUnitario: Number(concepto.ValorUnitario || 0),
                ValorUnitarioString: concepto.ValorUnitarioString || String(Number(concepto.ValorUnitario || 0).toFixed(2)),
                Importe: Number(concepto.Importe || Subtotal),
                ImporteString: concepto.ImporteString || String(Number(concepto.Importe || Subtotal).toFixed(2)),
            };
        });


        const extraerClaveSAT = (str, def = '') => {
            if (!str) return def;
            const clean = String(str).trim();
            return clean.split(' ')[0] || clean.substring(0, 4) || def;
        };

        const Descripcion = Factura.Descripcion || Factura.descripcion || Factura.Observaciones || Factura.observaciones || '';

        const getDatosEmisor = (Factura) => ({
            ID: Factura.EmisorID,
            Emisor: Factura.EmisorID,
            EmisorID: Factura.EmisorID,
            Rfc: Factura.Emisor?.Rfc || '',
            RFCEmisor: Factura.Emisor?.Rfc || '',
            Nombre: Factura.Emisor?.Nombre || '',
            NombreEmisor: Factura.Emisor?.Nombre || '',
            RegimenFiscal: extraerClaveSAT(Factura.Emisor?.RegimenFiscal, '601'),
            RegimenFiscalEmisor: extraerClaveSAT(Factura.Emisor?.RegimenFiscal, '601'),
            LugarExpedicion: Factura.Emisor?.LugarExpedicion || '01000',
            Calle: Factura.Emisor?.Calle || '',
            CalleEmisor: Factura.Emisor?.Calle || '',
            NumeroExterior: Factura.Emisor?.NumeroExterior || '',
            NoExteriorEmisor: Factura.Emisor?.NumeroExterior || '',
            NumeroInterior: Factura.Emisor?.NumeroInterior || '',
            NoInteriorEmisor: Factura.Emisor?.NumeroInterior || '',
            Colonia: Factura.Emisor?.Colonia || '',
            ColoniaEmisor: Factura.Emisor?.Colonia || '',
            Municipio: Factura.Emisor?.Municipio || '',
            MunicipioEmisor: Factura.Emisor?.Municipio || '',
            Estado: Factura.Emisor?.Estado || '',
            EstadoEmisor: Factura.Emisor?.Estado || '',
            LogoPath: Factura.Emisor?.LogoPath || '',
            Serie: Factura.Serie || '',
            Folio: Factura.Folio || '',
            Fecha: Factura.Fecha || '',
            TipoComprobante: Factura.TipoDeComprobante || 'I',
            Descripcion: Descripcion,
            Observaciones: Descripcion
        });

        const getDatosReceptor = (Factura) => ({
            ID: Factura.ReceptorID,
            Receptor: Factura.ReceptorID,
            ReceptorID: Factura.ReceptorID,
            Rfc: Factura.Receptor?.Rfc || 'XAXX010101000',
            RFCReceptor: Factura.Receptor?.Rfc || 'XAXX010101000',
            DomicilioFiscalReceptor: Factura.Receptor?.DomicilioFiscalReceptor || Factura.Emisor?.LugarExpedicion || '01000',
            Nombre: Factura.Receptor?.Nombre || 'PUBLICO EN GENERAL',
            NombreReceptor: Factura.Receptor?.Nombre || 'PUBLICO EN GENERAL',
            UsoCFDI: extraerClaveSAT(Factura.UsoCFDI, 'S01'),
            UsoCFDIDescripcion: FacturaRecuperada?.uso_cfdi?.Descripcion || 'Sin efectos fiscales',
            RegimenFiscal: extraerClaveSAT(Factura.Receptor?.RegimenFiscalReceptor || Factura.Receptor?.RegimenFiscal, '616'),
            RegimenFiscalReceptor: extraerClaveSAT(Factura.Receptor?.RegimenFiscalReceptor || Factura.Receptor?.RegimenFiscal, '616'),
            LugarExpedicion: Factura.Receptor?.LugarExpedicion || Factura.Emisor?.LugarExpedicion || '01000',
            Calle: Factura.Receptor?.Calle || '',
            NoExterior: Factura.Receptor?.NumeroExterior || '',
            NoInterior: Factura.Receptor?.NumeroInterior || '',
            Colonia: Factura.Receptor?.Colonia || '',
            Municipio: Factura.Receptor?.Municipio || '',
            Estado: Factura.Receptor?.Estado || '',
            MetodoPago: extraerClaveSAT(Factura.MetodoPago, 'PUE'),
            MetodoPagoDescripcion: FacturaRecuperada?.metodo_pago?.Descripcion || 'Pago en una sola exhibición',
            FormaPago: extraerClaveSAT(Factura.FormaPago, '03'),
            FormaPagoDescripcion: FacturaRecuperada?.forma_pago?.Descripcion || 'Transferencia electrónica de fondos',
            CondicionesDePago: Factura.CondicionesDePago || '',
            Descripcion: Descripcion,
            Observaciones: Descripcion,
    
            //informacion Global
            InformacionGlobal:{
                Anio: Factura.InformacionGlobal?.Anio || '',
                Meses: Factura.InformacionGlobal?.Meses || '',
                Periodicidad: Factura.InformacionGlobal?.Periodicidad || ''
            }
        });
        const conceptos = ListaConceptos;
        const emisor = getDatosEmisor(Factura);
        const receptor = getDatosReceptor(Factura);
        const impuestosLocales = parseImpuestosLocales(Factura, FacturaRecuperada);
        return {
            conceptos,
            emisor,
            receptor,
            impuestosLocales,
            descripcion: Descripcion,
            Descripcion: Descripcion,
            observaciones: Descripcion,
            Observaciones: Descripcion
        };
    }
    else if (Factura) {
        const Descripcion = Factura.Descripcion || Factura.descripcion || Factura.Observaciones || Factura.observaciones || '';

        const getDatosEmisor = (Factura) => ({
            ID: Factura.EmisorID,
            Emisor: Factura.EmisorID,
            EmisorID: Factura.EmisorID,
            Rfc: Factura.Emisor?.Rfc || '',
            RFCEmisor: Factura.Emisor?.Rfc || '',
            Nombre: Factura.Emisor?.Nombre || '',
            NombreEmisor: Factura.Emisor?.Nombre || '',
            RegimenFiscal: Factura.Emisor?.RegimenFiscal || '601',
            RegimenFiscalEmisor: Factura.Emisor?.RegimenFiscal || '601',
            LugarExpedicion: Factura.Emisor?.LugarExpedicion || '01000',
            Calle: Factura.Emisor?.Calle || '',
            CalleEmisor: Factura.Emisor?.Calle || '',
            NumeroExterior: Factura.Emisor?.NumeroExterior || '',
            NoExteriorEmisor: Factura.Emisor?.NumeroExterior || '',
            NumeroInterior: Factura.Emisor?.NumeroInterior || '',
            NoInteriorEmisor: Factura.Emisor?.NumeroInterior || '',
            Colonia: Factura.Emisor?.Colonia || '',
            ColoniaEmisor: Factura.Emisor?.Colonia || '',
            Municipio: Factura.Emisor?.Municipio || '',
            MunicipioEmisor: Factura.Emisor?.Municipio || '',
            Estado: Factura.Emisor?.Estado || '',
            EstadoEmisor: Factura.Emisor?.Estado || '',
            LogoPath: Factura.Emisor?.LogoPath || '',
            Serie: Factura.Serie || '',
            Folio: Factura.Folio || '',
            Fecha: Factura.Fecha || '',
            TipoComprobante: Factura.TipoDeComprobante || 'I',
            Descripcion: Descripcion,
            Observaciones: Descripcion
        });

        const getDatosReceptor = (Factura) => ({
            ID: Factura.ReceptorID,
            Receptor: Factura.ReceptorID,
            ReceptorID: Factura.ReceptorID,
            Rfc: Factura.Receptor?.Rfc || 'XAXX010101000',
            RFCReceptor: Factura.Receptor?.Rfc || 'XAXX010101000',
            DomicilioFiscalReceptor: Factura.Receptor?.DomicilioFiscalReceptor || '01000',
            Nombre: Factura.Receptor?.Nombre || 'PUBLICO EN GENERAL',
            NombreReceptor: Factura.Receptor?.Nombre || 'PUBLICO EN GENERAL',
            UsoCFDI: Factura.UsoCFDI || 'S01',
            UsoCFDIDescripcion: FacturaRecuperada?.uso_cfdi?.Descripcion || 'Sin efectos fiscales',
            RegimenFiscal: Factura.Receptor?.RegimenFiscalReceptor || '616',
            RegimenFiscalReceptor: Factura.Receptor?.RegimenFiscalReceptor || '616',
            MetodoPago: Factura.MetodoPago || 'PUE',
            MetodoPagoDescripcion: FacturaRecuperada?.metodo_pago?.Descripcion || 'Pago en una sola exhibición',
            FormaPago: Factura.FormaPago || '03',
            FormaPagoDescripcion: FacturaRecuperada?.forma_pago?.Descripcion || 'Transferencia electrónica de fondos',
            CondicionesDePago: Factura.CondicionesDePago || '',
            Descripcion: Descripcion,
            Observaciones: Descripcion,
            InformacionGlobal: {
                Anio: Factura.InformacionGlobal?.Anio || '',
                Meses: Factura.InformacionGlobal?.Meses || '',
                Periodicidad: Factura.InformacionGlobal?.Periodicidad || ''
            }
        });

        return {
            conceptos: [],
            emisor: getDatosEmisor(Factura),
            receptor: getDatosReceptor(Factura),
            impuestosLocales: parseImpuestosLocales ? parseImpuestosLocales(Factura, FacturaRecuperada) : [],
            descripcion: Descripcion,
            Descripcion: Descripcion,
            observaciones: Descripcion,
            Observaciones: Descripcion
        };
    }
    else {
        return {
            conceptos: [],
            emisor: {},
            receptor: {},
            impuestosLocales: [],
            descripcion: '',
            Descripcion: '',
            observaciones: '',
            Observaciones: ''
        };
    }
}