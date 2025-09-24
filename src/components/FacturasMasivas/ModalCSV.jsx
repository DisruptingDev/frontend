"use client"
import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography } from '@mui/material';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const ModalCSV = ({ token, open, handleClose, handleUpload }) => {
    const [file, setFile] = useState(null);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) return;

        const formData = new FormData();
        formData.append("ExcelFile", file, file.name); // `ExcelFile` es el nombre del campo esperado por la API

        try {
            const response = await fetch(`${apiUrl}/api/cargamasivafacturas/CargarFacturas`, {
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
                setFile(null); // Resetear el formulario
            } else {
                alert("Hubo un problema al subir el archivo. Inténtalo nuevamente.");
    
                // Resetear el formulario
                setFile(null);
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("Hubo un problema al subir el archivo. Inténtalo nuevamente.");
        }
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Subir Archivo</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ borderBlockColor: '#1b384a', color: '#1b384a' }}
                    >
                        Seleccionar archivo
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
                    Subir
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalCSV;
