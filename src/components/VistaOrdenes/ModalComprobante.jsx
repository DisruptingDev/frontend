import React, { useState } from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Button, Box, Typography, Table, TableBody, TableCell, TableRow, TextField, Grid, Divider,Snackbar,
    Alert
} from '@mui/material';

const ResumenOrdenesDialog = ({ open, onClose, ordenesSeleccionadas, totalAPagar, token }) => {
    const [showDetails, setShowDetails] = useState(false);
    const [archivo, setArchivo] = useState(null);
    const [alertMessage, setAlertMessage] = useState(''); // Estado para manejar mensajes de error
    const [severity, setSeverity] = useState('error'); // Severidad del mensaje

    const handleFileUpload = (event) => {
        setArchivo(event.target.files[0]);
    };
    // Función para formatear como moneda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value);
    };

    const SubirComprobante= async () => {
        if (archivo) {
            const ordenesID = ordenesSeleccionadas.map((orden) => orden.ID);
            const formData = new FormData();
            formData.append('comprobante', archivo);
            formData.append('ordenesID', JSON.stringify(ordenesID));
            console.log('Subiendo comprobante', formData);
            try {
                const response = await fetch('http://31.220.31.152:8092/SubirComprobante', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                });
                const data = await response.json();
                console.log(data);
                if (response.ok) {
                    setAlertMessage('Comprobante subido correctamente');
                    setSeverity('success');
                }
                else {
                    setAlertMessage(data.message);
                    setSeverity('error');
                }
            } catch (error) {
                setAlertMessage('Error al subir el comprobante');
                setSeverity('error');
            }
        }else{
            setAlertMessage('Seleccione un archivo');
            setSeverity('error');

        }
    };



    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: "600", fontSize: "1.5em" }}>
                Resumen de Órdenes
            </DialogTitle>
            <DialogContent >
                <Box mb={2} bgcolor="#f3f4f6" padding="0.4em" borderRadius="0.5em">
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Typography sx={{ fontSize: "1em" }}>
                            Órdenes a pagar:  <strong>{ordenesSeleccionadas.length}</strong>
                        </Typography>
                        <Typography sx={{ fontSize: "1em" }}>
                            Total: <strong>  {formatCurrency(totalAPagar)}</strong>
                        </Typography>
                    </Box>


                    <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={() => setShowDetails(!showDetails)}>
                            {showDetails ? 'Ocultar Detalles' : 'Mostrar Detalles'}
                        </Button>
                    </Box>
                    {showDetails && (
                        <Table sx={{ mt: 2 }}>
                            <TableBody>
                                {ordenesSeleccionadas.map((orden) => (
                                    <TableRow key={orden.ID}>
                                        <TableCell>{orden.EmisorID}</TableCell>
                                        <TableCell>{orden.PlanID? orden.Plan.ID: orden.Paquete.ID}</TableCell>
                                        <TableCell>{orden.PlanID? formatCurrency(orden.Plan.Costo): formatCurrency(orden.Paquete.Costo)}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </Box>

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
                            Monto a pagar: <strong> {formatCurrency(totalAPagar)}</strong>
                        </Typography>
                        {/* <Typography variant="caption" color="text.secondary">
                            Por favor, realice la transferencia a la cuenta proporcionada y suba el comprobante de pago.
                        </Typography> */}
                    </Box>
                </Box>

                <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '4px', }}>
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
                </Box>
            </DialogContent>
            <DialogActions>
            <Button onClick={SubirComprobante} variant="contained" color="primary" fullWidth sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }} >
                    Confirmar Pago
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResumenOrdenesDialog;
