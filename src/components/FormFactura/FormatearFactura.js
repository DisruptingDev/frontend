import Conceptos from "./Conceptos/Conceptos";
import Emisor from "./Emisor/Emisor";
import Receptor from "./Receptor/Receptor";

export default function FormatearFactura(emisor, receptor, conceptos, id, modo) {
    const subtotal = conceptos.reduce((acc, c) => acc + c.Subtotal, 0);
    const TotalTraslados = conceptos.reduce((acc, c) => acc + c.TotalTraslados, 0);
    const TotalRetenciones = conceptos.reduce((acc, c) => acc + c.TotalRetenciones, 0);
    console.log("TotalTraslados", TotalTraslados);
    console.log("TotalRetenciones", TotalRetenciones);
    const total = subtotal + TotalTraslados - TotalRetenciones;
    console.log("Total", total);
    const now = new Date();
    const horaActual = now.toTimeString().split(' ')[0]; // Obtiene solo "HH:MM:SS"
    const fechaFormateada = `${emisor.Fecha}T${horaActual}`;
    console.log("Emisor", emisor);
    console.log("Receptor", receptor);
    console.log("Conceptos", conceptos);

    let factura
    if (modo == "Factura") {
        factura = {
            ...(id && { ID: parseInt(id, 10) }),
            Version: "4.0",
            Fecha: fechaFormateada,

            FormaPago: receptor.FormaPago,
            Serie: emisor.Serie,
            SubTotal: subtotal,
            CondicionesDePago: "Condiciones De Pago",
            TipoDeComprobante: emisor.TipoComprobante,
            Descripcion: "",
            Moneda: emisor.Divisa || "MXN",
            TipoCambio: "1",
            Total: total,

            Exportacion: "01",
            MetodoPago: receptor.MetodoPago,

            LugarExpedicion: emisor.LugarExpedicion,
            Confirmacion: "",
            //Checar
            InformacionGlobal: {
                Año: receptor.Año || "",
                Meses: receptor.Meses || "",
                Periodicidad: receptor.Periodicidad || "",

            },
            EmisorID: emisor.Emisor,
            ReceptorID: receptor.Receptor,
            UsoCFDI: receptor.UsoCFDI,
            Conceptos: {
                ListaConceptos: conceptos.map(concepto => ({
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
                    Impuestos: {
                        Retenciones: concepto.Retenciones ? concepto.Retenciones.map(retencion => ({
                            Base: retencion.BaseImpuesto,
                            ImpuestoCatalogoID: retencion.Impuesto,
                            ImpuestoClave: String(retencion.ImpuestoClave),
                            TipoFactor: "Tasa",
                            TasaOCuota: retencion.TasaOCuota,
                            TasaCatalogoID: retencion.Tasa,
                            Importe: retencion.Monto
                        })) : [],
                        Traslados: concepto.Traslados ? concepto.Traslados.map(traslado => ({
                            Base: traslado.BaseImpuesto,
                            ImpuestoCatalogoID: traslado.Impuesto,
                            ImpuestoClave: String(traslado.ImpuestoClave),
                            TipoFactor: "Tasa",
                            TasaOCuota: traslado.TasaOCuota,
                            TasaCatalogoID: traslado.Tasa,
                            Importe: traslado.Monto
                        })) : []
                    }
                })),


                TotalImpuestosTrasladados: TotalTraslados,
                //Aqui restar
                TotalImpuestosRetenidos: TotalRetenciones

            }
        };
    }
    else if (modo == "VistaPrevia") {
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
            TipoDeComprobante: "I",
            Exportacion: "01",
            MetodoPago: receptor.MetodoPago,
            MetodoPagoDescripcion: receptor.MetodoPagoDescripcion,
            LugarExpedicion: emisor.LugarExpedicion,
            Confirmacion: "",
            InformacionGlobal: {
                Periodicidad: "01",
                Meses: "01",
                Año: "2024"
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
            // ReceptorID: receptor.Receptor,
            // ReceptorNombre: receptor.NombreReceptor,
            // ReceptorRFC: receptor.RFCReceptor,
            // ReceptorRegimenFiscal: receptor.RegimenFiscal,
            // ReceptorDireccion: receptor.Calle + " # " + receptor.NoExterior + "," + receptor.Colonia + "," + receptor.Municipio + "," + receptor.Estado,
            // ReceptorUsoCFDI: receptor.UsoCFDI,
            // ReceptorUsoCFDIDescripcion: receptor.UsoCFDIDescripcion,
            Conceptos: {
                ListaConceptos: conceptos.map(concepto => ({
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
                        Retenciones: concepto.Retenciones ? concepto.Retenciones.map(retencion => ({
                            NombreImpuesto: retencion.NombreImpuesto,
                            Base: retencion.BaseImpuesto,
                            ImpuestoClave: String(retencion.Impuesto),
                            TipoFactor: retencion.Tipo,
                            TasaOCuota: retencion.Tasa,
                            Importe: retencion.Monto
                        })) : [],
                        Traslados: concepto.Traslados ? concepto.Traslados.map(traslado => ({
                            NombreImpuesto: traslado.NombreImpuesto,
                            Base: traslado.BaseImpuesto,
                            ImpuestoClave: String(traslado.Impuesto),
                            TipoFactor: traslado.Tipo,
                            TasaOCuota: traslado.Tasa,
                            Importe: traslado.Monto
                        })) : []
                    }
                })),
                TotalImpuestosTrasladados: TotalTraslados,
                //Aqui restar
                TotalImpuestosRetenidos: TotalRetenciones,
                GrupoID: 1
            }
        };
    }
    else if (modo === "Pago") {
        factura = {
            Version: "4.0",
            Serie: 'P',
            Fecha: fechaFormateada,
            LugarExpedicion: emisor.LugarExpedicion,
            FormaPago: receptor.FormaPago,
            Moneda: emisor.Divisa || "MXN",
            TipoDeComprobante: 'P',
            UsoCFDI: receptor.UsoCFDI,
            Exportacion: "01",
            Descripcion: '',
            Subtotal: 0,
            Total: 0,
            EmisorID: emisor.Emisor,
            ReceptorID: receptor.Receptor,
            Conceptos: {
                ListaConceptos: conceptos.map(concepto => ({
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
                        TotalRetencionesIVA: emisor.Totales.TotalRetencionesIVA || 0,
                        TotalRetencionesISR: emisor.Totales.TotalRetencionesISR || 0,
                        TotalRetencionesIEPS: emisor.Totales.TotalRetencionesIEPS || 0,
                        TotalTrasladosBaseIVA16: (emisor.Totales.TotalTrasladosImpuestoIVA16) * 100 / 16 || 0,
                        TotalTrasladosImpuestoIVA16: emisor.Totales.TotalTrasladosImpuestoIVA16 || 0,
                        TotalTrasladosBaseIVA8: (emisor.Totales.TotalTrasladosImpuestoIVA8) * 100 / 8 || 0,
                        TotalTrasladosImpuestoIVA8: emisor.Totales.TotalTrasladosImpuestoIVA8 || 0,
                        TotalTrasladosBaseIVA0: emisor.Totales.TotalTrasladosBaseIVA0 || 0,
                        TotalTrasladosImpuestoIVA0: emisor.Totales.TotalTrasladosImpuestoIVA0 || 0,
                        TotalTrasladosBaseIVAExento: emisor.Totales.TotalTrasladosBaseIVAExento || 0,
                        TotalTrasladosImpuestoIVAExento: emisor.Totales.TotalTrasladosImpuestoIVAExento || 0,
                        montoTotalPagos: emisor.Totales.TotalTrasladosImpuestoIVA16

                    },
                    Pagos: [
                        {
                            FechaPago: fechaFormateada,
                            FormaPagoP: receptor.FormaPagoComprobante,
                            Moneda: "MXN",
                            TipoCambioP: "1",
                            Monto: receptor.Monto,
                            DoctoRelacionado: [{
                                IdDocumento: receptor.IdDocumento,
                                Serie: emisor.Serie,
                                Folio: 1,
                                MonedaDR: "MXN",
                                EquivalenciaDR: 1,
                                Numparcialidad: emisor.NumeroOperacion,
                                ImpSaldoAnt: emisor.SaldoAnterior,
                                ImpPagado: receptor.Monto,
                                ImpSaldoInsoluto:emisor.SaldoAnterior - receptor.Monto,
                                ObjetoImpDr: "02",
                            }],
                            Impuestos: {
        
                                Retenciones: emisor.ImpuestosPagos
                                    .filter(retencion => retencion.TipoImpuesto === "Retencion") // Filtrar primero las retenciones
                                    .map(retencion => ({
                                        Base: retencion.Base,
                                        ImpuestoCatalogoID: retencion.ImpuestoCatalogoID,
                                        ImpuestoClave: retencion.ImpuestoClave,
                                       
                                        TasaOCuota: retencion.TasaOCuota,
                                        Importe: retencion.Importe
                                    })),
                                Traslados: emisor.ImpuestosPagos
                                    .filter(traslado => traslado.TipoImpuesto === "Traslado") // Filtrar primero los traslados
                                    .map(traslado => ({
                                        Base: traslado.Base,
                                        ImpuestoCatalogoID: traslado.ImpuestoCatalogoID,
                                        ImpuestoClave: traslado.ImpuestoClave,
                              
                                        TasaOCuota: traslado.TasaOCuota,
                                        Importe: traslado.Importe
                                    }))
        
        
                            }
        
                        }
                    ]
                }
            },
           

        };

    }
    console.log("Resultado de la factura", factura);
    return factura;
}