import React, { useState } from 'react';
import Select from '../Select/Select';
import {
    Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Box, Grid, Divider, Snackbar,
    Alert
} from '@mui/material';
import { set } from 'date-fns';
import { includes } from 'valibot';

const ModalPago = ({ open, onClose, opcion, token}) => {
    const [empresa, setEmpresa] = useState('');
    const [archivo, setArchivo] = useState(null);
    const [showDetails, setShowDetails] = useState(false);
    const [alertMessage, setAlertMessage] = useState(''); // Estado para manejar mensajes de error
    const [severity, setSeverity] = useState('error'); // Severidad del mensaje


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
        // Validar que todos los campos estén llenos
        if (!empresa ) {
            setAlertMessage('Por favor, complete todos los campos.');
            setSeverity('error');
            return; // Salir de la función si hay campos vacíos
        }
        if(opcion.Nombre.includes('Plan')){
            console.log('Es un plan');
            // Recuperar datos ingresados
         formData = {
            
            // archivo,
            PlanID: opcion.ID,
        };
        }
        else{
            console.log('Es un paquete');
            // Recuperar datos ingresados
         formData = {
            EmisorID: empresa,
            // archivo,
            PaqueteID: opcion.ID,
        }
    }

    console.log('Datos a enviar:', formData);
    try {
         // Enviar datos al servidor
         const response = await fetch('http://31.220.31.152:8092/GenerarOrden', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify(formData),
        })
   

        if (response.ok) {
            console.log('Orden realizado con éxito');

            setAlertMessage('Orden realizado con éxito.'); // Mensaje de éxito
            setSeverity('success'); // Cambiar severidad a éxito
            // Cerrar el modal después de confirmar
            setTimeout(() => {

                onClose();
            }, 2000);
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
                                <strong>Tipo:</strong> Plan de Suscripción
                            </Typography>
                            <Typography variant="body2">
                                <strong>Características:</strong>
                            </Typography>
                            <ul style={{ paddingLeft: '16px', marginTop: '2px', marginBottom: '0px', listStyleType: 'disc', fontSize: "0.8em" }}>
                                {/* <li style={{ marginBottom: '2px' }}>100 timbres mensuales</li>
                                <li style={{ marginBottom: '2px' }}>Reinicio mensual a 100 timbres</li>
                                <li style={{ marginBottom: '2px' }}>Soporte por email</li> */}
                                {opcion.beneficios.map((beneficio, i) => (
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

                {/* Seleccionar empresa */}
                <Select
                    label="Seleccionar empresa"
                    url="http://31.220.31.152:8081/Catalogos/Emisor"
                    id="ID"
                    clave=""
                    // value={empresa}
                    onChange={handleEmpresa}
                    descripcion="Nombre"
                />

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
            <DialogActions>
                <Button variant="contained" color="primary" fullWidth onClick={handleConfirmPago} sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}>
                    Confirmar Pago
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
