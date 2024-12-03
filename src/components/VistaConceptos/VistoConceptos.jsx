import { useState, useEffect, useCallback } from "react";

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

const VistaConceptos = ({ token, actualizar, setActualizar }) => {

    const [conceptos, setConceptos] = useState([]);
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
    const fetchConceptos = useCallback(async () => {
        if (token) {
            console.log('Fetching conceptos', token);
            try {
                const response = await fetch(`${apiUrl}/api/conceptos/ListarConceptos`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    const transformedData = data.map((item) => createData(item));
                    const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
                    setConceptos(sortedData);
                }
                else {
                    console.error('Expected an array but received:', typeof data);
                }
            } catch (error) {
                console.error('Error fetching conceptos:', error);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchConceptos();
    }, [fetchConceptos, token]);

    useEffect(() => {
        if (actualizar) {
            fetchConceptos();
            setActualizar(false);
        }
    }, [actualizar, setActualizar, fetchConceptos]);

    return (
        <TableContainer component={Paper}>
            <Table>
                <TableHead>
                    <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ClaveProdServ</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ClaveUnidad</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Nombre</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Descripción</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Traslados</TableCell>
                        <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Retenciones</TableCell>
                        {/* <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acciones</TableCell> */}
                    </TableRow>
                </TableHead>
                <TableBody>
                    {conceptos.map((row) => (
                        <TableRow key={row.ID}>
                            <TableCell align="center">{row.ID}</TableCell>
                            <TableCell align="center">{row.ClaveProdServ}</TableCell>
                            <TableCell align="center">{row.ClaveUnidad}</TableCell>
                            <TableCell align="center">{row.Nombre}</TableCell>
                            <TableCell align="center">{row.Descripcion}</TableCell>

                            {/* Mostrar descripciones de todos los Traslados */}
                            <TableCell align="center">
                                {row.Impuestos.Traslados.length > 0
                                    ? row.Impuestos.Traslados.map((traslado) => traslado.ImpuestoCatalogo?.Descripcion).join(', ')
                                    : ''}
                            </TableCell>

                            {/* Mostrar descripciones de todos los Retenciones */}
                            <TableCell align="center">
                                {row.Impuestos.Retenciones.length > 0
                                    ? row.Impuestos.Retenciones.map((retencion) => retencion.ImpuestoCatalogo?.Descripcion).join(', ')
                                    : ''}
                            </TableCell>

                            {/* <TableCell align="center">
                                <IconButton onClick={(event) => handleMenuClick(event, row)}>
                                    <MoreVertIcon />
                                </IconButton>
                                <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                                    <MenuItem onClick={handleMenuClose}>Editar</MenuItem>
                                    <MenuItem onClick={handleMenuClose}>Eliminar</MenuItem>
                                </Menu>
                            </TableCell> */}
                        </TableRow>
                    ))}

                </TableBody>
            </Table>
            {/* <pre>{JSON.stringify(conceptos, null, 2)}</pre> */}

        </TableContainer>





    )
}
export default VistaConceptos;
