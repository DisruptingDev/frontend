import React, { useState, useEffect, useRef } from 'react';
import Select from '../Select/Select';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography,
    Box, Grid, Divider, Snackbar, Alert, FormControlLabel, Radio, RadioGroup, FormControl, FormLabel,
    CircularProgress, Backdrop
} from '@mui/material';
import { PayPalButtons, usePayPalScriptReducer } from '@paypal/react-paypal-js';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const PagoModal = ({ open, onClose, opcion, token, setCompra }) => {
    const [empresa, setEmpresa] = useState('');
    const [alertMessage, setAlertMessage] = useState('');
    const [severity, setSeverity] = useState('error');
    const [beneficios, setBeneficios] = useState([]);
    const [tipo, setTipo] = useState('');
    const [empresas, setEmpresas] = useState([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('paypal'); // PayPal por defecto
    const [paypalOrderId, setPaypalOrderId] = useState(null);
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const paypalSectionRef = useRef(null);

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

    // Hacer scroll a la sección de PayPal cuando se selecciona
    useEffect(() => {
        if (paymentMethod === 'paypal' && paypalSectionRef.current) {
            setTimeout(() => {
                paypalSectionRef.current.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
            }, 100);
        }
    }, [paymentMethod]);

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

    const handlePaymentMethodChange = (event) => {
        setPaymentMethod(event.target.value);
    };

    // Función para crear orden en PayPal
    const createPayPalOrder = async () => {
        try {
            setIsCreatingOrder(true);
            
            const payload = opcion.Nombre.includes('Plan')
                ? { PlanID: opcion.ID }
                : { EmisorID: parseInt(empresa), PaqueteID: parseInt(opcion.ID)};

            const endpoint = `${apiUrl}/api/compratimbres/CrearOrdenPayPal`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...payload,
                    monto: opcion.Costo,
                    descripcion: opcion.Nombre
                })
            });

            if (!response.ok) {
                throw new Error('Error al crear orden de PayPal');
            }

            const orderData = await response.json();
            setPaypalOrderId(orderData.orderId);
            return orderData.orderId;

        } catch (error) {
            console.error('Error al crear orden PayPal:', error);
            setAlertMessage('Error al procesar pago con PayPal');
            setSeverity('error');
            throw error;
        } finally {
            setIsCreatingOrder(false);
        }
    };

    // Función para capturar pago de PayPal
    const capturePayPalOrder = async (orderID) => {
        try {
            setIsProcessing(true);
            
            const response = await fetch(`${apiUrl}/api/compratimbres/CapturarOrdenPayPal`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId: orderID })
            });

            if (!response.ok) {
                throw new Error('Error al capturar pago de PayPal');
            }

            const result = await response.json();
            
            setAlertMessage('¡Pago realizado con éxito!');
            setSeverity('success');

            if (typeof setCompra === 'function') {
                setCompra(true);
            }

            // Cerrar el modal después de 2 segundos
            setTimeout(() => {
                onClose();
            }, 2000);

            return result;

        } catch (error) {
            console.error('Error al capturar orden PayPal:', error);
            setAlertMessage('Error al completar el pago');
            setSeverity('error');
            throw error;
        } finally {
            setIsProcessing(false);
        }
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
            {/* Backdrop para bloquear la interfaz durante el procesamiento */}
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={isProcessing}
            >
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <CircularProgress color="inherit" />
                    <Typography variant="h6" sx={{ mt: 2 }}>
                        Procesando pago...
                    </Typography>
                </Box>
            </Backdrop>

            <DialogTitle sx={{ fontWeight: "600", fontSize: "1.5em" }}>Realizar Orden</DialogTitle>
            <DialogContent>
                {/* Método de pago */}
                <Box mb={2} bgcolor="#f3f4f6" p={2} borderRadius={1}>
                    <FormControl component="fieldset">
                        <FormLabel component="legend" sx={{ fontWeight: '600', mb: 1 }}>
                            Método de Pago
                        </FormLabel>
                        <RadioGroup
                            value={paymentMethod}
                            onChange={handlePaymentMethodChange}
                        >
                            <FormControlLabel 
                                value="transferencia" 
                                control={<Radio />} 
                                label="Transferencia Bancaria" 
                            />
                            <FormControlLabel 
                                value="paypal" 
                                control={<Radio />} 
                                label="PayPal (Pago con tarjeta)" 
                            />
                        </RadioGroup>
                    </FormControl>
                </Box>

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

                {/* Datos para transferencia (solo se muestra si se selecciona transferencia) */}
                {paymentMethod === 'transferencia' && (
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
                )}

                {/* Botón de PayPal (solo se muestra si se selecciona PayPal) */}
                {paymentMethod === 'paypal' && (
                    <Box 
                        mb={2} 
                        bgcolor="#f3f4f6" 
                        p={2} 
                        borderRadius={1}
                        ref={paypalSectionRef}
                    >
                        <Typography variant="h6" gutterBottom sx={{ fontWeight: '600' }}>
                            Pago con PayPal
                        </Typography>
                        <Box sx={{ minHeight: '120px' }}>
                            {isCreatingOrder && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                                    <CircularProgress />
                                </Box>
                            )}
                            <PayPalButtons
                                createOrder={createPayPalOrder}
                                onApprove={(data, actions) => {
                                    return actions.order.capture().then((details) => {
                                        return capturePayPalOrder(data.orderID);
                                    });
                                }}
                                onError={(err) => {
                                    console.error('PayPal error:', err);
                                    setAlertMessage('Error en el proceso de pago con PayPal');
                                    setSeverity('error');
                                }}
                                style={{
                                    layout: 'vertical',
                                    shape: 'rect',
                                    color: 'blue',
                                }}
                                disabled={isProcessing || isCreatingOrder}
                            />
                        </Box>
                    </Box>
                )}
            </DialogContent>

            {/* Botón de confirmar solo para transferencia */}
            {paymentMethod === 'transferencia' && (
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
            )}

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

// Componente wrapper para PayPal Script Provider
const PagoModalWithPayPal = (props) => {
    const [{ isPending }] = usePayPalScriptReducer();

    return ( 
        <>
            {isPending && <div>Cargando PayPal...</div>}
            <PagoModal {...props} />
        </>
    );
};

export default PagoModalWithPayPal;