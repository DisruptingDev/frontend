"use client";

import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, FormHelperText } from '@mui/material';

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

export default function Select({ register = () => (1), nombre, label = nombre, url, className, clave = "", id = clave, descripcion = "", onChange, sx, variant = "outlined", error = false, helperText = "", value,disabled=false, reset =false }) {
    const [opciones, setOpciones] = useState([]);
    const [selectedValue, setSelectedValue] = useState(value || '');

    useEffect(() => {
        if(url)
        obtener_opciones(url).then(data => setOpciones(data));
    }, [url]);

    useEffect(() => {

        if (reset) {
            if(url){
                obtener_opciones(url).then(data => setOpciones(data));
            }
            

        }
    }, [reset, url]);

    useEffect(() => {
        // Update the selected value when `value` prop changes
        setSelectedValue(value || '');
    }, [value]);

    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedValue(value);  // Update local state

        const selectedOption = opciones.find(opcion => opcion[id] === value);
        
        if (onChange) {
            onChange({ target: { value: JSON.stringify(selectedOption) } });
        }
    };

    return (
        <FormControl fullWidth className={className} sx={sx} variant={variant} error={error} disabled={disabled}>
            <InputLabel>{label}</InputLabel>
            <MuiSelect
                {...register(nombre, {
                    required: "Este campo es obligatorio",
                    onChange: handleChange 
                })}
                value={selectedValue}  // Use controlled value
                label={label}
                variant={variant}
                onChange={handleChange}
                disabled={disabled}
            >
                <MenuItem value="" disabled>Selecciona una opción</MenuItem>
                {Array.isArray(opciones) && opciones.length > 0 ? (
                    opciones.map((opcion, index) => (
                        <MenuItem key={index} value={opcion[id]}>
                            {clave !== "" ? `${opcion[clave]} - ${opcion[descripcion]}` : `${opcion[descripcion]}`}
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
