import React, { useState, useEffect } from 'react';
import {
    Box,
    Card,
    CardContent,
    Typography,
    MenuItem,
    Select,
    FormControl,
    InputLabel,
    Button,
    Grid,
    TextField,
    CircularProgress,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Alert
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const mainApiUrl = process.env.NEXT_PUBLIC_API_URL;
// Assuming the microservice runs on port 8082 locally or properly configured in prod
// Ideally this should be an environment variable like NEXT_PUBLIC_BUZON_URL
const buzonApiUrl = "https://api.wisefacturacion.com/";

const VistaBuzonTributario = ({ token }) => {
    const [empresas, setEmpresas] = useState([]);
    const [selectedEmpresaId, setSelectedEmpresaId] = useState('');
    const [selectedEmpresaObj, setSelectedEmpresaObj] = useState(null);
    const [loadingEmpresas, setLoadingEmpresas] = useState(true);

    // CFDI Status State
    const [cfdiUuid, setCfdiUuid] = useState('');
    const [cfdiStatus, setCfdiStatus] = useState(null);
    const [loadingStatus, setLoadingStatus] = useState(false);
    const [statusError, setStatusError] = useState('');

    // Pending Requests State
    const [pendingRequests, setPendingRequests] = useState([]);
    const [loadingRequests, setLoadingRequests] = useState(false);

    useEffect(() => {
        fetchEmpresas();
    }, [token]);

    const fetchEmpresas = async () => {
        if (!token) return;
        try {
            const response = await fetch(`${mainApiUrl}/api/catalogos/Catalogos/Emisor`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            const data = await response.json();
            if (Array.isArray(data)) {
                setEmpresas(data.sort((a, b) => b.ID - a.ID));
            }
        } catch (error) {
            console.error('Error fetching empresas:', error);
        } finally {
            setLoadingEmpresas(false);
        }
    };

    const handleEmpresaChange = (event) => {
        const id = event.target.value;
        setSelectedEmpresaId(id);
        const empresa = empresas.find(e => e.ID === id);
        setSelectedEmpresaObj(empresa);
        // Reset sub-states
        setCfdiUuid('');
        setCfdiStatus(null);
        setPendingRequests([]);
        setStatusError('');

        // Load pending requests immediately when company is selected
        if (empresa) {
            fetchPendingRequests(empresa.Rfc);
        }
    };

    const handleBack = () => {
        setSelectedEmpresaId('');
        setSelectedEmpresaObj(null);
    };

    const checkCfdiStatus = async () => {
        if (!cfdiUuid) return;
        setLoadingStatus(true);
        setStatusError('');
        setCfdiStatus(null);
        try {
            const response = await fetch(`${buzonApiUrl}api/buzontributario/consultarEstatusComprobante/${cfdiUuid}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Passing token if needed by microservice
                },
            });
            if (!response.ok) {
                console.error('Error fetching status:', response.status, response.statusText);
                const errorText = await response.text();
                console.error('Error body:', errorText);
                throw new Error(`Error consultando el status: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            setCfdiStatus(data);
        } catch (error) {
            console.error(error);
            setStatusError('No se pudo obtener el estatus del CFDI. Verifique el UUID.');
        } finally {
            setLoadingStatus(false);
        }
    };

    const fetchPendingRequests = async (rfc) => {
        setLoadingRequests(true);
        try {
            // Assuming the endpoint accepts a query param or filters by user context/permissions
            // Here we might need to pass the RFC to the backend if the token doesn't carry it directly 
            // or if the microservice needs it explicitly.
            // Based on service def: ConsultarSolicitudesPendientes(rfc string)
            // But router is: v1.GET("/petitions/pending", ...)
            // We probably need to send RFC as query param? Or controller extracts it?
            // checking router again: v1.GET("/petitions/pending", prodigiaController.ConsultarSolicitudesPendientes)
            // The service method signature takes RFC, so the controller likely reads it from Query or Token.
            // I'll assume Query param for now: ?rfc=...
            const response = await fetch(`${buzonApiUrl}api/buzontributario/consultarPeticionesPendientes?rfc=${rfc}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setPendingRequests(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching requests:', error);
        } finally {
            setLoadingRequests(false);
        }
    };

    if (loadingEmpresas) {
        return <Box display="flex" justifyContent="center" p={4}><CircularProgress /></Box>;
    }

    if (!selectedEmpresaObj) {
        return (
            <Box p={3}>
                <Card elevation={3}>
                    <CardContent>
                        <Typography variant="h5" gutterBottom>
                            Buzón Tributario
                        </Typography>
                        <Typography variant="body1" color="textSecondary" paragraph>
                            Seleccione una empresa para consultar su buzón tributario.
                        </Typography>
                        <FormControl fullWidth margin="normal">
                            <InputLabel id="empresa-select-label">Empresa</InputLabel>
                            <Select
                                labelId="empresa-select-label"
                                value={selectedEmpresaId}
                                label="Empresa"
                                onChange={handleEmpresaChange}
                            >
                                {empresas.map((empresa) => (
                                    <MenuItem key={empresa.ID} value={empresa.ID}>
                                        {empresa.Nombre} ({empresa.Rfc})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </CardContent>
                </Card>
            </Box>
        );
    }

    return (
        <Box p={3}>
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={handleBack}
                sx={{ mb: 2 }}
            >
                Regresar a selección
            </Button>

            <Typography variant="h4" gutterBottom>
                Buzón Tributario: {selectedEmpresaObj.Nombre}
            </Typography>

            <Grid container spacing={3}>
                {/* Section: Check CFDI Status */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Consultar Estado de CFDI
                            </Typography>
                            <Box display="flex" gap={1} my={2}>
                                <TextField
                                    label="UUID del CFDI"
                                    variant="outlined"
                                    fullWidth
                                    value={cfdiUuid}
                                    onChange={(e) => setCfdiUuid(e.target.value)}
                                    size="small"
                                />
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={checkCfdiStatus}
                                    disabled={loadingStatus || !cfdiUuid}
                                >
                                    {loadingStatus ? <CircularProgress size={24} /> : <SearchIcon />}
                                </Button>
                            </Box>

                            {statusError && <Alert severity="error">{statusError}</Alert>}

                            {cfdiStatus && cfdiStatus.servicioConsultaComprobante && (
                                <Box mt={2} p={2} bgcolor="#f5f5f5" borderRadius={1}>
                                    <Typography variant="subtitle2" gutterBottom>Resultado de la Consulta:</Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Estado:</Typography>
                                            <Typography variant="body1" fontWeight="bold">
                                                {cfdiStatus.servicioConsultaComprobante.estado}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={6}>
                                            <Typography variant="body2" color="textSecondary">Es Cancelable:</Typography>
                                            <Typography variant="body1">
                                                {cfdiStatus.servicioConsultaComprobante.esCancelable}
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={12}>
                                            <Typography variant="body2" color="textSecondary">Código Estatus:</Typography>
                                            <Typography variant="body2">
                                                {cfdiStatus.servicioConsultaComprobante.codigoEstatus}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                </Box>
                            )}
                        </CardContent>
                    </Card>
                </Grid>

                {/* Section: Pending Requests */}
                <Grid item xs={12} md={6}>
                    <Card elevation={2}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom>
                                Solicitudes Pendientes
                            </Typography>
                            {loadingRequests ? (
                                <Box display="flex" justifyContent="center"><CircularProgress /></Box>
                            ) : pendingRequests.length === 0 ? (
                                <Alert severity="info">No hay solicitudes pendientes.</Alert>
                            ) : (
                                <TableContainer component={Paper}>
                                    <Table size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>UUID</TableCell>
                                                <TableCell>Estado</TableCell>
                                                <TableCell>Acciones</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {pendingRequests.map((req, index) => (
                                                <TableRow key={index}>
                                                    <TableCell>{req.uuid || 'N/A'}</TableCell>
                                                    <TableCell>{req.status || 'N/A'}</TableCell>
                                                    <TableCell>
                                                        <Button size="small" variant="outlined">
                                                            Responder
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VistaBuzonTributario;
