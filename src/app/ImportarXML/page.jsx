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

            setFacturaXML(facturaFormateada);
            setModoImportacion("xml");
            setFacturas([facturaFormateada]);

            // ✅ Mostrar mensaje diferente si ya está timbrado
            if (facturaFormateada.estaTimbrado) {
                setConfirmationMessage(`✅ XML timbrado importado. UUID: ${facturaFormateada.infoTimbrado?.UUID}`);
            } else {
                setConfirmationMessage("✅ XML validado correctamente - Listo para timbrar");
            }

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

    // Guardar facturas
    const guardarFacturas = async (facturasAGuardar) => {
        setLoading(true);
        let exito = 0;

        try {
            for (const factura of facturasAGuardar) {
                console.log("📦 Procesando factura:", factura);

                // ✅ Determinar el endpoint según si está timbrada o no
                const endpoint = factura.estaTimbrado ?
                    `${apiUrl}/api/facturas/GuardarFacturaTimbrada` : // Endpoint para facturas timbradas
                    `${apiUrl}/api/facturas/GuardarFactura`;         // Endpoint para facturas por timbrar

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
                    console.log("✅ Factura guardada exitosamente");
                } else {
                    const errorData = await response.json();
                    console.error("❌ Error al guardar la factura:", errorData);

                    // Mensaje específico según el tipo de factura
                    const tipoFactura = factura.estaTimbrado ? "timbrada" : "por timbrar";
                    alert(`Error al guardar factura ${tipoFactura}: ${errorData.error || "Error desconocido"}`);
                }
            }

            if (exito > 0) {
                const mensaje = facturasAGuardar[0]?.estaTimbrado ?
                    `Se importaron ${exito} facturas timbradas con éxito` :
                    `Se guardaron ${exito} facturas listas para timbrar`;

                setConfirmationMessage(mensaje);
                setOpenModalExito(true);
                setTimeout(() => {
                    router.push("/Home");
                }, 2000);
            }
        } catch (error) {
            console.error("Error en guardarFacturas:", error);
            setConfirmationMessage("Error de conexión al guardar las facturas");
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarFacturas = async () => {
        if (modoImportacion === "xml" && facturaXML) {
            // ✅ Guardar directamente factura_completa sin formatear
            await guardarFacturas([facturaXML]);
        } else {
            // Lógica original para facturas masivas (si aplica)
            const hasError = (obj) => Object.keys(obj).some((key) => key.includes("Error") && obj[key] === "record not found");

            const facturasConErrores = facturas.filter((factura) =>
                hasError(factura.Concepto) || hasError(factura.Emisor) || hasError(factura.Impuesto) || hasError(factura.Receptor)
            );

            const facturasSinErrores = facturas.filter((factura) =>
                !hasError(factura.Concepto) && !hasError(factura.Emisor) && !hasError(factura.Impuesto) && !hasError(factura.Receptor)
            );

            if (facturasConErrores.length === facturas.length) {
                setOpenModalError(true);
                setConfirmationMessage("Todas las facturas contienen errores");
            } else if (facturasConErrores.length > 0) {
                setFacturasSinErrores(facturasSinErrores);
                setOpenModalFacturasError(true);
                setConfirmationMessage(`Hay ${facturasConErrores.length} facturas con errores`);
            } else {
                // Para facturas masivas, usar la lógica existente
                await guardarFacturas(facturasSinErrores);
            }
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
                                Importar XML
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
                                    {loading ? "Procesando..." : "Importar"}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}