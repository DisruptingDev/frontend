"use client"
import React, { useState } from 'react';
import {
    Button, Dialog, DialogActions, DialogContent, DialogTitle,
    Box, Typography, Alert, List, ListItem, ListItemIcon,
    ListItemText, Chip, LinearProgress, Paper, Divider
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DescriptionIcon from '@mui/icons-material/Description';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalXMLMultiple = ({ token, open, handleClose, handleUploadMultiple }) => {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [procesados, setProcesados] = useState([]);
    const [currentFileIndex, setCurrentFileIndex] = useState(0);

    const handleFileChange = (event) => {
        const selectedFiles = Array.from(event.target.files);
        setFiles(selectedFiles);
        setProcesados([]);
    };

    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };

    const validarArchivo = async (file, index) => {
        try {
            const fileContent = await readFileAsText(file);

            setCurrentFileIndex(index);

            const response = await fetch(`${apiUrl}/api/importarxml/validar-xml`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    xml_content: fileContent
                }),
            });

            const data = await response.json();

            console.log(`Respuesta para ${file.name}:`, data);

            if (response.ok) {
                // Separar errores críticos de advertencias
                const erroresCriticos = data.errores ? data.errores.filter(error =>
                    error.includes("TimbreFiscalDigital") ||
                    error.includes("ya existe") ||
                    error.includes("UUID")
                ) : [];

                const advertencias = data.errores ? data.errores.filter(error =>
                    !error.includes("TimbreFiscalDigital") &&
                    !error.includes("ya existe") &&
                    !error.includes("UUID")
                ) : [];

                // Verificar timbrado
                const estaTimbrado =
                    data.validaciones?.timbre_valido === true ||
                    data.factura_completa?.timbre?.UUID ||
                    data.comprobante?.timbre?.UUID;

                if (!estaTimbrado) {
                    return {
                        fileName: file.name,
                        success: false,
                        errors: ["El XML no contiene un timbre fiscal digital válido"],
                        status: 'error'
                    };
                }

                if (erroresCriticos.length === 0) {
                    // Éxito
                    return {
                        fileName: file.name,
                        success: true,
                        data: data.factura_completa || data.comprobante,
                        message: data.mensaje || "XML validado correctamente",
                        validaciones: data.validaciones,
                        xmlContentOriginal: fileContent,
                        facturaCompleta: data.factura_completa,
                        comprobante: data.comprobante,
                        advertencias: advertencias,
                        status: advertencias.length > 0 ? 'warning' : 'success',
                        serie: data.comprobante?.Serie || data.factura_completa?.Serie || 'N/A',
                        folio: data.comprobante?.Folio || data.factura_completa?.Folio || 'N/A',
                        rfc: data.comprobante?.Receptor?.RFC || data.factura_completa?.Receptor?.RFC || 'N/A'
                    };
                } else {
                    // Error crítico
                    return {
                        fileName: file.name,
                        success: false,
                        errors: erroresCriticos,
                        validaciones: data.validaciones,
                        comprobante: data.comprobante,
                        xmlContentOriginal: fileContent,
                        status: 'error',
                        serie: data.comprobante?.Serie || 'N/A',
                        folio: data.comprobante?.Folio || 'N/A',
                        rfc: data.comprobante?.Receptor?.RFC || 'N/A'
                    };
                }
            } else {
                return {
                    fileName: file.name,
                    success: false,
                    errors: [data.error || "Error al validar el XML"],
                    status: 'error'
                };
            }
        } catch (error) {
            console.error(`Error validando ${file.name}:`, error);
            return {
                fileName: file.name,
                success: false,
                errors: ["Error de conexión o formato inválido"],
                status: 'error'
            };
        }
    };

    const handleSubmit = async () => {
        if (files.length === 0) return;

        setLoading(true);
        setProcesados([]);

        const resultados = [];

        for (let i = 0; i < files.length; i++) {
            const resultado = await validarArchivo(files[i], i);
            resultados.push(resultado);
            setProcesados([...resultados]);
        }

        setLoading(false);

        // Contar resultados
        const exitosos = resultados.filter(r => r.status === 'success').length;
        const conAdvertencias = resultados.filter(r => r.status === 'warning').length;
        const errores = resultados.filter(r => r.status === 'error').length;

        // Si hay al menos un archivo válido, proceder
        if (exitosos + conAdvertencias > 0) {
            handleUploadMultiple(resultados);
            handleClose();
            setFiles([]);
            setProcesados([]);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'success':
                return <CheckCircleIcon color="success" />;
            case 'warning':
                return <WarningIcon color="warning" />;
            case 'error':
                return <ErrorIcon color="error" />;
            default:
                return <DescriptionIcon />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'success': return 'success';
            case 'warning': return 'warning';
            case 'error': return 'error';
            default: return 'default';
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" alignItems="center" gap={1}>
                    <CloudUploadIcon color="primary" />
                    <Typography variant="h6">Importación Múltiple de XML</Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Área de selección de archivos */}
                <Paper variant="outlined" sx={{ p: 3, mb: 3, bgcolor: '#f8f9fa' }}>
                    <Typography variant="subtitle1" gutterBottom>
                        Selecciona uno o varios archivos XML
                    </Typography>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                        Puedes seleccionar múltiples archivos manteniendo Ctrl (Windows) o Cmd (Mac)
                    </Typography>

                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        disabled={loading}
                        startIcon={<CloudUploadIcon />}
                        sx={{
                            borderColor: '#1b384a',
                            color: '#1b384a',
                            py: 1.5,
                            '&:hover': {
                                borderColor: '#10232f',
                                backgroundColor: 'rgba(27,56,74,0.04)'
                            }
                        }}
                    >
                        {loading ? 'Procesando...' : 'Seleccionar archivos XML'}
                        <input
                            type="file"
                            accept=".xml,application/xml,text/xml"
                            hidden
                            multiple
                            onChange={handleFileChange}
                            disabled={loading}
                        />
                    </Button>

                    {files.length > 0 && (
                        <Box mt={2}>
                            <Chip
                                label={`${files.length} archivo(s) seleccionado(s)`}
                                color="primary"
                                variant="outlined"
                            />
                        </Box>
                    )}
                </Paper>

                {/* Barra de progreso durante la validación */}
                {loading && (
                    <Box sx={{ width: '100%', mb: 3 }}>
                        <LinearProgress />
                        <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
                            Procesando archivo {currentFileIndex + 1} de {files.length}
                        </Typography>
                    </Box>
                )}

                {/* Resumen de archivos procesados */}
                {procesados.length > 0 && (
                    <Box mt={3}>
                        <Typography variant="subtitle1" gutterBottom>
                            Resultados de validación:
                        </Typography>

                        <List>
                            {procesados.map((result, index) => (
                                <ListItem
                                    key={index}
                                    sx={{
                                        border: '1px solid #e0e0e0',
                                        borderRadius: 1,
                                        mb: 1,
                                        bgcolor: '#ffffff'
                                    }}
                                >
                                    <ListItemIcon>
                                        {getStatusIcon(result.status)}
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {result.fileName}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    label={result.serie && result.folio ? `${result.serie}-${result.folio}` : 'Sin folio'}
                                                    variant="outlined"
                                                />
                                            </Box>
                                        }
                                        secondary={
                                            result.status === 'error' ? (
                                                <Typography variant="caption" color="error">
                                                    {result.errors?.join(', ')}
                                                </Typography>
                                            ) : result.advertencias?.length > 0 ? (
                                                <Typography variant="caption" color="warning.main">
                                                    {result.advertencias.length} advertencia(s)
                                                </Typography>
                                            ) : (
                                                <Typography variant="caption" color="success.main">
                                                    Válido - RFC: {result.rfc}
                                                </Typography>
                                            )
                                        }
                                    />
                                    <Chip
                                        label={result.status === 'success' ? 'Válido' :
                                            result.status === 'warning' ? 'Con advertencias' : 'Error'}
                                        color={getStatusColor(result.status)}
                                        size="small"
                                    />
                                </ListItem>
                            ))}
                        </List>

                        {/* Estadísticas */}
                        <Paper variant="outlined" sx={{ p: 2, mt: 2, bgcolor: '#f5f5f5' }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Resumen:
                            </Typography>
                            <Box display="flex" gap={2} flexWrap="wrap">
                                <Chip
                                    icon={<CheckCircleIcon />}
                                    label={`Válidos: ${procesados.filter(r => r.status === 'success').length}`}
                                    color="success"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<WarningIcon />}
                                    label={`Con advertencias: ${procesados.filter(r => r.status === 'warning').length}`}
                                    color="warning"
                                    variant="outlined"
                                />
                                <Chip
                                    icon={<ErrorIcon />}
                                    label={`Con errores: ${procesados.filter(r => r.status === 'error').length}`}
                                    color="error"
                                    variant="outlined"
                                />
                            </Box>
                        </Paper>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                <Button onClick={handleClose} disabled={loading}>
                    Cancelar
                </Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    disabled={files.length === 0 || loading}
                    sx={{
                        bgcolor: '#1b384a',
                        '&:hover': { bgcolor: '#10232f' },
                        '&.Mui-disabled': {
                            bgcolor: '#cccccc'
                        }
                    }}
                >
                    {loading ? 'Validando...' : `Validar ${files.length} archivo(s)`}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalXMLMultiple;