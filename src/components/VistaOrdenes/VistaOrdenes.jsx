import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, IconButton,
    Menu,
    MenuItem,
    TextField,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';



const VistaOrdenes = () => {

    const ordenes = [
        { ID: 1, Opcion: 'Opcion 1',
            Monto: 100, Fecha: '2022-01-01', Comprobante: '' },
        { ID: 2, Opcion: 'Opcion 2',
            Monto: 200, Fecha: '2022-02-02', Comprobante: 'comprobante1.pdf' },
        { ID: 3, Opcion: 'Opcion 3',
            Monto: 300, Fecha: '2022-03-03', Comprobante: '' },
    ];

    // Supongo que tienes una función para manejar el cambio del input de archivo
    const handleFileChange = (event, ordenId) => {
        // Aquí puedes manejar el archivo subido
        const file = event.target.files[0];
        // Lógica para manejar el archivo...
    };

    return (
        <TableContainer component={Paper}>

            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Opcion</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Monto</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Comprobante</TableCell>

                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {ordenes.map((orden) => (
                        <TableRow key={orden.ID}>
                            <TableCell sx={{ textAlign: 'center' }}>{orden.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{orden.Opcion}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{orden.Monto}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{orden.Fecha}</TableCell>

                            <TableCell sx={{ textAlign: 'center' }}>
                                {orden.Comprobante !== '' ? (
                                    // Si hay comprobante, mostrar el nombre del archivo
                                    <Typography variant="body2">{orden.Comprobante}</Typography>
                                ) : (
                                    // Si no hay comprobante, mostrar el input para subir archivo
                                    <TextField
                                        type="file"
                                        onChange={(event) => handleFileChange(event, orden.ID)} // Manejar el cambio
                                        inputProps={{ accept: '.pdf,.jpg,.png' }} // Aceptar tipos de archivo específicos
                                        sx={{ width: 'auto', height:'auto', padding:'0px'}} // Ajustar el tamaño según sea necesario
                                    />
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
}
export default VistaOrdenes;