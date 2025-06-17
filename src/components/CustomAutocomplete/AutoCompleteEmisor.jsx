"use client";

import React, { useState, useEffect } from 'react';
import { 
  Autocomplete as MuiAutocomplete, 
  TextField, 
  CircularProgress,
  FormControl,
  FormHelperText 
} from '@mui/material';

async function obtener_opciones(url) {
    try {
        let token;
        if(localStorage.getItem('authToken')) {
            token = localStorage.getItem('authToken');
        }
        else{
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
    id = clave,
    descripcion = "",
    onChange,
    sx,
    variant = "outlined",
    error = false,
    helperText = "",
    value,
    disabled = false,
    reset = false,
    opcion = false,
    opcionText = "Todos",
    freeSolo = false,
    filterOptions,
    loading = false,
    setValue,
    updateFields,
}) {
    const [opciones, setOpciones] = useState([]);
    const [selectedValue, setSelectedValue] = useState(null);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (url) {
            setIsLoading(true);
            obtener_opciones(url).then((data) => {
                setOpciones(data);
                setIsLoading(false);
                
                // Set initial value if provided
                if (value) {
                    const foundOption = data.find(item => item[id] === value);
                    if (foundOption) {
                        setSelectedValue(foundOption);
                    }
                }
            });
        }
    }, [url, value, id]);

    useEffect(() => {
        if (reset && url) {
            setIsLoading(true);
            obtener_opciones(url).then(data => {
                setOpciones(data);
                setIsLoading(false);
            });
        }
    }, [reset, url]);

    const handleChange = (event, newValue) => {
        setSelectedValue(newValue);
        
        if (onChange) {
            if (newValue) {
                // Enviar solo el ID al onChange
                onChange({ target: { value: newValue[id], name: nombre } });
                
                // Si necesitas actualizar campos relacionados
                if (updateFields) {
                    updateFields(newValue);
                }
                
                // Actualizar el valor en react-hook-form
                if (setValue) {
                    setValue(nombre, newValue[id], { shouldValidate: true });
                }
            } else {
                onChange({ target: { value: '', name: nombre } });
                if (setValue) {
                    setValue(nombre, '', { shouldValidate: true });
                }
            }
        }
    };

    const handleInputChange = (event, newInputValue) => {
        setInputValue(newInputValue);
    };

    const getOptionLabel = (option) => {
        if (typeof option === 'string') {
            return option;
        }
        if (clave !== "" && descripcion !== "") {
            return `${option[clave]} - ${option[descripcion]}`;
        }
        if (descripcion !== "") {
            return option[descripcion];
        }
        if (clave !== "") {
            return option[clave];
        }
        return option.toString();
    };

    const isOptionEqualToValue = (option, value) => {
        if (!option || !value) return false;
        return option[id] === value[id];
    };

    return (
        <FormControl fullWidth className={className} sx={sx} error={error} disabled={disabled}>
            <MuiAutocomplete
                options={opciones}
                value={selectedValue}
                onChange={handleChange}
                inputValue={inputValue}
                onInputChange={handleInputChange}
                getOptionLabel={getOptionLabel}
                isOptionEqualToValue={isOptionEqualToValue}
                freeSolo={freeSolo}
                filterOptions={filterOptions}
                loading={isLoading || loading}
                disabled={disabled}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        {...register(nombre, {
                            required: "Este campo es obligatorio"
                        })}
                        label={label}
                        variant={variant}
                        error={error}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {isLoading || loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                )}
            />
            {error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
}