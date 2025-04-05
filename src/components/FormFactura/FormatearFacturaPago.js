export default function FormatearFactura(facturaOriginal, data, doctosRelacionados, id, modo) {
  const formatter = new Intl.NumberFormat("es-MX", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  // Obtener la fecha actual en formato ISO
  const fechaActual = new Date().toISOString();

  let factura;
  
  if (modo === "Pago") {
    // Verificar si doctosRelacionados es un array, si no, convertirlo
    const documentos = Array.isArray(doctosRelacionados) ? doctosRelacionados : [doctosRelacionados];
    
    // Crear estructura de complemento de pagos
    const complementoPagos = {
      Version: "2.0",
      Pagos: [{
        FechaPago: data.FechaPago || fechaActual,
        FormaDePagoP: data.FormaPagoComprobante || "PUE",
        Moneda: "MXN",
        TipoCambioP: "1",
        Monto: parseFloat(data.Monto) || 0,
        DoctoRelacionados: documentos.map(doc => ({
          IdDocumento: doc.IdDocumento || "",
          Serie: doc.Serie || "",
          Folio: doc.Folio || "",
          MonedaDR: doc.MonedaDR || "MXN",
          NumParcialidad: doc.NumParcialidad || 1,
          ImpSaldoAnt: parseFloat(doc.ImpSaldoAnt) || 0,
          ImpPagado: parseFloat(data.Monto) || 0, // Usar el monto del pago actual
          ImpSaldoInsoluto: parseFloat(data.ImpSaldoInsoluto) || 0,
          ObjetoImpDR: doc.ObjetoImpDR || "02",
          EquivalenciaDR: "1"
        }))
      }]
    };

    factura = {
      Version: facturaOriginal.Version || "4.0",
      Serie: data.SeriePagos || "P - Pago",
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
      TipoDeComprobante: "P - Pago",
      UsoCFDI: "CP01 - Pagos",
      Exportacion: "01 - No Aplica",
      Descripcion: "",
      Subtotal: facturaOriginal.Subtotal || 0,
      Descuentos: 0,
      MontoPago: parseFloat(data.Monto) || 0,
      NumeroOperacion: data.NumeroOperacion || "",
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
      Complemento: {
        Pagos: complementoPagos
      }
    };

    console.log("Factura formateada para Pago:", factura);
  }
  
  return factura;
}