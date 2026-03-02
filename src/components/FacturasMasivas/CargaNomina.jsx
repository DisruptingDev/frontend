"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Box, Button, Grid, Typography, Chip } from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import ModalNomina from "@/components/FacturasMasivas/ModalNomina";
import ModalError from "@/components/Home/Modales/modalError";
import VistaNominasImportadas from "@/components/FacturasMasivas/VistaNominasImportadas";
import Select from "@/components/Select/Select.jsx";
import FormatearNomina from "@/components/FacturasMasivas/FormatearNomina";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const GUARDAR_FACTURA_URL = `${apiUrl}/api/facturas/GuardarFactura`;

export default function CargaNomina({ token }) {
    const [loading, setLoading] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [nominas, setNominas] = useState([]);          // raw Excel rows
    const [selectedEmisor, setSelectedEmisor] = useState(null);

    const handleOpenModal = () => setOpenModal(true);
    const handleCloseModal = () => setOpenModal(false);
    const handleCloseModalError = () => setOpenModalError(false);

    const handleGuardarNominas = async () => {
        if (nominas.length === 0) return;
        if (!selectedEmisor) {
            setConfirmationMessage("Selecciona un Emisor antes de importar.");
            setOpenModalError(true);
            return;
        }

        setLoading(true);
        let exito = 0;
        const errores = [];

        for (let i = 0; i < nominas.length; i++) {
            const row = nominas[i];
            try {
                const payload = FormatearNomina(row, selectedEmisor);

                const response = await fetch(GUARDAR_FACTURA_URL, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                if (response.ok) {
                    exito++;
                } else {
                    const text = await response.text();
                    console.error(`❌ Error nómina #${i + 1} (HTTP ${response.status}):`, text);
                    errores.push(`Fila ${i + 1}: ${response.status} – ${text.substring(0, 120)}`);
                }
            } catch (err) {
                console.error(`❌ Error de red en nómina #${i + 1}:`, err);
                errores.push(`Fila ${i + 1}: Error de conexión`);
            }
        }

        const total = nominas.length;
        let msg = `✅ Se guardaron ${exito} de ${total} nómina(s) correctamente. Puedes verlas en la lista de nóminas para enviarlas a timbrado.`;
        if (errores.length > 0) {
            msg += `\n\n❌ Errores (${errores.length}):\n${errores.slice(0, 5).join("\n")}`;
            if (errores.length > 5) msg += `\n... y ${errores.length - 5} más.`;
        }

        setConfirmationMessage(msg);
        setOpenModalError(true);
        if (exito > 0) setNominas([]);

        setLoading(false);
    };

    return (
        <Box
            bgcolor="white"
            p={2}
            borderRadius={2}
            sx={{ maxWidth: "100%", overflow: "hidden" }}
        >
            {/* ── Header toolbar ── */}
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={2} flexWrap="wrap" gap={2}>
                <Box>
                    <Typography variant="h6" fontWeight="bold" color="#1b384a">
                        Nómina – Carga masiva
                    </Typography>
                    {nominas.length > 0 && (
                        <Chip
                            label={`${nominas.length} registro(s) cargado(s)`}
                            size="small"
                            sx={{ mt: 0.5, backgroundColor: "#e8f4f8", color: "#1b384a" }}
                        />
                    )}
                </Box>

                <Box display="flex" gap={2} alignItems="center">
                    {/* Emisor selector */}
                    <Box sx={{ minWidth: 260 }}>
                        <Select
                            label="Seleccionar Emisor"
                            url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                            id="ID"
                            descripcion="Nombre"
                            onChange={(e) => {
                                setSelectedEmisor(e.target.value ? JSON.parse(e.target.value) : null);
                            }}
                            value={selectedEmisor?.ID || ""}
                        />
                    </Box>

                    {/* Upload button */}
                    <Button
                        variant="contained"
                        startIcon={<CloudUploadIcon />}
                        disabled={!selectedEmisor}
                        sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                        onClick={handleOpenModal}
                    >
                        Importar Excel
                    </Button>
                </Box>
            </Box>

            {/* ── Data table ── */}
            <VistaNominasImportadas
                facturasRecuperadas={nominas}
                token={token}
                actualizarFacturas={setNominas}
            />

            {/* ── Submit button ── */}
            {nominas.length > 0 && (
                <Box display="flex" justifyContent="center" mt={4}>
                    <Button
                        variant="contained"
                        disabled={loading}
                        startIcon={<SendIcon />}
                        sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" }, px: 4 }}
                        onClick={handleGuardarNominas}
                    >
                        {loading ? "Guardando nóminas..." : `Guardar ${nominas.length} nómina(s)`}
                    </Button>
                </Box>
            )}

            {/* ── Modals ── */}
            <ModalNomina
                token={token}
                open={openModal}
                handleClose={handleCloseModal}
                handleUpload={setNominas}
                selectedEmisor={selectedEmisor}
            />
            <ModalError
                openModalError={openModalError}
                handleCloseModal={handleCloseModalError}
                confirmationMessage={confirmationMessage}
            />
        </Box>
    );
}
