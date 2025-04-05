export default function FormatearFactura(
  facturaOriginal,
  data,
  doctosRelacionados,
  id,
  modo
) {
  const pagos = doctosRelacionados;
  console.log("Pagos", pagos);
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Normalizar documentos relacionados (asegurar que sea array)
  const documentos = Array.isArray(doctosRelacionados) ? doctosRelacionados : [doctosRelacionados];
  
  // Obtener IdDocumento: primero de documentos relacionados, si no existe, de facturaOriginal.uuid
  const idDocumento = documentos.length > 0 && documentos[0].IdDocumento 
    ? documentos[0].IdDocumento 
    : facturaOriginal.uuid || facturaOriginal.factura?.uuid || "";

  // Obtener la fecha actual de la computadora
  const fechaActual = new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  let factura;
  if (modo === "Pago") {
    factura = {
      Version: facturaOriginal.Version || "4.0",
      Serie: "P - Pago",
      FechaPago: data.FechaPago || fechaActual,
      Fecha: data.Fecha || fechaActual,
      LugarExpedicion: data.LugarExpedicion || "00000",
      Calle: data.Calle || "",
      NoExterior: data.NoExterior || "",
      NoInterior: data.NoInterior || "",
      Colonia: data.Colonia || "", 
      Municipio: data.Municipio || "",
      Estado: data.Estado || "",
      FormaPago: "PUE",
      Folio: data.Folio || "",
      Moneda: "MXN",
      MonedaDR: "MXN",
      TipoDeComprobante: "P - Pago",
      UsoCFDI: "CP01 - Pagos",
      Exportacion: "01 - No Aplica",
      Descripcion: "",
      Subtotal: facturaOriginal.Subtotal || 0,
      Descuentos: 0,
      IdDocumento: idDocumento || "",
      MontoPago: parseInt(data.Monto) || 0,
      ImpSaldoAnt: parseInt(data.SaldoAnterior) || 0,
      ImpPagado: parseInt(data.Monto) || 0,
      ImpSaldoInsoluto: parseInt(data.ImpSaldoInsoluto) || 0,
      ObjetoImpDR: "02",
      NumeroOperacion: parseInt(data.NumeroOperacion) || "",
      NumParcialidad: parseInt(data.NumeroOperacion) || "",
      Total: facturaOriginal.Total || 0.00,
      EmisorID: facturaOriginal.EmisorID || "",
      NombreEmisor: data.NombreEmisor || "",
      RegimenFiscalEmisor: data.RegimenFiscalEmisor || "",
      RFCEmisor: data.RFCEmisor || "",
      NombreReceptor: data.NombreReceptor || "",
      RFCReceptor: data.RFCReceptor || "",
      RegimenFiscalReceptor: data.RegimenFiscal || "",
      ReceptorID: facturaOriginal.ReceptorID,
      DomicilioFiscalReceptor: data.DomicilioFiscalReceptor || "",
    //   Conceptos: {
    //     ListaConceptos: conceptos.map((concepto) => ({
    //       ClaveProdServ: String(concepto.ClaveProdServ),
    //       NoIdentificacion: concepto.NoIdentificacion || "",
    //       Cantidad: parseInt(concepto.Cantidad, 10),
    //       ClaveUnidad: String(concepto.ClaveUnidad),
    //       Unidad: concepto.Unidad || "",
    //       Descripcion: concepto.Descripcion,
    //       ValorUnitario: concepto.ValorUnitario,
    //       Importe: concepto.Subtotal,
    //       Descuento: concepto.Descuento,
    //       ObjetoImp: concepto.ObjetoImpuesto,
    //     })),
    //     TotalImpuestosTrasladados: TotalTraslados,
    //     TotalImpuestosRetenidos: TotalRetenciones,
    //   },
      Complemento: {
        Pagos: {
          Version: "2.0",
          Pagos: [
            {
              FechaPago: data.FechaPago || "2025-10-01T00:00:00",
              FormaDePagoP: "PUE",
              Moneda: "MXN",
              TipoCambioP: "1",
              
              DoctoRelacionados: [
                {
                  IdDocumento: doctosRelacionados.IdDocumento,
                  Serie: doctosRelacionados.Serie || "",
                  Folio: doctosRelacionados.Folio || "",
                  MonedaDR: doctosRelacionados.MonedaDR || "MXN",
                  Numparcialidad: parseInt(doctosRelacionados.NumParcialidad) || "1",
                  ImpSaldoAnt: doctosRelacionados.ImpSaldoAnt || 0,
                  ImpPagado: parseFloat(doctosRelacionados.ImpPagado),
                  ImpSaldoInsoluto: parseFloat(doctosRelacionados.ImpSaldoInsoluto) || 0,
                  ObjetoImpDr: "02",
                },
              ],
            },
          ],
        },
      },
    };
    console.log("Factura Vista Previa Pago", factura);
  }
  return factura;
}
