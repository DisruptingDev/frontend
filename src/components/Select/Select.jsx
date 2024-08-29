"use client";

import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, MenuItem, Select as MuiSelect, FormHelperText } from '@mui/material';

async function obtener_opciones(url) {
    try {
        const token = localStorage.getItem('authToken'); // Recupera el token del localStorage

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`, // Incluye el token en los headers
                'Content-Type': 'application/json',
            }
        });
        const data = await response.json();

        // Verifica si los datos recibidos son un array
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

export default function Select({ register = () => (1), nombre, url, className, clave = "", id= clave, descripcion = "", onChange, sx, variant = "outlined", error = false, helperText = "" }) {
    const [opciones, setOpciones] = useState([]);
    const [selectedValue, setSelectedValue] = useState(""); // Controla el valor seleccionado

    useEffect(() => {
        obtener_opciones(url).then(data => setOpciones(data));
    }, [url]);

    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedValue(value);
        if (onChange) {
            // Propaga los datos completos del emisor seleccionado al padre
            const selectedOption = opciones.find(opcion => opcion[id] === value);
            onChange({ target: { value: JSON.stringify(selectedOption) } });
        }
    };

    return (
        <FormControl fullWidth className={className} sx={sx} variant={variant} error={error}>
            <InputLabel>{nombre}</InputLabel>
            <MuiSelect
                {...register(nombre)}
                value={selectedValue || ""}
                onChange={handleChange}
                label={nombre}
                variant={variant} // Aplica la variante seleccionada
            >
                <MenuItem value="" disabled>Selecciona una opción</MenuItem>
                {Array.isArray(opciones) && opciones.length > 0 ? (
                    opciones.map((opcion, index) => (
                        <MenuItem key={index} value={opcion[id]}>
                            {opcion[id]} - {opcion[descripcion]}
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
