"use client"

import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Divider, Autocomplete } from '@mui/material';
import Impuesto from "@/components/FormFactura/Impuesto/Impuesto.jsx";
import { useForm, useFieldArray } from 'react-hook-form';
import CalcularSubtotal from "./Calculos/CalcularSubtotal.jsx";
import CrearConcepto from "./ModelConceptos.js";
import Select from "@/components/Select/Select.jsx";
import AddCircleIcon from '@mui/icons-material/AddCircle';

export default function Conceptos({ register, watch, setValue, getValues, setConceptos }) {
    const [cantidad, setCantidad] = useState(0);
    const [precioUnitario, setPrecioUnitario] = useState(0);
    const [descuento, setDescuento] = useState(0);
    const [subTotal, setSubtotal] = useState(0);

    const [claveOptions, setClaveOptions] = useState([]);
    const [query, setQuery] = useState('');

    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6NCwiZW1haWwiOiJrZXZpbkBnbWFpbC5jb20iLCJleHAiOjE3MjQ0NDU0MDl9.saQCBzYFAZ_n1gLn_wsCV_wd7BSqvwMoorgMppoDCrY'; // Token válido

    useEffect(() => {
        if (query.length > 2) {  // Solo buscar si la longitud de la query es mayor a 2 caracteres
            fetch(`http://31.220.31.152:8081/Catalogos/ClaveProdServ?query=${query}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            })
            .then(response => response.json())
            .then(data => setClaveOptions(data))  // Ajusta según la estructura de tu respuesta
            .catch(error => console.error('Error al buscar ClaveProdServ:', error));
        } else {
            setClaveOptions([]);
        }
    }, [query]);

    useEffect(() => {
        const sub = CalcularSubtotal(cantidad, precioUnitario, descuento);
        setValue("Subtotal", sub);
        setSubtotal(sub);
    }, [cantidad, precioUnitario, descuento, setValue]);

    const { control, reset } = useForm({
        defaultValues: {
            impuestos: [{ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'impuestos',
    });

    const handleAgregarConcepto = () => {
        // Obtener los valores actuales del formulario
        const objetoImpuesto = getValues("impuestos")[0].ObjetoImpuesto;
        console.log(getValues("impuestos"))
        
        // Verificar si ObjetoImpuesto tiene un valor válido
        if (!objetoImpuesto || objetoImpuesto === "Default") {
            console.error("El campo ObjetoImpuesto es obligatorio y no puede estar vacío.");
            return;
        }
    
        // Proceder a crear el concepto si la validación es exitosa
        const nuevoConcepto = CrearConcepto(getValues, getValues("impuestos"));
        if (nuevoConcepto !== "Error") {
            setConceptos(prevConceptos => [...prevConceptos, nuevoConcepto]);
    
            // Resetear todos los campos del formulario
            reset({
                Descripcion: '',
                ClaveProdServ: '',
                ClaveUnidad: '',
                Cantidad: 0,
                ValorUnitario: 0,
                Descuento: 0,
                Subtotal: 0,
                impuestos: [{ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' }]
            });
    
            // Reiniciar los estados locales
            setCantidad(0);
            setPrecioUnitario(0);
            setDescuento(0);
            setSubtotal(0);
            setValue("impuestos", []);
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
                    rows={4} // Puedes ajustar el número de líneas visibles
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
                
                {/* Autocomplete para ClaveProdServ */}
                <Autocomplete
                    options={claveOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`} // Combina Clave y Descripcion
                    onInputChange={(event, newInputValue) => setQuery(newInputValue)}
                    filterOptions={(options, { inputValue }) => 
                        options.filter((option) => 
                            option.Clave.toLowerCase().includes(inputValue.toLowerCase()) || 
                            option.Descripcion.toLowerCase().includes(inputValue.toLowerCase())
                        )
                    }
                    renderOption={(props, option) => (
                        <Box component="li" {...props}>
                            {option.Clave} - {option.Descripcion}
                        </Box>
                    )}
                    renderInput={(params) => (
                        <TextField 
                            {...params} 
                            label="Clave ProdServ" 
                            fullWidth 
                        />
                    )}
                    onChange={(event, value) => {
                        if (value) {
                            setValue('ClaveProdServ', value.Clave); // Ajusta según la estructura de datos
                        }
                    }}
                />
                
                <Select
                    register={register}
                    nombre="ClaveUnidad"
                    url="http://31.220.31.152:8081/Catalogos/ClaveUnidad"
                    clave="Clave"
                    descripcion="Descripcion"
                />

                <TextField
                    label="Cantidad"
                    type="number"
                    {...register("Cantidad")}
                    value={cantidad}
                    fullWidth
                    onChange={(e) => setCantidad(Number(e.target.value))}
                />

                <TextField
                    label="Precio Unitario"
                    type="number"
                    {...register("ValorUnitario")}
                    value={precioUnitario}
                    fullWidth
                    onChange={(e) => setPrecioUnitario(Number(e.target.value))}
                />

                <TextField
                    label="Descuento"
                    type="number"
                    {...register("Descuento")}
                    value={descuento}
                    fullWidth
                    onChange={(e) => setDescuento(Number(e.target.value))}
                />

                <TextField
                    label="Subtotal"
                    type="number"
                    {...register("Subtotal")}
                    value={subTotal}
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                    disabled
                />
            </Box>
            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 1fr 1fr 1fr 1fr 1fr', // Ajustado para permitir más columnas
                    lg: 'repeat(7, 1fr)', // 7 columnas de igual tamaño
                }}
                gap={3}
                mt={4}
            >
                {fields.map((field, index) => (
                    <React.Fragment key={field.id || index}>
                        <Box gridColumn="span 6">
                            <Impuesto
                                register={register}
                                setValue={setValue}
                                index={index}
                                baseImpuesto={subTotal || 0}
                                remove={remove} // Pasa la función remove al componente Impuesto
                                isLast={index === fields.length - 1}
                            />
                        </Box>
                    </React.Fragment>
                ))}

                <Box
                    gridColumn={{
                        xs: '1 / -1',  // Ocupa toda la fila en pantallas pequeñas
                        lg: '7 / 8',   // Coloca el botón en la última columna en pantallas grandes
                    }}
                    display="flex"
                    justifyContent="start"
                    alignItems="center"
                >
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: 'rgba(29, 57, 77, 1)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            '&:hover': {
                                backgroundColor: 'rgba(19, 47, 67, 1)',
                            }
                        }}
                        onClick={() => append({ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' })}
                    >
                        <AddCircleIcon sx={{ fontSize: '30px' }} />
                    </Button>
                </Box>
            </Box>
            <Box gridColumn="span 6" textAlign="end" mt={3}>
                <Button
                    startIcon={<AddCircleIcon />}
                    variant="contained"
                    sx={{
                        backgroundColor: 'rgba(29, 57, 77, var(--tw-bg-opacity, 1))',
                    }}

                    onClick={handleAgregarConcepto}
                >
                    Agregar Concepto
                </Button>
            </Box>
        </Box>
    );
}
