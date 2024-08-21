"use client";

import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, MenuItem, Select as MuiSelect } from '@mui/material';

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

        // Si la respuesta no es un array, devuelve un array vacío
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

export default function Select({ register = () => (1), nombre, url, className, clave = "Clave", descripcion = "Descripcion", onChange, sx }) {
    const [opciones, setOpciones] = useState([]);
    const [selectedValue, setSelectedValue] = useState(""); // Controla el valor seleccionado

    useEffect(() => {
        obtener_opciones(url).then(data => setOpciones(data));
    }, [url]);

    const handleChange = (e) => {
        const value = e.target.value;
        setSelectedValue(value);
        if (onChange) onChange(e); // Propaga el cambio al padre si es necesario
    };

    return (
        <FormControl fullWidth className={className} sx={sx} variant="outlined">
            <InputLabel>{nombre}</InputLabel>
            <MuiSelect
                {...register(nombre)}
                value={selectedValue}
                onChange={handleChange}
                label={nombre}
            >
                <MenuItem value="" disabled>Selecciona una opción</MenuItem>
                {Array.isArray(opciones) && opciones.length > 0 ? (
                    opciones.map((opcion, index) => (
                        <MenuItem key={index} value={JSON.stringify(opcion)}>
                            {opcion[clave]} - {opcion[descripcion]}
                        </MenuItem>
                    ))
                ) : (
                    <MenuItem value="" disabled>No hay opciones disponibles</MenuItem>
                )}
            </MuiSelect>
        </FormControl>
    );
}
