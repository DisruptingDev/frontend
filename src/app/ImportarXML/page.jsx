"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Grid } from "@mui/material";
import ModalXML from "@/components/ImportarXML/ModalXML";
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";
import VistaXMLImportado from "@/components/ImportarXML/VistaXMLImportado";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { formatearFacturaXML, formatearFacturaXMLSimple } from "@/components/ImportarXML/FormatearXML.js";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImportarFacturas() {
    const router = useRouter();
    const [openModal, setOpenModal] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [facturas, setFacturas] = useState([]);
    const [facturaXML, setFacturaXML] = useState(null);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [modoImportacion, setModoImportacion] = useState("masiva");
    const handleCloseModalExito = () => setOpenModalExito(false);

    // Función para manejar la carga de XML
    const handleUploadXML = (result) => {
        try {
            if (!result) {
                setConfirmationMessage("No se recibió respuesta del servidor al cargar el XML.");
                setOpenModalError(true);
                return;
            }

            if (!result.success) {
                const errores = result.errors?.join("\n") || "Error desconocido en el XML.";
                setConfirmationMessage(`Errores en XML:\n${errores}`);
                setOpenModalError(true);
                return;
            }

            let facturaFormateada = null;


            if (result.success) {
                facturaFormateada = formatearFacturaXML(result.data, result.xmlContentOriginal);
            } else {
                facturaFormateada = formatearFacturaXMLSimple(result.data);
            }

            // Proteger en caso de que venga null o vacío
            if (!facturaFormateada || typeof facturaFormateada !== "object") {
                setConfirmationMessage("Error: No se pudo procesar la factura XML correctamente.");
                setOpenModalError(true);
                return;
            }

            // Doble verificación de timbrado (por si el formateador aún no lo detecta)
            const estaTimbrado =
                facturaFormateada?.estaTimbrado === true ||
                result?.data?.factura_completa?.validaciones?.timbre_valido === true ||
                !!result?.data?.factura_completa?.timbre?.UUID;

            if (!estaTimbrado) {
                setConfirmationMessage(
                    "Error: Solo se pueden importar facturas timbradas. Este XML no contiene información de timbrado."
                );
                setOpenModalError(true);
                return;
            }

            // Guardar factura en estado y mostrar éxito
            setFacturaXML({
                ...facturaFormateada,
                estaTimbrado: true,
                infoTimbrado: facturaFormateada.infoTimbrado || result?.data?.factura_completa?.timbre || {},
            });

            setModoImportacion("xml");
            setConfirmationMessage(`XML validado correctamente. UUID: ${facturaFormateada?.infoTimbrado?.UUID || "Desconocido"}`);
            setOpenModalExito(true);
        } catch (error) {
            console.error("Error en handleUploadXML:", error);
            setConfirmationMessage("Error inesperado al procesar el XML.");
            setOpenModalError(true);
        }
    };


    // Función para actualizar las facturas (si aún la necesitas)
    const actualizarFacturas = (nuevasFacturas) => {
        // Si quieres mantener compatibilidad con el modo masivo
        setFacturas(nuevasFacturas);
        if (nuevasFacturas.length > 0 && nuevasFacturas[0]?.Version) {
            setModoImportacion("xml");
            setFacturaXML(nuevasFacturas[0]);
        } else {
            setModoImportacion("masiva");
            setFacturaXML(null);
        }
    };

    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
        }
    }, [router]);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);
    const handleCloseModalError = () => setOpenModalError(false);

    // Guardar facturas timbradas
    const guardarFacturasTimbradas = async (facturasAGuardar) => {
    setLoading(true);
    let exito = 0;

    try {
        for (const factura of facturasAGuardar) {
            if (!factura.estaTimbrado) {
                console.warn("Se intentó guardar una factura no timbrada, se omitirá:", factura);
                continue;
            }

            const endpoint = factura.es_complemento_pago 
                ? `${apiUrl}/api/facturas/GuardarFactura`
                : `${apiUrl}/api/facturas/GuardarFacturaTimbrada`;

            // Preparar datos según el tipo
            let datosEnvio;
            if (factura.es_complemento_pago) {
                datosEnvio = prepararComplementoPago(factura);
            } else {
                datosEnvio = prepararFacturaNormal(factura);
            }

            console.log("Datos a enviar:", datosEnvio);

            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(datosEnvio),
            });

            if (response.ok) {
                exito++;
            } else {
                const errorData = await response.json();
                console.error("Error al guardar:", errorData);
                alert(`Error: ${errorData.error || "Error desconocido"}`);
            }
        }

        if (exito > 0) {
            const tipo = facturasAGuardar[0]?.es_complemento_pago ? "complemento de pago" : "factura";
            setConfirmationMessage(`Se importó el ${tipo} timbrado correctamente.`);
            setOpenModalExito(true);
            setTimeout(() => router.push("/Home"), 2000);
        }
    } catch (error) {
        console.error("Error:", error);
        setConfirmationMessage("Error de conexión");
        setOpenModalError(true);
    } finally {
        setLoading(false);
    }
};

