"use client"
import { useState, useEffect } from "react";
import {
    Box, Button, Typography, Chip, Stepper, Step, StepLabel,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import PeopleIcon from "@mui/icons-material/People";
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";
import Select from "@/components/Select/Select.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const CARGAR_TRABAJADORES_URL = `${apiUrl}/api/gestores/cargarTrabajadores`;
const RECEPTORES_NOMINA_URL = `${apiUrl}/api/catalogos/Catalogos/ReceptorNomina`;

const PASOS = ["Seleccionar Emisor", "Cargar trabajadores", "Catálogo de trabajadores"];

export default function VistaTrabajadores({ token }) {
    const [loading, setLoading] = useState(false);
    const [loadingTabla, setLoadingTabla] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [selectedEmisor, setSelectedEmisor] = useState(null);
    const [trabajadoresCargados, setTrabajadoresCargados] = useState(false);
    const [archivo, setArchivo] = useState(null);
    const [receptores, setReceptores] = useState([]);

    const pasoActivo = !selectedEmisor ? 0 : !trabajadoresCargados ? 1 : 2;

    // ── Cargar catálogo cuando se selecciona un emisor ──
    useEffect(() => {
        if (!selectedEmisor) {
            setReceptores([]);
            return;
        }
        fetchReceptores();
    }, [selectedEmisor]);

    const fetchReceptores = async () => {
        setLoadingTabla(true);
        try {
            const res = await fetch(
                `${RECEPTORES_NOMINA_URL}?EmisorNominaID=${selectedEmisor.ID}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) {
                const data = await res.json();
                setReceptores(data ?? []);
                // Si ya hay trabajadores, avanzar al paso 3 automáticamente
                if (data?.length > 0) setTrabajadoresCargados(true);
            }
        } catch {
            setConfirmationMessage("Error al obtener el catálogo de trabajadores.");
            setOpenModalError(true);
        }
        setLoadingTabla(false);
    };

    const handleCargarTrabajadores = async () => {
        if (!archivo || !selectedEmisor) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("EmisorNominaID", selectedEmisor.ID);

        try {
            const res = await fetch(CARGAR_TRABAJADORES_URL, {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setConfirmationMessage(
                    `Proceso completado:\n• ${data.nuevos} trabajador(es) nuevo(s)\n• ${data.actualizados} trabajador(es) actualizado(s).`
                );
                setOpenModalExito(true);
                setTrabajadoresCargados(true);
                await fetchReceptores(); // Refrescar tabla
            } else {
                const text = await res.text();
                setConfirmationMessage(`Error al cargar trabajadores: ${text.substring(0, 200)}`);
                setOpenModalError(true);
            }
        } catch {
            setConfirmationMessage("Error de conexión al cargar trabajadores.");
            setOpenModalError(true);
        }

        setLoading(false);
    };

    const handleCambioEmisor = (e) => {
        setSelectedEmisor(e.target.value ? JSON.parse(e.target.value) : null);
        setTrabajadoresCargados(false);
        setArchivo(null);
        setReceptores([]);
    };

    const handleDescargarPlantilla = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/cargamasivafacturas/DescargarXLSXTrabajadores`, {
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
                link.download = "Plantilla-Trabajadores.xlsx";
                link.click();
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <Box bgcolor="white" p={2} borderRadius={2} sx={{ maxWidth: "100%", overflow: "hidden" }}>


            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold" color="#1b384a">
                    Nómina – Carga masiva de trabajadores
                </Typography>

                <Button
                    variant="contained"
                    sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                    onClick={handleDescargarPlantilla}
                >
                    Descargar plantilla .xlsx <DownloadIcon sx={{ ml: 1 }} />
                </Button>
            </Box>

            {/* ── Stepper ── */}
            <Stepper activeStep={pasoActivo} sx={{ my: 3 }}>
                {PASOS.map((label) => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
                ))}
            </Stepper>

            {/* ── Paso 1: Seleccionar Emisor ── */}
            <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
                <Box sx={{ minWidth: 300 }}>
                    <Select
                        label="Seleccionar Emisor de Nómina"
                        url={`${apiUrl}/api/catalogos/Catalogos/EmisorNomina`}
                        id="ID"
                        descripcion="Emisor.Nombre"
                        onChange={handleCambioEmisor}
                        value={selectedEmisor?.ID || ""}
                    />
                </Box>
                {selectedEmisor && (
                    <Chip
                        label={`Patrón: ${selectedEmisor.RegistroPatronal}`}
                        size="small"
                        sx={{ backgroundColor: "#e8f4f8", color: "#1b384a" }}
                    />
                )}
            </Box>

            {/* ── Paso 2: Cargar trabajadores ── */}
            {selectedEmisor && (
                <Box
                    display="flex" alignItems="center" gap={2} mb={3} p={2}
                    borderRadius={2}
                    sx={{ border: "1px dashed #1b384a", backgroundColor: "#f7fbfd" }}
                >
                    <PeopleIcon sx={{ color: "#1b384a" }} />
                    <Typography variant="body2" color="#1b384a" flex={1}>
                        Sube el <strong>.xlsx</strong> para agregar o actualizar trabajadores en el catálogo.
                    </Typography>

                    <Button variant="outlined" component="label"
                        sx={{ borderColor: "#1b384a", color: "#1b384a" }}>
                        Seleccionar archivo
                        <input type="file" accept=".xlsx" hidden
                            onChange={(e) => setArchivo(e.target.files[0])} />
                    </Button>

                    {archivo && (
                        <Chip label={archivo.name} size="small"
                            sx={{ backgroundColor: "#e8f4f8" }} />
                    )}

                    <Button
                        variant="contained"
                        disabled={!archivo || loading}
                        startIcon={<CloudUploadIcon />}
                        sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                        onClick={handleCargarTrabajadores}
                    >
                        {loading ? "Cargando..." : "Guardar trabajadores"}
                    </Button>
                </Box>
            )}

            {/* ── Paso 3: Tabla del catálogo ── */}
            {selectedEmisor && (
                <Box mt={2}>
                    <Typography variant="subtitle1" fontWeight="bold" color="#1b384a" mb={1}>
                        Trabajadores en catálogo
                        <Chip
                            label={receptores.length}
                            size="small"
                            sx={{ ml: 1, backgroundColor: "#e8f4f8", color: "#1b384a" }}
                        />
                    </Typography>

                    {loadingTabla ? (
                        <Box display="flex" justifyContent="center" p={3}>
                            <CircularProgress size={28} sx={{ color: "#1b384a" }} />
                        </Box>
                    ) : receptores.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                            No hay trabajadores registrados para este emisor.
                        </Typography>
                    ) : (
                        <TableContainer component={Paper} elevation={0}
                            sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: "#f0f4f7" }}>
                                    <TableRow>
                                        <TableCell><strong>RFC</strong></TableCell>
                                        <TableCell><strong>Nombre</strong></TableCell>
                                        <TableCell><strong>CURP</strong></TableCell>
                                        <TableCell><strong>NSS</strong></TableCell>
                                        <TableCell><strong>Tipo Contrato</strong></TableCell>
                                        <TableCell><strong>Puesto</strong></TableCell>
                                        <TableCell><strong>Salario Diario Integrado</strong></TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {receptores.map((r) => (
                                        <TableRow key={r.ID} hover>
                                            <TableCell>{r.Rfc}</TableCell>
                                            <TableCell>{r.Nombre}</TableCell>
                                            <TableCell>{r.Curp}</TableCell>
                                            <TableCell>{r.NumSeguridadSocial}</TableCell>
                                            <TableCell>{r.TipoContrato}</TableCell>
                                            <TableCell>{r.Puesto}</TableCell>
                                            <TableCell>{r.SalarioDiarioIntegrado}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    )}
                </Box>
            )}

            {/* ── Modals ── */}
            <ModalExito
                openModalSuccess={openModalExito}
                handleCloseModal={() => setOpenModalExito(false)}
                confirmationMessage={confirmationMessage}
            />
            <ModalError
                openModalError={openModalError}
                handleCloseModal={() => setOpenModalError(false)}
                confirmationMessage={confirmationMessage}
            />
        </Box>
    );
}