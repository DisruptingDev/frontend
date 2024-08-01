"use client"

import React, { useState, useEffect } from 'react';

async function obtener_opciones(url) {
    return fetch(url.toString())
        .then(response => response.json())
        .catch((error) => {
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

    function handleChange(event) {
        setSelectedOption(event.target.value)
        const result = opciones.find(item => item["ID"] == event.target.value);
        funcionPadre(result);
    };

    function handleClick(event) {
        if (opciones.length === 0) {
            //obtener_opciones(url).then(data => {
                //setOptions(data)
            //});
        }
    }

    return (
        <select className={`${className}`} value = {opcionSeleccionada} onChange = {handleChange} onFocus = {handleClick}>
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
