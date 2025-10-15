"use client"
import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Typography } from '@mui/material';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalXML = ({ token, open, handleClose, handleUpload }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [xmlContentOriginal, setXmlContentOriginal] = useState('');

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) return;

        setLoading(true);

        try {
            // Leer el contenido del archivo XML
            const fileContent = await readFileAsText(file);
            setXmlContentOriginal(fileContent); // ✅ Guardar contenido original
            
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
            console.log("Respuesta completa:", data);

            if (response.ok) {
                if (data.valido) {
                    handleUpload({
                        success: true,
                        data: data.factura_completa || data.comprobante,
                        message: data.mensaje,
                        validaciones: data.validaciones,
                        xmlContentOriginal: fileContent
                    });
                } else {
                    handleUpload({
                        success: false,
                        errors: data.errores,
                        validaciones: data.validaciones
                    });
                }
                handleClose();
                setFile(null);
                setXmlContentOriginal('');
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
            </DialogContent>
            <DialogActions>
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
            </DialogActions>
        </Dialog>
    );
};

export default ModalXML;