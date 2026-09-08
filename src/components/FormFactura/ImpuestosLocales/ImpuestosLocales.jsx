"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    TextField,
    Button,
    MenuItem,
    Table,
    TableHead,
    TableBody,
    TableRow,
    TableCell,
    IconButton,
    Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddCircleIcon from '@mui/icons-material/AddCircle';

// Catálogo de impuestos locales comunes en México
export const CATALOGO_IMPUESTOS_LOCALES = [
    {
        id: 'ISH_3.0',
        label: 'ISH - Hospedaje (3.00%)',
        nombre: 'ISH',
        tipo: 'Traslado',
        tasa: 3.00,
    },
    {
        id: 'ISH_3.5',
        label: 'ISH - Hospedaje CDMX (3.50%)',
        nombre: 'ISH',
        tipo: 'Traslado',
        tasa: 3.50,
    },
    {
        id: 'ISH_4.0',
        label: 'ISH - Hospedaje (4.00%)',
        nombre: 'ISH',
        tipo: 'Traslado',
        tasa: 4.00,
    },
    {
        id: 'ISH_5.0',
        label: 'ISH - Hospedaje Q. Roo / Nayarit (5.00%)',
        nombre: 'ISH',
        tipo: 'Traslado',
        tasa: 5.00,
    },
    {
        id: 'CEDULAR_2.0',
        label: 'Impuesto Cedular (2.00%)',
        nombre: 'Impuesto Cedular',
        tipo: 'Retencion',
        tasa: 2.00,
    },
    {
        id: 'CEDULAR_5.0',
        label: 'Impuesto Cedular (5.00%)',
        nombre: 'Impuesto Cedular',
        tipo: 'Retencion',
        tasa: 5.00,
    },
    {
        id: 'MILLAR_0.5',
        label: 'Retención 5 al millar (0.50%)',
        nombre: '5 al millar',
        tipo: 'Retencion',
        tasa: 0.50,
    },
    {
        id: 'MILLAR_0.2',
        label: 'Retención 2 al millar (0.20%)',
        nombre: '2 al millar',
        tipo: 'Retencion',
        tasa: 0.20,
    },
    {
        id: 'ISN_3.0',
        label: 'ISN - Nóminas (3.00%)',
        nombre: 'ISN',
        tipo: 'Traslado',
        tasa: 3.00,
    },
    {
        id: 'CUSTOM',
        label: 'Otro / Personalizado...',
        nombre: '',
        tipo: 'Traslado',
        tasa: 0.00,
    }
];

