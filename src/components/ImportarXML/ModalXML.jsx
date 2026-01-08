"use client"
import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Typography, Alert } from '@mui/material';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalXML = ({ token, open, handleClose, handleUpload }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [xmlContentOriginal, setXmlContentOriginal] = useState('');
    const [advertencias, setAdvertencias] = useState([]);
    const [facturaCompletaTemp, setFacturaCompletaTemp] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
        setAdvertencias([]); // Limpiar advertencias al cambiar archivo
    };

    const handleSubmit = async () => {
        if (!file) return;

        setLoading(true);
        setAdvertencias([]);

        try {
            // Leer el contenido del archivo XML
            const fileContent = await readFileAsText(file);
            setXmlContentOriginal(fileContent);

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

            if (response.ok) {
                // ✅ NUEVA LÓGICA: Separar errores críticos de advertencias
                setFacturaCompletaTemp(data.factura_completa || data.comprobante);

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

                setAdvertencias(advertencias);

                // Mostrar advertencias en el modal
                if (advertencias.length > 0) {
                    setAdvertencias(advertencias);
                    return; // No cerrar el modal, mostrar advertencias
                }

                if (erroresCriticos.length === 0) {
                    // ✅ ÉXITO: No hay errores críticos
                    handleUpload({
                        success: true,
                        data: data.factura_completa || data.comprobante,
                        message: data.mensaje || "XML validado correctamente",
                        validaciones: data.validaciones,
                        xmlContentOriginal: fileContent,
                        facturaCompleta: data.factura_completa,
                        comprobante: data.comprobante
                    });
                    handleClose();
                    setFile(null);
                    setXmlContentOriginal('');
                } else {
                    // ✅ ERROR CRÍTICO: Mostrar y cerrar
                    handleUpload({
                        success: false,
                        errors: erroresCriticos,
                        validaciones: data.validaciones,
                        comprobante: data.comprobante,
                        xmlContentOriginal: fileContent
                    });
                    handleClose();
                    setFile(null);
                    setXmlContentOriginal('');
                }
            } else {
                alert(`Error: ${data.error || "Hubo un problema al validar el XML"}`);
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("Error de conexión. Verifica la URL del servicio.");
        } finally {
            setLoading(false);
        }
    };

    const handleContinuarConAdvertencias = () => {
        if (!facturaCompletaTemp) return;

        handleUpload({
            success: true,
            data: facturaCompletaTemp,
            message: "XML validado con advertencias",
            xmlContentOriginal: xmlContentOriginal,
            advertencias: advertencias
        });

        handleClose();
        setFile(null);
        setAdvertencias([]);
        setXmlContentOriginal('');
    };


    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Subir Archivo XML</DialogTitle>
            <DialogContent>
                {/* Mostrar advertencias si existen */}
                {advertencias.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            <Typography variant="subtitle2" gutterBottom>
                                Advertencias de validación:
                            </Typography>
                            <ul style={{ margin: 0, paddingLeft: '20px' }}>
                                {advertencias.map((adv, index) => (
                                    <li key={index}>
                                        <Typography variant="body2">{adv}</Typography>
                                    </li>
                                ))}
                            </ul>
                        </Alert>
                        <Typography variant="body2" color="textSecondary">
                            ¿Desea continuar con la carga del XML?
                        </Typography>
                    </Box>
                )}

                {/* Formulario de subida (solo mostrar si no hay advertencias) */}
                {advertencias.length === 0 && (
                    <Box sx={{ mt: 2, p: 2, border: '1px dashed #ccc', borderRadius: '4px' }}>
                        <Typography variant="body2" color="textSecondary" gutterBottom>
                            Selecciona un archivo XML para validar
                        </Typography>
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            disabled={loading}
                            sx={{ borderColor: '#1b384a', color: '#1b384a', mt: 1 }}
                        >
                            {loading ? 'Procesando...' : 'Seleccionar archivo XML'}
                            <input
                                type="file"
                                accept=".xml,application/xml,text/xml"
                                hidden
                                onChange={handleFileChange}
                                disabled={loading}
                            />
                        </Button>
                        {file && (
                            <Box mt={2} p={1} bgcolor="#f5f5f5" borderRadius={1}>
                                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                                    Archivo seleccionado:
                                </Typography>
                                <Typography variant="body2">
                                    {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </Typography>
                            </Box>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                {advertencias.length > 0 ? (
                    // Botones cuando hay advertencias
                    <>
                        <Button onClick={() => setAdvertencias([])}>
                            Corregir
                        </Button>
                        <Button onClick={handleClose}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleContinuarConAdvertencias}
                            variant="contained"
                            sx={{ bgcolor: '#ff9800', '&:hover': { bgcolor: '#f57c00' } }}
                        >
                            Continuar con Advertencias
                        </Button>
                    </>
                ) : (
                    // Botones normales
                    <>
                        <Button onClick={handleClose} disabled={loading}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            variant="contained"
                            disabled={!file || loading}
                            sx={{ bgcolor: '#1b384a', '&:hover': { bgcolor: '#152a38' } }}
                        >
                            {loading ? 'Validando...' : 'Validar XML'}
                        </Button>
                    </>
                )}
            </DialogActions>
        </Dialog>
    );
};

export default ModalXML;