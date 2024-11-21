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
                    NombreImpuesto: impuesto.ImpuestoCatalogo.Impuesto,
                    Impuesto: impuesto.ImpuestoCatalogoID,
                    ImpuestoClave: impuesto.ImpuestoClave,
                    Tasa: impuesto.TasaCatalogoID,
                    TasaOCuota: impuesto.TasaOCuota,
                    BaseImpuesto: impuesto.Base || Subtotal,
                    Monto: impuesto.Importe,
                    Tipo: impuesto.TipoFactor
                })),
                Retenciones: Retenciones.map(retencion => ({
                    NombreImpuesto: retencion.ImpuestoCatalogo.Impuesto,
                    BaseImpuesto: retencion.Base,
                    Impuesto: retencion.ImpuestoCatalogoID,
                    ImpuestoClave: retencion.ImpuestoClave,
                    Tasa: retencion.TasaCatalogoID,
                    TasaOCuota: retencion.TasaOCuota,
                    Monto: retencion.Importe,
                    Tipo: retencion.TipoFactor
                })),
                // Retenciones: concepto.Impuestos?.Retenciones || [],
                Traslados: Traslados.map(traslado => ({
                    NombreImpuesto: traslado.ImpuestoCatalogo.Impuesto,
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
            Rfc: Factura.Emisor.Rfc,
            Nombre: Factura.Emisor.Nombre,
            RegimenFiscal: Factura.Emisor.RegimenFiscal,
            LugarExpedicion: Factura.Emisor.LugarExpedicion,
            Calle: Factura.Emisor.Calle,
            NumeroExterior: Factura.Emisor.NumeroExterior,
            NumeroInterior: Factura.Emisor.NumeroInterior,
            Colonia: Factura.Emisor.Colonia,
            Municipio: Factura.Emisor.Municipio,
            Estado: Factura.Emisor.Estado,
            // Logo: Factura.Emisor.Logo,
        
            Serie: Factura.Serie,
            Fecha: Factura.Fecha,
            TipoComprobante: Factura.TipoDeComprobante
        });

        const getDatosReceptor = (Factura) => ({
            ID: Factura.ReceptorID,
            Rfc: Factura.Receptor.Rfc,
            DomicilioFiscalReceptor: Factura.Receptor.DomicilioFiscalReceptor,
            Nombre: Factura.Receptor.Nombre,
            UsoCFDI: Factura.UsoCFDI,
            UsoCFDIDescripcion: FacturaRecuperada.uso_cfdi.Descripcion,
            RegimenFiscal: Factura.Receptor.RegimenFiscalReceptor,
            LugarExpedicion: Factura.Receptor.LugarExpedicion,
            Calle: Factura.Receptor.Calle,
            NoExterior: Factura.Receptor.NumeroExterior,
            NoInterior: Factura.Receptor.NumeroInterior,
            Colonia: Factura.Receptor.Colonia,
            Municipio: Factura.Receptor.Municipio,
            Estado: Factura.Receptor.Estado,
            MetodoPago: Factura.MetodoPago,
            MetodoPagoDescripcion: FacturaRecuperada.metodo_pago.Descripcion,
            FormaPago: Factura.FormaPago,
            FormaPagoDescripcion: FacturaRecuperada.forma_pago.Descripcion,
    
            //informacion Global
            InformacionGlobal:{
                Año: Factura.InformacionGlobal.Año,
                Meses: Factura.InformacionGlobal.Meses,
                Periodicidad: Factura.InformacionGlobal.Periodicidad
    
            }
    
        });
    const conceptos = ListaConceptos;
    const emisor = getDatosEmisor(Factura);
    const receptor = getDatosReceptor(Factura);
    return { conceptos, emisor, receptor };
    
    }
    else{
        return { conceptos: [], emisor: {}, receptor: {} };
    }
    

}