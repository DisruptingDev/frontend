"use client"
import React, { useState, useEffect, useCallback } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function createData(item) {
    return { ...item };
}

const VistaClientes = ({ setClienteIdEditar, actualizar, token }) => {
    // Estados para gestionar los receptores y el estado de carga
    const [receptores, setReceptores] = useState([]);
    const [loading, setLoading] = useState(true);

    // Estados para manejar el menú contextual
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);

    // Maneja la apertura del menú contextual
    const handleMenuClick = (event, row) => {
        setAnchorEl(event.currentTarget); // Establece la posición del menú
        setMenuRow(row); // Asigna la fila seleccionada
    };

    // Maneja el cierre del menú contextual
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    // Maneja la acción de editar un cliente
    const handleEditar = () => {
        setClienteIdEditar(menuRow.ID); // Asigna el ID del cliente a editar
        handleMenuClose(); // Cierra el menú
    };

    // Función para obtener la lista de receptores desde la API
    const fetchReceptores = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    const transformedData = data.map((item) => createData(item));
                    const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
                    setReceptores(sortedData);
                } else {
                    console.error('Expected an array but received:', typeof data);
                }
            } catch (error) {
                console.error('Error fetching receptores:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);

    // Efecto para cargar los receptores al montar el componente
    useEffect(() => {
        fetchReceptores();
    }, [fetchReceptores, token]);

    // Efecto para actualizar la lista de receptores
    useEffect(() => {
        if (actualizar) {
            console.log('Actualizando');
            fetchReceptores();
        }
    }, [actualizar, fetchReceptores]);

    if (loading) {
        return <CircularProgress />;
    }

    return (

        <TableContainer component={Paper}>

            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>RFC</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Nombre</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Regimen Fiscal</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Domicilio Fiscal</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Uso CFDI</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {receptores.map((receptor) => (
                        <TableRow key={receptor.ID}>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.Rfc}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.Nombre}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.RegimenFiscalReceptor}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.DomicilioFiscalReceptor}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.UsoCFDI}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                {receptor.Rfc !== 'XAXX010101000' && (
                                    <React.Fragment>
                                        <IconButton onClick={(event) => handleMenuClick(event, receptor)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={handleMenuClose}
                                        >
                                            <MenuItem onClick={handleEditar}>Editar</MenuItem>
                                        </Menu>
                                    </React.Fragment>
                                )}

                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default VistaClientes;