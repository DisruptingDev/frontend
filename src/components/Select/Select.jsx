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

export default function Select( {register = () => (1), nombre, url, className, clave = "Clave", descripcion = "Descripcion", onChange} ) {
    const [opciones, setOpciones] = useState([])

    useEffect(() => {
        obtener_opciones(url).then(data => setOpciones(data));
    }, []);

    return (
        <select {...register(nombre)} className={`${className}`} defaultValue = "Default" onChange = {onChange}>
            <option key="Default" value="Default">Selecciona una opcion</option>
            {opciones.map((opcion) => (
                <option key = {opcion["ID"]} value={JSON.stringify(opcion)}>
                    {opcion[clave]} - {opcion[descripcion]}
                </option>
            ))}
        </select>
    )
}
