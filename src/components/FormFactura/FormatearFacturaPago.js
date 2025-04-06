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
  const documentos = Array.isArray(doctosRelacionados)
    ? doctosRelacionados
    : [doctosRelacionados];

  // Obtener IdDocumento: primero de documentos relacionados, si no existe, de facturaOriginal.uuid
  const idDocumento =
    documentos.length > 0 && documentos[0].IdDocumento
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
      Total: facturaOriginal.Total || 0.0,
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
                  Numparcialidad:
                    parseInt(doctosRelacionados.NumParcialidad) || "1",
                  ImpSaldoAnt: doctosRelacionados.ImpSaldoAnt || 0,
                  ImpPagado: parseFloat(doctosRelacionados.ImpPagado),
                  ImpSaldoInsoluto:
                    parseFloat(doctosRelacionados.ImpSaldoInsoluto) || 0,
                  ObjetoImpDr: "02",
                },
              ],
            },
          ],
        },
      },
    };
    console.log("Factura Vista Previa Pago", factura);
  } else if (modo === "Factura") {
    factura = {
      Version: "4.0", //DEFAULT
      Serie: "P", //DEFAULT
      Fecha: data.Fecha || fechaActual,
      FormaPago: "01", //DEFAULT
      CondicionesDePago: "Condiciones De Pago", //DEFAULT
      SubTotal: facturaOriginal.Subtotal || 0,
      Descripcion: "",
      Moneda: "MXN", //DEFAULT
      TipoCambio: "1", //DEFAULT
      Total: facturaOriginal.Total || 0.0,
      TipoDeComprobante: "P", //DEFAULT
      Exportacion: "01", //DEFAULT
      MetodoPago: "PUE", //DEFAULT
      LugarExpedicion: data.LugarExpedicion,
      EmisorID: data.EmisorID,
      ReceptorID: data.ReceptorID,
      UsoCFDI: "S01",
      Conceptos: {
        //TODO EL NODO DE CONCEPTOS SE QUEDA ASÍ POR DEFAULT
        ListaConceptos: [
          {
            ClaveProdServ: "84111506",
            Cantidad: 1,
            ClaveUnidad: "ACT",
            Unidad: "Actividad",
            Descripcion: "Pago",
            ValorUnitario: 0,
            Importe: 0,
            Descuento: 0,
            ObjetoImp: "01",
            Impuestos: {
              Traslados: [],
              Retenciones: [],
            },
          },
        ],
        TotalImpuestosTrasladados: 0,
        TotalImpuestosRetenidos: 0,
      },
      Complemento: {
        Pagos: {
          Version: "2.0",
          Totales: {
            TotalRetencionesIVA: 0,
            TotalRetencionesISR: 0,
            TotalRetencionesIEPS: 0,
            TotalTrasladosBaseIVA16: 0,
            TotalTrasladosImpuestoIVA16: 0,
            TotalTrasladosImpuestoBaseIVA8: 0,
            TotalTrasladosImpuestoIVA8: 0,
            TotalTrasladosBaseIVA0: 0,
            TotalTrasladosImpuestoIVA0: 0,
            TotalTrasladosBaseIVAExento: 0,
            MontoTotalPagos: 0,
          },
          Pagos: [
            //EN ESTE SE PUEDEN MANDAR VARIOS PAGOS PERO EN ESTE PUNTO ESPECIFICO SOLO SE ENVIARÁ 1
            {
              FechaPago: data.FechaPago || fechaActual,
              FormaDePagoP: "01",
              MonedaP: "MXN",
              DoctoRelacionados: [
                //DE IGUAL MANERA SE PUEDEN ENVIAR VARIOS DOCTOS RELACIONADOS PERO DE MOMENTO SOLO SE DEBE ENVIAR UNO (LA FACTURA MADRE Y SU INFORMACION)
                {
                  IdDocumento: idDocumento, //UUID DELA FACTURA MADRE
                  Serie: "P", //SERIE DE LA MADRE
                  Folio: "", //FOLIO DE LA MADRE
                  MonedaDR: "MXN", //MONEDA DE LA MADRE
                  NumParcialidad: parseInt(data.NumeroOperacion), // NUEVO NUMERO DE PARCIALIDAD
                  ImpSaldoAnt: parseInt(data.SaldoAnterior), //IMP SALDO ANTERIOR DE LA MADRE
                  ImpPagado: parseFloat(data.Monto), //IMP PAGADO DE LA MADRE
                  ImpSaldoInsoluto: parseFloat(data.ImpSaldoInsoluto), //IMP SALDO INSOLUTO DE LA MADRE
                  ObjetoImpDR: "02", //OBJETO IMP DE LA MADRE
                },
              ],
            },
          ],
        },
      },
    };
  }
  return factura;
}
