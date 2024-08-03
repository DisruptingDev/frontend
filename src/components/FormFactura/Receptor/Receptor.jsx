"use client"
import React, { useState, useEffect, useRef } from 'react';

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Receptor( {register, watch, lugarExpedicion, getValues} ) {
    const [receptor, setReceptor] = useState();
    const [rfc, setRFC] = useState();
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
            setRFC(data["Rfc"])
        }
    }, [receptor, lugarExpedicion])

    return (
        <div className = "bg-white mx-4 p-4 shadow-xl rounded-md m-100">
            <h3 className = "card-title mb-6">Datos del Receptor</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div className = "">
                    <label className = "">Receptor</label>
                    <Select 
                        register = {register}
                        nombre = "Receptor"
                        className = "select select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/Receptor" 
                        clave = "Nombre"
                        onChange = {(e) => setReceptor(e.target.value)}
                    />
                </div>
                <div className = "">
                    <label className = "">RFC</label>
                    <div>
                        <input 
                            type = "text" 
                            value = {rfc}
                            className = "input input-md input-bordered w-full" 
                            disabled/>
                    </div>
                </div>
                <div className = "">
                    <label className = "" >Domicilio Fiscal</label>
                    <div>
                        <input 
                            type = "text" 
                            {...register("DomicilioFiscalReceptor")}
                            value = {domicilioFiscal} 
                            className = "input input-md input-bordered w-full" 
                            disabled
                        />
                    </div>
                </div>
                <div className = "">
                    <label className = "">Regimen Fiscal</label>
                    <Select 
                        register = {register}
                        nombre = "RegimenFiscal"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/RegimenFiscal"
                    />
                </div>
                <div className = "">
                    <label className = "">Metodo de Pago</label>
                    <Select 
                        register = {register}
                        nombre = "MetodoPago"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/MetodoPago"
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
                        register = {register}
                        nombre = "FormaPago"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/FormaPago"
                    />
                </div>
                <div className = "">
                    <label className = "">Uso de CFDI</label>
                    <Select 
                        register = {register}
                        nombre = "UsoCFDI"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/UsoCFDI"
                    />
                </div>
                <div className = "">
                    <label className = "">Exportaciones</label>
                    <Select 
                        register = {register}
                        nombre = "Exportaciones"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/Exportaciones"
                    />
                </div>
                <div className = {`sm:col-span-2 md:col-span-3 lg:col-span-6 divider w-full ${hiddeInfoGlobal}`} />
                <div className = {hiddeInfoGlobal}>
                    <label className = "text-slate-500" >Informacion<br/>Global</label>
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Periodicidad</label>
                    <Select 
                        register = {register}
                        nombre = "Periodicidad"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/Periodicidad"
                    />
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Meses</label>
                    <Select 
                        register = {register}
                        nombre = "Meses"
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/PeriodicidadMeses"
                    />
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Año</label>
                    <div>
                        <input 
                            type="number" 
                            {...register("Año")}
                            className = "input input-bordered" 
                            min="1900" 
                            max="2100" />
                    </div>
                </div>
            </div>
        </div>
    )
}

