export default function FormatearFactura(
  data,
  id = null,
  facturasRelacionadas = null,
) {
  console.log("Facturas sin formato", data);

  const conceptos = data.map((item) => {
    const concepto = item.Concepto || {};
    const impuestos = item.Impuesto || {};

    // Convertir TasaOCuota y Monto a cadenas y manejar valores undefined/null
    const tasaOCuota = String(impuestos.TasaOCuota || "0").replace(",", ".");
    const monto = String(impuestos.Monto || "0").replace(",", ".");

    const cantidad = parseFloat(concepto.Cantidad) || 0;
    const precioUnitario = parseFloat(concepto.PrecioUnitario) || 0;
    const descuento = parseFloat(concepto.Descuento) || 0;
    const importe = cantidad * precioUnitario;

    return {
      ClaveProdServ: String(concepto.ClaveProductoServicio || ""),
      NoIdentificacion: concepto.NoIdentificacion || "",
      Cantidad: Number(cantidad.toFixed(2)),
      ClaveUnidad: String(concepto.ClaveUnidad || ""),
      Unidad: calcularUnidad(String(concepto.ClaveUnidad)),
      Descripcion: concepto.Descripcion || "",
      ValorUnitario: Number(precioUnitario.toFixed(2)),
      ValorUnitarioString: String(precioUnitario.toFixed(2)),
      Importe: Number(importe.toFixed(2)),
      ImporteString: String(importe.toFixed(2)),
      Descuento: Number(descuento.toFixed(2)),
      DescuentoString: String(descuento.toFixed(2)),
      ObjetoImp: concepto.ObjetoImpuesto || "02",
      Impuestos: {
        Retenciones:
          impuestos.Tipo === "Retencion"
            ? [
                {
                  Base: Number(
                    parseFloat(impuestos.BaseImpuesto || 0).toFixed(2),
                  ),
                  ImpuestoCatalogoID: impuestos.ImpuestoClaveID,
                  ImpuestoClave: String(impuestos.ClaveImpuesto || ""),
                  TipoFactor: "Tasa",
                  TasaOCuota: Number(parseFloat(tasaOCuota).toFixed(2)),
                  TasaCatalogoID: impuestos.TasaOCuotaID,
                  Importe: Number(parseFloat(monto).toFixed(2)),
                },
              ]
            : [],
        Traslados:
          impuestos.Tipo === "Traslado"
            ? [
                {
                  Base: Number(
                    parseFloat(impuestos.BaseImpuesto || 0).toFixed(2),
                  ),
                  BaseString: String(
                    parseFloat(impuestos.BaseImpuesto || 0).toFixed(2),
                  ),
                  ImpuestoCatalogoID: impuestos.ImpuestoClaveID,
                  ImpuestoClave: String(impuestos.ClaveImpuesto || ""),
                  TipoFactor: "Tasa",
                  TasaOCuota: Number(parseFloat(tasaOCuota).toFixed(2)),
                  TasaOCuotaString: String(parseFloat(tasaOCuota).toFixed(2)),
                  TasaCatalogoID: impuestos.TasaOCuotaID,
                  Importe: Number(parseFloat(monto).toFixed(2)),
                  ImporteString: String(parseFloat(monto).toFixed(2)),
                },
              ]
            : [],
      },
    };
  });

  // Cálculos de totales
  const TotalTraslados = conceptos.reduce(
    (acc, c) => acc + c.Impuestos.Traslados.reduce((a, r) => a + r.Importe, 0),
    0,
  );

  const TotalRetenciones = conceptos.reduce(
    (acc, c) =>
      acc + c.Impuestos.Retenciones.reduce((a, r) => a + r.Importe, 0),
    0,
  );

  const TotalDescuento = conceptos.reduce((acc, c) => acc + c.Descuento, 0);
  const subtotal = conceptos.reduce(
    (acc, c) => acc + c.Importe - c.Descuento,
    0,
  );
  const total = subtotal + TotalTraslados - TotalRetenciones;

  const emisor = data[0].Emisor || {};
  const receptor = data[0].Receptor || {};
  const informacionGlobal = data[0].InformacionGlobal;

  // Obtener fecha actual formateada
  const now = new Date();
  const fechaFormateada =
    now.toISOString().split("T")[0] + "T" + now.toTimeString().split(" ")[0];

  const factura = {
    ...(id && { ID: Number(Number(id).toFixed(2)) }),
    Version: "4.0",
    Fecha: fechaFormateada,
    FormaPago: receptor.FormaPago,
    Descuento: Number(TotalDescuento.toFixed(2)),
    DescuentoString: String(TotalDescuento.toFixed(2)),
    Serie: emisor.Serie,
    SubTotal: Number(subtotal.toFixed(2)),
    SubTotalString: String(subtotal.toFixed(2)),
    CondicionesDePago: receptor.CondicionesDePago || null,
    TipoDeComprobante: emisor.TipoComprobante || "I",
    Descripcion: "",
    Moneda: emisor.Divisa || "MXN",
    TipoCambio: "1",
    Total: Number(total.toFixed(2)),
    TotalString: String(total.toFixed(2)),
    Exportacion: "01",
    MetodoPago: receptor.MetodoPago,
    LugarExpedicion: emisor.LugarExpedicion,
    Confirmacion: "",
    ...(informacionGlobal && {
      InformacionGlobal: {
        Anio: informacionGlobal.Anio || "",
        Meses: informacionGlobal.Meses || "",
        Periodicidad: informacionGlobal.Periodicidad || "",
      },
    }),
    EmisorID: emisor.ID,
    ReceptorID: receptor.ID,
    UsoCFDI: receptor.UsoCFDI,
    ...(facturasRelacionadas &&
    facturasRelacionadas.TipoRelacion &&
    facturasRelacionadas.ListaCFDIRelacionados &&
    facturasRelacionadas.ListaCFDIRelacionados.length > 0
      ? {
          CFDIRelacionados: {
            TipoRelacion: facturasRelacionadas.TipoRelacion,
            ListaCFDIRelacionados:
              facturasRelacionadas.ListaCFDIRelacionados.map((uuidObj) => ({
                UUID: uuidObj.UUID,
              })),
          },
        }
      : {}),
    Conceptos: {
      ListaConceptos: conceptos,
      TotalImpuestosTrasladados: Number(TotalTraslados.toFixed(2)),
      TotalImpuestosTrasladadosString: String(TotalTraslados.toFixed(2)),
      TotalImpuestosRetenidos: Number(TotalRetenciones.toFixed(2)),
      TotalImpuestosRetenidosString: String(TotalRetenciones.toFixed(2)),
    },
  };

  function calcularUnidad(claveUnidad) {
    const unidades = {
      H87: "Pieza",
      E48: "Unidad de servicio",
      ACT: "Actividad",
    };
    return unidades[claveUnidad] || claveUnidad;
  }

  console.log("Factura Formateada:", factura);
  return factura;
}
