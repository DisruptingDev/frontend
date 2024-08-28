"use client";

import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Autocomplete } from '@mui/material';
import Impuesto from "@/components/FormFactura/Impuesto/Impuesto.jsx";
import { useForm, useFieldArray } from 'react-hook-form';
import CrearConcepto from "./ModelConceptos.js";
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default function Conceptos({ setConceptos }) {
    const [claveProdServOptions, setClaveProdServOptions] = useState([]);
    const [claveUnidadOptions, setClaveUnidadOptions] = useState([]);
    const [queryProdServ, setQueryProdServ] = useState('');
    const [queryUnidad, setQueryUnidad] = useState('');
    const [selectedClaveProdServ, setSelectedClaveProdServ] = useState(null);
    const [selectedClaveUnidad, setSelectedClaveUnidad] = useState(null);

    const token = localStorage.getItem('authToken');

    const { control, register, reset, getValues, setValue, watch } = useForm({
        defaultValues: {
            Descripcion: '',
            ClaveProdServ: '',
            ClaveUnidad: '',
            Cantidad: 1,
            ValorUnitario: 0,
            Descuento: 0,
            Subtotal: 0,
            impuestos: [{ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'impuestos',
    });

    // Función para obtener datos de ClaveProdServ y ClaveUnidad
    useEffect(() => {
        if (queryProdServ.length > 2) {
            fetch(`http://31.220.31.152:8081/Catalogos/ClaveProdServ?query=${queryProdServ}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            })
                .then(response => response.json())
                .then(data => setClaveProdServOptions(Array.isArray(data) ? data : []))
                .catch(error => console.error('Error al buscar ClaveProdServ:', error));
        } else {
            setClaveProdServOptions([]);
        }

        if (queryUnidad.length > 1) {
            fetch(`http://31.220.31.152:8081/Catalogos/ClaveUnidad?query=${queryUnidad}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            })
                .then(response => response.json())
                .then(data => setClaveUnidadOptions(Array.isArray(data) ? data : []))
                .catch(error => console.error('Error al buscar ClaveUnidad:', error));
        } else {
            setClaveUnidadOptions([]);
        }
    }, [queryProdServ, queryUnidad, token]);

    // Calcular y actualizar Subtotal y BaseImpuesto
    useEffect(() => {
        const calcularSubtotal = () => {
            const cantidad = getValues('Cantidad');
            const precioUnitario = getValues('ValorUnitario');
            const descuento = getValues('Descuento');
            const subtotal = (cantidad * precioUnitario) - descuento;
            setValue("Subtotal", subtotal);
            return subtotal;
        };

        const subtotal = calcularSubtotal();
        setValue("Subtotal", subtotal);

        // Actualizar BaseImpuesto para cada impuesto
        fields.forEach((_, index) => {
            setValue(`impuestos.${index}.BaseImpuesto`, subtotal);
        });

    }, [watch('Cantidad'), watch('ValorUnitario'), watch('Descuento'), fields, setValue, getValues]);

    const handleAgregarConcepto = () => {
        const objetoImpuesto = getValues("impuestos")[0]?.ObjetoImpuesto;
        if (!objetoImpuesto || objetoImpuesto === "Default") {
            console.error("El campo ObjetoImpuesto es obligatorio y no puede estar vacío.");
            return;
        }

        const nuevoConcepto = CrearConcepto(getValues, getValues("impuestos"));
        if (nuevoConcepto !== "Error") {
            setConceptos(prevConceptos => [...prevConceptos, nuevoConcepto]);
            reset();
            setSelectedClaveProdServ(null);
            setSelectedClaveUnidad(null);
        } else {
            console.log("Ocurrió un error en el concepto");
        }
    };

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={6}>Conceptos</Typography>
            <Box display="grid" gridTemplateColumns="8fr 1fr" gap={3}>
                <TextField
                    label="Descripción"
                    {...register("Descripcion")}
                    fullWidth
                    multiline
                    rows={4}
                />
            </Box>
            <Box display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.2fr 0.2fr'
                }}
                gap={3}
                mt={4}>

                <Autocomplete
                    options={claveProdServOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`}
                    value={selectedClaveProdServ}
                    onInputChange={(event, newInputValue) => setQueryProdServ(newInputValue)}
                    onChange={(event, value) => {
                        setSelectedClaveProdServ(value);
                        setValue('ClaveProdServ', value?.Clave || '');
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Clave ProdServ" fullWidth />
                    )}
                />

                <Autocomplete
                    options={claveUnidadOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`}
                    value={selectedClaveUnidad}
                    onInputChange={(event, newInputValue) => setQueryUnidad(newInputValue)}
                    onChange={(event, value) => {
                        setSelectedClaveUnidad(value);
                        setValue('ClaveUnidad', value?.Clave || '');
                    }}
                    renderInput={(params) => (
                        <TextField {...params} label="Clave Unidad" fullWidth />
                    )}
                />

                <TextField label="Cantidad" type="number" {...register("Cantidad")} fullWidth />
                <TextField label="Precio Unitario" type="number" {...register("ValorUnitario")} fullWidth />
                <TextField label="Descuento" type="number" {...register("Descuento")} fullWidth />
                <TextField label="Subtotal" type="number" {...register("Subtotal")} fullWidth InputProps={{ readOnly: true }} disabled />
            </Box>

            <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={3} mt={4}>
                {fields.map((field, index) => (
                    <Box key={field.id || index} gridColumn="span 6">
                        <Impuesto
                            register={register}
                            setValue={setValue}
                            getValues={getValues}
                            index={index}
                            baseImpuesto={watch('Subtotal') || 0}
                            remove={remove}
                            fieldsLength={fields.length}
                        />
                    </Box>
                ))}

                <Box gridColumn="7 / 8" display="flex" justifyContent="start" alignItems="center">
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: 'rgba(29, 57, 77, 1)',
                            '&:hover': { backgroundColor: 'rgba(19, 47, 67, 1)' }
                        }}
                        onClick={() => append({ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' })}
                    >
                        <AddCircleIcon sx={{ fontSize: '30px' }} />
                    </Button>
                </Box>
            </Box>

            <Box textAlign="end" mt={3}>
                <Button
                    startIcon={<AddCircleIcon />}
                    variant="contained"
                    sx={{ backgroundColor: 'rgba(29, 57, 77, var(--tw-bg-opacity, 1))' }}
                    onClick={handleAgregarConcepto}
                >
                    Agregar Concepto
                </Button>
            </Box>
        </Box>
    );
}
