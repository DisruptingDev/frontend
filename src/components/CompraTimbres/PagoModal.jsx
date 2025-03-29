import React, { useState, useEffect, useRef } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
    Box, Grid, Divider, Snackbar, Alert, TextField
} from '@mui/material';
import Select from '../Select/Select';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const PagoModal = ({ open, onClose, opcion, token, setCompra }) => {
    const [empresa, setEmpresa] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [severity, setSeverity] = useState('error');
    const [beneficios, setBeneficios] = useState([]);
    const [tipo, setTipo] = useState('');
    const [empresas, setEmpresas] = useState([]);
    const [tipoPago, setTipoPago] = useState('');
    const [cardData, setCardData] = useState({
        holder_name: '',
        card_number: '',
        expiration_month: '',
        expiration_year: '',
        cvv2: ''
    });
    const [isProcessing, setIsProcessing] = useState(false);
    const formRef = useRef(null);
    const [openpayReady, setOpenpayReady] = useState(false);

    // Cargar empresas y configurar OpenPay
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

        // Configurar OpenPay cuando el modal se abre
        if (open && typeof window !== 'undefined' && window.OpenPay) {
            window.OpenPay.setId('mdzll2qkgndudhvft5s5');
            window.OpenPay.setApiKey('pk_2184b0089644486ab942a933d494a78e');
            window.OpenPay.setSandboxMode(true); // Cambiar a false en producción

            // Configurar deviceData después de que el DOM se actualice
            setTimeout(() => {
                if (document.getElementById('payment-form')) {
                    window.OpenPay.deviceData.setup('payment-form', 'device_session_id');
                    console.log('OpenPay deviceData configurado');
                    setOpenpayReady(true);
                    console.log('Device ID:', window.OpenPay.deviceData.getDeviceId());
                } else {
                    console.error('No se encontró el formulario con id payment-form');
                }
            }, 100);
        }
    }, [open, opcion, token]);

    // Configurar beneficios según el tipo de opción
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

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        setCardData(prev => ({ ...prev, [name]: value }));
    };

    const handleTipoPago = (tipo) => {
        setTipoPago(tipo);
    };

    const handleConfirmPago = async () => {
        if (!empresa && opcion.Nombre.includes('Paquete')) {
            setAlertMessage('Por favor, seleccione una empresa.');
            setSeverity('error');
            return;
        }

        if (tipoPago === 'openpay') {
            if (!cardData.holder_name || !cardData.card_number ||
                !cardData.expiration_month || !cardData.expiration_year || !cardData.cvv2) {
                setAlertMessage('Por favor, complete todos los datos de la tarjeta.');
                setSeverity('error');
                return;
            }

            try {
                setIsProcessing(true);

                window.OpenPay.token.create({
                    "card_number": cardData.card_number.replace(/\s/g, ''),
                    "holder_name": cardData.holder_name,
                    "expiration_year": cardData.expiration_year,
                    "expiration_month": cardData.expiration_month,
                    "cvv2": cardData.cvv2
                }, async (response) => {
                    const deviceId = window.OpenPay.deviceData.getDeviceId();
                    const sourceId = 'web_checkout'; // Identificador de origen

                    const payload = {
                        EmisorID: empresa,
                        PaqueteID: opcion.ID,
                        TokenId: response.data.id
                    };

                    const queryParams = new URLSearchParams({
                        deviceID: deviceId,
                        sourceID: sourceId
                    });

                    const endpoint = `${apiUrl}/api/compratimbres/GenerarOrdenPaquete?${queryParams.toString()}`;

                    const serverResponse = await fetch(endpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(payload)
                    });
                }, (error) => {
                    // Manejar errores...
                });

            } catch (error) {
                console.error('Error en el pago:', error);
                setAlertMessage('Error al procesar el pago. Verifique los datos de la tarjeta.');
                setIsProcessing(false);
            }
        } else if (tipoPago === 'transferencia') {
            setAlertMessage('Por favor, realice la transferencia con los datos proporcionados.');
            setSeverity('info');
        }
    };

    const processPayment = async (tokenId) => {
        try {
            const deviceId = window.OpenPay.deviceData.getDeviceId();
            const sourceId = 'checkout'; // Puedes personalizar este valor según tu necesidad

            const formData = opcion.Nombre.includes('Plan')
                ? {
                    PlanID: opcion.ID,
                    TokenId: tokenId,
                    deviceID: deviceId,
                    sourceID: sourceId
                }
                : {
                    EmisorID: empresa,
                    PaqueteID: opcion.ID,
                    TokenId: tokenId,
                    deviceID: deviceId,
                    sourceID: sourceId
                };

            const endpoint = opcion.Nombre.includes('Plan')
                ? `${apiUrl}/api/compratimbres/GenerarOrdenPlan`
                : `${apiUrl}/api/compratimbres/GenerarOrdenPaquete`;

            // Construir query string con los parámetros requeridos
            const queryParams = new URLSearchParams({
                deviceID: deviceId,
                sourceID: sourceId
            });

            const response = await fetch(`${endpoint}?${queryParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                setAlertMessage('Pago realizado con éxito.');
                setSeverity('success');
                if (typeof setCompra === 'function') {
                    setCompra(true);
                }
                onClose();
            } else {
                const errorData = await response.json();
                setAlertMessage(errorData.message || 'Error al procesar el pago.');
            }
        } catch (error) {
            console.error('Error al procesar pago:', error);
            setAlertMessage('Error al procesar el pago. Por favor, intente nuevamente.');
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
                {/* Formulario de pago con el ID requerido por OpenPay */}
                <form id="payment-form">
                    <input type="hidden" name="token_id" id="token_id" />
                    <input type="hidden" name="device_session_id" id="device_session_id" />


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

                    {/* Selección de tipo de pago */}
                    <Box mb={2} bgcolor="#f3f4f6" p={2} borderRadius={1}>
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>Método de pago</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant={tipoPago === 'transferencia' ? 'contained' : 'outlined'}
                                    onClick={() => handleTipoPago('transferencia')}
                                >
                                    Transferencia
                                </Button>
                            </Grid>
                            <Grid item xs={6}>
                                <Button
                                    fullWidth
                                    variant={tipoPago === 'openpay' ? 'contained' : 'outlined'}
                                    onClick={() => handleTipoPago('openpay')}
                                >
                                    Tarjeta (OpenPay)
                                </Button>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Formulario de tarjeta */}
                    {tipoPago === 'openpay' && (
                        <Box mb={2} bgcolor="#f3f4f6" p={2} borderRadius={1}>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>Datos de la tarjeta</Typography>

                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Nombre del titular"
                                        name="holder_name"
                                        value={cardData.holder_name}
                                        onChange={handleCardChange}
                                        inputProps={{ 'data-openpay-card': 'holder_name' }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="Número de tarjeta"
                                        name="card_number"
                                        value={cardData.card_number}
                                        onChange={handleCardChange}
                                        inputProps={{
                                            'data-openpay-card': 'card_number',
                                            maxLength: 16
                                        }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Mes (MM)"
                                        name="expiration_month"
                                        value={cardData.expiration_month}
                                        onChange={handleCardChange}
                                        inputProps={{
                                            'data-openpay-card': 'expiration_month',
                                            maxLength: 2
                                        }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={6}>
                                    <TextField
                                        fullWidth
                                        label="Año (YY)"
                                        name="expiration_year"
                                        value={cardData.expiration_year}
                                        onChange={handleCardChange}
                                        inputProps={{
                                            'data-openpay-card': 'expiration_year',
                                            maxLength: 2
                                        }}
                                        required
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        fullWidth
                                        label="CVV"
                                        name="cvv2"
                                        value={cardData.cvv2}
                                        onChange={handleCardChange}
                                        inputProps={{
                                            'data-openpay-card': 'cvv2',
                                            maxLength: 4
                                        }}
                                        required
                                    />
                                </Grid>
                            </Grid>

                            <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                                <Typography variant="caption" color="text.secondary">
                                    Transacciones seguras con OpenPay
                                </Typography>
                            </Box>
                        </Box>
                    )}

                    {/* Datos para transferencia */}
                    {tipoPago === 'transferencia' && (
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

                            <Typography>
                                Monto a pagar: <strong>{formatCurrency(opcion.Costo)}</strong>
                            </Typography>
                        </Box>
                    )}
                </form>
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
                    {isProcessing ? 'Procesando...' : 'Confirmar Pago'}
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