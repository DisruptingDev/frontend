"use client"
import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';
import FileInput from "@/components/FileInput/FileInput";

export default function CertificadoCSD({ onUpdateEmpresa }) {
    const [csdFile, setCsdFile] = useState(null);
    const [keyFile, setKeyFile] = useState(null);
    const [password, setPassword] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const [csdFileError, setCsdFileError] = useState(false);
    const [keyFileError, setKeyFileError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);

    const handleFileChange = (event, setFile, setError) => {
        const file = event.target.files[0];
        if (file) {
            setFile(file);
            setError(false);
            console.log(`Archivo seleccionado: ${file.name}`);
        } else {
            console.error("No se seleccionó ningún archivo");
        }
    };

    const handleFileSubmit = async () => {
        let hasError = false;

        if (!csdFile) {
            setCsdFileError(true);
            hasError = true;
        } else {
            setCsdFileError(false);
        }

        if (!keyFile) {
            setKeyFileError(true);
            hasError = true;
        } else {
            setKeyFileError(false);
        }

        if (!password) {
            setPasswordError(true);
            hasError = true;
        } else {
            setPasswordError(false);
        }

        // if (hasError) {
        //     setSnackbarMessage('Por favor, complete todos los campos obligatorios.');
        //     setSnackbarSeverity('warning');
        //     setOpenSnackbar(true);
        //     return;
        // }

        const formData = new FormData();
        formData.append('CSD', csdFile);
        formData.append('KEY', keyFile);
        formData.append('PASS', password);

        try {
            const token = localStorage.getItem('authToken'); // Asumiendo que tu token está almacenado en localStorage

            const response = await fetch('http://31.220.31.152:8083/SubirCSD', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`, // Agrega el token en los encabezados
                },
                body: formData,
            });

            if (response.ok) {

                const data = await response.json();
                console.log(data);
                if (data.status === 'success') {
                    setSnackbarMessage(data.data);
                    setSnackbarSeverity('success');
                    setOpenSnackbar(true);

                    const { issuer_rfc, issuer_business_name } = data.CSD;
                    onUpdateEmpresa(issuer_business_name, issuer_rfc);
                }

                else if (data.status === 'error') {

                    const error = "Error al subir los archivos: " + data.error;
                    console.error('Error al subir los archivos:', error);

                    setSnackbarMessage(error);
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                }
            }
            else{
                
                console.error("Error al subir los archivos");
                setSnackbarMessage('Error al subir los archivos');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }



        } catch (error) {
            console.error('Error al subir los archivos:', error);
            setSnackbarMessage('Error al subir los archivos: ' + error);
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        }
    };

    return (
        <Box>
            <Typography variant="h6" mb={2}>Alta de Empresa</Typography>
            <Box
                display="grid"
                gridTemplateColumns="3fr 3fr 1.5fr 1.5fr 0.5fr"
                gap={3}
                alignItems="start"
            >
                <FileInput
                    name="Certificado CSD"
                    onChange={(event) => handleFileChange(event, setCsdFile, setCsdFileError)}
                    error={csdFileError} // Resalta el campo si hay un error
                />

                <FileInput
                    name="Archivo Key"
                    onChange={(event) => handleFileChange(event, setKeyFile, setKeyFileError)}
                    error={keyFileError} // Resalta el campo si hay un error
                />

                <TextField
                    label="Contraseña"
                    type="password"
                    fullWidth


                    required
                    value={password}
                    onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordError(false); // Elimina el error cuando el usuario escribe
                    }}
                    error={passwordError} // Resalta el campo si hay un error
                    helperText={passwordError && "Por favor, ingrese la contraseña."}
                    sx={{ marginTop: '36px' }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{
                        height: '56px', fontSize: '14px', backgroundColor: '#04b2ca', marginTop: '36px',
                        '&:hover': {
                            backgroundColor: '#038a9e',
                        },
                    }}
                    onClick={handleFileSubmit}
                >
                    Cargar certificado
                </Button>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                        padding: '12px'
                    }}

                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
