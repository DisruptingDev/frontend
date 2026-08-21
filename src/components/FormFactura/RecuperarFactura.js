export default function RecuperarFactura(FacturaRecuperada) {
    const Factura = FacturaRecuperada.factura;
    if (Factura && Factura.Conceptos && Factura.Conceptos.ListaConceptos) {
        // Mapea los conceptos a la estructura deseada
        const ListaConceptos = Factura.Conceptos.ListaConceptos.map((concepto) => {

            // Calcula el subtotal como ValorUnitario * Cantidad
            const Subtotal = concepto.ValorUnitario * concepto.Cantidad;

            // Mapea los impuestos para la estructura deseada
            const Impuestos = [
                ...(concepto.Impuestos?.Retenciones || []), // Incluye las retenciones si existen
                ...(concepto.Impuestos?.Traslados || [])   // Incluye los traslados si existen
            ];
            const Retenciones = [
                ...(concepto.Impuestos?.Retenciones || [])
            ]
            const Traslados = [
                ...(concepto.Impuestos?.Traslados || [])
            ]

            // Calcula los totales de retenciones y traslados
            const TotalRetenciones = concepto.Impuestos?.Retenciones?.reduce((acc, ret) => acc + ret.Importe, 0) || 0;
            const TotalTraslados = concepto.Impuestos?.Traslados?.reduce((acc, tras) => acc + tras.Importe, 0) || 0;

            return {
                ID: concepto.ID,
                Cantidad: concepto.Cantidad,
                ClaveProdServ: concepto.ClaveProdServ,
                ClaveUnidad: concepto.ClaveUnidad,
                Unidad: concepto.Unidad,
                Descripcion: concepto.Descripcion,
                Descuento: concepto.Descuento,
                ObjetoImpuesto: concepto.ObjetoImpuesto || concepto.ObjetoImp,
                Impuestos: Impuestos.map(impuesto => ({
                    NombreImpuesto: impuesto.ImpuestoCatalogo?.Impuesto || 'IVA',
                    Impuesto: impuesto.ImpuestoCatalogoID,
                    ImpuestoClave: impuesto.ImpuestoClave,
                    Tasa: impuesto.TasaCatalogoID,
                    TasaOCuota: impuesto.TasaOCuota,
                    BaseImpuesto: impuesto.Base || Subtotal,
                    Monto: impuesto.Importe,
                    Tipo: impuesto.TipoFactor,
                    TipoImpuesto: impuesto.ImpuestoCatalogo?.Tipo || 'Federal'
                })),
                Retenciones: Retenciones.map(retencion => ({
                    NombreImpuesto: retencion.ImpuestoCatalogo?.Impuesto || 'ISR',
                    BaseImpuesto: retencion.Base,
                    Impuesto: retencion.ImpuestoCatalogoID,
                    ImpuestoClave: retencion.ImpuestoClave,
                    Tasa: retencion.TasaCatalogoID,
                    TasaOCuota: retencion.TasaOCuota,
                    Monto: retencion.Importe,
                    Tipo: retencion.TipoFactor
                })),
                Traslados: Traslados.map(traslado => ({
                    NombreImpuesto: traslado.ImpuestoCatalogo?.Impuesto || 'IVA',
                    BaseImpuesto: traslado.Base,
                    Impuesto: traslado.ImpuestoCatalogoID,
                    ImpuestoClave: traslado.ImpuestoClave,
                    Tasa: traslado.TasaCatalogoID,
                    TasaOCuota: traslado.TasaOCuota,
                    Monto: traslado.Importe,
                    Tipo: traslado.Tipo
                })),
                // Traslados: concepto.Impuestos?.Traslados || [],
                Subtotal: Subtotal,
                TotalRetenciones: TotalRetenciones,
                TotalTraslados: TotalTraslados,
                ValorUnitario: concepto.ValorUnitario,
            };
        });


        const getDatosEmisor = (Factura) => ({
            ID: Factura.EmisorID,
            Rfc: Factura.Emisor?.Rfc || '',
            Nombre: Factura.Emisor?.Nombre || '',
            RegimenFiscal: Factura.Emisor?.RegimenFiscal || '',
            LugarExpedicion: Factura.Emisor?.LugarExpedicion || '',
            Calle: Factura.Emisor?.Calle || '',
            NumeroExterior: Factura.Emisor?.NumeroExterior || '',
            NumeroInterior: Factura.Emisor?.NumeroInterior || '',
            Colonia: Factura.Emisor?.Colonia || '',
            Municipio: Factura.Emisor?.Municipio || '',
            Estado: Factura.Emisor?.Estado || '',
            LogoPath: Factura.Emisor?.LogoPath || '',
            Serie: Factura.Serie || '',
            Fecha: Factura.Fecha || '',
            TipoComprobante: Factura.TipoDeComprobante || 'I'
        });

        const getDatosReceptor = (Factura) => ({
            ID: Factura.ReceptorID,
            Rfc: Factura.Receptor?.Rfc || '',
            DomicilioFiscalReceptor: Factura.Receptor?.DomicilioFiscalReceptor || '',
            Nombre: Factura.Receptor?.Nombre || '',
            UsoCFDI: Factura.UsoCFDI || 'S01',
            UsoCFDIDescripcion: FacturaRecuperada?.uso_cfdi?.Descripcion || 'Sin efectos fiscales',
            RegimenFiscal: Factura.Receptor?.RegimenFiscalReceptor || '616',
            LugarExpedicion: Factura.Receptor?.LugarExpedicion || Factura.Emisor?.LugarExpedicion || '',
            Calle: Factura.Receptor?.Calle || '',
            NoExterior: Factura.Receptor?.NumeroExterior || '',
            NoInterior: Factura.Receptor?.NumeroInterior || '',
            Colonia: Factura.Receptor?.Colonia || '',
            Municipio: Factura.Receptor?.Municipio || '',
            Estado: Factura.Receptor?.Estado || '',
            MetodoPago: Factura.MetodoPago || 'PUE',
            MetodoPagoDescripcion: FacturaRecuperada?.metodo_pago?.Descripcion || 'Pago en una sola exhibición',
            FormaPago: Factura.FormaPago || '03',
            FormaPagoDescripcion: FacturaRecuperada?.forma_pago?.Descripcion || 'Transferencia electrónica de fondos',
    
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
    return { conceptos, emisor, receptor };
    
    }
    else if (Factura) {
        // Fallback for when Conceptos are missing but Emisor and Receptor are present
        const getDatosEmisor = (Factura) => ({
            ID: Factura.EmisorID,
            Rfc: Factura.Emisor?.Rfc || '',
            Nombre: Factura.Emisor?.Nombre || '',
            RegimenFiscal: Factura.Emisor?.RegimenFiscal || '',
            LugarExpedicion: Factura.Emisor?.LugarExpedicion || ''
        });

        const getDatosReceptor = (Factura) => ({
            ID: Factura.ReceptorID,
            Rfc: Factura.Receptor?.Rfc || '',
            DomicilioFiscalReceptor: Factura.Receptor?.DomicilioFiscalReceptor || '',
            Nombre: Factura.Receptor?.Nombre || '',
            UsoCFDI: Factura.UsoCFDI || 'S01',
            RegimenFiscal: Factura.Receptor?.RegimenFiscalReceptor || '616'
        });

        return { conceptos: [], emisor: getDatosEmisor(Factura), receptor: getDatosReceptor(Factura) };
    }
    else {
        return { conceptos: [], emisor: {}, receptor: {} };
    }
    

}