import React from 'react';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Box} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

export default function AdministrarEmpresas() {
    const empresas = [
        { id: '02', nombre: 'Empresa Demo Uno S.A de C.V.', rfc: 'EDU230803RLM', timbres: '1,000', estatus: 'Activa' },
        { id: '05', nombre: 'Empresa Demo Uno S.A de C.V.', rfc: 'EDU230803RLM', timbres: '874', estatus: 'Activa' },
    ];

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow style={{ backgroundColor: '#00ACC1' }}>
                            <TableCell style={{ color: 'white' }}>ID</TableCell>
                            <TableCell style={{ color: 'white' }}>Empresa</TableCell>
                            <TableCell style={{ color: 'white' }}>RFC</TableCell>
                            <TableCell style={{ color: 'white' }}>Timbres disponibles</TableCell>
                            <TableCell style={{ color: 'white' }}>Estatus</TableCell>
                            <TableCell style={{ color: 'white' }}>Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {empresas.map((empresa) => (
                            <TableRow key={empresa.id} style={{ backgroundColor: empresa.id === '05' ? '#f5f5f5' : 'white' }}>
                                <TableCell>{empresa.id}</TableCell>
                                <TableCell>{empresa.nombre}</TableCell>
                                <TableCell>{empresa.rfc}</TableCell>
                                <TableCell>{empresa.timbres}</TableCell>
                                <TableCell>{empresa.estatus}</TableCell>
                                <TableCell>
                                    <IconButton>
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
};


