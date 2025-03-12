import React, { useState, useEffect } from 'react';
import Select from '../Select/Select';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Divider, Snackbar,
    Alert
} from '@mui/material';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalPago = ({ open, onClose, opcion, token, setCompra }) => {
    const [empresa, setEmpresa] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [alertMessage, setAlertMessage] = useState('');
    const [severity, setSeverity] = useState('error');
    const [beneficios, setBeneficios] = useState([]);
    const [tipo, setTipo] = useState('');
    const [preferenceId, setPreferenceId] = useState('');
    const [tipoPago, setTipoPago] = useState('');
    const [linkPago, setLinkPago] = useState('');
    const [empresas, setEmpresas] = useState([]); // Estado para almacenar la lista de empresas

    // Obtener la lista de empresas al cargar el componente
    useEffect(() => {
        const fetchEmpresas = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setEmpresas(data);

                    // Si solo hay una empresa, seleccionarla automáticamente
                    if (data.length === 1) {
                        setEmpresa(data[0].ID);
                    }
                } else {
                    console.error('Error al obtener la lista de empresas');
                }
            } catch (error) {
                console.error('Error al obtener la lista de empresas:', error);
            }
        };

        if (open && opcion.Nombre.includes('Paquete')) {
            fetchEmpresas();
        }
    }, [open, opcion, token]);

    useEffect(() => {
        console.log('Opción seleccionada:', opcion);
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

    const handleFileUpload = (event) => {
        setArchivo(event.target.files[0]);
    };

    const handleConfirmPago = async () => {
        let formData = {};
        let URL;

        if (!empresa && opcion.Nombre.includes('Paquete')) {
            setAlertMessage('Por favor, complete todos los campos.');
            setSeverity('error');
            return;
        }

        if (opcion.Nombre.includes('Plan')) {
            formData = { PlanID: opcion.ID };
            URL = `${apiUrl}/api/compratimbres/GenerarOrdenPlan`;
        } else {
            formData = { EmisorID: empresa, PaqueteID: opcion.ID };
            URL = `${apiUrl}/api/compratimbres/GenerarOrdenPaquete`;
        }

        try {
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                const data = await response.json();
                console.log('Data:', data);
                setLinkPago(data.link); // Almacena la URL de pago de OpenPay
                setAlertMessage('Orden realizado con éxito.');
                setSeverity('success');
                return data.link; // Retorna el link de pago
            } else {
                setAlertMessage('Error al realizar el pago. Por favor, intente de nuevo.');
            }
        } catch (error) {
            console.error('Error en el pago:', error);
            setAlertMessage('Error al realizar el pago. Por favor, intente de nuevo.');
        }
    };

    const handleCloseSnackbar = () => {
        setAlertMessage('');
    };

    const handleEmpresa = (e) => {
        const data = JSON.parse(e.target.value);
        setEmpresa(data.ID);
    };

    const handleTipoPago = async (tipo) => {
        setTipoPago(tipo);
        const link = await handleConfirmPago(); // Generar la orden y obtener el link de pago
    
        // Redirigir solo si el tipo de pago es OpenPay y hay un link de pago
        if (tipo === 'openpay' && link) {
            window.open(link, '_blank'); // Abre el link de pago en una nueva pestaña
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: "600", fontSize: "1.5em" }}>Realizar Orden</DialogTitle>
            <DialogContent>
                {/* Detalles de la compra */}
                <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: "600", fontSize: "1em" }}>Detalles de la compra:</Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: "500", fontSize: "0.9em" }}>{opcion.Nombre}</Typography>
                        <Typography>{formatCurrency(opcion.Costo)}</Typography>
                    </Box>
                    <Typography color="textSecondary">{opcion.CantidadTimbres} Timbres </Typography>
                    <Box mt={1}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2"><strong>Tipo:</strong> {tipo}</Typography>
                        <Typography variant="body2"><strong>Características:</strong></Typography>
                        <ul style={{ paddingLeft: '16px', marginTop: '2px', marginBottom: '0px', listStyleType: 'disc', fontSize: "0.8em" }}>
                            {beneficios.map((beneficio, i) => (
                                <li key={i} style={{ marginBottom: '2px' }}>{beneficio}</li>
                            ))}
                        </ul>
                    </Box>
                </Box>

                <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                    <Typography sx={{ fontWeight: "600", fontSize: "1em" }} gutterBottom>Empresa:</Typography>
                    {opcion.Nombre.includes('Paquete') && (
                        empresas.length > 1 ? (
                            <Select
                                label="Seleccionar empresa"
                                url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                                id="ID"
                                clave=""
                                onChange={handleEmpresa}
                                descripcion="Nombre"
                            />
                        ) : (
                            <Typography sx={{ fontWeight: "500", fontSize: "0.9em" }}>
                                {empresas.length === 1 ? empresas[0].Nombre : 'No hay empresas disponibles'}
                            </Typography>
                        )
                    )}
                </Box>

                <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                    <Typography sx={{ fontWeight: "600", fontSize: "1em" }} gutterBottom>Tipo de pago:</Typography>
                    {opcion.Nombre.includes('Paquete') && (
                        <Box display="flex" justifyContent="space-between">
                            <Button
                                variant={tipoPago === 'transferencia' ? 'contained' : 'outlined'}
                                color="primary"
                                onClick={() => handleTipoPago('transferencia')}
                                sx={{ flex: 1, marginRight: '0.5em' }}
                            >
                                Transferencia bancaria
                            </Button>
                            <Button
                                variant={tipoPago === 'openpay' ? 'contained' : 'outlined'}
                                color="primary"
                                onClick={() => handleTipoPago('openpay')}
                                sx={{ flex: 1, marginLeft: '0.5em' }}
                            >
                                Pago en línea (OpenPay)
                            </Button>
                        </Box>
                    )}
                </Box>

                {/* Datos para transferencia */}
                {tipoPago === 'transferencia' && (
                    <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                        <Typography sx={{ fontWeight: "600", fontSize: "1em" }} gutterBottom>Datos para transferencia:</Typography>
                        <Box sx={{ mt: 1 }}>
                            <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                                <Grid item xs={5}><Typography color="text.secondary">Banco:</Typography></Grid>
                                <Grid item xs={7}><Typography color="text.primary" fontWeight="medium">Banco Nacional de México</Typography></Grid>
                                <Grid item xs={5}><Typography color="text.secondary">Cuenta:</Typography></Grid>
                                <Grid item xs={7}><Typography color="text.primary" fontWeight="medium">1234567890</Typography></Grid>
                                <Grid item xs={5}><Typography color="text.secondary">CLABE:</Typography></Grid>
                                <Grid item xs={7}><Typography color="text.primary" fontWeight="medium">002123456789012345</Typography></Grid>
                                <Grid item xs={5}><Typography color="text.secondary">Beneficiario:</Typography></Grid>
                                <Grid item xs={7}><Typography color="text.primary" fontWeight="medium">Wise Factura S.A. de C.V.</Typography></Grid>
                            </Grid>
                            <Divider sx={{ my: 1 }} />
                            <Typography>Monto a pagar: <strong>{formatCurrency(opcion.Costo)}</strong></Typography>
                        </Box>
                    </Box>
                )}
            </DialogContent>
            <DialogActions sx={{ flexDirection: 'column' }}>
                <Button variant="outlined" color="secondary" fullWidth onClick={onClose} sx={{ marginTop: '0.5em' }}>
                    Cancelar
                </Button>
            </DialogActions>

            {/* Snackbar para mostrar mensajes de error */}
            <Snackbar
                open={Boolean(alertMessage)}
                autoHideDuration={6000}
                onClose={handleCloseSnackbar}
                message={alertMessage}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity={severity} variant='filled' sx={{ width: '100%' }}>
                    {alertMessage}
                </Alert>
            </Snackbar>
        </Dialog>
    );
};

export default ModalPago;