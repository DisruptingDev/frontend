"use client";

import React from 'react';
import { Button, TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import FileInput from "@/components/FileInput/FileInput";
import { end } from '@formkit/drag-and-drop';

export default function AltaEmpresa({ register, setLugarExpedicion }) {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        console.log(file); // Aquí puedes manejar el archivo subido
    };

    return (
        <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={2}>Alta de Empresa</Typography>

            <Box
                display="grid"
                gridTemplateColumns="3fr 3fr 1fr 1fr 1fr"  // Diferentes anchos para cada columna
                gap={3}
                alignItems="end"  // Alinea todos los elementos al fondo de su celda
            >
                <FileInput
                    name="Certificado CSD"
                    sx={{ alignSelf: 'end', height: '100%' }}  // Asegura que el input ocupe toda la altura y se alinee al fondo
                />

                <FileInput
                    name="Archivo Key"
                    sx={{ alignSelf: 'end', height: '100%' }}  // Asegura que el input ocupe toda la altura y se alinee al fondo
                />

                <TextField
                    label="Contraseña"
                    type="password"
                    fullWidth
                    margin="normal"
                    required
                    sx={{ alignSelf: 'end', 'margin-bottom': '0px' }}  // Asegura que el input ocupe toda la altura y se alinee al fondo
                />

                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ alignSelf: 'end', height: '58%', fontSize: '12px' }}  // Asegura que el botón ocupe toda la altura y se alinee al fondo
                >
                    Cargar certificado
                </Button>
            </Box>


            <Box
                my={4}
                display="grid"
                gridTemplateColumns="1fr 1fr 1fr 1fr 2fr"  // Diferentes anchos para cada columna
                gap={3}
                alignItems="end"  // Alinea todos los elementos al fondo de su celda
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
                alignItems="end"  // Alinea todos los elementos al fondo de su celda
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
                    sx={{ width: '150px' }} // Ajusta el ancho del botón
                >
                    Cancelar
                </Button>

                <Button
                    variant="contained"
                    color="primary"
                    sx={{ width: '250px' }} // Ajusta el ancho del botón
                >
                    Guardar empresa
                </Button>
            </Box>
        </Box>

    );
}
