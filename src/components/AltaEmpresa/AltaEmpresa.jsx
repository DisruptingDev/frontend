"use client";

import React, { useState } from 'react';
import { Button, TextField, Box, Typography, Snackbar, Alert } from '@mui/material';
import FileInput from "@/components/FileInput/FileInput";
import Select from "@/components/Select/Select.jsx";
import padding from 'tailwindcss-logical/plugins/padding';

export default function AltaEmpresa({ register, setLugarExpedicion }) {
    const [csdFile, setCsdFile] = useState(null);
    const [keyFile, setKeyFile] = useState(null);
    const [password, setPassword] = useState('');

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // Puede ser 'success', 'error', 'warning', 'info'

    const handleFileChange = (event, setFile) => {
        const file = event.target.files[0];
        if (file) {
            setFile(file);
            console.log(`Archivo seleccionado: ${file.name}`);
        } else {
            console.error("No se seleccionó ningún archivo");
        }
    };

    const handleSubmit = async () => {
        if (!csdFile || !keyFile || !password) {
            console.log("csd + key + pass", csdFile, keyFile, password);
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
        <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
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
                    sx={{ alignSelf: 'end', height: '58%', fontSize: '12px', backgroundColor: '#04b2ca',
                        '&:hover': {
                            backgroundColor: '#038a9e',
                        }, }}
                    onClick={handleSubmit}
                >
                    Cargar certificado
                </Button>
            </Box>

            {/* Snackbar para mostrar la notificación */}
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000} // 6 segundos
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
                    style={
                        { padding: '12px' }
                    }
                // sx={{ 
                //     width: '100%', 
                //     fontSize: '1.2rem', // Texto más grande
                //     backgroundColor: snackbarSeverity === 'success' ? '#4caf50' : '#f44336', // Colores sólidos
                //     color: 'white', // Color del texto
                // }}
                // style={{
                //     padding: '12px', // Aumentar el padding
                // }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>


            <Box
                my={4}
                display="grid"
                gridTemplateColumns="1fr 1fr 1fr 1fr 2fr"
                gap={3}
                alignItems="end"
            >
                <Select
                    register={register}
                    nombre="Emisor"
                    url="http://31.220.31.152:8081/Catalogos/Emisor"
                    clave="Nombre"
                    descripcion="NombreCompleto"
                    fullWidth
                    sx={{ alignSelf: 'end' }}
                />

                <TextField
                    label="R.F.C."
                    fullWidth
                    placeholder="EDS156842456"
                    margin="normal"
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <Select
                    register={register}
                    nombre="RegimenFiscal"
                    url="http://31.220.31.152:8081/Catalogos/RegimenFiscal"
                    clave="Descripcion"
                    descripcion="Descripcion"
                    fullWidth
                    required
                    sx={{ alignSelf: 'end' }}
                />

                <TextField
                    label="Lugar Expedición"
                    fullWidth
                    placeholder="Ej: CDMX"
                    margin="normal"
                    required
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />
            </Box>

            <Box
                my={4}
                display="grid"
                gridTemplateColumns="0.7fr 0.4fr 0.4fr 0.4fr 0.4fr 0.7fr 1fr"
                gap={3}
                alignItems="end"
            >
                <TextField
                    label="Calle"
                    fullWidth
                    placeholder="Ej: Av. Siempre Viva"
                    margin="normal"
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <TextField
                    label="Número exterior"
                    fullWidth
                    placeholder="Ej: 742"
                    margin="normal"
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <TextField
                    label="Número interior"
                    fullWidth
                    placeholder="Ej: 5"
                    margin="normal"
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <TextField
                    label="Colonia"
                    fullWidth
                    placeholder="Ej: Centro"
                    margin="normal"
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <TextField
                    label="Municipio"
                    fullWidth
                    placeholder="Ej: Benito Juárez"
                    margin="normal"
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}
                />

                <Select
                    register={register}
                    nombre="Estado"
                    url="http://31.220.31.152:8081/Catalogos/Estados"
                    clave="Nombre"
                    descripcion="Nombre"
                    fullWidth
                    sx={{ alignSelf: 'end' }}
                />
            </Box>
            <Box
                my={4}
                mx={20}
                display="flex"
                justifyContent="flex-end"
                gap={3}
            >
                <Button
                    variant="contained"
                    color="error"
                    sx={{ width: '150px', backgroundColor: '#da0404' }}
                >
                    Cancelar
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{
                        width: '250px',
                        backgroundColor: '#04b2ca',
                        '&:hover': {
                            backgroundColor: '#038a9e',
                        },
                    }}
                >
                    Guardar empresa
                </Button>
            </Box>
        </Box>
    );
}
