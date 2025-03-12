"use client"

import { CalculosFinales } from "./Calculos/Calculo.js";
import { Box, Typography, Table, TableHead, TableBody, TableRow, TableCell, Grid, Button } from '@mui/material';


export default function Resumen({ children, conceptos, subTotal, Descuento, handleEditConcepto, handleDeleteConcepto }) {
    let finales = CalculosFinales(conceptos);
    //console.log("Conceptos Resumen", conceptos);

    return (
        <Box bgcolor="white" mx={4} p={4} boxShadow={3} borderRadius={2}
                sx={{   padding: '1rem', margin:'auto', marginTop:'1rem', marginBottom:'1rem', }}>
            <Typography variant="h6" mb={4}>Resumen</Typography>

            <Grid container spacing={1} sx={{ width: '100%', margin: 'auto' }}>
                {/* Tabla de conceptos */}
                <Grid item xs={12} md={8}>
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
                                    <TableCell sx={{ textAlign: 'center' }}>{concepto.ValorUnitario}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>{concepto.Descuento}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>{concepto.TotalTraslados}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>{concepto.TotalRetenciones}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        {concepto.Subtotal + concepto.TotalTraslados - concepto.TotalRetenciones}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <Button
                                            variant="contained"
                                            sx={{ backgroundColor: '#ffc107', '&:hover': { backgroundColor: '#e0a800' }, marginRight: 1 }}
                                            onClick={() => handleEditConcepto(index)}
                                        >
                                            Editar
                                        </Button>
                                        <Button
                                            variant="contained"
                                            sx={{ backgroundColor: '#dc3545', '&:hover': { backgroundColor: '#c82333' } }}
                                            onClick={() => handleDeleteConcepto(index)}
                                        >
                                            Eliminar
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Grid>

                {/* Tabla de resumen */}
                <Grid item xs={12} md={4}>
                    <Table sx={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <TableBody>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Subtotal:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>$ {finales.SubTotalFinal}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Descuento:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>$ {finales.DescuentoFinal}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Retenciones:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>$ {finales.RetencionesFinal}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Traslados:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>$ {finales.TrasladosFinal}</TableCell>
                            </TableRow>
                            <TableRow>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white' }}>Total:</TableCell>
                                <TableCell sx={{ backgroundColor: '#1b384a', color: 'white', textAlign: 'right' }}>$ {finales.TotalFinal}</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </Grid>
            </Grid>
            {children}

        </Box>
    );
}
