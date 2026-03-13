"use client"
import { useState } from "react";
import { Box, Button, Typography, Chip, Stepper, Step, StepLabel } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import PeopleIcon from "@mui/icons-material/People";
import ModalNomina from "@/components/FacturasMasivas/ModalNomina";
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";
import VistaNominasImportadas from "@/components/FacturasMasivas/VistaNominasImportadas";
import Select from "@/components/Select/Select.jsx";
import GenerarNominas from "@/components/FacturasMasivas/GenerarNomina";


const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const CARGAR_TRABAJADORES_URL = `${apiUrl}/api/gestores/cargarTrabajadores`;
const GUARDAR_FACTURA_URL = `${apiUrl}/api/facturas/GuardarFactura`;

const PASOS = ["Seleccionar Emisor", "Cargar trabajadores", "Generar nóminas"];

export default function CargaNomina({ token }) {
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [nominas, setNominas] = useState([]);
    const [selectedEmisor, setSelectedEmisor] = useState(null); // EmisorNomina completo
    const [trabajadoresCargados, setTrabajadoresCargados] = useState(false);
    const [archivo, setArchivo] = useState(null);

    // Paso activo del stepper
    const pasoActivo = !selectedEmisor ? 0 : !trabajadoresCargados ? 1 : 2;

    // ── Paso 2: subir .xlsx al catálogo ──
    const handleCargarTrabajadores = async () => {
        if (!archivo || !selectedEmisor) return;
        setLoading(true);

        const formData = new FormData();
        formData.append("archivo", archivo);
        formData.append("EmisorNominaID", selectedEmisor.ID);

        try {
            const res = await fetch(CARGAR_TRABAJADORES_URL, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setTrabajadoresCargados(true);
                setConfirmationMessage(
                    `Proceso completado:\n• ${data.nuevos} trabajador(es) nuevo(s)\n• ${data.actualizados} trabajador(es) actualizado(s).`
                );
                setOpenModalExito(true);
            } else {
                const text = await res.text();
                setConfirmationMessage(`Error al cargar trabajadores: ${text.substring(0, 200)}`);
                setOpenModalError(true);
            }
        } catch (err) {
            setConfirmationMessage("Error de conexión al cargar trabajadores.");
            setOpenModalError(true);
        }

        setLoading(false);
    };

    // ── Paso 3: guardar nóminas ──
    const handleGuardarNominas = async () => {
        if (nominas.length === 0 || !selectedEmisor) return;
        setLoading(true);

        let exito = 0;
        const errores = [];

        for (let i = 0; i < nominas.length; i++) {
            const row = nominas[i];
            try {
                // row ya debe traer ReceptorNominaID desde VistaNominasImportadas
                const payload = {
                    ...row,
                    EmisorNominaID: selectedEmisor.ID,
                };

                const res = await fetch(GUARDAR_FACTURA_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    exito++;
                } else {
                    const text = await res.text();
                    errores.push(`Fila ${i + 1}: ${res.status} – ${text.substring(0, 120)}`);
                }
            } catch (err) {
                errores.push(`Fila ${i + 1}: Error de conexión`);
            }
        }

        let msg = `Se guardaron ${exito} de ${nominas.length} nómina(s) correctamente.`;
        if (errores.length > 0) {
            msg += `\n\nErrores (${errores.length}):\n${errores.slice(0, 5).join("\n")}`;
            if (errores.length > 5) msg += `\n... y ${errores.length - 5} más.`;
            setOpenModalError(true);
        }

        setConfirmationMessage(msg);
        if (exito > 0) setNominas([]);
        setLoading(false);
    };

    const handleCambioEmisor = (e) => {
        // Resetear pasos siguientes si cambia el emisor
        setSelectedEmisor(e.target.value ? JSON.parse(e.target.value) : null);
        setTrabajadoresCargados(false);
        setArchivo(null);
        setNominas([]);
    };

    return (
        <Box bgcolor="white" p={2} borderRadius={2} sx={{ maxWidth: "100%", overflow: "hidden" }}>

            {/* ── Título ── */}
            <Typography variant="h6" fontWeight="bold" color="#1b384a" mb={2}>
                Nómina – Carga masiva
            </Typography>

            {/* ── Stepper ── */}
            <Stepper activeStep={pasoActivo} sx={{ mb: 3 }}>
                {PASOS.map((label) => (
                    <Step key={label}>
                        <StepLabel>{label}</StepLabel>
                    </Step>
                ))}
            </Stepper>

            {/* ── Paso 1: Seleccionar EmisorNomina ── */}
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

            {/* ── Paso 2: Cargar trabajadores al catálogo ── */}
            {selectedEmisor && !trabajadoresCargados && (
                <Box
                    display="flex" alignItems="center" gap={2} mb={3}
                    p={2} borderRadius={2}
                    sx={{ border: "1px dashed #1b384a", backgroundColor: "#f7fbfd" }}
                >
                    <PeopleIcon sx={{ color: "#1b384a" }} />
                    <Typography variant="body2" color="#1b384a" flex={1}>
                        Sube el <strong>.xlsx</strong> con los trabajadores para guardarlos en el catálogo.
                    </Typography>

                    <Button
                        variant="outlined"
                        component="label"
                        sx={{ borderColor: "#1b384a", color: "#1b384a" }}
                    >
                        Seleccionar archivo
                        <input
                            type="file"
                            accept=".xlsx"
                            hidden
                            onChange={(e) => setArchivo(e.target.files[0])}
                        />
                    </Button>

                    {archivo && (
                        <Chip label={archivo.name} size="small" sx={{ backgroundColor: "#e8f4f8" }} />
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

            {trabajadoresCargados && (
                <Chip
                    label="✔ Trabajadores en catálogo"
                    size="small"
                    sx={{ mb: 2, backgroundColor: "#e6f4ea", color: "#2e7d32" }}
                />
            )}

            {/* ── Paso 3: Importar y generar nóminas ── */}
            {trabajadoresCargados && (
                <GenerarNominas
                    token={token}
                    selectedEmisor={selectedEmisor}
                    onMessage={(msg) => {
                        setConfirmationMessage(msg);
                        setOpenModalExito(true);
                    }}
                />
            )}

            {/* ── Modals ── */}
            <ModalNomina
                token={token}
                open={openModal}
                handleClose={() => setOpenModal(false)}
                handleUpload={setNominas}
                selectedEmisor={selectedEmisor}
            />

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