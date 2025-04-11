"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid } from "@mui/material";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import ModalCSV from "@/components/FacturasMasivas/ModalCSV";
import modal from "@/components/FacturasMasivas/Modal";
import ModalError from "@/components/Home/Modales/modalError";
import VistaFacturasImportadas from "@/components/FacturasMasivas/VistaFacturasImportadas";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
export default function ImportarFacturas() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [facturas, setFacturas] = useState([]);

    const [token, setToken] = useState("");
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
        }
    }, [router]);

    const handleOpenModal = () => {
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
    };
    const handleCloseModalError = () => {
        setOpenModalError(false);
    };

    const handleDescargarPlantilla = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/cargamasivafacturas/DescargarCSV`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },

            });
            if (response.ok) {
                const blob = await response.blob();
                const link = document.createElement('a');
                link.href = URL.createObjectURL(blob);
                link.download = "Plantilla_Factura_Masiva.csv";
                link.click();
            }

        } catch (error) {
            console.error(error);

        }
    };

    const handleGuardarFacturas = () => {
        console.log(facturas);

        // Función para validar si un objeto contiene errores
        const hasError = (obj) => {
            return Object.keys(obj).some((key) => key.includes("Error") && obj[key] === "record not found");
        };

        // Validar cuántas facturas tienen errores
        const facturasConErrores = facturas.filter((factura) => {
            return (
                hasError(factura.Concepto) ||
                hasError(factura.Emisor) ||
                hasError(factura.Impuesto) ||
                hasError(factura.Receptor)
            );
        });
        // Validar cuántas facturas no tienen errores
        const facturasSinErrores = facturas.filter((factura) => {
            return !hasError(factura.Concepto) && !hasError(factura.Emisor) && !hasError(factura.Impuesto) && !hasError(factura.Receptor);
        });
        console.log(facturasConErrores);
        console.log(facturasSinErrores);
        if (facturasConErrores.length === facturas.length) {
            console.log("Todas las facturas contienen errores");
            setOpenModalError(true);
            setConfirmationMessage("Todas las facturas contienen errores");
            // Mostrar modal con un mensaje de error

        }
        else {
            if (facturasConErrores.length > 0) {
                console.log("Hay facturas con errores");
                // Mostrar modal con las facturas con errores

            }
        }

        // Aquí podrías llamar a tu API para subir las facturas con errores y sin errores

    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid >
                    <SideBarMenu />
                </Grid>
                <Grid >
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
                                sx={{
                                    backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',

                                }}
                                onClick={handleOpenModal}

                            >
                                Importar Nóminas
                            </Button>
                            <Button
                                variant="contained"
                                sx={{
                                    backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    display: 'flex',
                                    justifyContent: 'center',
                                    alignItems: 'center',

                                }}
                                onClick={handleDescargarPlantilla}
                            >
                                Descargar Plantilla
                            </Button>
                        </Box>
                        <VistaFacturasImportadas facturasRecuperadas={facturas} token={token} />
                        <ModalCSV token={token} open={openModal} handleClose={handleCloseModal} handleUpload={setFacturas} />
                        <ModalError openModalError={openModalError} handleCloseModal={handleCloseModalError} confirmationMessage={confirmationMessage} />
                        {facturas.length > 0 &&
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    }}
                                    onClick={handleGuardarFacturas}
                                >
                                    Importar
                                </Button>
                            </Box>
                        }
                    </Box>
                </Grid>
            </Grid>
        </div>
    )
}