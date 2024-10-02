import React, { useState, useEffect } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, CircularProgress, Typography, IconButton,
    Menu,
    MenuItem,
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

function createData(item) {
    return { ...item };
  }
  
const VistaEmpresas = ( {setEmpresaIdEditar, actualizar}) => {
   

    const [emisores, setEmisores] = useState([]);
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
    setEmpresaIdEditar(menuRow.ID);
    handleMenuClose();
    
  };
  const fetchEmisores = async () => {
    try {
        const response = await fetch('http://31.220.31.152:8081/Catalogos/Emisor', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            },
        });
        const data = await response.json();
        console
        if (Array.isArray(data)) {
            const transformedData = data.map((item) => createData(item));
            const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
            // setRows(sortedData);
            setEmisores(sortedData);
          } else {
            console.error('Expected an array but received:', typeof data);
          }

    } catch (error) {
        console.error('Error fetching emisores:', error);
    } finally {
        setLoading(false);
    }
};

    useEffect(() => {

        fetchEmisores();
    }, []);

    useEffect(() => {
        if (actualizar) {
            console.log('Actualizando');
            fetchEmisores();
        }
    }
    , [actualizar]);

    if (loading) {
        return <CircularProgress />;
    }

    return (

        <TableContainer component={Paper}>

            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Nombre</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>RFC</TableCell>
                
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>TimbresDisponibles</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Estatus</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {emisores.map((emisor) => (
                        <TableRow key={emisor.ID}>
                            <TableCell sx={{ textAlign: 'center' }}>{emisor.ID}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{emisor.Nombre}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>{emisor.Rfc}</TableCell>
                            
                            <TableCell sx={{ textAlign: 'center' }}>{emisor.Grupo.TimbresDisponiblesPaquetes}</TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>Activa</TableCell>
                           
                            <TableCell sx={{ textAlign: 'center' }}>
                              
                
                                        <IconButton onClick={(event) => handleMenuClick(event, emisor)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                        
                                        <Menu
                                            anchorEl={anchorEl}
                                            open={Boolean(anchorEl)}
                                            onClose={handleMenuClose}
                                            
                                        >
                                            <MenuItem onClick={handleEditar}>Editar</MenuItem>
                                            {/* <MenuItem onClick={handleMenuClose}>Eliminar</MenuItem> */}
                                        </Menu>
                                  
                               
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    );
};

export default VistaEmpresas;