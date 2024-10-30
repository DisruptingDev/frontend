import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button } from '@mui/material';

const VistaPaquetes = ({ paquetes, selectedRows, handleSelectRow, handleVerComprobante }) => {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell padding="checkbox" sx={{ textAlign: 'center' }} />
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Opción</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Timbres</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Empresa</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Monto</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Estatus</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Comprobante</TableCell>

                    </TableRow>
                </TableHead>
                <TableBody>
                    {paquetes.map((paquete) => (
                        <TableRow key={paquete.PaqueteID}>
                            <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                                <Checkbox
                                    color="primary"
                                    checked={selectedRows.includes(paquete.ID)}
                                    onChange={() => handleSelectRow(paquete)}
                                    sx={{
                                        color: '#04b2ca',
                                        '&.Mui-checked': { color: '#028596' },
                                    }}
                                />
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.Paquete.Nombre}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.Paquete.CantidadTimbres}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.EmisorID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.Paquete.Costo}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.Estatus}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                {paquete.ComprobantePath ? (
                                    <Button
                                        variant="text"
                                        onClick={() => handleVerComprobante(paquete.ID)}>
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

export default VistaPaquetes;