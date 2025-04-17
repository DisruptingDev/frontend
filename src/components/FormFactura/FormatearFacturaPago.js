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
      Fecha: data.FechaPago || new Date().toISOString(),
      MetodoPago: "PUE",
      Serie: data.SeriePagos || "P",
      FormaPago: data.FormaPagoComprobante || "99 - Por definir",
      CondicionesDePago: "Condiciones De Pago",
      Subtotal: facturaOriginal.Subtotal || 0,
      Descripcion: "",
      Moneda: "MXN",
      TipoCambio: "1",
      Total: facturaOriginal.Total || 0.0,
      TipoDeComprobante: data.SeriePagos || "P",
      Exportacion: "01",
      LugarExpedicion: data.LugarExpedicion || "00000",
      EmisorID: data.EmisorID || "",
      ReceptorID: data.ReceptorID,
      UsoCFDI: "CP01",
      Conceptos: {
        ListaConceptos: [{
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
            Traslados: [
              {
                Base: data.ImpuestosPagos[0].Base,
                ImpuestoCatalogoID: data.ImpuestosPagos[0].ImpuestoCatalogoID || 0,
                ImpuestoClave: data.ImpuestosPagos[0].ImpuestoClave || "002",
                TipoFactor: data.ImpuestosPagos[0].TipoFactoe || "Tasa",
                TasaOCuota: data.ImpuestosPagos[0].TasaOCuota || 0.16,
                TasaCatalogoID: data.ImpuestosPagos[0].ImpuestoCatalogoID || 0,
                Importe: data.ImpuestosPagos[0].Importe || 0,
              }
            ],
            Retenciones: []
        }
        }],
        TotalImpuestosTrasladados: TotalTraslados || 10,
        TotalImpuestosRetenidos: TotalRetenciones || 0
      },
      Complemento: {
        Pagos: {
          Version: "2.0",
          Totales: { 
            TotalRetencionesIVA: 0,
            TotalRetencionesISR: 0,
            TotalRetencionesIEPS: 0,
            TotalTrasladosBaseIVA16: 0,
            TotalTrasladosImpuestoIVA16: data.ImpuestosPagos[0].Importe,
            TotalTrasladosImpuestoBaseIVA8: 0,
            TotalTrasladosImpuestoIVA8: 0,
            TotalTrasladosBaseIVA0: 0,
            TotalTrasladosImpuestoIVA0: 0,
            TotalTrasladosBaseIVAExento: 0,
            MontoTotalPagos: facturaOriginal.Total || 0,
          },
          Pagos: [
            {
              FechaPago: data.FechaPago || new Date().toISOString(),
              FormaDePagoP: data.FormaPagoComprobante || "99 - Por definir",
              MonedaP: data.Divisa || "MXN",
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
                  ObjetoImpDR: "02" 
                }
              ],
              Impuestos: { // Agregado nodo Impuestos que faltaba
                Traslados: [
                  {
                    Base: data.ImpuestosPagos[0].Base,
                    ImpuestoCatalogoID: data.ImpuestosPagos[0].ImpuestoCatalogoID,
                    ImpuestoClave: data.ImpuestosPagos[0].ImpuestoClave,
                    TipoFactor: "Tasa",
                    TasaOCuota: data.ImpuestosPagos[0].TasaOCuota,
                    TasaCatalogoID: data.ImpuestosPagos[0].ImpuestoCatalogoID,
                    Importe: data.ImpuestosPagos[0].Importe
                  }
                ],
                Retenciones: [
                  {
                    Base: 0,
                    ImpuestoCatalogoID: 2,
                    ImpuestoClave: "002",
                    TipoFactor: "Tasa",
                    TasaOCuota: 0.16,
                    TasaCatalogoID: 21,
                    Importe: 0
                  }
                ]
              }
            }
          ]
        }
      }
    };
    console.log
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
      Total: facturaOriginal.Total || 0.00,
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
