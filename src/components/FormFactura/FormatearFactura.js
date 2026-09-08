export default function FormatearFactura(
  emisor,
  receptor,
  conceptos,
  id,
  modo,
  facturasRelacionadas = null,
  impuestosLocales = [],
) {
  const subtotal = conceptos.reduce((acc, c) => acc + (Number(c.Subtotal) || (Number(c.Cantidad || 1) * Number(c.ValorUnitario || 0)) || 0), 0);
  const TotalTraslados = conceptos.reduce(
    (acc, c) => acc + (Number(c.TotalTraslados) || 0),
    0,
  );
  const TotalRetenciones = conceptos.reduce(
    (acc, c) => acc + (Number(c.TotalRetenciones) || 0),
    0,
  );
  const TotalDescuento = conceptos.reduce((acc, c) => acc + (Number(c.Descuento) || 0), 0);

  const totalTrasladosLocales = Array.isArray(impuestosLocales)
    ? impuestosLocales.filter((i) => i.Tipo === "Traslado").reduce((acc, c) => acc + (Math.abs(Number(c.Importe)) || 0), 0)
    : 0;
  const totalRetencionesLocales = Array.isArray(impuestosLocales)
    ? impuestosLocales.filter((i) => i.Tipo === "Retencion").reduce((acc, c) => acc + (Math.abs(Number(c.Importe)) || 0), 0)
    : 0;

  const total = subtotal + TotalTraslados - TotalRetenciones - TotalDescuento + totalTrasladosLocales - totalRetencionesLocales;
  const now = new Date();
  const horaActual = now.toTimeString().split(" ")[0]; // Obtiene solo "HH:MM:SS"
  const rawFecha = emisor.Fecha ? String(emisor.Fecha).split("T")[0] : now.toISOString().split("T")[0];
  const fechaFormateada = `${rawFecha}T${horaActual}`;

  const formatter = new Intl.NumberFormat("es-MX", {
    style: "decimal",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const resolverTipoFactor = (item) => {
    const permitidos = ["Tasa", "Cuota", "Exento"];
    if (item && permitidos.includes(item.TipoFactor)) return item.TipoFactor;
    if (item && permitidos.includes(item.Tipo)) return item.Tipo;
    return "Tasa";
  };

  const resolverImpuestoClave = (item, defaultClave) => {
    const rawClave = String(item.ImpuestoClave || item.ImpuestoCatalogo?.Clave || item.ImpuestoCatalogo?.clave || "").trim();
    if (rawClave === "001" || rawClave === "002" || rawClave === "003") return rawClave;
    const nombre = (item.NombreImpuesto || item.ImpuestoCatalogo?.Impuesto || "").toUpperCase();
    if (nombre.includes("ISR")) return "001";
    if (nombre.includes("IVA")) return "002";
    if (nombre.includes("IEPS")) return "003";
    const id = Number(item.ImpuestoCatalogoID || item.Impuesto);
    if (id === 1 || id === 4) return "001";
    if (id === 2 || id === 5) return "002";
    if (id === 3 || id === 6) return "003";
    return defaultClave;
  };

  let factura;
  if (modo == "Factura") {
    const toDec2 = (n) => {
      const num = Number(n);
      return isNaN(num) ? "0.00" : num.toFixed(2);
    };

    factura = {
      ...(id && { ID: Number(id) }),
      Version: "4.0",
      Fecha: fechaFormateada,
      FormaPago: receptor.FormaPago || "03",
      Descuento: Number(toDec2(TotalDescuento)),
      DescuentoString: toDec2(TotalDescuento),
      Serie: emisor.Serie || "F",
      ...(emisor.Folio ? { Folio: String(emisor.Folio) } : {}),
      SubTotal: Number(toDec2(subtotal)),
      SubTotalString: toDec2(subtotal),
      CondicionesDePago: receptor.CondicionesDePago || null,
      TipoDeComprobante: emisor.TipoComprobante || "I",
      Descripcion: emisor.Descripcion || receptor.Descripcion || emisor.Observaciones || receptor.Observaciones || "",
      Moneda: emisor.Divisa || "MXN",
      TipoCambio: "1",
      Total: Number(toDec2(total)),
      TotalString: toDec2(total),
      Exportacion: "01",
      MetodoPago: receptor.MetodoPago || "PUE",
      LugarExpedicion: emisor.LugarExpedicion || "01000",
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
      EmisorID: Number(emisor.Emisor || emisor.EmisorID || emisor.ID || emisor.Emisor?.ID || 1),
      ReceptorID: Number(receptor.Receptor || receptor.ReceptorID || receptor.ID || receptor.Receptor?.ID || 1),
      UsoCFDI: receptor.UsoCFDI || "S01",
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
        ListaConceptos: conceptos.map((concepto) => {
          const itemCant = parseInt(concepto.Cantidad, 10) || 1;
          const itemValUnit = Number(concepto.ValorUnitario || 0);
          const itemSubtotal = concepto.Subtotal != null && !isNaN(Number(concepto.Subtotal))
            ? Number(concepto.Subtotal)
            : itemCant * itemValUnit;
          const itemDesc = Number(concepto.Descuento || 0);

          return {
            ...(concepto.ID ? { ID: Number(concepto.ID) } : {}),
            ClaveProdServ: String(concepto.ClaveProdServ || "86121500"),
            NoIdentificacion: concepto.NoIdentificacion || "",
            Cantidad: itemCant,
            ClaveUnidad: String(concepto.ClaveUnidad || "E48"),
            Unidad: concepto.Unidad || "Servicio",
            Descripcion: concepto.Descripcion || "",
            ValorUnitario: Number(toDec2(itemValUnit)),
            ValorUnitarioString: toDec2(itemValUnit),
            Importe: Number(toDec2(itemSubtotal)),
            ImporteString: toDec2(itemSubtotal),
            Descuento: Number(toDec2(itemDesc)) || 0,
            DescuentoString: toDec2(itemDesc),
            ObjetoImp: concepto.ObjetoImpuesto || concepto.ObjetoImp || "02",
            Impuestos: {
              Retenciones: concepto.Retenciones && concepto.Retenciones.length > 0
                ? concepto.Retenciones.map((retencion) => {
                  const rBase = Number(retencion.BaseImpuesto != null ? retencion.BaseImpuesto : (retencion.Base != null ? retencion.Base : itemSubtotal));
                  const rTasaCuota = Number(retencion.TasaOCuota != null ? retencion.TasaOCuota : (retencion.Tasa != null ? retencion.Tasa : 0));
                  const rMonto = Number(retencion.Monto != null ? retencion.Monto : (retencion.Importe != null ? retencion.Importe : 0));
                  const tasaStr = retencion.TasaOCuotaString || (rTasaCuota > 0 ? String(rTasaCuota) : "0.000000");

                  return {
                    ...(retencion.ID ? { ID: Number(retencion.ID) } : {}),
                    Base: Number(toDec2(rBase)),
                    BaseString: toDec2(rBase),
                    ImpuestoCatalogoID: Number(retencion.ImpuestoCatalogoID || retencion.Impuesto || 4),
                    ImpuestoClave: resolverImpuestoClave(retencion, "001"),
                    TipoFactor: resolverTipoFactor(retencion),
                    TasaOCuota: rTasaCuota,
                    TasaOCuotaString: String(tasaStr),
                    TasaCatalogoID: Number(retencion.TasaCatalogoID || retencion.Tasa || 1),
                    Importe: Number(toDec2(rMonto)),
                    ImporteString: toDec2(rMonto),
                  };
                })
                : [],
              Traslados: concepto.Traslados && concepto.Traslados.length > 0
                ? concepto.Traslados.map((traslado) => {
                  const tBase = Number(traslado.BaseImpuesto != null ? traslado.BaseImpuesto : (traslado.Base != null ? traslado.Base : itemSubtotal));
                  const tTasaCuota = Number(traslado.TasaOCuota != null ? traslado.TasaOCuota : (traslado.Tasa != null ? traslado.Tasa : 0.16));
                  const tMonto = Number(traslado.Monto != null ? traslado.Monto : (traslado.Importe != null ? traslado.Importe : (tBase * tTasaCuota)));
                  const tasaStr = traslado.TasaOCuotaString || (tTasaCuota > 0 ? String(tTasaCuota) : "0.160000");

                  return {
                    ...(traslado.ID ? { ID: Number(traslado.ID) } : {}),
                    Base: Number(toDec2(tBase)),
                    BaseString: toDec2(tBase),
                    ImpuestoCatalogoID: Number(traslado.ImpuestoCatalogoID || traslado.Impuesto || 2),
                    ImpuestoClave: resolverImpuestoClave(traslado, "002"),
                    TipoFactor: resolverTipoFactor(traslado),
                    TasaOCuota: tTasaCuota,
                    TasaOCuotaString: String(tasaStr),
                    TasaCatalogoID: Number(traslado.TasaCatalogoID || traslado.Tasa || 21),
                    Importe: Number(toDec2(tMonto)),
                    ImporteString: toDec2(tMonto),
                  };
                })
                : [],
            },
          };
        }),
        TotalImpuestosTrasladados: Number(toDec2(TotalTraslados)),
        TotalImpuestosTrasladadosString: toDec2(TotalTraslados),
        TotalImpuestosRetenidos: Number(toDec2(TotalRetenciones)),
        TotalImpuestosRetenidosString: toDec2(TotalRetenciones),
      },
      ...(Array.isArray(impuestosLocales) && impuestosLocales.length > 0
        ? {
          Complemento: {
            ImpuestosLocales: {
              Version: "1.0",
              TotaldeRetenciones: Number(toDec2(totalRetencionesLocales)),
              TotaldeRetencionesString: toDec2(totalRetencionesLocales),
              TotaldeTraslados: Number(toDec2(totalTrasladosLocales)),
              TotaldeTrasladosString: toDec2(totalTrasladosLocales),
              RetencionesLocales: impuestosLocales
                .filter((imp) => imp.Tipo === "Retencion")
                .map((ret) => ({
                  ImpLocRetenido: ret.Nombre,
                  TasadeRetencion: Number(ret.Tasa || 0),
                  TasadeRetencionString: Number(ret.Tasa || 0).toFixed(2),
                  Importe: Math.abs(Number(toDec2(ret.Importe))),
                  ImporteString: toDec2(Math.abs(Number(ret.Importe))),
                })),
              TrasladosLocales: impuestosLocales
                .filter((imp) => imp.Tipo === "Traslado")
                .map((tras) => ({
                  ImpLocTrasladado: tras.Nombre,
                  TasadeTraslado: Number(tras.Tasa || 0),
                  TasadeTrasladoString: Number(tras.Tasa || 0).toFixed(2),
                  Importe: Number(toDec2(tras.Importe)),
                  ImporteString: toDec2(tras.Importe),
                })),
            },
          },
        }
        : {}),
    };
    console.log("Factura formateada para modo 'Factura':", factura);
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
      CondicionesDePago: receptor.CondicionesDePago || null,
      Descripcion: emisor.Descripcion || receptor.Descripcion || emisor.Observaciones || receptor.Observaciones || "",
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
        RegimenFiscal: emisor.RegimenFiscalEmisor || "",
        LugarExpedicion: emisor.LugarExpedicion,
        LogoPath: emisor.LogoPath,
        Calle: emisor.CalleEmisor,
        NumeroExterior: emisor.NoExteriorEmisor,
        NumeroInterior: emisor.NoInteriorEmisor,
        Colonia: emisor.ColoniaEmisor,
        Municipio: emisor.MunicipioEmisor,
        Estado: emisor.EstadoEmisor,
      },
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
      },
      Conceptos: {
        ListaConceptos: conceptos.map((concepto) => {
          const itemCant = Number(concepto.Cantidad || 1);
          const itemValUnit = Number(concepto.ValorUnitario || 0);
          const itemSubtotal = Number(concepto.Subtotal != null ? concepto.Subtotal : (itemCant * itemValUnit));
          const itemDesc = Number(concepto.Descuento || 0);

          return {
            ClaveProdServ: String(concepto.ClaveProdServ || "86121500"),
            NoIdentificacion: concepto.NoIdentificacion || "",
            Cantidad: itemCant,
            ClaveUnidad: String(concepto.ClaveUnidad || "E48"),
            Unidad: concepto.Unidad || "Servicio",
            Descripcion: concepto.Descripcion || "",
            ValorUnitario: itemValUnit,
            Importe: itemSubtotal,
            Descuento: itemDesc,
            ObjetoImp: concepto.ObjetoImpuesto || concepto.ObjetoImp || "02",
            Impuestos: {
              Retenciones: concepto.Retenciones
                ? concepto.Retenciones.map((retencion) => ({
                  NombreImpuesto: retencion.NombreImpuesto || "ISR",
                  Base: Number(retencion.BaseImpuesto != null ? retencion.BaseImpuesto : (retencion.Base != null ? retencion.Base : itemSubtotal)),
                  ImpuestoClave: resolverImpuestoClave(retencion, "001"),
                  TipoFactor: resolverTipoFactor(retencion),
                  TasaOCuota: Number(retencion.TasaOCuota != null ? retencion.TasaOCuota : (retencion.Tasa != null ? retencion.Tasa : 0)),
                  Importe: Number(retencion.Monto != null ? retencion.Monto : (retencion.Importe != null ? retencion.Importe : 0)),
                }))
                : [],
              Traslados: concepto.Traslados
                ? concepto.Traslados.map((traslado) => ({
                  NombreImpuesto: traslado.NombreImpuesto || "IVA",
                  Base: Number(traslado.BaseImpuesto != null ? traslado.BaseImpuesto : (traslado.Base != null ? traslado.Base : itemSubtotal)),
                  ImpuestoClave: resolverImpuestoClave(traslado, "002"),
                  TipoFactor: resolverTipoFactor(traslado),
                  TasaOCuota: Number(traslado.TasaOCuota != null ? traslado.TasaOCuota : (traslado.Tasa != null ? traslado.Tasa : 0)),
                  Importe: Number(traslado.Monto != null ? traslado.Monto : (traslado.Importe != null ? traslado.Importe : 0)),
                }))
                : [],
            },
          };
        }),
        TotalImpuestosTrasladados: TotalTraslados,
        TotalImpuestosRetenidos: TotalRetenciones,
        TotalDescuento: TotalDescuento,
        GrupoID: 1,
      },
      ImpuestosLocales: impuestosLocales || [],
      ...(Array.isArray(impuestosLocales) && impuestosLocales.length > 0
        ? {
          Complemento: {
            ImpuestosLocales: {
              Version: "1.0",
              TotaldeRetenciones: Number(toDec2(totalRetencionesLocales)),
              TotaldeTraslados: Number(toDec2(totalTrasladosLocales)),
              RetencionesLocales: impuestosLocales
                .filter((imp) => imp.Tipo === "Retencion")
                .map((ret) => ({
                  ImpLocRetenido: ret.Nombre,
                  TasadeRetencion: Number(ret.Tasa || 0),
                  Importe: Math.abs(Number(toDec2(ret.Importe))),
                })),
              TrasladosLocales: impuestosLocales
                .filter((imp) => imp.Tipo === "Traslado")
                .map((tras) => ({
                  ImpLocTrasladado: tras.Nombre,
                  TasadeTraslado: Number(tras.Tasa || 0),
                  Importe: Number(toDec2(tras.Importe)),
                })),
            },
          },
        }
        : {}),
    };
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
      Descripcion: emisor.Descripcion || "",
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
              (emisor.Totales.TotalRetencionesIVA || 0).toFixed(2),
            ),
            TotalRetencionesISR: Number(
              (emisor.Totales.TotalRetencionesISR || 0).toFixed(2),
            ),
            TotalRetencionesIEPS: Number(
              (emisor.Totales.TotalRetencionesIEPS || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVA16: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA16 || 0) * 100) /
                16
              ).toFixed(2),
            ),
            TotalTrasladosImpuestoIVA16: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA16 || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVA8: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA8 || 0) * 100) /
                8
              ).toFixed(2),
            ),
            TotalTrasladosImpuestoIVA8: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA8 || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVA0: Number(
              (emisor.Totales.TotalTrasladosBaseIVA0 || 0).toFixed(2),
            ),
            TotalTrasladosImpuestoIVA0: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA0 || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVAExento: Number(
              (emisor.Totales.TotalTrasladosBaseIVAExento || 0).toFixed(2),
            ),
            TotalTrasladosImpuestoIVAExento: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVAExento || 0).toFixed(2),
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
      CondicionesDePago: receptor.CondicionesDePago || null,
      Descripcion: emisor.Descripcion || "",
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
                ImpuestoClave: resolverImpuestoClave(retencion, "001"),
                TipoFactor: resolverTipoFactor(retencion),
                TasaOCuota: retencion.Tasa,
                Importe: retencion.Monto,
              }))
              : [],
            Traslados: concepto.Traslados
              ? concepto.Traslados.map((traslado) => ({
                NombreImpuesto: traslado.NombreImpuesto,
                Base: traslado.BaseImpuesto,
                ImpuestoClave: resolverImpuestoClave(traslado, "002"),
                TipoFactor: resolverTipoFactor(traslado),
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
              (emisor.Totales.TotalRetencionesIVA || 0).toFixed(2),
            ),
            TotalRetencionesISR: Number(
              (emisor.Totales.TotalRetencionesISR || 0).toFixed(2),
            ),
            TotalRetencionesIEPS: Number(
              (emisor.Totales.TotalRetencionesIEPS || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVA16: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA16 || 0) * 100) /
                16
              ).toFixed(2),
            ),
            TotalTrasladosImpuestoIVA16: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA16 || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVA8: Number(
              (
                ((emisor.Totales.TotalTrasladosImpuestoIVA8 || 0) * 100) /
                8
              ).toFixed(2),
            ),
            TotalTrasladosImpuestoIVA8: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA8 || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVA0: Number(
              (emisor.Totales.TotalTrasladosBaseIVA0 || 0).toFixed(2),
            ),
            TotalTrasladosImpuestoIVA0: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVA0 || 0).toFixed(2),
            ),
            TotalTrasladosBaseIVAExento: Number(
              (emisor.Totales.TotalTrasladosBaseIVAExento || 0).toFixed(2),
            ),
            TotalTrasladosImpuestoIVAExento: Number(
              (emisor.Totales.TotalTrasladosImpuestoIVAExento || 0).toFixed(2),
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
                  (retencion) => retencion.TipoImpuesto === "Retencion",
                ) // Filtrar primero las retenciones
                  .map((retencion) => ({
                    Base: retencion.Base,
                    ImpuestoCatalogoID: retencion.ImpuestoCatalogoID,
                    ImpuestoClave: retencion.ImpuestoClave,
                    TipoFactor: resolverTipoFactor(retencion),
                    TasaOCuota: retencion.TasaOCuota,
                    Importe: retencion.Importe,
                  })),
                Traslados: emisor.ImpuestosPagos.filter(
                  (traslado) => traslado.TipoImpuesto === "Traslado",
                ) // Filtrar primero los traslados
                  .map((traslado) => ({
                    Base: traslado.Base,
                    ImpuestoCatalogoID: traslado.ImpuestoCatalogoID,
                    ImpuestoClave: traslado.ImpuestoClave,
                    TipoFactor: resolverTipoFactor(traslado),
                    TasaOCuota: traslado.TasaOCuota,
                    Importe: traslado.Importe,
                  })),
              },
            },
          ],
        },
      },
    };
  }
  return factura;
}
