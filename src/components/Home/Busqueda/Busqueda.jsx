"use client";

import React, { useState } from 'react';
import { Box, Button, TextField } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import PickersMinMax from "@/components/PickersMinMax/PickersMinMax.jsx";
import 'react-datepicker/dist/react-datepicker.css';

export default function SearchFilter({ register }) {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());

    return (
        <Box
            sx={{
                backgroundColor: '#1d394d', // Fondo oscuro similar a la imagen proporcionada
                padding: '16px',
                borderRadius: '8px',
                boxShadow: 1,
                margin: 1,
                mt:6
            }}
        >
            <Box 
                sx={{
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(4, 1fr) auto', // 4 columnas para los inputs y 1 auto para el botón
                    gap: 4, 
                    alignItems: 'center'
                    
                }}
            >
                <Box sx={{ background: "white", borderRadius: "5px", color: "black", minWidth: '200px' }}>
                    <PickersMinMax />
                </Box>

                <Select
                    register={register}
                    nombre="Emisor"
                    url="http://31.220.31.152:8081/Catalogos/Emisor"
                    clave="Nombre"
                    descripcion="NombreCompleto"
                    sx={{ background: "white", borderRadius: "5px", color: "black", minWidth: '200px' }}
                    variant="filled"
                />
                <Select
                    register={register}
                    nombre="Receptor"
                    url="http://31.220.31.152:8081/Catalogos/Receptor"
                    clave="Rfc"
                    descripcion="Nombre"
                    sx={{ background: "white", borderRadius: "5px", color: "black", minWidth: '200px' }}
                    variant="filled"
                />
                <Select
                    register={register}
                    nombre="Usuario"
                    url="http://31.220.31.152:8081/Catalogos/Usuario"
                    clave="nombre"
                    descripcion="Nombre"
                    sx={{ background: "white", borderRadius: "5px", color: "black", minWidth: '200px' }}
                    variant="filled"
                />
                <Button
                    variant="contained"
                    color="primary"
                    sx={{ height: '90%', background: "white", color: "black" }} // Ocupa toda la altura de la fila
                >
                    Buscar
                </Button>
            </Box>
        </Box>
    );
}
