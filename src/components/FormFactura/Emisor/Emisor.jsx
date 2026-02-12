"use client";
import React, { useState, useEffect, use } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { format, parseISO } from 'date-fns';
import padding from 'tailwindcss-logical/plugins/padding';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import AutocompleteEmisor from '@/components/Autocompletes/AutocompleteEmisor';

export default function Emisor({ register, setLugarExpedicion, setValue, getValues, trigger, errors, emisorData, disabled = false, setTipoComprobante, setEmisorID }) {
    const [emisor, setEmisor] = useState({});
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [serieUrl, setSerieUrl] = useState('');
    const [isMXN, setIsMXN] = useState(false);

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
    useEffect(() => {
        const today = new Date();


        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        if (!emisorData) {
            setValue("Fecha", formatDate(today));
        }

    }, [emisorData, setValue]);

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
            setValue("CalleEmisor", emisorData.Calle);
            setValue("NoExteriorEmisor", emisorData.NumeroExterior);
            setValue("NoInteriorEmisor", emisorData.NumeroInterior);
            setValue("ColoniaEmisor", emisorData.Colonia);
            setValue("MunicipioEmisor", emisorData.Municipio);
            setValue("EstadoEmisor", emisorData.Estado);
            setValue("RegimenFiscalEmisor", emisorData.RegimenFiscal);
            setValue("LogoEmisor", emisorData.LogoPath);
            setValue("Serie", emisorData.Serie);
            setValue("TipoComprobante", emisorData.TipoComprobante);

            setLugarExpedicion(emisorData.LugarExpedicion);

            // Solo establece la fecha si no está definida
            if (!getValues("Fecha")) {
                const formattedDate = emisorData.Fecha
                    ? format(parseISO(emisorData.Fecha), 'yyyy-MM-dd')
                    : '';
                console.log(formattedDate);
                setValue("Fecha", formattedDate);
            }

            setSerieUrl(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisorData.ID}`);
            // Dispara la validación de estos campos
            trigger(["Emisor", "RFCEmisor", "LugarExpedicion", "NombreEmisor", "RegimenFiscalEmisor", "Serie", "Fecha", "TipoCambio"]);
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
            setValue("CalleEmisor", emisor.Calle)
            setValue("NoExterior", emisor.NumeroExterior)
            setValue("NoInterior", emisor.NumeroInterior)
            setValue("ColoniaEmisor", emisor.Colonia)
            setValue("MunicipioEmisor", emisor.Municipio)
            setValue("EstadoEmisor", emisor.Estado)
            setValue("RegimenFiscalEmisor", emisor.RegimenFiscal)
            setValue("LogoEmisor", emisor.LogoPath)

            setSerieUrl(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisor.ID}`);

            setLugarExpedicion(emisor.LugarExpedicion);

            // Dispara la validación de estos campos
            trigger("RFCEmisor");
            trigger("LugarExpedicion");


        }
    }, [emisor, setLugarExpedicion, setValue, trigger]);

    useEffect(() => {
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

        // Fetch Monedas to set default MXN and check initial value
        const fetchMonedas = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Moneda`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    // Try to find MXN (check both lowercase and uppercase properties just in case)
                    const mxn = data.find(m => m.clave === 'MXN' || m.Clave === 'MXN');
                    if (mxn) {
                        // Access id/clave based on which property exists
                        // const id = mxn.id || mxn.ID;
                        const clave = mxn.clave || mxn.Clave;

                        const currentDivisa = getValues("Divisa");

                        // If no value set, set default to MXN
                        if (!currentDivisa) {
                            setValue('Divisa', clave);
                            if (clave === 'MXN') {
                                setValue("TipoCambio", "1");
                                setIsMXN(true);
                            }
                        } else {
                            // If value exists (e.g. edit mode), check if it is MXN
                            // We compare string values (e.g. "MXN")
                            if (String(currentDivisa) === String(clave)) {
                                setIsMXN(true);
                                setValue("TipoCambio", "1");
                            } else {
                                setIsMXN(false);
                            }
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching monedas:", error);
            }
        };
        if (token) {
            fetchMonedas();
        }
    }, [setValue, getValues]);

    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setEmisor(data);
            console.log(data);
            //Checar, si es correcto
            setValue("Serie", "");
            setValue("TipoComprobante", "");
            if (setEmisorID) {
                setEmisorID(data.ID);
            }
        } catch (error) {
            console.error("El valor de emisor no es un JSON válido:", e.target.value);
        }
    };

    const handleSerieChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            // console.log("Serie:", data);
            setValue("TipoComprobante", data.TipoComprobante);
            // Actualiza el estado en el componente padre
            if (setTipoComprobante) {
                setTipoComprobante(data.TipoComprobante);
            }
        } catch (error) {
            console.error("El valor de emisor no es un JSON válido:", e.target.value);
        }
    }

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}
            sx={{ padding: '1rem', margin: 'auto', marginButtom: '1rem' }}>
            <Typography variant="h6" mb={4}>Datos del Emisor</Typography>
            <Box
                display="grid"
                gap={3}
                sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr'
                    }
                }}
            >
                {/* <Select
                    register={register}
                    trigger={trigger}
                    nombre="Emisor"
                    url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                    id="ID"
                    clave=""
                    descripcion="Nombre"
                    onChange={handleEmisorChange}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                    value={getValues("EmisorID") || ""}
                    disabled={disabled}
                /> */}

                <AutocompleteEmisor
                    nombre="Emisor"
                    label="Emisor"
                    url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                    id="ID"
                    clave=""
                    descripcion="Nombre"
                    register={register}
                    setValue={setValue}
                    value={getValues("Emisor")}
                    onChange={handleEmisorChange}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
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
                    url={serieUrl}
                    id="Clave"
                    clave='Clave'
                    descripcion="TimbresDisponibles"
                    error={!!errors.Serie}
                    helperText={errors.Serie ? "Este campo es obligatorio" : ""}
                    value={getValues("Serie") || ""}
                    onChange={handleSerieChange}
                    disabled={disabled}

                />

                <TextField
                    label="Fecha"
                    type="date"
                    {...register("Fecha", {
                        required: !disabled ? "La fecha es requerida." : false,
                        validate: !disabled
                            ? {
                                notTooOld: (value) => {
                                    const inputDate = new Date(value);
                                    const today = new Date();
                                    const twoDaysAgo = new Date();
                                    twoDaysAgo.setDate(today.getDate() - 2);

                                    // Normalizar fechas a medianoche para evitar errores por horas
                                    inputDate.setHours(0, 0, 0, 0);
                                    today.setHours(0, 0, 0, 0);
                                    twoDaysAgo.setHours(0, 0, 0, 0);

                                    return (
                                        (inputDate >= twoDaysAgo && inputDate <= today) ||
                                        "Fecha inválida."
                                    );
                                },
                            }
                            : undefined,
                    })}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={{
                        inputProps: {
                            min: (() => {
                                const d = new Date();
                                d.setDate(d.getDate() - 2);
                                return d.toISOString().split("T")[0];
                            })(),
                            max: (() => {
                                const d = new Date();
                                return d.toISOString().split("T")[0];
                            })(),
                        },
                    }}
                    error={!disabled && !!errors.Fecha}
                    helperText={!disabled && errors.Fecha ? errors.Fecha.message : ""}
                    disabled={disabled}
                />


                <Select
                    register={register}
                    nombre="Divisa"
                    label="Divisa"
                    url={`${apiUrl}/api/catalogos/Catalogos/Moneda`}
                    id="Clave"
                    clave="Clave"
                    descripcion="Clave"
                    error={!!errors.Divisa}
                    helperText={errors.Divisa ? "Este campo es obligatorio" : ""}
                    value={getValues("Divisa") || ""}
                    onChange={(e) => {
                        try {
                            const val = JSON.parse(e.target.value);
                            // console.log("Moneda seleccionada:", val);
                            const id = val.id || val.ID;
                            const clave = val.clave || val.Clave;

                            setValue("Divisa", clave);

                            if (clave === 'MXN' || clave === 'XXX') {
                                setValue("TipoCambio", "1");
                                setIsMXN(true);
                            } else {
                                setValue("TipoCambio", "");
                                setIsMXN(false);
                            }
                            trigger("Divisa");
                        } catch (err) {
                            console.error(err);
                        }
                    }}
                    disabled={disabled}
                />

                <TextField
                    label="Tipo de cambio"
                    {...register("TipoCambio", { required: "Campo obligatorio" })}
                    fullWidth
                    defaultValue="1"
                    disabled={disabled || isMXN}
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