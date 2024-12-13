import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button } from '@mui/material';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import { formatCurrency } from '@/utils/formatCurrency';

export default function Paquetes({ paquetes }) {
    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Nombre</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Timbres</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Precio</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {paquetes.map((paquete) => (
                        <TableRow key={paquete.ID}>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.Nombre}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{paquete.CantidadTimbres}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(paquete.Costo)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )

}