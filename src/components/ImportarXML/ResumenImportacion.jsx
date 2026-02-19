"use client"
import React from 'react';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    Box, Typography, Paper, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Chip, Button,
    Alert, AlertTitle, Divider, Grid
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';

const ResumenImportacion = ({ open, handleClose, facturas, onConfirm }) => {
    
    const facturasValidas = facturas.filter(f => f.status === 'success' || f.status === 'warning');
    const facturasConError = facturas.filter(f => f.status === 'error');
    
    const totalFacturas = facturas.length;
    const totalValidas = facturasValidas.length;
    const totalErrores = facturasConError.length;

    const getStatusColor = (status) => {
        switch(status) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    const getStatusIcon = (status) => {
        switch(status) {
            case 'success': return <CheckCircleIcon fontSize="small" color="success" />;
            case 'warning': return <WarningIcon fontSize="small" color="warning" />;
            case 'error': return <ErrorIcon fontSize="small" color="error" />;
            default: return <InfoIcon fontSize="small" />;
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

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="lg" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <InfoIcon color="primary" />
                    <Typography variant="h6">Resumen de Importación</Typography>
                </Box>
            </DialogTitle>

            <DialogContent dividers>
                {/* Alertas de resumen */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} md={4}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 2, 
                                bgcolor: '#e8f5e8', 
                                border: '1px solid #4caf50',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="subtitle2" color="success.dark">
                                Facturas válidas
                            </Typography>
                            <Typography variant="h4" color="success.main">
                                {facturasValidas.length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 2, 
                                bgcolor: '#fff3e0', 
                                border: '1px solid #ff9800',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="subtitle2" color="warning.dark">
                                Con advertencias
                            </Typography>
                            <Typography variant="h4" color="warning.main">
                                {facturas.filter(f => f.status === 'warning').length}
                            </Typography>
                        </Paper>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Paper 
                            elevation={0} 
                            sx={{ 
                                p: 2, 
                                bgcolor: '#ffebee', 
                                border: '1px solid #f44336',
                                borderRadius: 2
                            }}
                        >
                            <Typography variant="subtitle2" color="error.dark">
                                Con errores
                            </Typography>
                            <Typography variant="h4" color="error.main">
                                {facturasConError.length}
                            </Typography>
                        </Paper>
                    </Grid>
                </Grid>

                {/* Tabla de facturas */}
                <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell>Estado</TableCell>
                                <TableCell>Archivo</TableCell>
                                <TableCell>Serie-Folio</TableCell>
                                <TableCell>RFC Receptor</TableCell>
                                <TableCell>Total</TableCell>
                                <TableCell>UUID</TableCell>
                                <TableCell>Observaciones</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {facturas.map((factura, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Chip
                                            icon={getStatusIcon(factura.status)}
                                            label={factura.status === 'success' ? 'Válido' :
                                                   factura.status === 'warning' ? 'Advertencias' : 'Error'}
                                            color={getStatusColor(factura.status)}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                                            {factura.fileName}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {factura.serie && factura.folio ? 
                                            `${factura.serie}-${factura.folio}` : 
                                            <Typography variant="caption" color="textSecondary">
                                                Sin información
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {factura.rfc || 
                                            <Typography variant="caption" color="textSecondary">
                                                N/A
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {factura.data?.Total ? 
                                            formatMoneda(factura.data.Total) : 
                                            <Typography variant="caption" color="textSecondary">
                                                $0.00
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {factura.data?.UUID || factura.data?.infoTimbrado?.UUID ? 
                                            <Typography variant="caption" noWrap sx={{ maxWidth: 100 }}>
                                                {(factura.data?.UUID || factura.data?.infoTimbrado?.UUID || '').substring(0, 8)}...
                                            </Typography> : 
                                            <Typography variant="caption" color="textSecondary">
                                                Sin UUID
                                            </Typography>
                                        }
                                    </TableCell>
                                    <TableCell>
                                        {factura.status === 'error' && factura.errors && (
                                            <Chip
                                                size="small"
                                                label={factura.errors[0]?.substring(0, 30) + '...'}
                                                color="error"
                                                variant="outlined"
                                            />
                                        )}
                                        {factura.status === 'warning' && factura.advertencias && (
                                            <Chip
                                                size="small"
                                                label={`${factura.advertencias.length} advertencia(s)`}
                                                color="warning"
                                                variant="outlined"
                                            />
                                        )}
                                        {factura.status === 'success' && (
                                            <Chip
                                                size="small"
                                                label="OK"
                                                color="success"
                                                variant="outlined"
                                            />
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Detalle de errores */}
                {facturasConError.length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Alert severity="error">
                            <AlertTitle>Errores de validación</AlertTitle>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {facturasConError.map((factura, idx) => (
                                    <li key={idx}>
                                        <Typography variant="body2">
                                            <strong>{factura.fileName}:</strong> {factura.errors?.join(', ')}
                                        </Typography>
                                    </li>
                                ))}
                            </ul>
                        </Alert>
                    </Box>
                )}

                {/* Advertencias */}
                {facturas.filter(f => f.status === 'warning' && f.advertencias?.length > 0).length > 0 && (
                    <Box sx={{ mt: 3 }}>
                        <Alert severity="warning">
                            <AlertTitle>Advertencias</AlertTitle>
                            <ul style={{ margin: 0, paddingLeft: 20 }}>
                                {facturas.filter(f => f.status === 'warning').map((factura, idx) => (
                                    factura.advertencias?.map((adv, advIdx) => (
                                        <li key={`${idx}-${advIdx}`}>
                                            <Typography variant="body2">
                                                <strong>{factura.fileName}:</strong> {adv}
                                            </Typography>
                                        </li>
                                    ))
                                ))}
                            </ul>
                        </Alert>
                    </Box>
                )}

                {/* Nota informativa */}
                <Box sx={{ mt: 3, p: 2, bgcolor: '#f0f7ff', borderRadius: 1 }}>
                    <Typography variant="body2" color="info.dark">
                        <strong>Nota:</strong> Las facturas con advertencias pueden ser importadas, 
                        pero se recomienda revisar los detalles. Las facturas con errores críticos 
                        no podrán ser importadas.
                    </Typography>
                </Box>
            </DialogContent>

            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
                <Button 
                    onClick={handleClose}
                    variant="outlined"
                >
                    Cancelar
                </Button>
                <Button 
                    onClick={() => onConfirm(facturasValidas)}
                    variant="contained"
                    disabled={facturasValidas.length === 0}
                    sx={{ 
                        bgcolor: '#1b384a', 
                        '&:hover': { bgcolor: '#10232f' },
                        '&.Mui-disabled': {
                            bgcolor: '#cccccc'
                        }
                    }}
                >
                    Importar {facturasValidas.length} factura(s) válida(s)
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ResumenImportacion;