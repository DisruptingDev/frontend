import { uuid } from "valibot";

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

  const calculoImpuestosTraslado = 0;

  const TotalTraslados = 0;
  const TotalRetenciones = 0;

  console.log("Factura original en Formateo", facturaOriginal);

  let factura;
  if (modo === "Pago") {
    factura = {
      Version: facturaOriginal.Version || "4.0",
      Fecha: facturaOriginal.factura.Fecha,
      MetodoPago: "PUE",
      Serie: data.SeriePagos || "P",
      FormaPago: data.FormaPagoComprobante || "99 - Por definir",
      CondicionesDePago: "Condiciones De Pago",
      Subtotal: 0,
      Descripcion: "",
      Moneda: "MXN",
      TipoCambio: "1",
      Total: facturaOriginal.Total || 0.0,
      TipoDeComprobante: "P",
      Exportacion: "01",
      LugarExpedicion: data.LugarExpedicion || "00000",
      EmisorID: data.EmisorID || "",
      ReceptorID: data.ReceptorID,
      UsoCFDI: "CP01",
      Conceptos: {
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
            TotalRetencionesIVA: data.ImpuestosPagos.filter(
              (imp) =>
                imp.TipoImpuesto === "Retencion" && imp.ImpuestoClave === "002"
            ).reduce((sum, imp) => sum + imp.Importe, 0),
            TotalRetencionesISR: data.ImpuestosPagos.filter(
              (imp) =>
                imp.TipoImpuesto === "Retencion" && imp.ImpuestoClave === "001"
            ).reduce((sum, imp) => sum + imp.Importe, 0),
            TotalRetencionesIEPS: data.ImpuestosPagos.filter(
              (imp) =>
                imp.TipoImpuesto === "Retencion" && imp.ImpuestoClave === "003"
            ).reduce((sum, imp) => sum + imp.Importe, 0),
            TotalTrasladosBaseIVA16: data.ImpuestosPagos.filter(
              (imp) =>
                imp.TipoImpuesto === "Traslado" &&
                imp.ImpuestoClave === "002" &&
                imp.TasaOCuota === 0.16
            ).reduce((sum, imp) => sum + imp.Base, 0),
            TotalTrasladosImpuestoIVA16: data.ImpuestosPagos.filter(
              (imp) =>
                imp.TipoImpuesto === "Traslado" &&
                imp.ImpuestoClave === "002" &&
                imp.TasaOCuota === 0.16
            ).reduce((sum, imp) => sum + imp.Importe, 0),
            // ... otros totales
            MontoTotalPagos: parseFloat(data.Monto) || 0,
          },
          Pagos: [
            {
              FechaPago: data.FechaPago || new Date().toISOString(),
              FormaDePagoP: data.FormaPagoComprobante || "99 - Por definir",
              MonedaP: data.Divisa || "MXN",
              Monto: parseFloat(data.Monto),
              TipoCambioP: "1",
              DoctosRelacionados: [
                {
                  IdDocumento: data.IdDocumento || "",
                  Serie: data.SeriePagos || "P",
                  Folio: "",
                  MonedaDR: data.Divisa || "MXN",
                  NumParcialidad: parseInt(data.NumeroOperacion) || 1,
                  ImpSaldoAnt: parseFloat(data.SaldoAnterior),
                  ImpPagado: parseFloat(data.Monto),
                  ImpSaldoInsoluto: parseFloat(data.ImpSaldoInsoluto) || 0,
                  ObjetoImpDR: "02",
                },
              ],
              Impuestos: {
                Traslados: data.ImpuestosPagos.filter(
                  (impuesto) => impuesto.TipoImpuesto === "Traslado"
                ) // Solo traslados
                  .map((impuesto) => ({
                    Base: impuesto.Base,
                    ImpuestoCatalogoID: impuesto.ImpuestoCatalogoID,
                    ImpuestoClave: impuesto.ImpuestoClave,
                    TipoFactor: "Tasa", // Puedes ajustar según necesites (Tasa, Cuota, Exento)
                    TasaOCuota: impuesto.TasaOCuota,
                    TasaCatalogoID: impuesto.ImpuestoCatalogoID,
                    Importe: impuesto.Importe,
                  })),
                Retenciones: data.ImpuestosPagos.filter(
                  (impuesto) => impuesto.TipoImpuesto === "Retencion"
                ) // Solo retenciones
                  .map((impuesto) => ({
                    Base: impuesto.Base,
                    ImpuestoCatalogoID: impuesto.ImpuestoCatalogoID,
                    ImpuestoClave: impuesto.ImpuestoClave,
                    TipoFactor: "Tasa", // Puedes ajustar según necesites
                    TasaOCuota: impuesto.TasaOCuota,
                    TasaCatalogoID: impuesto.ImpuestoCatalogoID,
                    Importe: impuesto.Importe,
                  })),
              },
            },
          ],
        },
      },
    };
    console.log("Factura Vista Previa Pago", factura);
  } else if (modo === "VistaPreviaPago") {
    factura = {
      Version: "4.0",
      Serie: data.SeriePagos || "P",
      FechaPago: data.FechaPago || fechaActual,
      uuid: "",
      TipoDeComprobante: "P",
      Fecha: data.Fecha || fechaActual,
      Calle: data.Calle || "",
      NoExterior: data.NoExterior || "",
      Exportacion: "01",
      NoInterior: data.NoInterior || "",
      Colonia: data.Colonia || "",
      Municipio: data.Municipio || "",
      Estado: data.Estado || "",
      Folio: data.Folio || "",
      MonedaDR: "MXN",
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
  }
  return factura;
}