export default function ImpuestosLocales({ impuestosLocales = [], setImpuestosLocales }) {
    const [selectedPreset, setSelectedPreset] = useState('');
    const [tipo, setTipo] = useState('Traslado');
    const [nombre, setNombre] = useState('');
    const [tasa, setTasa] = useState('');
    const [importe, setImporte] = useState('');
    const [error, setError] = useState('');

    const handlePresetChange = (e) => {
        const val = e.target.value;
        setSelectedPreset(val);
        setError('');

        const preset = CATALOGO_IMPUESTOS_LOCALES.find(item => item.id === val);
        if (preset) {
            setTipo(preset.tipo);
            setNombre(preset.nombre);
            setTasa(preset.tasa > 0 ? String(preset.tasa) : '');
            // El campo de importe se mantiene abierto para captura manual
        }
    };

    const handleAgregar = () => {
        const nombreFinal = String(nombre || '').trim();
        const tasaNum = parseFloat(tasa);
        const importeNum = parseFloat(importe);

        if (!nombreFinal) {
            setError('Debe especificar el nombre del impuesto local.');
            return;
        }
        if (isNaN(tasaNum) || tasaNum < 0) {
            setError('Debe especificar una tasa porcentual válida (ej. 3.00).');
            return;
        }
        if (isNaN(importeNum) || importeNum <= 0) {
            setError('Debe ingresar un importe mayor a cero.');
            return;
        }

        const nuevoImpuesto = {
            id: Date.now().toString(),
            Tipo: tipo, // "Traslado" o "Retencion"
            Nombre: nombreFinal, // Ej: "ISH", "Impuesto Cedular"
            Tasa: tasaNum,
            TasaString: tasaNum.toFixed(2),
            Importe: Number(Math.abs(importeNum).toFixed(2)),
            ImporteString: Math.abs(importeNum).toFixed(2),
        };

        setImpuestosLocales([...impuestosLocales, nuevoImpuesto]);

        // Limpiar campos del formulario
        setSelectedPreset('');
        setNombre('');
        setTasa('');
        setImporte('');
        setError('');
    };

    const handleEliminar = (id) => {
        setImpuestosLocales(impuestosLocales.filter(item => item.id !== id));
    };

    const formatoMoneda = (val) => {
        const num = Number(val) || 0;
        return num.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
    };

    return (
        <Box
            bgcolor="white"
            mx={4}
            p={4}
            boxShadow={3}
            borderRadius={2}
            sx={{
                padding: '1rem',
                margin: 'auto',
                marginTop: '1rem',
                marginBottom: '1rem',
            }}
        >
            <Typography variant="h6" mb={3}>
                Impuestos Locales (Opcional)
            </Typography>

            {/* Fila de campos con los mismos estilos y tamaños estándar que Emisor, Receptor y Conceptos */}
            <Grid container spacing={3} alignItems="flex-start">
                {/* 1. Selector de Catálogo */}
                <Grid item xs={12} sm={6} md={3}>
                    <TextField
                        select
                        fullWidth
                        label="Impuesto Local"
                        value={selectedPreset}
                        onChange={handlePresetChange}
                    >
                        <MenuItem value="">
                            <em>-- Seleccione un impuesto --</em>
                        </MenuItem>
                        {CATALOGO_IMPUESTOS_LOCALES.map((item) => (
                            <MenuItem key={item.id} value={item.id}>
                                {item.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Grid>

                {/* 2. Tipo de Impuesto (Traslado vs Retención) */}
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        select
                        fullWidth
                        label="Tipo"
                        value={tipo}
                        onChange={(e) => setTipo(e.target.value)}
                    >
                        <MenuItem value="Traslado">Traslado (+)</MenuItem>
                        <MenuItem value="Retencion">Retención (-)</MenuItem>
                    </TextField>
                </Grid>

                {/* 3. Nombre / Clave SAT */}
                <Grid item xs={12} sm={6} md={2}>
                    <TextField
                        fullWidth
                        label="Nombre / Clave"
                        placeholder="Ej. ISH"
                        value={nombre}
                        onChange={(e) => {
                            setNombre(e.target.value);
                            setError('');
                        }}
                    />
                </Grid>

                {/* 4. Tasa (%) */}
                <Grid item xs={6} sm={3} md={1.5}>
                    <TextField
                        fullWidth
                        label="Tasa (%)"
                        type="number"
                        placeholder="3.00"
                        inputProps={{ step: "0.01", min: "0" }}
                        value={tasa}
                        onChange={(e) => {
                            setTasa(e.target.value);
                            setError('');
                        }}
                    />
                </Grid>

                {/* 5. Importe / Monto ($) - Abierto para captura manual */}
                <Grid item xs={6} sm={3} md={2}>
                    <TextField
                        fullWidth
                        label="Monto ($)"
                        type="number"
                        placeholder="0.00"
                        inputProps={{ step: "0.01", min: "0" }}
                        value={importe}
                        onChange={(e) => {
                            setImporte(e.target.value);
                            setError('');
                        }}
                    />
                </Grid>

                {/* 6. Botón Agregar perfectamente alineado */}
                <Grid item xs={12} md={1.5} display="flex" alignItems="center">
                    <Button
                        variant="contained"
                        fullWidth
                        startIcon={<AddCircleIcon />}
                        onClick={handleAgregar}
                        sx={{
                            height: '56px',
                            backgroundColor: '#1b384a',
                            '&:hover': { backgroundColor: '#10232f' },
                            fontWeight: 'bold',
                            textTransform: 'none',
                            fontSize: '0.95rem'
                        }}
                    >
                        Agregar
                    </Button>
                </Grid>
            </Grid>

            {error && (
                <Typography variant="body2" color="error" mt={1.5} sx={{ fontWeight: 500 }}>
                    {error}
                </Typography>
            )}

            {/* Tabla de impuestos locales agregados con estilos idénticos a Resumen */}
            {impuestosLocales.length > 0 && (
                <Box mt={4}>
                    <Table sx={{ width: '100%', border: '1px solid #e0e0e0', borderRadius: 2 }}>
                        <TableHead sx={{ backgroundColor: '#1b384a' }}>
                            <TableRow>
                                <TableCell sx={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>#</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo</TableCell>
                                <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Impuesto Local</TableCell>
                                <TableCell sx={{ color: 'white', textAlign: 'center', fontWeight: 'bold' }}>Tasa (%)</TableCell>
                                <TableCell sx={{ color: 'white', textAlign: 'right', fontWeight: 'bold' }}>Monto</TableCell>
                                <TableCell sx={{ color: 'white', textAlign: 'center', fontWeight: 'bold', width: '90px' }}>Acción</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {impuestosLocales.map((imp, idx) => (
                                <TableRow key={imp.id} sx={{ '&:hover': { backgroundColor: '#f5f5f5' } }}>
                                    <TableCell sx={{ textAlign: 'center' }}>{idx + 1}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={imp.Tipo === 'Traslado' ? 'Traslado (+)' : 'Retención (-)'}
                                            size="small"
                                            color={imp.Tipo === 'Traslado' ? 'info' : 'warning'}
                                            variant="outlined"
                                            sx={{ fontWeight: 'bold' }}
                                        />
                                    </TableCell>
                                    <TableCell sx={{ fontWeight: 500 }}>{imp.Nombre}</TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>{Number(imp.Tasa).toFixed(2)}%</TableCell>
                                    <TableCell sx={{ textAlign: 'right', fontWeight: 'bold', color: imp.Tipo === 'Traslado' ? '#0d9488' : '#e11d48' }}>
                                        {formatoMoneda(Math.abs(imp.Importe))}
                                    </TableCell>
                                    <TableCell sx={{ textAlign: 'center' }}>
                                        <IconButton
                                            size="small"
                                            onClick={() => handleEliminar(imp.id)}
                                            title="Eliminar impuesto local"
                                            sx={{
                                                backgroundColor: '#dc3545',
                                                color: 'white',
                                                '&:hover': { backgroundColor: '#c82333' }
                                            }}
                                        >
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Box>
            )}
        </Box>
    );
}
