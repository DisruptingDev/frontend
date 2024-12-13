import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Button } from '@mui/material';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import { formatCurrency } from '@/utils/formatCurrency';

export default function Planes({ planes }) {
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
                    {planes.map((plan) => (
                        <TableRow key={plan.ID}>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.Nombre}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{plan.CantidadTimbres}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(plan.Costo)}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )

}