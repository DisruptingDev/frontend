"use client";

import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, FormHelperText } from '@mui/material';

async function obtener_opciones(url) {
    try {
        const token = localStorage.getItem('authToken');

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

export default function Select({ register = () => (1), nombre, label=nombre, url, className, clave = "", id = clave, descripcion = "", onChange, sx, variant = "outlined", error = false, helperText = "" }) {
    const [opciones, setOpciones] = useState([]);

    useEffect(() => {
        obtener_opciones(url).then(data => setOpciones(data));
    }, [url]);

    const handleChange = (e) => {
        const value = e.target.value;
        
        const selectedOption = opciones.find(opcion => opcion[id] === value);
        
        if (onChange) {
            onChange({ target: { value: JSON.stringify(selectedOption) } });
        }
    };

    return (
        <FormControl fullWidth className={className} sx={sx} variant={variant} error={error}>
            <InputLabel>{label}</InputLabel>
            <MuiSelect
                {...register(nombre, {
                    required: "Este campo es obligatorio", 
                    onChange: handleChange 
                })}
                defaultValue="" 
                label={label}
                variant={variant}
            >
                <MenuItem value="" disabled>Selecciona una opción</MenuItem>
                {Array.isArray(opciones) && opciones.length > 0 ? (
                    opciones.map((opcion, index) => (
                        <MenuItem key={index} value={opcion[id]}>
                            {opcion[clave]} - {opcion[descripcion]}
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem value="" disabled>No hay opciones disponibles</MenuItem>
                )}
            </MuiSelect>
            {error && <FormHelperText>{helperText}</FormHelperText>}
        </FormControl>
    );
}
