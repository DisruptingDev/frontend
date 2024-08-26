import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';
import FileInput from "@/components/FileInput/FileInput";
import Select from "@/components/Select/Select.jsx";

export default function AltaEmpresa({ onClose }) {

    const [csdFile, setCsdFile] = useState(null);
    const [keyFile, setKeyFile] = useState(null);
    const [password, setPassword] = useState('');
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const handleFileChange = (event, setFile) => {
        const file = event.target.files[0];
        if (file) {
            setFile(file);
            console.log(`Archivo seleccionado: ${file.name}`);
        } else {
            console.error("No se seleccionó ningún archivo");
        }
    };

    const handleFileSubmit = async () => {
        if (!csdFile || !keyFile || !password) {
            console.error("Todos los campos son obligatorios");
            return;
        }

        const formData = new FormData();
        formData.append('CSD', csdFile);
        formData.append('KEY', keyFile);
        formData.append('PASS', password);

        try {
            const response = await fetch('http://31.220.31.152:8083/SubirCSD', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error al subir los archivos: ${response.statusText} - ${errorText}`);
            }

            const data = await response.json();
            console.log(data);

            if (data.status === 'success') {
                setSnackbarMessage(data.data);
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
            }

        } catch (error) {
            console.error('Error al subir los archivos:', error);
            setSnackbarMessage('Error al subir los archivos');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
        }
    };


    return (
        <Box>
            <Typography variant="h6" mb={2}>Alta de Empresa</Typography>
            <Box
                display="grid"
                gridTemplateColumns="3fr 3fr 1fr 1fr 1fr"
                gap={3}
                alignItems="end"
            >
                <FileInput
                    name="Certificado CSD"
                    onChange={(event) => handleFileChange(event, setCsdFile)}
                />

                <FileInput
                    name="Archivo Key"
                    onChange={(event) => handleFileChange(event, setKeyFile)}
                />

                <TextField
                    label="Contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{
                        alignSelf: 'end', height: '58%', fontSize: '12px', backgroundColor: '#04b2ca',
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
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                    }}
                    style={{ padding: '12px' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>

           
        </Box>
    );
}
