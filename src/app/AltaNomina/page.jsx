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

    const [loading, setLoading] = useState(false);
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
        // Función para validar si un objeto contiene errores
        const hasError = (obj) => {
            if (!obj) return false;
            return Object.keys(obj).some((key) => key.includes("Error") && obj[key] === "record not found");
        };

        const nominasConErrores = nominas.filter((nomina) =>
            hasError(nomina) || hasError(nomina.Receptor) || hasError(nomina.Nomina)
        );
        const nominasSinErrores = nominas.filter((nomina) =>
            !hasError(nomina) && !hasError(nomina.Receptor) && !hasError(nomina.Nomina)
        );

        if (nominasConErrores.length === nominas.length) {
            setOpenModalError(true);
            setConfirmationMessage("Todas las nóminas contienen errores");
            return;
        }

        if (nominasSinErrores.length === 0) return;

        setLoading(true);
        let exito = 0;

        try {
            for (const nomina of nominasSinErrores) {
                console.log("📤 Enviando nómina a ComplementoNomina:", JSON.stringify(nomina, null, 2));
                const response = await fetch(`${apiUrl}/api/facturas/ComplementoNomina`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(nomina),
                });

                if (response.ok) {
                    exito++;
                } else {
                    const text = await response.text();
                    console.error(`Error al guardar nómina (${response.status}):`, text);
                }
            }

            setConfirmationMessage(`Se guardaron ${exito} de ${nominasSinErrores.length} nóminas con éxito`);
            setOpenModalError(true);
            if (exito > 0) setNominas([]);

        } catch (error) {
            console.error("Error de red:", error);
            setConfirmationMessage("Error de conexión al guardar las nóminas");
            setOpenModalError(true);
        } finally {
            setLoading(false);
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
                                    disabled={loading}
                                    sx={{
                                        backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                    }}
                                    onClick={handleGuardarNominas}
                                >
                                    {loading ? "Procesando..." : "Importar"}
                                </Button>
                            </Box>
                        }
                    </Box>
                </Grid>
            </Grid>
        </div>
    )
}