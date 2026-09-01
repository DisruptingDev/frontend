"use client"

import { CalculosFinales } from "./Calculos/Calculo.js";
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Grid, Button, TextField } from '@mui/material';
import {
    Edit, Delete
} from '@mui/icons-material';


export default function Resumen({ children, conceptos, subTotal, Descuento, handleEditConcepto, handleDeleteConcepto, register }) {
    let finales = CalculosFinales(conceptos);


    const formatoMoneda = (valor) => {
        return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    return (
        <Box bgcolor="white" mx={4} p={4} boxShadow={3} borderRadius={2}
            sx={{ padding: '1rem', margin: 'auto', marginTop: '1rem', marginBottom: '1rem', }}>
            
            {/* Campo de observaciones / descripcion */}
            <Box mb={4}>
                <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Observaciones / Información Adicional"
                    variant="outlined"
                    {...(register ? register("Descripcion") : {})}
                />
            </Box>

            <Typography variant="h6" mb={4}>Resumen</Typography>

            <Grid container spacing={1} sx={{ width: '100%', margin: 'auto' }}>
                <Grid item xs={12} xl={8}>
                    {/* Vista Escritorio */}
                    <Box sx={{ display: { xs: 'none', md: 'block' } }}>
                        <Table sx={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                            <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>#</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Clave Prod.</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Clave Unidad</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Concepto</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Cantidad</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Precio Unitario</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Descuento</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Traslados</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Retenciones</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Monto</TableCell>
                                    <TableCell sx={{ color: 'white', textAlign: 'center' }}>Acciones</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {conceptos.map((concepto, index) => (
                                    <TableRow key={index} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                        <TableCell sx={{ textAlign: 'center' }}>{index + 1}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{concepto.ClaveProdServ}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{concepto.ClaveUnidad}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{concepto.Descripcion}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{concepto.Cantidad}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{formatoMoneda(concepto.ValorUnitario)}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{formatoMoneda(concepto.Descuento)}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{formatoMoneda(concepto.TotalTraslados)}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>{formatoMoneda(concepto.TotalRetenciones)}</TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            {formatoMoneda(concepto.Subtotal + concepto.TotalTraslados - concepto.TotalRetenciones)}
                                        </TableCell>
                                        <TableCell sx={{ textAlign: 'center' }}>
                                            <Button
                                                variant="contained"
                                                sx={{ backgroundColor: '#ffc107', '&:hover': { backgroundColor: '#e0a800' }, marginRight: 1 }}
                                                onClick={() => handleEditConcepto(index)}
                                            >
                                                <Edit />
                                            </Button>
                                            <Button
                                                variant="contained"
                                                sx={{ backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }}
                                                onClick={() => handleDeleteConcepto(index)}
                                            >
                                                <Delete />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </Box>

                    {/* Vista Móvil */}
                    <Box sx={{ display: { xs: 'block', md: 'none' } }}>
                        {conceptos.map((concepto, index) => (
                            <Box key={index} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, mb: 2, p: 2, bgcolor: '#fafafa' }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 'bold', width: '100%', borderBottom: '1px solid #ccc', mb: 1 }}>
                                    Concepto #{index + 1}
                                </Typography>

                                <Grid container spacing={1}>
                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Clave Prod:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{concepto.ClaveProdServ}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Clave Unidad:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{concepto.ClaveUnidad}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Concepto:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{concepto.Descripcion}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Cantidad:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{concepto.Cantidad}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Precio Unitario:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{formatoMoneda(concepto.ValorUnitario)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Descuento:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{formatoMoneda(concepto.Descuento)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Traslados:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{formatoMoneda(concepto.TotalTraslados)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Retenciones:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{formatoMoneda(concepto.TotalRetenciones)}</Typography></Grid>

                                    <Grid item xs={6}><Typography variant="body2" fontWeight="bold">Monto:</Typography></Grid>
                                    <Grid item xs={6}><Typography variant="body2">{formatoMoneda(concepto.Subtotal + concepto.TotalTraslados - concepto.TotalRetenciones)}</Typography></Grid>
                                </Grid>

                                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        sx={{ backgroundColor: '#ffc107', '&:hover': { backgroundColor: '#e0a800' } }}
                                        onClick={() => handleEditConcepto(index)}
                                    >
                                        <Edit fontSize="small" />
                                    </Button>
                                    <Button
                                        variant="contained"
                                        size="small"
                                        sx={{ backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }}
                                        onClick={() => handleDeleteConcepto(index)}
                                    >
                                        <Delete fontSize="small" />
                                    </Button>
                                </Box>
                            </Box>
                        ))}
                    </Box>
                </Grid>

                {/* Tabla de resumen */}
                <Grid item xs={12} xl={4}>
                    <Table sx={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Subtotal:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>{formatoMoneda(finales.SubTotalFinal)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Descuento:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>{formatoMoneda(finales.DescuentoFinal)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Retenciones:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>{formatoMoneda(finales.RetencionesFinal)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Traslados:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>{formatoMoneda(finales.TrasladosFinal)}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Total:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>{formatoMoneda(finales.TotalFinal)}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Grid>
            </Grid>
            {children}

        </Box>
    );
}
