"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Grid } from "@mui/material";
import ModalXML from "@/components/ImportarXML/ModalXML";
import ModalFacturasError from "@/components/FacturasMasivas/Modal";
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";
import VistaFacturasImportadas from "@/components/FacturasMasivas/VistaFacturasImportadas";
import VistaXMLImportado from "@/components/ImportarXML/VistaXMLImportado";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { formatearFacturaXML, formatearFacturaXMLSimple } from "@/components/ImportarXML/FormatearXML.js";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImportarFacturas() {
    const router = useRouter();
    const [openModal, setOpenModal] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalFacturasError, setOpenModalFacturasError] = useState(false);
    const [respuestaModal, setRespuestaModal] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [facturas, setFacturas] = useState([]);
    const [facturaXML, setFacturaXML] = useState(null);
    const [facturasSinErrores, setFacturasSinErrores] = useState([]);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [modoImportacion, setModoImportacion] = useState("masiva");

    // Función para manejar la carga de XML
    const handleUploadXML = (result) => {
        console.log("Resultado XML:", result);

        if (result.success) {
            let facturaFormateada;

            // ✅ Usar la función con detección de timbrado si tenemos el XML original
            if (result.xmlContentOriginal) {
                facturaFormateada = formatearFacturaXML(result.data, result.xmlContentOriginal);
            } else {
                // ✅ Usar la función simple si no tenemos el XML original
                facturaFormateada = formatearFacturaXMLSimple(result.data);
            }

            // ✅ Validar que la factura esté timbrada
            if (!facturaFormateada.estaTimbrado) {
                setConfirmationMessage("❌ Error: Solo se pueden importar facturas timbradas. Este XML no contiene información de timbrado.");
                setOpenModalError(true);
                return;
            }

            setFacturaXML(facturaFormateada);
            setModoImportacion("xml");
            setFacturas([facturaFormateada]);

            // ✅ Mostrar mensaje de éxito para XML timbrado
            setConfirmationMessage(`✅ XML timbrado importado. UUID: ${facturaFormateada.infoTimbrado?.UUID}`);
            setOpenModalExito(true);
        } else {
            setConfirmationMessage(`❌ Errores en XML:\n${result.errors.join('\n')}`);
            setOpenModalError(true);
        }
    };

    // Función para actualizar las facturas
    const actualizarFacturas = (nuevasFacturas) => {
        setFacturas(nuevasFacturas);
        if (nuevasFacturas.length > 0 && nuevasFacturas[0]?.Version) {
            // Si tiene estructura de XML, mantener modo XML
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
                console.log("📦 Procesando factura timbrada:", factura);

                // ✅ Validar que la factura esté timbrada antes de enviar
                if (!factura.estaTimbrado) {
                    console.warn("⚠️ Se intentó guardar una factura no timbrada, se omitirá:", factura);
                    continue;
                }

                const endpoint = `${apiUrl}/api/facturas/GuardarFacturaTimbrada`;
                console.log(`📤 Enviando a: ${endpoint}`);

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(factura),
                });

                if (response.ok) {
                    exito++;
                    console.log("✅ Factura timbrada guardada exitosamente");
                } else {
                    const errorData = await response.json();
                    console.error("❌ Error al guardar la factura timbrada:", errorData);
                    alert(`Error al guardar factura timbrada: ${errorData.error || "Error desconocido"}`);
                }
            }

            if (exito > 0) {
                setConfirmationMessage(`✅ Se importaron ${exito} facturas timbradas con éxito`);
                setOpenModalExito(true);
                setTimeout(() => {
                    router.push("/Home");
                }, 2000);
            } else {
                setConfirmationMessage("❌ No se pudo importar ninguna factura timbrada");
                setOpenModalError(true);
            }
        } catch (error) {
            console.error("Error en guardarFacturasTimbradas:", error);
            setConfirmationMessage("❌ Error de conexión al guardar las facturas timbradas");
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarFacturas = async () => {
        if (modoImportacion === "xml" && facturaXML) {
            // ✅ Validar que la factura XML esté timbrada
            if (!facturaXML.estaTimbrado) {
                setConfirmationMessage("❌ Error: Solo se pueden importar facturas timbradas. Esta factura no contiene información de timbrado.");
                setOpenModalError(true);
                return;
            }
            await guardarFacturasTimbradas([facturaXML]);
        } else {
            // ✅ Para facturas masivas, también validar que estén timbradas
            const facturasTimbradas = facturas.filter(factura => factura.estaTimbrado);
            const facturasNoTimbradas = facturas.filter(factura => !factura.estaTimbrado);

            if (facturasTimbradas.length === 0) {
                setConfirmationMessage("❌ No hay facturas timbradas para importar. Solo se permiten facturas timbradas.");
                setOpenModalError(true);
                return;
            }

            if (facturasNoTimbradas.length > 0) {
                console.warn(`⚠️ Se omitirán ${facturasNoTimbradas.length} facturas no timbradas`);
            }

            // ✅ Solo procesar las facturas timbradas
            await guardarFacturasTimbradas(facturasTimbradas);
        }
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid>
                    <Box
                        bgcolor="white"
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
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

                        <ModalError openModalError={openModalError} handleCloseModal={handleCloseModalError} confirmationMessage={confirmationMessage} />

                        {(facturas.length > 0 || facturaXML) && (
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Button
                                    variant="contained"
                                    sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                                    onClick={handleGuardarFacturas}
                                    disabled={loading}
                                >
                                    {loading ? "Procesando..." : "Importar Facturas Timbradas"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}