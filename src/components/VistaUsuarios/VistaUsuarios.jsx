import React, { useCallback, useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Box, Button, IconButton, Menu, MenuItem, Modal, Typography, Collapse, TextField
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { Password } from '@mui/icons-material';



function createData(item) {
  return { ...item };
}

const VistaUsuarios = ({token}) => {
    const [selectedRows, setSelectedRows] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    
    const [actualizar, setActualizar] = useState(false);
    
    // const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const usuarios = [
        {
            ID: 1,
            Nombre: 'Juan',
            Apellido: 'Perez',
            Email: 'Juan@gmail.com',
            Password: '123456',
            Rol: 'Admin',
            Activo: true,
        },
        {
            ID: 2,
            Nombre: 'Pedro',
            Apellido: 'Lopez',
            Email: 'pedro@gmail.com',
            Password: '123456',
            Rol: 'Admin',
            Activo: true,
        },
    ];

    // const fetchUsuarios = useCallback( async () => {
    //     if (token) {
    //         console.log('Fetching usuarios', token);
    //         try {
    //             const response = await fetch('http://Uusarios',{
    //                 headers: {
    //                     'Authorization': `Bearer ${token}`,
    //                 },
    //             });
    //             const data = await response.json();
    //             if (Array.isArray(data)) {
    //                 const transformedData = data.map((item) => createData(item));
    //                 const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
    //                 console.log('Usuarios:', sortedData);
    //                 setUsuarios(sortedData);
    //             }
    //             else {
    //                 console.error('Expected an array but received:', typeof data);
    //             }
    //         }
    //         catch (error) {
    //             console.error('Error fetching usuarios:', error);
    //         }
    //         finally {
    //             setLoading(false);
    //         }
    //     }
    // }, [token]);

    const handleMenuClick = (event, row) => {
        setAnchorEl(event.currentTarget);
        setMenuRow(row);
    }
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    }
    const handleSelectRow = (row) => {
        if (selectedRows.includes(row)) {
            setSelectedRows(selectedRows.filter((r) => r !== row));
        }
        else {
            setSelectedRows([...selectedRows, row]);
        }
    }
    return (
        <Box>
            <Box display="flex" justifyContent="flex-end" alignItems="center" mb={2}>
                {/* <Typography variant="h4">Usuarios</Typography> */}
                <Button variant="contained"
                disabled={selectedRows.length === 0}
                 color="primary"
                 sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                 >Agregar Usuario</Button>
            </Box>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                       <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                       <TableCell padding="checkbox" sx={{ textAlign: 'center' }} />
                       <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                            <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Nombre</TableCell>
                            <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Apellido</TableCell>
                            <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Email</TableCell>
                            <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Rol</TableCell>
                            {/* <TableCell>Activo</TableCell> */}
                            <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {usuarios.map((row) => (
                            <TableRow key={row.ID}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedRows.includes(row.ID)}
                                        onChange={() => handleSelectRow(row.ID)}
                                    />
                                </TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{row.ID}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{row.Nombre}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{row.Apellido}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{row.Email}</TableCell>
                                <TableCell sx={{ textAlign: 'center' }}>{row.Rol}</TableCell>
                                {/* <TableCell>{row.Activo ? 'Si' : 'No'}</TableCell> */}
                                <TableCell sx={{ textAlign: 'center' }}>
                                    <IconButton onClick={(event) => handleMenuClick(event, row)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
    

}
export default VistaUsuarios;