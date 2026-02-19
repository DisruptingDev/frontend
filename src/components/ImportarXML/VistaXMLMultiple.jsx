"use client";
import React, { useState } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Button,
    IconButton,
    Collapse,
    Alert,
    Divider
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';

const VistaXMLMultiple = ({
    facturas = [],
    token,
    actualizarFacturas,
    onVerDetalle
}) => {
    const [expandedRows, setExpandedRows] = useState({});

    const handleEliminarFactura = (index) => {
        const nuevasFacturas = facturas.filter((_, i) => i !== index);
        actualizarFacturas(nuevasFacturas);
    };

    const toggleRow = (index) => {
        setExpandedRows(prev => ({
            ...prev,
            [index]: !prev[index]
        }));
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'success':
                return <CheckCircleIcon color="success" fontSize="small" />;
            case 'warning':
                return <WarningIcon color="warning" fontSize="small" />;
            case 'error':
                return <ErrorIcon color="error" fontSize="small" />;
            default:
                return null;
        }
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    const getStatusText = (status) => {
        switch(status) {
            case 'success': return 'Válida';
            case 'warning': return 'Con advertencias';
            case 'error': return 'Error';
            default: return 'Desconocido';
        }
    };

    const formatMoneda = (monto) => {
        if (!monto && monto !== 0) return '$0.00';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2
        }).format(monto);
    };

    if (!facturas || facturas.length === 0) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography variant="h6" color="textSecondary">
                    No hay facturas XML cargadas
                </Typography>
            </Box>
        );
    }

    // Estadísticas generales
    const totalFacturas = facturas.length;
    const validas = facturas.filter(f => f.status === 'success').length;
    const conAdvertencias = facturas.filter(f => f.status === 'warning').length;
    const conErrores = facturas.filter(f => f.status === 'error').length;

    return (
        <Box>
            {/* Resumen general */}
            <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: '#f8f9fa', border: '1px solid #e0e0e0' }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} md={3}>
                        <Typography variant="h6" gutterBottom>
                            Resumen de Carga
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                            {totalFacturas} factura(s) cargada(s)
                        </Typography>
                    </Grid>
                    <Grid item xs={12} md={9}>
                        <Box display="flex" gap={2} flexWrap="wrap">
                            <Chip
                                icon={<CheckCircleIcon />}
                                label={`Válidas: ${validas}`}
                                color="success"
                                variant="outlined"
                            />
                            <Chip
                                icon={<WarningIcon />}
                                label={`Con advertencias: ${conAdvertencias}`}
                                color="warning"
                                variant="outlined"
                            />
                            <Chip
                                icon={<ErrorIcon />}
                                label={`Con errores: ${conErrores}`}
                                color="error"
                                variant="outlined"
                            />
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* Tabla de facturas */}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                        <TableRow>
                            <TableCell padding="checkbox" />
                            <TableCell>Estado</TableCell>
                            <TableCell>Archivo</TableCell>
                            <TableCell>Serie-Folio</TableCell>
                            <TableCell>RFC Receptor</TableCell>
                            <TableCell>Total</TableCell>
                            <TableCell>UUID</TableCell>
                            <TableCell align="center">Acciones</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {facturas.map((factura, index) => (
                            <React.Fragment key={index}>
                                <TableRow 
                                    sx={{ 
                                        '& > *': { borderBottom: 'unset' },
                                        bgcolor: factura.status === 'error' ? '#fff2f2' : 'inherit'
                                    }}
                                >
                                    <TableCell padding="checkbox">
                                        <IconButton
                                            aria-label="expand row"
                                            size="small"
                                            onClick={() => toggleRow(index)}
                                        >
                                            {expandedRows[index] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                                        </IconButton>
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(factura.status)}
                                            label={getStatusText(factura.status)}
                                            color={getStatusColor(factura.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                            {factura.fileName || 'N/A'}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {factura.Serie && factura.Folio ? 
                                            `${factura.Serie}-${factura.Folio}` : 
                                            <Typography variant="caption" color="textSecondary">
                                                Sin información
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {factura.ReceptorRFC || 
                                            <Typography variant="caption" color="textSecondary">
                                                N/A
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {formatMoneda(factura.Total)}
                                    </TableCell>
                                    <TableCell>
                                        {factura.infoTimbrado?.UUID ? 
                                            <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                                                {factura.infoTimbrado.UUID.substring(0, 8)}...
                                            </Typography> : 
                                            <Typography variant="caption" color="textSecondary">
                                                Sin UUID
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell align="center">
                                        <Box display="flex" justifyContent="center" gap={1}>
                                            <IconButton
                                                size="small"
                                                color="primary"
                                                onClick={() => onVerDetalle && onVerDetalle(factura)}
                                                title="Ver detalle"
                                            >
                                                <VisibilityIcon fontSize="small" />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                color="error"
                                                onClick={() => handleEliminarFactura(index)}
                                                title="Eliminar"
                                            >
                                                <DeleteIcon fontSize="small" />
                                            </IconButton>
                                        </Box>
                                    </TableCell>
                                </TableRow>
                                <TableRow>
                                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={8}>
                                        <Collapse in={expandedRows[index]} timeout="auto" unmountOnExit>
                                            <Box sx={{ margin: 2 }}>
                                                <Typography variant="subtitle2" gutterBottom>
                                                    Detalles de Validación
                                                </Typography>
                                                
                                                {/* Advertencias si existen */}
                                                {factura.advertencias && factura.advertencias.length > 0 && (
                                                    <Alert severity="warning" sx={{ mb: 2 }}>
                                                        <Typography variant="body2" fontWeight="bold">
                                                            Advertencias:
                                                        </Typography>
                                                        <ul style={{ margin: 0, paddingLeft: 20 }}>
                                                            {factura.advertencias.map((adv, idx) => (
                                                                <li key={idx}>
                                                                    <Typography variant="body2">{adv}</Typography>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </Alert>
                                                )}

                                                {/* Información de emisor y receptor */}
                                                <Grid container spacing={2}>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Emisor:
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {factura.EmisorRFC} - {factura.Emisor?.Nombre || ''}
                                                        </Typography>
                                                        {factura.EmisorID && (
                                                            <Chip 
                                                                label={`ID: ${factura.EmisorID}`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ mt: 1 }}
                                                            />
                                                        )}
                                                    </Grid>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2" color="textSecondary">
                                                            Receptor:
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {factura.ReceptorRFC} - {factura.Receptor?.Nombre || ''}
                                                        </Typography>
                                                        {factura.ReceptorID && (
                                                            <Chip 
                                                                label={`ID: ${factura.ReceptorID}`}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ mt: 1 }}
                                                            />
                                                        )}
                                                    </Grid>
                                                </Grid>

                                                <Divider sx={{ my: 2 }} />

                                                {/* Conceptos (primeros 3) */}
                                                <Typography variant="body2" color="textSecondary" gutterBottom>
                                                    Conceptos:
                                                </Typography>
                                                {factura.Conceptos?.ListaConceptos?.slice(0, 3).map((concepto, idx) => (
                                                    <Box key={idx} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                                        <Typography variant="body2">
                                                            {concepto.Descripcion}
                                                        </Typography>
                                                        <Typography variant="body2">
                                                            {concepto.Cantidad} x ${concepto.ValorUnitario?.toFixed(2)}
                                                        </Typography>
                                                    </Box>
                                                ))}
                                                {factura.Conceptos?.ListaConceptos?.length > 3 && (
                                                    <Typography variant="caption" color="textSecondary">
                                                        ... y {factura.Conceptos.ListaConceptos.length - 3} concepto(s) más
                                                    </Typography>
                                                )}
                                            </Box>
                                        </Collapse>
                                    </TableCell>
                                </TableRow>
                            </React.Fragment>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Nota informativa */}
            <Box sx={{ mt: 2, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                <Typography variant="body2" color="info.dark">
                    <strong>Nota:</strong> Las facturas con estado &quot;Válida&quot; o &quot;Con advertencias&quot; pueden ser importadas.
                    Las facturas con estado &quot;Error&quot; no podrán ser importadas hasta que se corrijan los problemas.
                </Typography>
            </Box>
        </Box>
    );
};

export default VistaXMLMultiple;