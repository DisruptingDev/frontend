"use client"
import { useState } from "react";
import { Box, Typography, Chip, Stepper, Step, StepLabel } from "@mui/material";
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";
import Select from "@/components/Select/Select.jsx";
import GenerarNominas from "@/components/FacturasMasivas/GenerarNomina";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const PASOS = ["Seleccionar Emisor", "Generar nóminas"];

export default function CargaNomina({ token, onSuccess }) {
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [selectedEmisor, setSelectedEmisor] = useState(null);

    const pasoActivo = !selectedEmisor ? 0 : 1;

    const handleCambioEmisor = (e) => {
        setSelectedEmisor(e.target.value ? JSON.parse(e.target.value) : null);
    };

    return (
        <Box bgcolor="white" p={2} borderRadius={2} sx={{ maxWidth: "100%", overflow: "hidden" }}>

            <Typography variant="h6" fontWeight="bold" color="#1b384a" mb={2}>
                Nómina – Carga masiva
            </Typography>

            <Stepper activeStep={pasoActivo} sx={{ mb: 3 }}>
                {PASOS.map((label) => (
                    <Step key={label}><StepLabel>{label}</StepLabel></Step>
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

            {/* ── Paso 2: Generar nóminas ── */}
            {selectedEmisor && (
                <GenerarNominas
                    token={token}
                    selectedEmisor={selectedEmisor}
                    onMessage={(msg, isError) => {
                        setConfirmationMessage(msg);
                        isError ? setOpenModalError(true) : setOpenModalExito(true);
                    }}
                    onSuccess={onSuccess}
                />
            )}

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