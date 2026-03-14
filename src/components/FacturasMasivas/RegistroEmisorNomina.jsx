"use client"
import { useState, useEffect } from "react";
import { 
    Box, 
    Button, 
    Typography, 
    TextField,
    Modal,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import Select from "@/components/Select/Select.jsx";
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const REGISTRAR_EMISOR_URL = `${apiUrl}/api/gestores/RegistroEmisorNomina`;
const CONSULTAR_EMISORES_URL = `${apiUrl}/api/catalogos/Catalogos/EmisorNomina`;

export default function RegistroEmisorNomina({ token }) {
    // Estado para el modal
    const [openModal, setOpenModal] = useState(false);
    
    // Estado del formulario
    const [selectedEmisor, setSelectedEmisor] = useState(null);
    const [registroPatronal, setRegistroPatronal] = useState("");
    const [rfcPatronOrigen, setRfcPatronOrigen] = useState("");
    
    // Estado para la tabla
    const [emisoresRegistrados, setEmisoresRegistrados] = useState([]);
    const [loadingTable, setLoadingTable] = useState(false);
    
    // Estados generales
    const [loading, setLoading] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");

    // Cargar emisores registrados
    const cargarEmisores = async () => {
        try {
            setLoadingTable(true);
            const response = await fetch(CONSULTAR_EMISORES_URL, {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });
            
            if (!response.ok) {
                throw new Error("Error al cargar emisores");
            }
            
            const data = await response.json();
            setEmisoresRegistrados(data);
        } catch (err) {
            console.error(err);
            setConfirmationMessage("Error al cargar la lista de emisores");
            setOpenModalError(true);
        } finally {
            setLoadingTable(false);
        }
    };

    // Cargar emisores al montar el componente
    useEffect(() => {
        cargarEmisores();
    }, []);

    const handleOpenModal = () => {
        setOpenModal(true);
        // Limpiar formulario al abrir
        setSelectedEmisor(null);
        setRegistroPatronal("");
        setRfcPatronOrigen("");
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    const handleCloseModalError = () => setOpenModalError(false);
    const handleCloseModalExito = () => setOpenModalExito(false);

    const handleRegistrar = async () => {
        if (!selectedEmisor) {
            setConfirmationMessage("Selecciona un emisor.");
            setOpenModalError(true);
            return;
        }

        if (!registroPatronal || !rfcPatronOrigen) {
            setConfirmationMessage("Completa todos los campos.");
            setOpenModalError(true);
            return;
        }

        const payload = {
            EmisorNomina: {
                RegistroPatronal: registroPatronal,
                RfcPatronOrigen: rfcPatronOrigen,
                EmisorID: selectedEmisor.ID
            }
        };

        try {
            setLoading(true);
            const response = await fetch(REGISTRAR_EMISOR_URL, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const text = await response.text();
                throw new Error(text);
            }

            setConfirmationMessage("Emisor de nómina registrado correctamente.");
            setLoading(false);
            setOpenModalExito(true);
            
            // Cerrar modal y recargar tabla
            handleCloseModal();
            cargarEmisores();

        } catch (err) {
            console.error(err);
            setConfirmationMessage(
                "Error al registrar el emisor de nómina.\n\n" +
                err.message.substring(0, 200)
            );
            setLoading(false);
            setOpenModalError(true);
        }
    };

    return (
        <Box bgcolor="white" p={3} borderRadius={2}>
            {/* Header con título y botón */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h6" fontWeight="bold" color="#1b384a">
                    Registros Patronales Registrados
                </Typography>
                
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={handleOpenModal}
                    sx={{
                        backgroundColor: "#1b384a",
                        "&:hover": { backgroundColor: "#10232f" },
                    }}
                >
                    Nuevo Emisor
                </Button>
            </Box>

            {/* Tabla de emisores registrados */}
            <TableContainer component={Paper} sx={{ boxShadow: 'none', border: '1px solid #e0e0e0' }}>
                <Table>
                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell><strong>ID</strong></TableCell>
                            <TableCell><strong>Emisor</strong></TableCell>
                            <TableCell><strong>Registro Patronal</strong></TableCell>
                            <TableCell><strong>RFC Patrón Origen</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loadingTable ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    Cargando...
                                </TableCell>
                            </TableRow>
                        ) : emisoresRegistrados.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} align="center">
                                    No hay emisores registrados
                                </TableCell>
                            </TableRow>
                        ) : (
                            emisoresRegistrados.map((emisor) => (
                                <TableRow key={emisor.ID}>
                                    <TableCell>{emisor.ID}</TableCell>
                                    <TableCell>{emisor.Emisor?.Nombre || 'N/A'}</TableCell>
                                    <TableCell>{emisor.RegistroPatronal}</TableCell>
                                    <TableCell>{emisor.RfcPatronOrigen}</TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal de registro */}
            <Modal
                open={openModal}
                onClose={handleCloseModal}
                aria-labelledby="modal-registro-emisor"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    borderRadius: 2,
                    p: 4,
                    maxWidth: 600,
                    width: '90%',
                    maxHeight: '90vh',
                    overflow: 'auto'
                }}>
                    {/* Header del modal */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                        <Typography variant="h6" fontWeight="bold" color="#1b384a">
                            Registro de Emisor de Nómina
                        </Typography>
                        <IconButton onClick={handleCloseModal} size="small">
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    {/* Formulario */}
                    <Box mb={3}>
                        <Select
                            label="Seleccionar Emisor"
                            url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                            id="ID"
                            descripcion="Nombre"
                            value={selectedEmisor?.ID || ""}
                            onChange={(e) => {
                                setSelectedEmisor(
                                    e.target.value ? JSON.parse(e.target.value) : null
                                );
                            }}
                        />
                    </Box>

                    <TextField
                        label="Registro Patronal"
                        fullWidth
                        value={registroPatronal}
                        onChange={(e) => setRegistroPatronal(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    <TextField
                        label="RFC Patrón Origen"
                        fullWidth
                        value={rfcPatronOrigen}
                        onChange={(e) => setRfcPatronOrigen(e.target.value)}
                        sx={{ mb: 4 }}
                    />

                    {/* Botones del modal */}
                    <Box display="flex" justifyContent="center" gap={2}>
                        <Button
                            variant="outlined"
                            onClick={handleCloseModal}
                            sx={{
                                color: "#666",
                                borderColor: "#666",
                                "&:hover": { 
                                    borderColor: "#444",
                                    backgroundColor: "rgba(0,0,0,0.04)"
                                },
                                px: 5
                            }}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            startIcon={<SendIcon />}
                            disabled={loading}
                            sx={{
                                backgroundColor: "#1b384a",
                                "&:hover": { backgroundColor: "#10232f" },
                                px: 5
                            }}
                            onClick={handleRegistrar}
                        >
                            {loading ? "Registrando..." : "Registrar"}
                        </Button>
                    </Box>
                </Box>
            </Modal>

            {/* Modales de éxito y error */}
            <ModalExito
                openModalSuccess={openModalExito}
                handleCloseModal={handleCloseModalExito}
                confirmationMessage={confirmationMessage}
            />

            <ModalError
                openModalError={openModalError}
                handleCloseModal={handleCloseModalError}
                confirmationMessage={confirmationMessage}
            />
        </Box>
    );
}