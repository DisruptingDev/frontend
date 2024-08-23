"use client";
import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

export default function Emisor({ register, setLugarExpedicion }) {
    const [emisor, setEmisor] = useState();
    const [rfc, setRFC] = useState();
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');

    useEffect(() => {
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const formatDateTime = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}`;
        };

        setMinDate(formatDateTime(threeDaysAgo));
        setMaxDate(formatDateTime(today));
    }, []);

    useEffect(() => {
        if (emisor !== undefined) {
            try {
                let data = JSON.parse(emisor);
                setRFC(data["Rfc"]);
                setLugarExpedicion(data["LugarExpedicion"]);
                console.log(data);
            } catch (e) {
                console.error("El valor de emisor no es un JSON válido:", emisor);
            }
        }
    }, [emisor]);

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={4}>Datos del Emisor</Typography>
            <Box
                display="grid"
                gap={3}
                sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr'
                    }
                }}
            >
                <Select
                    register={register}
                    nombre="Emisor"
                    url="http://31.220.31.152:8081/Catalogos/Emisor"
                    clave="Rfc"
                    descripcion="Nombre"
                    onChange={(e) => setEmisor(e.target.value)}
                />

                <TextField
                    label="RFC"
                    value={rfc || ""}
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                    disabled
                />

                <TextField
                    label="Lugar Expedicion"
                    {...register("LugarExpedicion")}
                    fullWidth
                    value={emisor ? JSON.parse(emisor)["LugarExpedicion"] : ""}
                    onChange={(e) => setLugarExpedicion(e.target.value)}
                    disabled
                />

                <Select
                    register={register}
                    nombre="Serie"
                    url="http://31.220.31.152:8081/Catalogos/Serie"
                    clave="Codigo"
                    descripcion="Descripcion"
                />

                <TextField
                    label="Fecha"
                    type="datetime-local"
                    {...register("Fecha")}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={{
                        inputProps: { min: minDate, max: maxDate, step: 1 },
                    }}
                />

                <Select
                    register={register}
                    nombre="Divisa"
                    url="http://31.220.31.152:8081/Catalogos/Divisa"
                    clave="Codigo"
                    descripcion="Descripcion"
                />

                <TextField
                    label="Tipo de cambio"
                    {...register("TipoCambio")}
                    fullWidth
                    onChange={(e) => setLugarExpedicion(e.target.value)}
                    disabled
                />
            </Box>
        </Box>
    );
}
