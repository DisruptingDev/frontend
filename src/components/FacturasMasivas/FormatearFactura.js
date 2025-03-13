export default function FormatearFactura(data) {
    console.log("Facturas sin formato", data);

    const conceptos = data.map((item) => {
        const concepto = item.Concepto || {};
        const impuestos = item.Impuesto || {};

        // Convertir TasaOCuota y Monto a cadenas y manejar valores undefined/null
        const tasaOCuota = String(impuestos.TasaOCuota || "0").replace(",", ".");
        const monto = String(impuestos.Monto || "0").replace(",", ".");

        return {
            ClaveProdServ: String(concepto.ClaveProductoServicio),
            NoIdentificacion: concepto.NoIdentificacion || "",
            Cantidad: parseInt(concepto.Cantidad, 10),
            ClaveUnidad: String(concepto.ClaveUnidad),
            Unidad: concepto.Unidad || "",
            Descripcion: concepto.Descripcion,
            ValorUnitario: parseFloat(concepto.PrecioUnitario),
            Importe: parseFloat(concepto.Cantidad) * parseFloat(concepto.PrecioUnitario),
            Descuento: parseFloat(concepto.Descuento || 0),
            ObjetoImp: concepto.ObjetoImpuesto || "02",
            Impuestos: {
                Retenciones: impuestos.Tipo === "Retencion" ? [
                    {
                        Base: parseFloat(impuestos.BaseImpuesto),
                        ImpuestoCatalogoID: impuestos.ImpuestoClaveID,
                        ImpuestoClave: String(impuestos.ClaveImpuesto),
                        TipoFactor: "Tasa",
                        TasaOCuota: parseFloat(tasaOCuota), // Usar la tasaOCuota formateada
                        TasaCatalogoID: impuestos.TasaOCuotaID,
                        Importe: parseFloat(monto) // Usar el monto formateado
                    }
                ] : [],
                Traslados: impuestos.Tipo === "Traslado" ? [
                    {
                        Base: parseFloat(impuestos.BaseImpuesto),
                        ImpuestoCatalogoID: impuestos.ImpuestoClaveID,
                        ImpuestoClave: String(impuestos.ClaveImpuesto),
                        TipoFactor: "Tasa",
                        TasaOCuota: parseFloat(tasaOCuota), // Usar la tasaOCuota formateada
                        TasaCatalogoID: impuestos.TasaOCuotaID,
                        Importe: parseFloat(monto) // Usar el monto formateado
                    }
                ] : []
            }
        };
    });

    const TotalTraslados = conceptos.reduce((acc, c) =>
        acc + c.Impuestos.Traslados.reduce((a, r) => a + r.Importe, 0), 0);

    const TotalRetenciones = conceptos.reduce((acc, c) =>
        acc + c.Impuestos.Retenciones.reduce((a, r) => a + r.Importe, 0), 0);

    const subtotal = conceptos.reduce((acc, c) => acc + c.Importe - c.Descuento, 0);
    const total = subtotal + TotalTraslados - TotalRetenciones;

    const emisor = data[0].Emisor || {};
    const receptor = data[0].Receptor || {};

    const factura = {
        Version: "4.0",
        Fecha: new Date().toISOString(), // Cambia esto por la fecha real si está disponible
        FormaPago: receptor.FormaPago,
        Serie: emisor.Serie,
        SubTotal: subtotal,
        CondicionesDePago: "Condiciones De Pago",
        TipoDeComprobante: emisor.TipoComprobante || "I",
        Descripcion: "",
        Moneda: emisor.Divisa || "MXN",
        TipoCambio: "1",
        Total: total,
        Exportacion: "01",
        MetodoPago: receptor.MetodoPago,
        LugarExpedicion: emisor.LugarExpedicion,
        Confirmacion: "",
        InformacionGlobal: {
            Año: receptor.Año || "",
            Meses: receptor.Meses || "",
            Periodicidad: receptor.Periodicidad || "",
        },
        EmisorID: emisor.ID,
        ReceptorID: receptor.ID,
        UsoCFDI: receptor.UsoCFDI,
        Conceptos: {
            ListaConceptos: conceptos,
            TotalImpuestosTrasladados: conceptos.reduce((acc, c) =>
                acc + c.Impuestos.Traslados.reduce((a, t) => a + t.Importe, 0), 0),
            TotalImpuestosRetenidos: conceptos.reduce((acc, c) =>
                acc + c.Impuestos.Retenciones.reduce((a, r) => a + r.Importe, 0), 0)
        }
    };

    return factura;
}