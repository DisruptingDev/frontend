"use client"

import React, { useState, useEffect } from 'react';

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Emisor( {register, setLugarExpedicion} ) {
    const [emisor, setEmisor] = useState();
    const [rfc, setRFC] = useState();
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');

    useEffect(() => {
        const today = new Date();
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(today.getDate() - 3);

        const formatDate = (date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0'); // Mes es 0-indexado
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };

        setMinDate(formatDate(threeDaysAgo));
        setMaxDate(formatDate(today));
    }, []);

    useEffect(() => {
        if (emisor !== undefined) {
            let data = JSON.parse(emisor)
            setRFC(data["Rfc"]) 
        }
    }, [emisor])

    return (
        <div className = "bg-white my-6 mx-4 p-4 shadow-xl rounded-md">
            <h3 className = "card-title mb-6">Datos del Emisor</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                <div className = "">
                    <label className = "">Emisor</label>
                    <Select 
                        register = {register}
                        nombre = "Emisor"
                        className = "select select-md select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/Emisor" 
                        clave = "Nombre"
                        onChange = {(e) => setEmisor(e.target.value)}
                    />
                </div>
                <div className = "">
                    <label className = "" >RFC</label>
                    <div>
                        <input 
                            type = "text" 
                            value = {rfc}
                            className = "input input-md input-bordered w-full" 
                            disabled
                        />
                    </div>
                </div>
                <div className = "">
                    <label className = "" >Lugar Expedicion</label>
                    <div>
                        <input 
                            type = "text" 
                            {...register("LugarExpedicion")}
                            className = "input input-md input-bordered w-full"
                            onChange = {(e) => setLugarExpedicion(e.target.value)}
                        />
                    </div>
                </div>
                <div className = "">
                    <label className = "">Serie</label>
                    <Select 
                        register = {register}
                        nombre = "Serie"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/Serie" 
                    />
                </div>
                <div className = "">
                    <label className = "">Fecha</label>
                    <div>
                        <input 
                            type="datetime-local" 
                            {...register("Fecha")}
                            step="1" 
                            min={minDate} 
                            max={maxDate} 
                            className="input input-md input-bordered w-full" 
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
