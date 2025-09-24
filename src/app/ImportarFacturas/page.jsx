"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Grid } from "@mui/material";
import ModalCSV from "@/components/FacturasMasivas/ModalCSV";
import ModalExito from "@/components/Home/Modales/modalExito";
import ModalFacturasError from "@/components/FacturasMasivas/Modal";
import VistaFacturasImportadas from "@/components/FacturasMasivas/VistaFacturasImportadas";
import FormatearFactura from "@/components/FacturasMasivas/FormatearFactura";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImportarFacturas() {
    const router = useRouter();
    const [openModal, setOpenModal] = useState(false);
    const [openModalSuccess, setOpenModalSuccess] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [respuestaModal, setRespuestaModal] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [facturas, setFacturas] = useState([]);
    const [facturasSinErrores, setFacturasSinErrores] = useState([]);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const [openModalFacturasError, setOpenModalFacturasError] = useState(false);
    const [facturasConErrores, setFacturasConErrores] = useState([]);

    // Función para actualizar las facturas
    const actualizarFacturas = (nuevasFacturas) => {
        setFacturas(nuevasFacturas); // Actualiza el estado de las facturas
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
    const handleCloseModalSuccess = () => setOpenModalSuccess(false);

    const handleDescargarPlantilla = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/cargamasivafacturas/DescargarCSV`, {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = "Plantilla_Factura_Masiva.xlsx";
                link.click();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const guardarFacturas = async (facturasAGuardar) => {
        setLoading(true);
        let exito = 0;

        console.log("Facturas a guardar:", facturasAGuardar);

        try {
            for (const factura of facturasAGuardar) {
                const response = await fetch(`${apiUrl}/api/facturas/GuardarFactura`, {
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
                    console.error("Error al guardar la factura");
                }
            }

            setConfirmationMessage(`Se guardaron ${exito} facturas con éxito`);
            setOpenModalSuccess(true);
            setTimeout(() => {
                router.push("/Home");
            }, 2000);
        } catch (error) {
            console.error(error);
            setConfirmationMessage("Ocurrió un error al guardar las facturas");
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleGuardarFacturas = async () => {
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
            // Guardamos las facturas con errores y sin errores en estados
            setFacturasConErrores(facturasConErrores);
            setFacturasSinErrores(facturasSinErrores);
            setOpenModalFacturasError(true);
            setConfirmationMessage(`Hay ${facturasConErrores.length} facturas con errores. ¿Deseas continuar con las ${facturasSinErrores.length} facturas válidas?`);
        } else {
            const facturasFormateadas = facturasSinErrores.map((factura) => FormatearFactura([factura]));
            await guardarFacturas(facturasFormateadas);
        }
    };

    // Función para manejar la aceptación de continuar con facturas válidas
    const handleAcceptWithValidInvoices = () => {
        setOpenModalFacturasError(false);
        // Filtrar solo las facturas sin errores para mostrar en la tabla
        setFacturas(facturasSinErrores);

        // Guardar las facturas válidas
        const facturasFormateadas = facturasSinErrores.map((factura) => FormatearFactura([factura]));
        guardarFacturas(facturasFormateadas);
    };

    // Función para manejar el cancelar (volver a la lista)
    const handleCancelAndReturn = () => {
        setOpenModalFacturasError(false);
        // Mantener todas las facturas (con y sin errores) en la tabla
        // El usuario puede ver y corregir las que tienen errores
    };

    useEffect(() => {
        if (respuestaModal && facturasSinErrores.length > 0) {
            const facturasFormateadas = facturasSinErrores.map((factura) => FormatearFactura([factura]));
            guardarFacturas(facturasFormateadas);
            setRespuestaModal(false);
        }
    }, [respuestaModal, facturasSinErrores]);

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid   >
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
                                Importar Facturas
                            </Button>
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                                onClick={handleDescargarPlantilla}
                            >
                                Descargar Plantilla
                            </Button>
                        </Box>
                        <VistaFacturasImportadas facturasRecuperadas={facturas} token={token} actualizarFacturas={actualizarFacturas} />
                        <ModalCSV token={token} open={openModal} handleClose={handleCloseModal} handleUpload={setFacturas} />
                        <ModalFacturasError
                            openModalError={openModalFacturasError}
                            handleCloseModal={handleCancelAndReturn}
                            handleAccept={handleAcceptWithValidInvoices}
                            confirmationMessage={confirmationMessage}
                        />
                        <ModalExito
                            openModalSuccess={openModalSuccess}
                            handleCloseModal={handleCloseModalSuccess}
                            confirmationMessage={confirmationMessage}
                        />
                        {facturas.length > 0 && (
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