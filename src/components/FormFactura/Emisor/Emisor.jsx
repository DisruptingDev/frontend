"use client";
import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

export default function Emisor({ register, setLugarExpedicion, setValue, trigger, errors }) {
    const [emisor, setEmisor] = useState({});
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');

    useEffect(() => {
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setMinDate(formatDate(threeDaysAgo));
        setMaxDate(formatDate(today));
    }, []);

    // Cada vez que se selecciona un nuevo Emisor
    useEffect(() => {
        if (emisor && emisor.Rfc) {
            // Actualiza los valores de RFC y LugarExpedicion en react-hook-form
            setValue("RFCEmisor", emisor.Rfc);
            setValue("LugarExpedicion", emisor.LugarExpedicion);

            // Dispara la validación de estos campos
            trigger("RFCEmisor");
            trigger("LugarExpedicion");

            // También actualiza el lugar de expedición en el componente padre
            setLugarExpedicion(emisor.LugarExpedicion);
        }
    }, [emisor, setValue, setLugarExpedicion, trigger]);

    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value); // Asegura que es un JSON válido
            setEmisor(data);
            console.log(data);
        } catch (e) {
            console.error("El valor de emisor no es un JSON válido:", e.target.value);
        }
    };

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
                    trigger={trigger} // Pasa trigger como prop
                    nombre="Emisor"
                    url="http://31.220.31.152:8081/Catalogos/Emisor"
                    clave="Rfc"
                    descripcion="Nombre"
                    onChange={handleEmisorChange}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                />

                <TextField
                    label="RFC"
                    {...register("RFCEmisor", { required: "El RFC del emisor es requerido." })}
                    fullWidth
                    value={emisor.Rfc || ""}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f', // Cambia el borde a rojo si hay error
                            }
                        }
                    }}
                    error={!!errors.RFCEmisor} // Muestra error si hay errores en RFCEmisor
                    helperText={errors.RFCEmisor && errors.RFCEmisor.message}
                    disabled
                />

                <TextField
                    label="Lugar Expedicion"
                    {...register("LugarExpedicion", { required: "El lugar de expedición es requerido." })}
                    fullWidth
                    value={emisor.LugarExpedicion || ""}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f', // Cambia el borde a rojo si hay error
                            }
                        }
                    }}
                    error={!!errors.LugarExpedicion} // Muestra error si hay errores en LugarExpedicion
                    helperText={errors.LugarExpedicion && errors.LugarExpedicion.message}
                    disabled
                />

                <Select
                    register={register}
                    nombre="Serie"
                    url="http://31.220.31.152:8081/Catalogos/Serie"
                    clave="Codigo"
                    descripcion="Descripcion"
                    error={!!errors.Serie}
                    helperText={errors.Serie ? "Este campo es obligatorio" : ""}
                    {...register("Serie", { required: "La serie es requerida." })}
                />

                <TextField
                    label="Fecha"
                    type="date"
                    {...register("Fecha", { required: "La fecha es requerida." })}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={{
                        inputProps: { min: minDate, max: maxDate },
                    }}
                    error={!!errors.Fecha}
                    helperText={errors.Fecha && errors.Fecha.message}
                />

                <Select
                    register={register}
                    nombre="Divisa"
                    url=""
                    clave="Codigo"
                    descripcion="Descripcion"
                    error={!!errors.Divisa}
                    helperText={errors.Divisa ? "Este campo es obligatorio" : ""}
                    {...register("Divisa", { required: "La divisa es requerida." })}
                />

                <TextField
                    label="Tipo de cambio"
                    {...register("TipoCambio", { required: "El tipo de cambio es requerido." })}
                    fullWidth
                    disabled
                    error={!!errors.TipoCambio}
                    helperText={errors.TipoCambio && errors.TipoCambio.message}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f', // Cambia el borde a rojo si hay error
                            }
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
