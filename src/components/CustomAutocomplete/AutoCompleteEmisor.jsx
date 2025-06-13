"use client";

import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, FormControl, FormHelperText, Box, Typography } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';

async function obtener_opciones(url) {
    try {
        let token;
        if (localStorage.getItem('authToken')) {
            token = localStorage.getItem('authToken');
        } else {
            token = sessionStorage.getItem('authToken');
        }
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();

        if (Array.isArray(data)) {
            return data;
        }

        console.error('Expected an array but received:', data);
        return [];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [
            { Clave: 'valor1', Descripcion: 'Elemento 1' },
            { Clave: 'valor2', Descripcion: 'Elemento 2' },
            { Clave: 'valor3', Descripcion: 'Elemento 3' },
        ];
    }
}

export default function AutocompleteEmisor({
    register = () => (1),
    nombre,
    label = nombre,
    url,
    className,
    clave = "",
    id = "ID",
    descripcion = "Nombre",
    onChange,
    sx,
    error = false,
    helperText = "",
    value,
    disabled = false,
    reset = false,
    opcion = false,
    opcionText = "Todos",
    freeSolo = false,
    onAddOption
}) {
    const [opciones, setOpciones] = useState([]);
    const [selectedValue, setSelectedValue] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialLoad, setInitialLoad] = useState(true);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        if (url) {
            setLoading(true);
            obtener_opciones(url)
                .then(data => {
                    setOpciones(data);
                    // Si tenemos un valor inicial, buscamos la opción correspondiente
                    if (value && initialLoad) {
                        const foundOption = data.find(opt => opt[id] === value);
                        setSelectedValue(foundOption || null);
                        setInitialLoad(false);
                    }
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [url, value, id, initialLoad]);

    useEffect(() => {
        if (reset) {
            if (url) {
                obtener_opciones(url).then(data => setOpciones(data));
            }
        }
    }, [reset, url]);

    useEffect(() => {
        // Actualizar el valor seleccionado cuando cambia la prop `value`
        if (value !== undefined && value !== null) {
            const foundOption = opciones.find(opt => opt[id] === value);
            setSelectedValue(foundOption || null);
        } else {
            setSelectedValue(null);
        }
    }, [value, opciones, id]);

    const handleChange = (event, newValue) => {
        if (newValue?.isAddOption) {
            if (onAddOption) onAddOption(inputValue); // llama a un callback externo
            return;
        }

        setSelectedValue(newValue);
        if (onChange) {
            onChange(newValue);
        }
    };

    const getOptionLabel = (option) => {
        if (!option) return '';
        if (option.isAddOption) return option[descripcion];
        if (typeof option === 'string') return option;
        return clave !== ""
            ? `${option[clave] || ''}${option[descripcion] ? ` - ${option[descripcion]}` : ''}`
            : `${option[descripcion] || ''}`;
    };



    const isOptionEqualToValue = (option, value) => {
        return option?.[id] === value?.[id];
    };




    return (
        <FormControl fullWidth className={className} sx={sx} error={error} disabled={disabled}>
            <Autocomplete
                options={opciones}
                value={selectedValue}
                onChange={handleChange}
                inputValue={inputValue}
                onInputChange={(event, newInputValue) => {
                    setInputValue(newInputValue);
                }}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
                loading={loading}
                disabled={disabled}
                freeSolo={freeSolo}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        error={error}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                        {...register(nombre, {
                            required: "Este campo es obligatorio",
                        })}
                    />
                )}
                noOptionsText={opciones.length === 0 ? "No hay opciones disponibles" : "No se encontraron resultados"}
            />
            {error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
}