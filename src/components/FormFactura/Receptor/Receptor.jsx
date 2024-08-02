"use client"
import React, { useState, useEffect, useRef } from 'react';

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Receptor( {register, watch, lugarExpedicion, getValues} ) {
    const [receptor, setReceptor] = useState();
    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState("hidden");
    const [domicilioFiscal, setDomicilioFiscal] = useState("");

    useEffect(() => {
        if (receptor !== undefined) {
            let data = JSON.parse(receptor)
            if (data["Rfc"] !== "XAXX010101000") {
                setDomicilioFiscal(data["DomicilioFiscalReceptor"]) 
                setHiddeInfoGlobal("hidden")
            }
            else{
                setDomicilioFiscal(lugarExpedicion) 
                setHiddeInfoGlobal("")
            }
        }
    }, [receptor, lugarExpedicion])

    return (
        <div className = "bg-white mx-4 p-4 shadow-xl rounded-md m-100">
            <h3 className = "card-title mb-6">Datos del Receptor</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div className = "">
                    <label className = "">Receptor</label>
                    <Select 
                        className = "select select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/Receptor" 
                        clave = "Nombre"
                        register = {register}
                        nombre = "Receptor"
                        onChange = {(e) => setReceptor(e.target.value)}
                    />
                </div>
                <div className = "">
                    <label className = "">RFC</label>
                    <div>
                        <input 
                            type = "text" 
                            value = ""
                            className = "input input-md input-bordered w-full" 
                            disabled/>
                    </div>
                </div>
                <div className = "">
                    <label className = "" >Domicilio Fiscal</label>
                    <div>
                        <input 
                            type = "text" 
                            value = {domicilioFiscal} 
                            className = "input input-md input-bordered w-full" 
                            disabled
                        />
                    </div>
                </div>
                <div className = "">
                    <label className = "">Regimen Fiscal</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/RegimenFiscal"
                        register = {register}
                        nombre = "RegimenFiscal"
                    />
                </div>
                <div className = "">
                    <label className = "">Metodo de Pago</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/MetodoPago"
                        register = {register}
                        nombre = "MetodoPago"
                    />
                </div>
                <div>
                    <button className="">
                        <img src="add_circle.png" className = "mt-6" />
                    </button>
                </div>
                <div className = "">
                    <label className = "">Forma de Pago</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/FormaPago"
                        register = {register}
                        nombre = "FormaPago"
                    />
                </div>
                <div className = "">
                    <label className = "">Uso de CFDI</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/UsoCFDI"
                        register = {register}
                        nombre = "UsoCFDI"
                    />
                </div>
                <div className = "">
                    <label className = "">Exportaciones</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/Exportaciones"
                        register = {register}
                        nombre = "Exportaciones"
                    />
                </div>
                <div className = {`sm:col-span-2 md:col-span-3 lg:col-span-6 divider w-full ${hiddeInfoGlobal}`} />
                <div className = {hiddeInfoGlobal}>
                    <label className = "text-slate-500" >Informacion<br/>Global</label>
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Periodicidad</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/Periodicidad"
                        register = {register}
                        nombre = "Periodicidad"
                    />
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Meses</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/PeriodicidadMeses"
                        register = {register}
                        nombre = "Meses"
                    />
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Año</label>
                    <div>
                        <input className = "input input-bordered" type="number" min="1900" max="2100" />
                    </div>
                </div>
            </div>
        </div>
    )
}

