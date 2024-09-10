"use client";
import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { set } from 'date-fns';

export default function Emisor({ register, setValue, getValues, trigger, errors, emisorData }) {
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

    // Actualiza los valores del formulario cuando emisorData cambia
    useEffect(() => {
        if (emisorData) {
            console.log('EmisorEdit', emisorData);
            setEmisor(emisorData);
            //Checar, posible usar un useState
            setValue("Emisor", emisorData.ID);
            setValue("EmisorID", emisorData.ID);
            setValue("RFCEmisor", emisorData.Rfc);
            setValue("LugarExpedicion", emisorData.LugarExpedicion);
            setValue("NombreEmisor", emisorData.Nombre);
            setValue("Calle", emisorData.Calle);
            setValue("NoExterior", emisorData.NumeroExterior);
            setValue("NoInterior", emisorData.NumeroInterior);
            setValue("ColoniaEmisor", emisorData.Colonia);
            setValue("MunicipioEmisor", emisorData.Municipio);
            setValue("EstadoEmisor", emisorData.Estado);
            setValue("RegimenFiscalEmisor", emisorData.RegimenFiscal);
            setValue("LogoEmisor", emisorData.LogoPath);
            setValue("Serie", emisorData.Serie);

            // Solo establece la fecha si no está definida
            if (!getValues("Fecha")) {
                const formattedDate = emisorData.Fecha ? new Date(emisorData.Fecha).toISOString().split('T')[0] : '';
                setValue("Fecha", formattedDate);
            }

            // Dispara la validación de estos campos
            trigger(["Emisor","RFCEmisor", "LugarExpedicion", "NombreEmisor", "RegimenFiscalEmisor", "Serie", "Fecha"]);
        }
    }, [emisorData, setValue, trigger, getValues]);

     // Cada vez que se selecciona un nuevo Emisor
     useEffect(() => {
        if (emisor && emisor.Rfc) {
            // Actualiza los valores de RFC y LugarExpedicion en react-hook-form
            setValue("Emisor", emisor.ID);
            setValue("RFCEmisor", emisor.Rfc);
            setValue("LugarExpedicion", emisor.LugarExpedicion);
            setValue("NombreEmisor", emisor.Nombre);
            setValue("Calle", emisor.Calle)
            setValue("NoExterior", emisor.NumeroExterior)
            setValue("NoInterior", emisor.NumeroInterior)
            setValue("ColoniaEmisor", emisor.Colonia)
            setValue("MunicipioEmisor", emisor.Municipio)
            setValue("EstadoEmisor", emisor.Estado)
            setValue("RegimenFiscalEmisor", emisor.RegimenFiscal)
            setValue("LogoEmisor", emisor.LogoPath)


            // Dispara la validación de estos campos
            trigger("RFCEmisor");
            trigger("LugarExpedicion");

     
        }
    }, [emisor, setValue,  trigger]);
    useEffect(() => {
        // Establece el valor por defecto para 'Divisa'
        setValue('Divisa', 'MXN'); // Por ejemplo, 'MXN' como valor por defecto
    }, [setValue]);

    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setEmisor(data);
            console.log(data);
        } catch (error) {
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
                    trigger={trigger}
                    nombre="Emisor"
                    url="http://31.220.31.152:8081/Catalogos/Emisor"
                    id="ID"
                    clave=""
                    descripcion="Nombre"
                    onChange={handleEmisorChange}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                    value={getValues("EmisorID") || ""}
                />

                <TextField
                    label="RFC"
                    {...register("RFCEmisor", { required: "El RFC del emisor es requerido." })}
                    fullWidth
                    value={getValues("RFCEmisor") || ""}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f',
                            }
                        }
                    }}
                    error={!!errors.RFCEmisor}
                    helperText={errors.RFCEmisor && errors.RFCEmisor.message}
                    disabled
                />

                <TextField
                    label="Lugar Expedicion"
                    {...register("LugarExpedicion", { required: "El lugar de expedición es requerido." })}
                    fullWidth
                    value={getValues("LugarExpedicion") || ""}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f',
                            }
                        }
                    }}
                    error={!!errors.LugarExpedicion}
                    helperText={errors.LugarExpedicion && errors.LugarExpedicion.message}
                    disabled
                />

                <Select
                    register={register}
                    nombre="Serie"
                    url="http://31.220.31.152:8081/Catalogos/Serie"
                    id="Clave"
                    descripcion="Descripcion"
                    error={!!errors.Serie}
                    helperText={errors.Serie ? "Este campo es obligatorio" : ""}
                    value={getValues("Serie") || ""}
                />

                <TextField
                    label="Fecha"
                    type="date"
                    // {...register("Fecha", { required: "La fecha es requerida." })}
                    {...register("Fecha", { 
                        required: "La fecha es requerida.",
                        validate: {
                            notTooOld: (value) => {
                                const currentDate = new Date();
                                const inputDate = new Date(value);
                                const threeDaysAgo = new Date();
                                threeDaysAgo.setDate(currentDate.getDate() - 3);
                                return inputDate >= threeDaysAgo || "Fecha invalida";
                            }
                        }
                    })}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={{
                        inputProps: { min: minDate, max: maxDate },
                    }}
                    error={!!errors.Fecha}
                    helperText={errors.Fecha && errors.Fecha.message}
                    // value={getValues("Fecha") || ""}  // Usa getValues para manejar el valor
                    // onChange={(e) => setValue("Fecha", e.target.value)}  // Permite edición manual
                />

                <TextField
                    label="Divisa"
                    {...register("Divisa", { required: "Campo obligatorio" })}
                    fullWidth
                    defaultValue="MXN"
                    disabled
                    error={!!errors.Divisa}
                    helperText={errors.Divisa && errors.Divisa.message}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f',
                            }
                        }
                    }}
                />

                <TextField
                    label="Tipo de cambio"
                    fullWidth
                    disabled
                    error={!!errors.TipoCambio}
                    helperText={errors.TipoCambio && errors.TipoCambio.message}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f',
                            }
                        }
                    }}
                />
            </Box>
        </Box>
    );
}
