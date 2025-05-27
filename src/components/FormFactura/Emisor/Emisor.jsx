"use client";
import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography, Autocomplete, CircularProgress } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { format, parseISO } from 'date-fns';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Emisor({ register, setLugarExpedicion, setValue, getValues, trigger, errors, emisorData, disabled = false, setTipoComprobante, setEmisorID, token }) {
    const [emisor, setEmisor] = useState({});
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [serieUrl, setSerieUrl] = useState('');
    const [emisorOptions, setEmisorOptions] = useState([]);
    const [loadingEmisores, setLoadingEmisores] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        const fetchEmisores = async () => {
            setLoadingEmisores(true);
            try {
                const url = searchTerm
                    ? `${apiUrl}/api/catalogos/Catalogos/Emisor?emisorAutoComplete=${encodeURIComponent(searchTerm)}`
                    : `${apiUrl}/api/catalogos/Catalogos/Emisor`; // Llamada sin filtro

                const response = await fetch(url, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                const data = await response.json();
                console.log("Emisores fetched:", data);
                setEmisorOptions(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error("Error fetching emisores:", error);
            } finally {
                setLoadingEmisores(false);
            }
        };

        const debounceFetch = setTimeout(() => {
            fetchEmisores();
        }, 300);

        return () => clearTimeout(debounceFetch);
    }, [searchTerm]);

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
        // Establece el valor por defecto para 'Divisa'
        setValue('Divisa', 'MXN'); // Por ejemplo, 'MXN' como valor por defecto
    }, [setValue]);

    const handleEmisorChange = (emisorID) => {
        try {
            // Busca el emisor completo en las opciones disponibles
            const emisorSeleccionado = emisorOptions.find(opt => opt.ID === emisorID);

            if (emisorSeleccionado) {
                setEmisor(emisorSeleccionado);
                setValue("Serie", "");
                if (setEmisorID) {
                    setEmisorID(emisorSeleccionado.ID);
                }
            }
        } catch (error) {
            console.error("Error al procesar el emisor:", error);
        }
    };
    // const handleLugarExpedicionChange = (e) => {
    //     setLugarExpedicion(e.target.value);
    // };
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

                <Autocomplete
                    options={emisorOptions}
                    loading={loadingEmisores}
                    disabled={disabled}
                    value={getValues("EmisorID") ? emisorOptions.find(e => e.ID === getValues("EmisorID")) : null}
                    onChange={(_, newValue) => {
                        setValue("EmisorID", newValue?.ID || "");
                        handleEmisorChange(newValue?.ID);
                    }}
                    onInputChange={(_, newInputValue) => {
                        setSearchTerm(newInputValue);
                    }}
                    getOptionLabel={(option) => option.Nombre || ""}
                    isOptionEqualToValue={(option, value) => option.ID === value.ID}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Emisor"
                            error={!!errors.Emisor}
                            helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                            InputProps={{
                                ...params.InputProps,
                                endAdornment: (
                                    <>
                                        {loadingEmisores ? <CircularProgress color="inherit" size={20} /> : null}
                                        {params.InputProps.endAdornment}
                                    </>
                                ),
                            }}
                        />
                    )}
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
                        required: !disabled ? "La fecha es requerida." : false, // Solo aplica validación si no está deshabilitado
                        validate: !disabled
                            ? {
                                notTooOld: (value) => {
                                    const currentDate = new Date();
                                    const inputDate = new Date(value);
                                    const threeDaysAgo = new Date();
                                    threeDaysAgo.setDate(currentDate.getDate() - 3);
                                    return inputDate >= threeDaysAgo || "Fecha invalida";
                                },
                            }
                            : undefined, // No se aplican validaciones si está deshabilitado
                    })}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    InputProps={{
                        inputProps: { min: minDate, max: maxDate },
                    }}
                    error={!disabled && !!errors.Fecha} // Solo marca error si no está deshabilitado
                    helperText={!disabled && errors.Fecha ? errors.Fecha.message : ""} // No muestra mensaje si está deshabilitado
                    disabled={disabled}
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
                    {...register("TipoCambio", { required: "Campo obligatorio" })}
                    fullWidth
                    defaultValue="1"
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
