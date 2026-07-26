'use client';
import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    Typography,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Link
} from '@mui/material';
import {
    CloudUpload as TimbrarIcon,
    Cancel as CancelIcon,
    CloudDownload as DescargarIcon
} from '@mui/icons-material';

export default function ModalDocumentosRelacionados({ open, onClose, uuid, onTimbrar, onCancelar, onDescargar, onFilterClick }) {
    const [documentos, setDocumentos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (open && uuid) {
            fetchDocumentos();
        } else {
            setDocumentos([]);
        }
    }, [open, uuid]);

    const fetchDocumentos = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`/api/facturas/documentos-relacionados/${encodeURIComponent(uuid)}`);
            if (!response.ok) {
                const errData = await response.json().catch(() => null);
                throw new Error(errData?.error || 'Error al obtener los documentos relacionados');
            }
            const data = await response.json();
            setDocumentos(data);
        } catch (err) {
            console.error('Error en fetchDocumentos:', err);
            setError(err.message || 'No se pudieron cargar los documentos relacionados.');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return '$0.00';
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(Number(value));
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Documentos Relacionados (Pagos)</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Typography color="error">{error}</Typography>
                ) : documentos.length === 0 ? (
                    <Typography>No se encontraron documentos de pago relacionados.</Typography>
                ) : (
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell><strong>ID</strong></TableCell>
                                    <TableCell><strong>Folio</strong></TableCell>
                                    <TableCell><strong>UUID</strong></TableCell>
                                    <TableCell><strong>Parcialidad</strong></TableCell>
                                    <TableCell><strong>Monto Pagado</strong></TableCell>
                                    <TableCell><strong>Saldo Insoluto</strong></TableCell>
                                    <TableCell><strong>Estatus</strong></TableCell>
                                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {documentos.map((doc, index) => (
                                    <TableRow key={doc.id || index}>
                                        <TableCell>{doc.id}</TableCell>
                                        <TableCell>
                                            {onFilterClick && doc.folio ? (
                                                <Link 
                                                    component="button"
                                                    variant="body2"
                                                    onClick={() => onFilterClick(doc.folio)}
                                                    sx={{ cursor: 'pointer', textDecoration: 'underline', fontWeight: 'bold' }}
                                                >
                                                    {doc.folio}
                                                </Link>
                                            ) : (
                                                doc.folio
                                            )}
                                        </TableCell>
                                        <TableCell sx={{ wordBreak: 'break-all' }}>{doc.uuid}</TableCell>
                                        <TableCell>{doc.numParcialidad || '-'}</TableCell>
                                        <TableCell>{formatCurrency(doc.montoPagado)}</TableCell>
                                        <TableCell>
                                            {formatCurrency(doc.saldoInsoluto)}
                                            {doc.saldoInsoluto === 0 && (
                                                <Chip label="Liquidada" color="success" size="small" sx={{ ml: 1 }} />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <Chip 
                                                label={doc.estatus} 
                                                color={doc.estatus === 'Cancelada' ? 'error' : (doc.estatus === 'Timbrada' ? 'success' : 'default')} 
                                                size="small" 
                                            />
                                        </TableCell>
                                        <TableCell align="center" sx={{ whiteSpace: 'nowrap' }}>
                                            {doc.estatus === 'No timbrada' && onTimbrar && (
                                                <Tooltip title="Timbrar">
                                                    <IconButton color="primary" onClick={() => onTimbrar(Number(doc.id))} size="small">
                                                        <TimbrarIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {doc.estatus === 'Timbrada' && onDescargar && (
                                                <Tooltip title="Descargar PDF">
                                                    <IconButton color="primary" onClick={() => onDescargar(Number(doc.id))} size="small">
                                                        <DescargarIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {doc.estatus === 'Timbrada' && onCancelar && (
                                                <Tooltip title="Cancelar">
                                                    <IconButton color="error" onClick={() => onCancelar(Number(doc.id))} size="small">
                                                        <CancelIcon fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="primary" variant="contained">
                    Cerrar
                </Button>
            </DialogActions>
        </Dialog>
    );
}
