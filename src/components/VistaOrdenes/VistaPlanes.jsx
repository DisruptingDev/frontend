import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button } from '@mui/material';
import { date } from 'valibot';
import { format } from 'date-fns';
import es from 'date-fns/locale/es'; // Para formatear en español
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaPlanes = ({ planes, selectedRows, handleSelectRow, handleVerComprobante, origen }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell padding="checkbox" sx={{ textAlign: 'center' }} />
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Opción</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Timbres</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha Activación</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Monto</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Estatus</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Comprobante</TableCell>

                    </TableRow>
                </TableHead>
                <TableBody>
                    {planes.map((plan) => (
                        <TableRow key={plan.ID}>
                            <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                                {origen === 'Pagos' ? (
                                    plan.Estatus === 'En proceso de revisión' ? (
                                        <Checkbox
                                            color="primary"
                                            checked={selectedRows.includes(plan.ID)}
                                            onChange={() => handleSelectRow(plan)}
                                            sx={{ color: '#04b2ca', '&.Mui-checked': { color: '#028596' } }}
                                        />
                                    ) : null
                                ) : (
                                    <Checkbox
                                        color="primary"
                                        checked={selectedRows.includes(plan.ID)}
                                        onChange={() => handleSelectRow(plan)}
                                        sx={{ color: '#04b2ca', '&.Mui-checked': { color: '#028596' } }}
                                    />
                                )}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.Plan.Nombre}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.Plan.CantidadTimbres}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.Estatus ==='Aprobada'? format(new Date(plan.FechaActivacion), 'dd/MM/yyyy', { locale: es }):''}</TableCell>
                          
                            <TableCell sx={{ textAlign: 'center' }}>{plan.Plan.Costo}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.Estatus}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                {plan.ComprobantePath ? (
                                    <Button
                                        variant="text"
                                        onClick={() => handleVerComprobante(plan.ID)}>
                                        Ver
                                    </Button>
                                ) : null}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default VistaPlanes;