// Función específica para complementos de pago
const prepararComplementoPago = (factura) => {
    // Clonar y convertir tipos
    const datos = JSON.parse(JSON.stringify(factura));
    
    // 1. Convertir campos numéricos (soluciona errores anteriores)
    if (datos.Complemento?.Pagos?.Pagos) {
        datos.Complemento.Pagos.Pagos.forEach(pago => {
            if (pago.DoctosRelacionados) {
                pago.DoctosRelacionados.forEach(docto => {
                    // NumParcialidad: string → uint32
                    if (docto.NumParcialidad) {
                        docto.NumParcialidad = parseInt(docto.NumParcialidad) || 1;
                    }
                    // Campos numéricos
                    if (docto.ImpSaldoAnt) docto.ImpSaldoAnt = parseFloat(docto.ImpSaldoAnt);
                    if (docto.ImpPagado) docto.ImpPagado = parseFloat(docto.ImpPagado);
                    if (docto.ImpSaldoInsoluto) docto.ImpSaldoInsoluto = parseFloat(docto.ImpSaldoInsoluto);
                });
            }
            
            // Convertir impuestos
            if (pago.Impuestos) {
                if (pago.Impuestos.Traslados) {
                    pago.Impuestos.Traslados.forEach(tras => {
                        if (tras.ImpuestoCatalogoID) tras.ImpuestoCatalogoID = parseInt(tras.ImpuestoCatalogoID) || 0;
                        if (tras.TasaCatalogoID) tras.TasaCatalogoID = parseInt(tras.TasaCatalogoID) || 0;
                        if (tras.Base) tras.Base = parseFloat(tras.Base);
                        if (tras.Importe) tras.Importe = parseFloat(tras.Importe);
                        if (tras.TasaOCuota) tras.TasaOCuota = parseFloat(tras.TasaOCuota);
                    });
                }
                if (pago.Impuestos.Retenciones) {
                    pago.Impuestos.Retenciones.forEach(ret => {
                        if (ret.ImpuestoCatalogoID) ret.ImpuestoCatalogoID = parseInt(ret.ImpuestoCatalogoID) || 0;
                        if (ret.TasaCatalogoID) ret.TasaCatalogoID = parseInt(ret.TasaCatalogoID) || 0;
                        if (ret.Base) ret.Base = parseFloat(ret.Base);
                        if (ret.Importe) ret.Importe = parseFloat(ret.Importe);
                        if (ret.TasaOCuota) ret.TasaOCuota = parseFloat(ret.TasaOCuota);
                    });
                }
            }
        });
    }
    
    // 2. Añadir campos obligatorios para el backend Go
    // Basado en la estructura de ComprobanteRequest que espera el backend
    return {
        // Campos del comprobante
        TipoDeComprobante: datos.TipoDeComprobante || "P",
        Version: datos.Version || "4.0",
        Serie: datos.Serie || "",
        Folio: datos.Folio || "",
        Fecha: datos.Fecha,
        LugarExpedicion: datos.LugarExpedicion || "",
        Moneda: datos.Moneda || "XXX",
        Total: datos.Total || 0,
        SubTotal: datos.SubTotal || 0,
        Descuento: datos.Descuento || 0,
        TipoCambio: datos.TipoCambio || "1",
        Exportacion: datos.Exportacion || "01",
        Confirmacion: datos.Confirmacion || "",
        UsoCFDI: datos.Receptor?.UsoCFDI || "P01", // P01 para complementos
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
            ValorUnitarioString: "0",
            ImporteString: "0",
            DescuentoString: "0",
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
        
        // Campos requeridos (poner valores por defecto)
        FormaPago: datos.FormaPago || "99", // 99 = Por definir (para complementos)
        MetodoPago: datos.MetodoPago || "PUE", // PUE = Pago en una sola exhibición
        
        // IDs ficticios (el backend deberá buscar/crear los registros reales)
        EmisorID: datos.EmisorID || 0, // 0 indica que no está registrado
        ReceptorID: datos.ReceptorID || 0,
        
        // Información del emisor y receptor
        Emisor: datos.Emisor || {
            RFC: datos.Emisor?.RFC || "",
            Nombre: datos.Emisor?.Nombre || ""
        },
        Receptor: datos.Receptor || {
            RFC: datos.Receptor?.RFC || "",
            Nombre: datos.Receptor?.Nombre || "",
            UsoCFDI: datos.Receptor?.UsoCFDI || "P01", // P01 para complementos
            DomicilioFiscalReceptor: datos.Receptor?.DomicilioFiscalReceptor || "",
            RegimenFiscalReceptor: datos.Receptor?.RegimenFiscalReceptor || ""
        },
        
        // Información de timbrado
        UUID: datos.UUID || datos.infoTimbrado?.UUID,
        FechaTimbrado: datos.infoTimbrado?.FechaTimbrado,
        NoCertificadoSAT: datos.infoTimbrado?.NoCertificadoSAT,
        SelloSAT: datos.infoTimbrado?.SelloSAT,
        RfcProvCertif: datos.infoTimbrado?.RfcProvCertif,
        
        // Complemento específico
        es_complemento_pago: true,
        Complemento: datos.Complemento,
        
        // XML original
        xml_content: datos.xmlContent || datos.xmlContentOriginal,
        
        // Campos adicionales para validación
        CondicionesDePago: datos.CondicionesDePago || "",
        Descripcion: datos.Descripcion || "",
        
        // Para búsqueda de factura original
        facturaOriginalUUID: datos.facturaOriginalUUID,
        facturaOriginalSerie: datos.facturaOriginalSerie,
        facturaOriginalFolio: datos.facturaOriginalFolio,
        
        // Validaciones
        validaciones: datos.validaciones || {},
        errores: datos.errores || []
    };
};

