export default function FormatearFactura(
  emisor,
  receptor,
  conceptos,
  id,
  modo,
  facturasRelacionadas = null
) {
  console.log("Facturas relacionadas", facturasRelacionadas);
  //console.log("Conceptos antes de reduce: ",conceptos);
  const subtotal = conceptos.reduce((acc, c) => acc + c.Subtotal, 0);
  const TotalTraslados = conceptos.reduce(
    (acc, c) => acc + c.TotalTraslados,
    0
  );
  const TotalRetenciones = conceptos.reduce(
    (acc, c) => acc + c.TotalRetenciones,
    0
  );
  const TotalDescuento = conceptos.reduce((acc, c) => acc + c.Descuento, 0);
  //console.log("TotalTraslados", TotalTraslados);
  //console.log("TotalRetenciones", TotalRetenciones);
  //console.log("TotalDescuento", TotalDescuento);
  const total = subtotal + TotalTraslados - TotalRetenciones - TotalDescuento;
  //console.log("Total", total);
  const now = new Date();
  const horaActual = now.toTimeString().split(" ")[0]; // Obtiene solo "HH:MM:SS"
  const fechaFormateada = `${emisor.Fecha}T${horaActual}`;
  // console.log("Emisor", emisor);
  // console.log("Receptor", receptor);
  //console.log("Conceptos", conceptos);

  const formatter = new Intl.NumberFormat("es-MX", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  let factura;
  if (modo == "Factura") {
    factura = {
      ...(id && { ID: Number(Number(id).toFixed(2)) }),
      Version: "4.0",
      Fecha: fechaFormateada,
      FormaPago: receptor.FormaPago,
      Descuento: Number(Number(TotalDescuento).toFixed(2)),
      DescuentoString: String(Number(TotalDescuento).toFixed(2)),
      Serie: emisor.Serie,
      SubTotal: Number(Number(subtotal).toFixed(2)),
      SubTotalString: String(Number(subtotal).toFixed(2)),
      CondicionesDePago: "Condiciones De Pago",
      TipoDeComprobante: emisor.TipoComprobante,
      Descripcion: "",
      Moneda: emisor.Divisa || "MXN",
      TipoCambio: "1",
      Total: Number(Number(total).toFixed(2)),
      TotalString: String(Number(total).toFixed(2)),
      Exportacion: "01",
      MetodoPago: receptor.MetodoPago,
      LugarExpedicion: emisor.LugarExpedicion,
      Confirmacion: "",
      ...(receptor.Año || receptor.Meses || receptor.Periodicidad
        ? {
            InformacionGlobal: {
              Anio: receptor.Año || "",
              Meses: receptor.Meses || "",
              Periodicidad: receptor.Periodicidad || "",
            },
          }
        : {}),
      EmisorID: emisor.Emisor,
      ReceptorID: receptor.Receptor,
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
        ListaConceptos: conceptos.map((concepto) => ({
          ClaveProdServ: String(concepto.ClaveProdServ),
          NoIdentificacion: concepto.NoIdentificacion || "",
          Cantidad: Number(Number(concepto.Cantidad).toFixed(2)),
          ClaveUnidad: String(concepto.ClaveUnidad),
          Unidad: concepto.Unidad || "",
          Descripcion: concepto.Descripcion,
          ValorUnitario: Number(Number(concepto.ValorUnitario).toFixed(2)),
          ValorUnitarioString: String(
            Number(concepto.ValorUnitario).toFixed(2)
          ),
          Importe: Number(Number(concepto.Subtotal).toFixed(2)),
          ImporteString: String(Number(concepto.Subtotal).toFixed(2)),
          Descuento: Number(Number(concepto.Descuento).toFixed(2)),
          DescuentoString: String(Number(concepto.Descuento).toFixed(2)),
          ObjetoImp: concepto.ObjetoImpuesto,
          Impuestos: {
            Retenciones: concepto.Retenciones
              ? concepto.Retenciones.map((retencion) => ({
                  Base: Number(Number(retencion.BaseImpuesto).toFixed(2)),
                  BaseString: String(Number(retencion.BaseImpuesto).toFixed(2)),
                  ImpuestoCatalogoID: retencion.Impuesto,
                  ImpuestoClave: String(retencion.ImpuestoClave),
                  TipoFactor: "Tasa",
                  TasaOCuota: Number(Number(retencion.TasaOCuota).toFixed(2)),
                  TasaOCuotaString: String(
                    Number(retencion.TasaOCuota).toFixed(2)
                  ),
                  TasaCatalogoID: retencion.Tasa,
                  Importe: Number(Number(retencion.Monto).toFixed(2)),
                  ImporteString: String(Number(retencion.Monto).toFixed(2)),
                }))
              : [],
            Traslados: concepto.Traslados
              ? concepto.Traslados.map((traslado) => ({
                  Base: Number(Number(traslado.BaseImpuesto).toFixed(2)),
                  BaseString: String(Number(traslado.BaseImpuesto).toFixed(2)),
                  ImpuestoCatalogoID: traslado.Impuesto,
                  ImpuestoClave: String(traslado.ImpuestoClave),
                  TipoFactor: "Tasa",
                  TasaOCuota: Number(Number(traslado.TasaOCuota).toFixed(2)),
                  TasaOCuotaString: String(
                    Number(traslado.TasaOCuota).toFixed(2)
                  ),
                  TasaCatalogoID: traslado.Tasa,
                  Importe: Number(Number(traslado.Monto).toFixed(2)),
                  ImporteString: String(Number(traslado.Monto).toFixed(2)),
                }))
              : [],
          },
        })),
        TotalImpuestosTrasladados: Number(Number(TotalTraslados).toFixed(2)),
        TotalImpuestosTrasladadosString: String(
          Number(TotalTraslados).toFixed(2)
        ),
        TotalImpuestosRetenidos: Number(Number(TotalRetenciones).toFixed(2)),
        TotalImpuestosRetenidosString: String(
          Number(TotalRetenciones).toFixed(2)
        ),
      },
    };
    console.log("Factura Generada:", factura);
  } else if (modo == "VistaPrevia") {
    factura = {
      UUID: "",
      Version: "4.0",
      Serie: emisor.Serie,
      Folio: "",
      Fecha: fechaFormateada,
      Sello: "",
      FormaPago: receptor.FormaPago,
      FormaPagoDescripcion: receptor.FormaPagoDescripcion,
      NoCertificado: "",
      Certificado: "",
      CondicionesDePago: "Condiciones de Pago",
      SubTotal: subtotal,
      Moneda: emisor.Divisa || "MXN",
      TipoCambio: "1",
      Total: total,
      TipoDeComprobante: "I - Ingreso",
      Exportacion: "01 - No Aplica",
      MetodoPago: receptor.MetodoPago,
      MetodoPagoDescripcion: receptor.MetodoPagoDescripcion,
      LugarExpedicion: emisor.LugarExpedicion,
      Confirmacion: "",
      InformacionGlobal: {
        Periodicidad: "01",
        Meses: "01",
        Año: "2025",
      },
      EmisorID: emisor.Emisor,
      Emisor: {
        Rfc: emisor.RFCEmisor,
        Nombre: emisor.NombreEmisor,
        RegimenFiscal: emisor.RegimenFiscal,
        LugarExpedicion: emisor.LugarExpedicion,
        LogoPath: emisor.LogoEmisor,
        Calle: emisor.CalleEmisor,
        NumeroExterior: emisor.NoExteriorEmisor,
        NumeroInterior: emisor.NoInteriorEmisor,
        Colonia: emisor.ColoniaEmisor,
        Municipio: emisor.MunicipioEmisor,
        Estado: emisor.EstadoEmisor,
      },
      // EmisorNombre: emisor.NombreEmisor,
      // EmisorRFC: emisor.RFCEmisor,
      // EmisorDireccion: emisor.Calle + " # " + emisor.NoExterior + "," + emisor.ColoniaEmisor + "," + emisor.MunicipioEmisor + "," + emisor.EstadoEmisor,
      // EmisorRegimenFiscal: emisor.RegimenFiscal,
      // EmisorLogo: emisor.LogoEmisor,
      Receptor: {
        Rfc: receptor.RFCReceptor,
        Nombre: receptor.NombreReceptor,
        RegimenFiscal: receptor.RegimenFiscal,
        UsoCFDI: receptor.UsoCFDI,
        UsoCFDIDescripcion: receptor.UsoCFDIDescripcion,
        DomicilioFiscalReceptor: receptor.DomicilioFiscalReceptor,
        Calle: receptor.Calle,
        NumeroExterior: receptor.NoExterior,
        Colonia: receptor.Colonia,
        Municipio: receptor.Municipio,
        Estado: receptor.Estado,

        // Direccion: receptor:wp
        // .Calle + " # " + receptor.NoExterior + "," + receptor.Colonia + "," + receptor.Municipio + "," + receptor.Estado,
      },
      // ReceptorID: receptor.Receptor,
      // ReceptorNombre: receptor.NombreReceptor,
      // ReceptorRFC: receptor.RFCReceptor,
      // ReceptorRegimenFiscal: receptor.RegimenFiscal,
      // ReceptorDireccion: receptor.Calle + " # " + receptor.NoExterior + "," + receptor.Colonia + "," + receptor.Municipio + "," + receptor.Estado,
      // ReceptorUsoCFDI: receptor.UsoCFDI,
      // ReceptorUsoCFDIDescripcion: receptor.UsoCFDIDescripcion,
      Conceptos: {
        ListaConceptos: conceptos.map((concepto) => ({
          ClaveProdServ: String(concepto.ClaveProdServ),
          NoIdentificacion: concepto.NoIdentificacion || "",
          Cantidad: parseInt(concepto.Cantidad, 10),
          ClaveUnidad: String(concepto.ClaveUnidad),
          Unidad: concepto.Unidad || "",
          Descripcion: concepto.Descripcion,
          ValorUnitario: concepto.ValorUnitario,
          Importe: concepto.Subtotal,
          Descuento: concepto.Descuento,
          ObjetoImp: concepto.ObjetoImp || "",
          Impuestos: {
            Retenciones: concepto.Retenciones
              ? concepto.Retenciones.map((retencion) => ({
                  NombreImpuesto: retencion.NombreImpuesto,
                  Base: retencion.BaseImpuesto,
                  ImpuestoClave: String(retencion.Impuesto),
                  TipoFactor: retencion.Tipo,
                  TasaOCuota: retencion.Tasa,
                  Importe: retencion.Monto,
                }))
              : [],
            Traslados: concepto.Traslados
              ? concepto.Traslados.map((traslado) => ({
                  NombreImpuesto: traslado.NombreImpuesto,
                  Base: parseFloat(traslado.BaseImpuesto),
                  ImpuestoClave: String(traslado.Impuesto),
                  TipoFactor: traslado.Tipo,
                  TasaOCuota: traslado.Tasa,
                  Importe: traslado.Monto,
                }))
              : [],
          },
        })),
        TotalImpuestosTrasladados: TotalTraslados,
        //Aqui restar
        TotalImpuestosRetenidos: TotalRetenciones,
        TotalDescuento: TotalDescuento,
        GrupoID: 1,
      },
    };
    //console.log("Factura Vista Previa:", factura);
  } else if (modo === "Pago") {
    factura = {
      Version: "4.0",
      Serie: emisor.SeriePagos || "P",
      Fecha: emisor.FechaPago,
      LugarExpedicion: emisor.LugarExpedicion,
      FormaPago: receptor.FormaPago,
      Moneda: emisor.Divisa || "MXN",
      TipoDeComprobante: "P",
      UsoCFDI: "CP01",
      Exportacion: "01 - No Aplica",
      Descripcion: "",
      Subtotal: 0,
      Total: 0,
      EmisorID: emisor.Emisor,
      ReceptorID: receptor.Receptor,
      Conceptos: {
        ListaConceptos: conceptos.map((concepto) => ({
          ClaveProdServ: String(concepto.ClaveProdServ),
          NoIdentificacion: concepto.NoIdentificacion || "",
          Cantidad: parseInt(concepto.Cantidad, 10),
          ClaveUnidad: String(concepto.ClaveUnidad),
          Unidad: concepto.Unidad || "",
          Descripcion: concepto.Descripcion,
          ValorUnitario: concepto.ValorUnitario,
          Importe: concepto.Subtotal,
          Descuento: concepto.Descuento,
          ObjetoImp: concepto.ObjetoImpuesto,
        })),
        TotalImpuestosTrasladados: TotalTraslados,
        TotalImpuestosRetenidos: TotalRetenciones,
      },
      Complemento: {
        Pagos: {
          Version: "2.0",
          Totales: {
            TotalRetencionesIVA: Number(
              (emisor.Totales.TotalRetencionesIVA || 0).toFixed(2)
            ),
            TotalRetencionesISR: Number(
              (emisor.Totales.TotalRetencionesISR || 0).toFixed(2)
            ),
            TotalRetencionesIEPS: Number(
              (emisor.Totales.TotalRetencionesIEPS || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVA16: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA16 || 0) * 100) /
                16
              ).toFixed(2)
            ),
            TotalTrasladosImpuestoIVA16: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA16 || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVA8: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA8 || 0) * 100) /
                8
              ).toFixed(2)
            ),
            TotalTrasladosImpuestoIVA8: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA8 || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVA0: Number(
              (emisor.Totales.TotalTrasladosBaseIVA0 || 0).toFixed(2)
            ),
            TotalTrasladosImpuestoIVA0: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA0 || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVAExento: Number(
              (emisor.Totales.TotalTrasladosBaseIVAExento || 0).toFixed(2)
            ),
            TotalTrasladosImpuestoIVAExento: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVAExento || 0).toFixed(2)
            ),
            // montoTotalPagos: Number((receptor.Monto || 0).toFixed(2))
            montoTotalPagos: parseFloat(receptor.Monto),
          },
          Pagos: [
            {
              FechaPago: emisor.FechaPago,
              FormaDePagoP: receptor.FormaPagoComprobante,
              Moneda: "MXN",
              TipoCambioP: "1",
              Monto: parseFloat(receptor.Monto),
              DoctoRelacionados: [
                {
                  IdDocumento: receptor.IdDocumento,
                  Serie: emisor.Serie,
                  Folio: emisor.Folio,
                  MonedaDR: "MXN",
                  EquivalenciaDR: 1,
                  Numparcialidad: emisor.NumeroOperacion,
                  ImpSaldoAnt: emisor.SaldoAnterior,
                  ImpPagado: parseFloat(receptor.Monto),
                  ImpSaldoInsoluto: parseFloat(emisor.ImpSaldoInsoluto),
                  ObjetoImpDr: "02",
                },
              ],
              // Impuestos: {

              //     Retenciones: emisor.ImpuestosPagos
              //         .filter(retencion => retencion.TipoImpuesto === "Retencion") // Filtrar primero las retenciones
              //         .map(retencion => ({
              //             Base: retencion.Base,
              //             ImpuestoCatalogoID: retencion.ImpuestoCatalogoID,
              //             ImpuestoClave: retencion.ImpuestoClave,
              //             TipoFactor: retencion.TipoFactor || "Tasa",
              //             TasaOCuota: retencion.TasaOCuota,
              //             Importe: retencion.Importe
              //         })),
              //     Traslados: emisor.ImpuestosPagos
              //         .filter(traslado => traslado.TipoImpuesto === "Traslado") // Filtrar primero los traslados
              //         .map(traslado => ({
              //             Base: traslado.Base,
              //             ImpuestoCatalogoID: traslado.ImpuestoCatalogoID,
              //             ImpuestoClave: traslado.ImpuestoClave,
              //             TipoFactor: traslado.TipoFactor || "Tasa",
              //             TasaOCuota: traslado.TasaOCuota,
              //             Importe: traslado.Importe
              //         }))
              // }
            },
          ],
        },
      },
    };
    //console.log("Factura Vista Previa Pago", factura);
  } else if (modo === "VistaPreviaRPE") {
    factura = {
      UUID: "",
      Version: "4.0",
      Serie: emisor.Serie,
      Folio: "",
      Fecha: fechaFormateada,
      Sello: "",
      FormaPago: receptor.FormaPago,
      FormaPagoDescripcion: receptor.FormaPagoDescripcion,
      NoCertificado: "",
      Certificado: "",
      CondicionesDePago: "Condiciones de Pago",
      SubTotal: subtotal,
      Moneda: emisor.Divisa || "MXN",
      TipoCambio: "1",
      Total: total,
      TipoDeComprobante: "I - Ingreso",
      Exportacion: "01 - No Aplica",
      MetodoPago: receptor.MetodoPago,
      MetodoPagoDescripcion: receptor.MetodoPagoDescripcion,
      LugarExpedicion: emisor.LugarExpedicion,
      Confirmacion: "",
      InformacionGlobal: {
        Periodicidad: "01",
        Meses: "01",
        Año: "2025",
      },
      EmisorID: emisor.Emisor,
      Emisor: {
        Rfc: emisor.RFCEmisor,
        Nombre: emisor.NombreEmisor,
        RegimenFiscal: emisor.RegimenFiscal,
        LugarExpedicion: emisor.LugarExpedicion,
        LogoPath: emisor.LogoEmisor,
        Calle: emisor.CalleEmisor,
        NumeroExterior: emisor.NoExteriorEmisor,
        NumeroInterior: emisor.NoInteriorEmisor,
        Colonia: emisor.ColoniaEmisor,
        Municipio: emisor.MunicipioEmisor,
        Estado: emisor.EstadoEmisor,
      },
      // EmisorNombre: emisor.NombreEmisor,
      // EmisorRFC: emisor.RFCEmisor,
      // EmisorDireccion: emisor.Calle + " # " + emisor.NoExterior + "," + emisor.ColoniaEmisor + "," + emisor.MunicipioEmisor + "," + emisor.EstadoEmisor,
      // EmisorRegimenFiscal: emisor.RegimenFiscal,
      // EmisorLogo: emisor.LogoEmisor,
      Receptor: {
        Rfc: receptor.RFCReceptor,
        Nombre: receptor.NombreReceptor,
        RegimenFiscal: receptor.RegimenFiscal,
        UsoCFDI: receptor.UsoCFDI,
        UsoCFDIDescripcion: receptor.UsoCFDIDescripcion,
        Calle: receptor.Calle,
        NumeroExterior: receptor.NoExterior,
        Colonia: receptor.Colonia,
        Municipio: receptor.Municipio,
        Estado: receptor.Estado,
        // Direccion: receptor.Calle + " # " + receptor.NoExterior + "," + receptor.Colonia + "," + receptor.Municipio + "," + receptor.Estado,
      },

      Conceptos: {
        ListaConceptos: conceptos.map((concepto) => ({
          ClaveProdServ: String(concepto.ClaveProdServ),
          NoIdentificacion: concepto.NoIdentificacion || "",
          Cantidad: parseInt(concepto.Cantidad, 10),
          ClaveUnidad: String(concepto.ClaveUnidad),
          Unidad: concepto.Unidad || "",
          Descripcion: concepto.Descripcion,
          ValorUnitario: concepto.ValorUnitario,
          Importe: concepto.Subtotal,
          Descuento: concepto.Descuento,
          ObjetoImp: concepto.ObjetoImp || "",
          Impuestos: {
            Retenciones: concepto.Retenciones
              ? concepto.Retenciones.map((retencion) => ({
                  NombreImpuesto: retencion.NombreImpuesto,
                  Base: retencion.BaseImpuesto,
                  ImpuestoClave: String(retencion.Impuesto),
                  TipoFactor: retencion.Tipo,
                  TasaOCuota: retencion.Tasa,
                  Importe: retencion.Monto,
                }))
              : [],
            Traslados: concepto.Traslados
              ? concepto.Traslados.map((traslado) => ({
                  NombreImpuesto: traslado.NombreImpuesto,
                  Base: traslado.BaseImpuesto,
                  ImpuestoClave: String(traslado.Impuesto),
                  TipoFactor: traslado.Tipo,
                  TasaOCuota: traslado.Tasa,
                  Importe: traslado.Monto,
                }))
              : [],
          },
        })),

        TotalImpuestosTrasladados: TotalTraslados,
        //Aqui restar
        TotalImpuestosRetenidos: TotalRetenciones,
        GrupoID: 1,
      },
      Complemento: {
        Pagos: {
          Version: "2.0",
          Totales: {
            TotalRetencionesIVA: Number(
              (emisor.Totales.TotalRetencionesIVA || 0).toFixed(2)
            ),
            TotalRetencionesISR: Number(
              (emisor.Totales.TotalRetencionesISR || 0).toFixed(2)
            ),
            TotalRetencionesIEPS: Number(
              (emisor.Totales.TotalRetencionesIEPS || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVA16: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA16 || 0) * 100) /
                16
              ).toFixed(2)
            ),
            TotalTrasladosImpuestoIVA16: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA16 || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVA8: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA8 || 0) * 100) /
                8
              ).toFixed(2)
            ),
            TotalTrasladosImpuestoIVA8: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA8 || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVA0: Number(
              (emisor.Totales.TotalTrasladosBaseIVA0 || 0).toFixed(2)
            ),
            TotalTrasladosImpuestoIVA0: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA0 || 0).toFixed(2)
            ),
            TotalTrasladosBaseIVAExento: Number(
              (emisor.Totales.TotalTrasladosBaseIVAExento || 0).toFixed(2)
            ),
            TotalTrasladosImpuestoIVAExento: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVAExento || 0).toFixed(2)
            ),
            // montoTotalPagos: Number((receptor.Monto || 0).toFixed(2))
            montoTotalPagos: parseFloat(receptor.Monto),
          },
          Pagos: [
            {
              FechaPago: emisor.FechaPago,
              FormaDePagoP: receptor.FormaPagoComprobante,
              Moneda: "MXN",
              TipoCambioP: "1",
              Monto: parseFloat(receptor.Monto),
              DoctoRelacionados: [
                {
                  IdDocumento: receptor.IdDocumento,
                  Serie: emisor.Serie,
                  Folio: emisor.Folio,
                  MonedaDR: "MXN",
                  EquivalenciaDR: 1,
                  Numparcialidad: emisor.NumeroOperacion - 1,
                  ImpSaldoAnt: emisor.SaldoAnterior,
                  ImpPagado: parseFloat(receptor.Monto),
                  ImpSaldoInsoluto: parseFloat(emisor.ImpSaldoInsoluto),
                  ObjetoImpDr: "02",
                },
              ],
              Impuestos: {
                Retenciones: emisor.ImpuestosPagos.filter(
                  (retencion) => retencion.TipoImpuesto === "Retencion"
                ) // Filtrar primero las retenciones
                  .map((retencion) => ({
                    Base: retencion.Base,
                    ImpuestoCatalogoID: retencion.ImpuestoCatalogoID,
                    ImpuestoClave: retencion.ImpuestoClave,
                    TipoFactor: retencion.TipoFactor || "Tasa",
                    TasaOCuota: retencion.TasaOCuota,
                    Importe: retencion.Importe,
                  })),
                Traslados: emisor.ImpuestosPagos.filter(
                  (traslado) => traslado.TipoImpuesto === "Traslado"
                ) // Filtrar primero los traslados
                  .map((traslado) => ({
                    Base: traslado.Base,
                    ImpuestoCatalogoID: traslado.ImpuestoCatalogoID,
                    ImpuestoClave: traslado.ImpuestoClave,
                    TipoFactor: traslado.TipoFactor || "Tasa",
                    TasaOCuota: traslado.TasaOCuota,
                    Importe: traslado.Importe,
                  })),
              },
            },
          ],
        },
      },
    };
    //console.log("Factura Vista Previa RPE", factura);
  }
  //console.log("Resultado de la factura", factura);
  return factura;
}
