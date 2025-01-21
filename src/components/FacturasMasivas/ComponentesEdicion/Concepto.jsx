"use client"
import React, { useState, useEffect, use } from 'react';
import { TextField, Box, Typography, Autocomplete } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Concepto({ setValue, register, getValues, token }) {
    const [conceptoOptions, setConceptoOptions] = useState([]);
    const [claveProdServOptions, setClaveProdServOptions] = useState([]);
    const [claveUnidadOptions, setClaveUnidadOptions] = useState([]);
    const [queryConcepto, setQueryConcepto] = useState('');
    const [queryProdServ, setQueryProdServ] = useState('');
    const [queryUnidad, setQueryUnidad] = useState('');
    const [selectedConcepto, setSelectedConcepto] = useState(null);
    const [selectedClaveProdServ, setSelectedClaveProdServ] = useState(null);
    const [selectedClaveUnidad, setSelectedClaveUnidad] = useState(null);


    const fetchOptions = async () => {
        if (!token) return;

        try {
            const prodServResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveProdServ?query=${queryProdServ}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const prodServData = await prodServResponse.json();
            setClaveProdServOptions(Array.isArray(prodServData) ? prodServData : []);

            const unidadResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveUnidad?query=${queryUnidad}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const unidadData = await unidadResponse.json();
            setClaveUnidadOptions(Array.isArray(unidadData) ? unidadData : []);
        } catch (error) {
            console.error('Error al buscar ClaveProdServ o ClaveUnidad:', error);
        }
    };

    useEffect(() => {
        if (selectedClaveUnidad) {
            console.log("Seleccion", selectedClaveUnidad.Descripcion);

            setValue("Unidad", selectedClaveUnidad.Descripcion);

        }

    }, [selectedClaveUnidad, setValue])
    useEffect(() => {
        console.log("Entre a la funcion");
        fetchOptions();
    }, [queryProdServ, queryUnidad, token]);
    return (
        <Box>
            <Typography variant="h6" >Concepto</Typography>
            <Box
                display="grid"
                gap={3}
                sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: '1fr  '
                    }
                }}>

                <TextField

                    label="Descripcion"
                    {...register("Descripcion")}
                    // value={getValues("Descripcion")}
                    multiline
                    rows={4} // Ajusta el número de líneas visibles
                    fullWidth

                />
            </Box>
            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1.5fr 2.5fr 0.5fr 0.5fr 0.5fr 0.5fr  '
                }}
                gap={3}
                mt={4}>
                <Autocomplete
                    options={claveProdServOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`}
                    value={selectedClaveProdServ}
                    isOptionEqualToValue={(option, value) => option.Clave === value.Clave}
                    onInputChange={(event, newInputValue) => setQueryProdServ(newInputValue)}
                    onChange={(event, value) => {
                        setSelectedClaveProdServ(value);
                        setValue('ClaveProdServ', value?.Clave || '');
                        setClaveProdServError(false);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Clave ProdServ"
                            fullWidth

                        />
                    )}
                />

                <Autocomplete
                    options={claveUnidadOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`}
                    value={selectedClaveUnidad}
                    isOptionEqualToValue={(option, value) => option.Clave === value.Clave}
                    onInputChange={(event, newInputValue) => setQueryUnidad(newInputValue)}
                    onChange={(event, value) => {
                        setSelectedClaveUnidad(value);
                        setValue('ClaveUnidad', value?.Clave || '');
                        setClaveUnidadError(false);
                        setValue('Unidad', value?.Descripcion || '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Clave Unidad"
                            fullWidth

                        />
                    )}
                />

                <TextField
                    label="Cantidad"
                    {...register("Cantidad")}
                    type="number"
                    // value={getValues("Cantidad")}
                    fullWidth
                    InputProps={{
                        min: 1,
                        max: 1000,
                        step: 1,
                    }}
                />
                <TextField
                    label="Precio Unitario"
                    type="number"
                    {...register("PrecioUnitario")}
                    // value={getValues("PrecioUnitario")}
                    fullWidth
                    InputProps={{
                        min: 0,
                        step: 0.01,
                    }}
                />

                <TextField
                    label="Descuento"
                    type="number"
                    {...register("Descuento")}
                    // value={getValues("Descuento")}
                    fullWidth
                    InputProps={{
                        min: 0,
                        max: 100,
                        step: 0.01,
                    }}
                />
                <TextField
                    label="Total"
                    type="number"
                    {...register("Total")}
                    // value={getValues("Total")}
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                    disabled
                />
            </Box>
            <Box>
                <Typography variant="h6" mb={2}>Impuestos</Typography>
                <Select
                    register={register}
                    clave='Clave'
                    nombre='ObjetoImpuesto'
                    label='Objeto Impuesto'
                    descripcion='Descripcion'
                    url={`${apiUrl}/api/catalogos/Catalogos/ObjetoImpuestos`}
                    value={getValues("ObjetoImpuesto") || "02"}
                    // onChange={handleObjetoImpuestoChange}
                    sx={{ width: 'auto', minWidth: '23%' }}
                />
            </Box>
            <Box display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1.5fr 2.5fr 0.5fr 0.5fr 0.5fr 0.5fr  '
                }}
                gap={3}
                mt={4}>
                <Select
                    register={register}
                    clave='Clave'
                    id='ID'
                    descripcion='Descripcion'
                    nombre={'Impuesto'}
                    label='Impuesto'
                    url={`${apiUrl}/api/catalogos/Catalogos/ImpuestoClave`}
                // onChange={handleImpuestoChange}

                />
                <TextField
                        label="Base Impuesto"
                        type="number"
                        {...register(`BaseImpuesto`)}
                        // value={baseImpuesto}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                  <TextField
                        label="Monto"
                        type="number"
                        {...register(`Monto`)}
                        // value={monto}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

            </Box>


        </Box>
    )
}