// Función para facturas normales (mantener tu lógica actual)
const prepararFacturaNormal = (factura) => {
    // Clonar para no modificar el original
    const datos = JSON.parse(JSON.stringify(factura));
    
    // Asegurar campos obligatorios
    return {
        ...datos,
        FormaPago: datos.FormaPago || "99",
        MetodoPago: datos.MetodoPago || "PUE",
        EmisorID: datos.EmisorID || 0,
        ReceptorID: datos.ReceptorID || 0,
        Emisor: datos.Emisor || {},
        Receptor: datos.Receptor || {},
        UUID: datos.UUID || datos.infoTimbrado?.UUID,
        UsoCFDI: datos.Receptor?.UsoCFDI || "G03",
    };
};

    const handleGuardarFacturas = async () => {
        if (modoImportacion === "xml" && facturaXML) {
            // ✅ Validar que la factura XML esté timbrada
            if (!facturaXML.estaTimbrado) {
                setConfirmationMessage("Error: Solo se pueden importar facturas timbradas. Esta factura no contiene información de timbrado.");
                setOpenModalError(true);
                return;
            }
            await guardarFacturasTimbradas([facturaXML]);
        } else {
            // ✅ Para facturas masivas, también validar que estén timbradas
            const facturasTimbradas = facturas.filter(factura => factura.estaTimbrado);
            const facturasNoTimbradas = facturas.filter(factura => !factura.estaTimbrado);

            if (facturasTimbradas.length === 0) {
                setConfirmationMessage("No hay facturas timbradas para importar. Solo se permiten facturas timbradas.");
                setOpenModalError(true);
                return;
            }

            if (facturasNoTimbradas.length > 0) {
                console.warn(`⚠️ Se omitirán ${facturasNoTimbradas.length} facturas no timbradas`);
            }

            await guardarFacturasTimbradas(facturasTimbradas);
        }
    };

    return (
        <div>
            <Header />
            <Grid container >
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid>
                    <Box
                        bgcolor="white"
                        ml={{ xs: 1, sm: 5, md: 10 }}
                        mr={{ xs: 1, sm: 2, md: 3 }}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                        sx={{
                            width: {
                                xs: '90vw', // móviles
                                sm: '85vw', // tablets
                                md: '80vw', // pantallas medianas
                                lg: '94vw', // pantallas grandes
                            },
                        }}
                    >
                        <Box display="flex" justifyContent="flex-end" mb={2} gap={2} width="100%">
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                                onClick={handleOpenModal}
                            >
                                Importar XML Timbrado
                            </Button>
                        </Box>

                        <VistaXMLImportado
                            facturaXML={facturaXML}
                            token={token}
                            actualizarFacturas={actualizarFacturas}
                        />

                        <ModalXML
                            token={token}
                            open={openModal}
                            handleClose={handleCloseModal}
                            handleUpload={handleUploadXML}
                        />

                        <ModalExito
                            openModalSuccess={openModalExito}
                            handleCloseModal={handleCloseModalExito}
                            confirmationMessage={confirmationMessage}
                        />

                        <ModalError openModalError={openModalError} handleCloseModal={handleCloseModalError} confirmationMessage={confirmationMessage} />

                        {facturaXML && (
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Button
                                    variant="contained"
                                    sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                                    onClick={handleGuardarFacturas}
                                    disabled={loading}
                                >
                                    {loading ? "Procesando..." : "Importar Factura"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </div >
    );
}