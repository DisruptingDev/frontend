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

                // Validar que la factura esté timbrada antes de enviar
                if (!factura.estaTimbrado) {
                    console.warn("Se intentó guardar una factura no timbrada, se omitirá:", factura);
                    continue;
                }

                const endpoint = `${apiUrl}/api/facturas/GuardarFacturaTimbrada`;

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
                } else {
                    const errorData = await response.json();
                    console.error("Error al guardar la factura timbrada:", errorData);
                    alert(`Error al guardar factura timbrada: ${errorData.error || "Error desconocido"}`);
                }

                if (exito > 0) {
                    setConfirmationMessage(`Se importó la factura ${factura.UUID} timbrada correctamente.`);
                    setOpenModalExito(true);
                    // Redirigir después de mostrar el modal
                    setTimeout(() => {
                        router.push("/Home");
                    }, 2000);
                }
            }
        } catch (error) {
            console.error("Error en guardarFacturasTimbradas:", error);
            setConfirmationMessage("Error de conexión al guardar las facturas timbradas");
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
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