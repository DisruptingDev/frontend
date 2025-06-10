import React, { useState, useEffect } from 'react';
import Select from '../Select/Select';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
    Box, Grid, Divider, Snackbar, Alert
} from '@mui/material';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const PagoModal = ({ open, onClose, opcion, token, setCompra }) => {
    const [empresa, setEmpresa] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [severity, setSeverity] = useState('error');
    const [beneficios, setBeneficios] = useState([]);
    const [tipo, setTipo] = useState('');
    const [empresas, setEmpresas] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);

    // Obtener empresas
    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setEmpresas(data);
                    if (data.length === 1) setEmpresa(data[0].ID);
                }
            } catch (error) {
                console.error('Error al obtener empresas:', error);
            }
        };

        if (open && opcion.Nombre.includes('Paquete')) {
            fetchEmpresas();
        }
    }, [open, opcion, token]);

    // Configurar beneficios según tipo de opción
    useEffect(() => {
        if (opcion.Nombre.includes('Paquete')) {
            setBeneficios(['Sin caducidad', 'Pago único']);
            setTipo('Paquete');
        } else {
            setBeneficios(['Renovable mensualmente', 'Planeación de timbres']);
            setTipo('Plan');
        }
    }, [opcion]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const handleEmpresa = (e) => {
        const data = JSON.parse(e.target.value);
        setEmpresa(data.ID);
    };

    const handleConfirmPago = async () => {
        if (!empresa && opcion.Nombre.includes('Paquete')) {
            setAlertMessage('Por favor, seleccione una empresa.');
            setSeverity('error');
            return;
        }

        try {
            setIsProcessing(true);
            setAlertMessage('Generando orden...');
            setSeverity('info');

            const payload = opcion.Nombre.includes('Plan')
                ? { PlanID: opcion.ID }
                : { EmisorID: empresa, PaqueteID: opcion.ID };

            const endpoint = opcion.Nombre.includes('Plan')
                ? `${apiUrl}/api/compratimbres/GenerarOrdenPlan`
                : `${apiUrl}/api/compratimbres/GenerarOrdenPaquete`;

            const serverResponse = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (!serverResponse.ok) {
                const errorData = await serverResponse.json().catch(() => ({}));
                throw new Error(errorData.message || 'Error en la respuesta del servidor');
            }

            const responseData = await serverResponse.json();

            setAlertMessage('¡Orden generada con éxito! Por favor realice la transferencia con los datos proporcionados.');
            setSeverity('success');

            if (typeof setCompra === 'function') {
                setCompra(true);
            }

            // Cerrar el modal después de 2 segundos
            setTimeout(() => {
                onClose();
            }, 2000);
        } catch (error) {
            console.error('Error al generar la orden:', error);
            setAlertMessage(error.message || 'Error al generar la orden');
            setSeverity('error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleCloseSnackbar = () => {
        setAlertMessage('');
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: "600", fontSize: "1.5em" }}>Realizar Orden</DialogTitle>
            <DialogContent>
                {/* Detalles de la compra */}
                <Box mb={2} bgcolor="#f3f4f6" p={2} borderRadius={1}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>Detalles de la compra</Typography>
                    <Box display="flex" justifyContent="space-between" mb={1}>
                        <Typography>{opcion.Nombre}</Typography>
                        <Typography>{formatCurrency(opcion.Costo)}</Typography>
                    </Box>
                    <Typography color="textSecondary" mb={2}>{opcion.CantidadTimbres} Timbres</Typography>

                    <Divider sx={{ my: 1 }} />

                    <Box>
                        <Typography variant="body2"><strong>Tipo:</strong> {tipo}</Typography>
                        <Typography variant="body2"><strong>Características:</strong></Typography>
                        <ul style={{ paddingLeft: '20px', margin: '4px 0' }}>
                            {beneficios.map((beneficio, i) => (
                                <li key={i}>{beneficio}</li>
                            ))}
                        </ul>
                    </Box>
                </Box>

                {/* Selección de empresa */}
                {opcion.Nombre.includes('Paquete') && (
                    <Box mb={2} bgcolor="#f3f4f6" p={2} borderRadius={1}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>Empresa</Typography>
                        {empresas.length > 1 ? (
                            <Select
                                label="Seleccionar empresa"
                                url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                                id="ID"
                                clave=""
                                onChange={handleEmpresa}
                                descripcion="Nombre"
                            />
                        ) : (
                            <Typography>
                                {empresas.length === 1 ? empresas[0].Nombre : 'No hay empresas disponibles'}
                            </Typography>
                        )}
                    </Box>
                )}

                {/* Datos para transferencia */}
                <Box mb={2} bgcolor="#f3f4f6" p={2} borderRadius={1}>
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>Datos para transferencia</Typography>
                    <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                        <Grid item xs={5}><Typography color="text.secondary">Banco:</Typography></Grid>
                        <Grid item xs={7}><Typography fontWeight="medium">Banco Nacional de México</Typography></Grid>
                        <Grid item xs={5}><Typography color="text.secondary">Cuenta:</Typography></Grid>
                        <Grid item xs={7}><Typography fontWeight="medium">1234567890</Typography></Grid>
                        <Grid item xs={5}><Typography color="text.secondary">CLABE:</Typography></Grid>
                        <Grid item xs={7}><Typography fontWeight="medium">002123456789012345</Typography></Grid>
                        <Grid item xs={5}><Typography color="text.secondary">Beneficiario:</Typography></Grid>
                        <Grid item xs={7}><Typography fontWeight="medium">Wise Factura S.A. de C.V.</Typography></Grid>
                    </Grid>
                    <Divider sx={{ my: 2 }} />
                    <Typography>Monto a pagar: <strong>{formatCurrency(opcion.Costo)}</strong></Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleConfirmPago}
                    disabled={isProcessing}
                    size="large"
                >
                    {isProcessing ? 'Procesando...' : 'Confirmar Orden'}
                </Button>
            </DialogActions>

            <Snackbar
                open={Boolean(alertMessage)}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseSnackbar}
                    severity={severity}
                    sx={{ width: '100%' }}
                >
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default PagoModal;
