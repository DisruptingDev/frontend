import React, { useState, useEffect } from 'react';
import Select from '../Select/Select';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Divider, Snackbar,
    Alert
} from '@mui/material';
import { set } from 'date-fns';
import { includes } from 'valibot';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import CheckoutButton from './BotonMercadoPago';
import { initMercadoPago } from '@mercadopago/sdk-react';

initMercadoPago('APP_USR-b8869ba5-ccd0-4d4b-9a25-8ba73e433482');

const ModalPago = ({ open, onClose, opcion, token, setCompra }) => {
    const [empresa, setEmpresa] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [alertMessage, setAlertMessage] = useState(''); // Estado para manejar mensajes de error
    const [severity, setSeverity] = useState('error'); // Severidad del mensaje
    const [beneficios, setBeneficios] = useState([]); // Beneficios 
    const [tipo, setTipo] = useState(''); // Tipo de compra
    const [disabled, setDisabled] = useState(false);
    const [deviceId, setDeviceId] = useState('');
    const [preferenceId, setPreferenceId] = useState('');


    useEffect(() => {
        const script = document.createElement("script");
        script.src = "https://www.mercadopago.com/v2/security.js";
        script.setAttribute("view", "checkout");
        document.body.appendChild(script);

        script.onload = () => {
            // Accede al Device ID generado automáticamente
            const deviceId = window.MP_DEVICE_SESSION_ID;
            console.log("Device ID:", deviceId);
            setDeviceId(deviceId);

            // Enviar el Device ID al backend (opcional)
            // sendDeviceIdToBackend(deviceId);
        };

        return () => {
            // Limpieza del script cuando el componente se desmonta
            document.body.removeChild(script);
        };
    }, []);

    useEffect(() => {
        console.log('Opción seleccionada:', opcion);
        if (opcion.Nombre.includes('Paquete')) {
            console.log('Es un paquete');
            setBeneficios([
                'Sin caducidad',
                'Pago único',
            ]);
            setTipo('Paquete');
        }
        else {
            console.log('Es un plan');
            setBeneficios([
                'Renovable mensualmente',
                'Planeación de timbres',
            ]);
            setTipo('Plan');

        }
    }, [opcion]);


    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value);
    }

    const handleFileUpload = (event) => {
        setArchivo(event.target.files[0]);
    };

    const toggleDetails = () => {
        setShowDetails(!showDetails);
    };

    const handleConfirmPago = async () => {
        let formData = {};
        let URL
        // Validar que todos los campos estén llenos
        if (!empresa && opcion.Nombre.includes('Paquete')) {
            setAlertMessage('Por favor, complete todos los campos.');
            setSeverity('error');
            return; // Salir de la función si hay campos vacíos
        }
        if (opcion.Nombre.includes('Plan')) {
            console.log('Es un plan');
            // Recuperar datos ingresados
            formData = {

                // archivo,
                PlanID: opcion.ID,
            };
            URL = `${apiUrl}/api/compratimbres/GenerarOrdenPlan`
        }
        else {
            console.log('Es un paquete');
            // Recuperar datos ingresados
            formData = {
                EmisorID: empresa,
                // archivo,
                PaqueteID: opcion.ID,
            }
            URL = `${apiUrl}/api/compratimbres/GenerarOrdenPaquete?deviceID=${deviceId}`
        }
        setDisabled(true);

        console.log('Datos a enviar:', formData);
        try {
            // Enviar datos al servidor
            const response = await fetch(URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            })


            if (response.ok) {
                console.log('Orden realizado con éxito', response);
                const data = await response.json();
                console.log('Data:', data);
                const linkPago = data.link;
                console.log('Link de pago:', linkPago);
                if (data.pref_id) {
                    setPreferenceId(data.pref_id);
                }

                setAlertMessage('Orden realizado con éxito.'); // Mensaje de éxito
                setSeverity('success'); // Cambiar severidad a éxito
                // Cerrar el modal después de confirmar
                // setTimeout(() => {

                //     onClose();
                //     if(linkPago){
                //         window.open(linkPago, '_blank');
                //         if(setCompra)setCompra(true);
                //     }

                // }, 1500);
            } else {
                console.error('Error en el pago:', response);
                setAlertMessage('Error al realizar el pago. Por favor, intente de nuevo.'); // Mensaje de error
            }

        } catch (error) {
            console.error('Error en el pago:', error);

        }

    };

    // Función para manejar el cierre del Snackbar
    const handleCloseSnackbar = () => {
        setAlertMessage('');
    };
    const handleEmpresa = (e) => {
        const data = JSON.parse(e.target.value);

        console.log(data.ID);
        setEmpresa(data.ID);


    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: "600", fontSize: "1.5em" }}>
                Realizar Orden
            </DialogTitle>
            <DialogContent>
                {/* Detalles de la compra */}
                <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: "600", fontSize: "1em" }}>
                            Detalles de la compra:
                        </Typography>
                        <Button size="small" onClick={toggleDetails}>
                            {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                        </Button>
                    </Box>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontWeight: "500", fontSize: "0.9em" }}>{opcion.Nombre}</Typography>
                        <Typography>{formatCurrency(opcion.Costo)}</Typography>
                    </Box>
                    <Typography color="textSecondary">{opcion.CantidadTimbres} Timbres </Typography>

                    {showDetails && (
                        <Box mt={1}>
                            <Divider sx={{ my: 1 }} />
                            <Typography variant="body2">
                                <strong>Tipo:</strong> {tipo}
                            </Typography>
                            <Typography variant="body2">
                                <strong>Características:</strong>
                            </Typography>
                            <ul style={{ paddingLeft: '16px', marginTop: '2px', marginBottom: '0px', listStyleType: 'disc', fontSize: "0.8em" }}>
                                {/* <li style={{ marginBottom: '2px' }}>100 timbres mensuales</li>
                                <li style={{ marginBottom: '2px' }}>Reinicio mensual a 100 timbres</li>
                                <li style={{ marginBottom: '2px' }}>Soporte por email</li> */}
                                {beneficios.map((beneficio, i) => (
                                    <li key={i} style={{ marginBottom: '2px' }}>{beneficio}</li>
                                ))}
                            </ul>
                        </Box>
                    )}
                </Box>

                {/* Datos para transferencia */}
                <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                    <Typography sx={{ fontWeight: "600", fontSize: "1em" }} gutterBottom>
                        Datos para transferencia:
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                        <Grid container spacing={1} sx={{ fontSize: '0.875rem' }}>
                            <Grid item xs={5}>
                                <Typography color="text.secondary">Banco:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography color="text.primary" fontWeight="medium">Banco Nacional de México</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography color="text.secondary">Cuenta:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography color="text.primary" fontWeight="medium">1234567890</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography color="text.secondary">CLABE:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography color="text.primary" fontWeight="medium">002123456789012345</Typography>
                            </Grid>
                            <Grid item xs={5}>
                                <Typography color="text.secondary">Beneficiario:</Typography>
                            </Grid>
                            <Grid item xs={7}>
                                <Typography color="text.primary" fontWeight="medium">CFDITotal S.A. de C.V.</Typography>
                            </Grid>
                        </Grid>
                        <Divider sx={{ my: 1 }} />
                        <Typography>
                            Monto a pagar: <strong>{formatCurrency(opcion.Costo)}</strong>
                        </Typography>
                        {/* <Typography variant="caption" color="text.secondary">
                            Por favor, realice la transferencia a la cuenta proporcionada y suba el comprobante de pago.
                        </Typography> */}
                    </Box>
                </Box>

                {opcion.Nombre.includes('Paquete') && (
                    // Seleccionar empresa
                    <Select
                        label="Seleccionar empresa"
                        url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                        id="ID"
                        clave=""
                        // value={empresa}
                        onChange={handleEmpresa}
                        descripcion="Nombre"
                    />
                )}

                {/* Subir comprobante */}
                {/* <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '4px', }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{borderBlockColor: '#1b384a', color:'#1b384a' }}
                    >
                        Seleccionar archivo
                        <input
                            type="file"
                            hidden
                            onChange={handleFileUpload}
                        />
                    </Button>
                    {archivo && (
                        <Box mt={1}>

                            <Typography mt={1} sx={{ fontWeight: '500', fontSize: '1rem', padding: '0.5em' }}>
                                Archivo seleccionado: <span style={{ fontWeight: 'bold' }}>{archivo.name}</span>
                            </Typography>
                        </Box>
                    )}
                </Box> */}
            </DialogContent>
            <DialogActions sx={{ flexDirection: 'column' }}>


                {preferenceId ? (<CheckoutButton preferenceId={preferenceId} />) : 
                <Button disabled={disabled} variant="contained" color="primary" fullWidth onClick={handleConfirmPago} sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}>
                    Generar orden
                </Button>}
                {preferenceId ? <Button  variant="contained" color="primary" fullWidth onClick={onClose} sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}>
                    Cerrar
                </Button> : null}

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
