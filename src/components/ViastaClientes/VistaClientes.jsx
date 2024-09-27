import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const VistaClientes = ( {setClienteIdEditar}) => {
   

    const [receptores, setReceptores] = useState([]);
    const [loading, setLoading] = useState(true);

    //Para el menu
    const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };
  const handleEditar = () => {
    setClienteIdEditar(menuRow.ID);
    handleMenuClose();
    
  };

    useEffect(() => {
        const fetchReceptores = async () => {
            try {
                const response = await fetch('http://31.220.31.152:8081/Catalogos/Receptor', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });
                const data = await response.json();
                setReceptores(data);
            } catch (error) {
                console.error('Error fetching receptores:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchReceptores();
    }, []);

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
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Calle</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Número Exterior</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Número Interior</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Colonia</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Municipio</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Estado</TableCell>
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
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.Calle}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.NumeroExterior}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.NumeroInterior}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.Colonia}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.Municipio}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{receptor.Estado}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                                <IconButton onClick={(event) => handleMenuClick(event, receptor)}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl)}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={handleEditar}>Editar</MenuItem>
                                    <MenuItem onClick={handleMenuClose}>Eliminar</MenuItem>


                                </Menu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default VistaClientes;