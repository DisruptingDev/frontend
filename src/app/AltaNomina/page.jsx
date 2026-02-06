"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid } from "@mui/material";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import ModalNomina from "@/components/FacturasMasivas/ModalNomina";
import modal from "@/components/FacturasMasivas/Modal";
import ModalError from "@/components/Home/Modales/modalError";
import VistaNominasImportadas from "@/components/FacturasMasivas/VistaNominasImportadas";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import Select from "@/components/Select/Select.jsx";
export default function ImportarFacturas() {
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [nominas, setNominas] = useState([]);
    const [selectedEmisor, setSelectedEmisor] = useState(null);

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

    const handleGuardarNominas = async () => {
        console.log(nominas);

        // Función para validar si un objeto contiene errores
        const hasError = (obj) => {
            if (!obj) return false;
            return Object.keys(obj).some((key) => key.includes("Error") && obj[key] === "record not found");
        };

        // Validar cuántas nóminas tienen errores
        const nominasConErrores = nominas.filter((nomina) => {
            // Adjust validation based on Nomina structure
            // Assuming errors can be at root or specific children
            return (
                hasError(nomina) ||
                hasError(nomina.Receptor) ||
                hasError(nomina.Nomina)
            );
        });

        // Validar cuántas nóminas no tienen errores
        const nominasSinErrores = nominas.filter((nomina) => {
            return !(
                hasError(nomina) ||
                hasError(nomina.Receptor) ||
                hasError(nomina.Nomina)
            );
        });

        console.log("Con errores:", nominasConErrores);
        console.log("Sin errores:", nominasSinErrores);

        if (nominasConErrores.length === nominas.length) {
            console.log("Todas las nóminas contienen errores");
            setOpenModalError(true);
            setConfirmationMessage("Todas las nóminas contienen errores");
            return;
        }

        if (nominasConErrores.length > 0) {
            console.log("Hay nóminas con errores");
            // Optional: Alert user that only valid ones will be uploaded or block
            // For now, let's proceed with valid ones or ask confirmation (skipping confirmation for speed unless requested)
            // setOpenModalError(true);
            // setConfirmationMessage("Hay registros con errores. Solo se procesarán los correctos.");
            // return; // Uncomment to block
        }

        if (nominasSinErrores.length === 0) return;

        try {
            // iterate and save specifically or batch?
            // The endpoint /ComplementoNomina likely accepts a single object or list.
            // "guardara los datos" usually implies batch if previous was batch. 
            // However, typical API designs might be per item. 
            // Let's assume batch for list endpoint or iterative. 
            // Given "CargaMasiva" context, usually it sends the whole list.
            // Let's try sending the array of valid nominas.

            const response = await fetch(`${apiUrl}/api/facturas/Facturas/ComplementoNomina`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nominasSinErrores),
            });

            if (response.ok) {
                alert("Nóminas guardadas correctamente");
                setNominas([]);
                // Reload or redirect?
            } else {
                const errorData = await response.json();
                console.error("Error saving nominas:", errorData);
                alert("Error al guardar las nóminas");
            }

        } catch (error) {
            console.error("Error network:", error);
            alert("Error de conexión");
        }
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
                        <Box display="flex" flexDirection="column" gap={2} mb={2}>
                            <Box sx={{ maxWidth: 400 }}>
                                <Select
                                    label="Seleccionar Emisor"
                                    url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                                    id="ID"
                                    descripcion="Nombre"
                                    onChange={(e) => {
                                        if (e.target.value) {
                                            setSelectedEmisor(JSON.parse(e.target.value));
                                        } else {
                                            setSelectedEmisor(null);
                                        }
                                    }}
                                    value={selectedEmisor?.ID || ""}
                                />
                            </Box>
                            <Box display="flex" justifyContent="flex-end" gap={2}>
                                <Button
                                    variant="contained"
                                    disabled={!selectedEmisor}
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
                                    disabled={!selectedEmisor}
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
                        </Box>
                        <VistaNominasImportadas facturasRecuperadas={nominas} token={token} actualizarFacturas={setNominas} />
                        <ModalNomina
                            token={token}
                            open={openModal}
                            handleClose={handleCloseModal}
                            handleUpload={setNominas}
                            additionalData={{ EmisorID: selectedEmisor?.ID }}
                        />
                        <ModalError openModalError={openModalError} handleCloseModal={handleCloseModalError} confirmationMessage={confirmationMessage} />
                        {nominas.length > 0 &&
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    }}
                                    onClick={handleGuardarNominas}
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