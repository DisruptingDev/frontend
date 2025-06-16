"use client";
import React, { useState, useEffect } from 'react';
import { Autocomplete, TextField, CircularProgress, FormControl, FormHelperText } from '@mui/material';

async function obtener_opciones(url, searchTerm = "") {
    try {
        let token;
        if(localStorage.getItem('authToken')) {
            token = localStorage.getItem('authToken');
        } else {
            token = sessionStorage.getItem('authToken');
        }
        
        const finalUrl = searchTerm ? `${url}?search=${encodeURIComponent(searchTerm)}` : url;
        
        const response = await fetch(finalUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();

        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error fetching data:', error);
        return [];
    }
}

export default function CustomAutocomplete({
    register = () => ({}),
    nombre,
    label = nombre,
    url,
    className,
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
    trigger,
    getValues,
    setValue
}) {
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [selectedValue, setSelectedValue] = useState(null);
    const [initialLoad, setInitialLoad] = useState(true);

    // Función para cargar opciones con debounce
    const fetchOptions = React.useCallback(async (search) => {
        setLoading(true);
        try {
            const data = await obtener_opciones(url, search);
            setOptions(data);
            
            // Si es la carga inicial y tenemos un valor, buscamos el correspondiente
            if (initialLoad && value) {
                const foundValue = data.find(option => option[id] === value);
                if (foundValue) {
                    setSelectedValue(foundValue);
                    setInputValue(foundValue[descripcion]);
                }
            }
            setInitialLoad(false);
        } finally {
            setLoading(false);
        }
    }, [url, id, descripcion, value, initialLoad]);

    // Efecto para cargar opciones iniciales
    useEffect(() => {
        fetchOptions('');
    }, [fetchOptions]);

    // Efecto para manejar cambios externos en el valor (como en edición)
    useEffect(() => {
        if (value && options.length > 0) {
            const foundValue = options.find(option => option[id] === value);
            if (foundValue) {
                setSelectedValue(foundValue);
                setInputValue(foundValue[descripcion]);
            }
        } else if (!value) {
            setSelectedValue(null);
            setInputValue('');
        }
    }, [value, options, id, descripcion]);

    // Efecto para manejar el reset
    useEffect(() => {
        if (reset) {
            fetchOptions('');
            setInputValue('');
            setSelectedValue(null);
        }
    }, [reset, fetchOptions]);

    // Efecto para buscar con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (!initialLoad || inputValue !== '') {
                fetchOptions(inputValue);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [inputValue, fetchOptions, initialLoad]);

    const handleChange = (event, newValue) => {
        setSelectedValue(newValue);
        
        if (onChange) {
            const eventValue = newValue ? JSON.stringify(newValue) : '';
            onChange({ target: { value: eventValue } });
            
            // Actualizar el valor en react-hook-form
            if (setValue) {
                setValue(nombre, newValue ? newValue[id] : '');
            }
        }
        
        if (trigger) {
            trigger(nombre);
        }
    };

    const handleInputChange = (event, newInputValue) => {
        setInputValue(newInputValue);
    };

    return (
        <FormControl fullWidth className={className} sx={sx} error={error} disabled={disabled}>
            <Autocomplete
                options={options}
                getOptionLabel={(option) => option[descripcion] || ''}
                isOptionEqualToValue={(option, value) => option[id] === value?.[id]}
                value={selectedValue}
                onChange={handleChange}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                loading={loading}
                disabled={disabled}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        label={label}
                        variant="outlined"
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
                        error={error}
                    />
                )}
                renderOption={(props, option) => (
                    <li {...props} key={option[id]}>
                        {option[descripcion]}
                    </li>
                )}
                noOptionsText="No hay opciones"
            />
            {error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
}