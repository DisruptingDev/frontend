"use client"
import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography } from '@mui/material';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalNomina = ({ token, open, handleClose, handleUpload, additionalData, uploadUrl }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("ExcelFile", file, file.name);

        if (additionalData) {
            Object.entries(additionalData).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }

        // Default endpoint or custom one
        const url = uploadUrl || `${apiUrl}/api/facturas/Facturas/ComplementoNomina`; // Guessing logic or waiting for user

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });
            const data = await response.json();
            console.log("Respuesta:", data);

            if (response.ok) {
                handleUpload(data);
                handleClose();
                setFile(null);
            } else {
                console.error("Error response from server:", data);
                const errorMsg = data?.message || data?.error || "Hubo un problema al subir la nómina. Verifica el endpoint o el archivo.";
                alert(`Error: ${errorMsg}`);
                setFile(null);
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("Hubo un problema de conexión al subir la nómina.");
        }
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Subir Nómina</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ borderBlockColor: '#1b384a', color: '#1b384a' }}
                    >
                        Seleccionar archivo de Nómina
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>
                    {file && (
                        <Box mt={1}>
                            <Typography mt={1} sx={{ fontWeight: '500', fontSize: '1rem', padding: '0.5em' }}>
                                Archivo seleccionado: <span style={{ fontWeight: 'bold' }}>{file.name}</span>
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} color="primary" disabled={!file}>
                    Subir Nómina
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalNomina;
