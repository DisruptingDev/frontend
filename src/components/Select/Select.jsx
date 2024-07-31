"use client"

import React, { useState, useEffect } from 'react';

async function obtener_opciones(url) {
    return fetch(url.toString())
        .then(response => response.json())
        .catch(() => {
            console.error('Error fetching data:', error); // Imprime el error en la consola
            return [
                { Clave: 'valor1', Descripcion: 'Elemento 1' },
                { Clave: 'valor2', Descripcion: 'Elemento 2' },
                { Clave: 'valor3', Descripcion: 'Elemento 3' },
            ];
        });
}

export default function Select( {children, url, className, clave = "Clave", descripcion = "Descripcion", funcionPadre = () => (1) } ) {
    const [opciones, setOptions] = useState([]);
    const [opcionSeleccionada, setSelectedOption] = useState("");

    useEffect(() => {
        obtener_opciones(url).then(data => setOptions(data));
    }, []);

    const handleChange = (event) => {
        setSelectedOption(event.target.value)
        const result = opciones.find(item => item["ID"] == event.target.value);
        funcionPadre(result);
    };

    return (
        <select className={`${className}`} value = {opcionSeleccionada} onChange = {handleChange}>
            {children}
            <option value="" disabled selected>Selecciona una opción</option>
            {opciones.map((opcion) => (
                <option value={opcion["ID"]}>
                    {opcion[clave]} - {opcion[descripcion]}
                </option>
            ))}
        </select>
    )
}
