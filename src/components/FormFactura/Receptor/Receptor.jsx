"use client"
import React, { useState, useEffect } from 'react';

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Receptor( {enviarAlPadre} ) {
    const [receptor, setReceptor] = useState({
        Rfc: "",
        DomicilioFiscalReceptor: ""
    });
    const [domicilioFiscal, setDomicilioFiscal] = useState();
    const [regimenFiscal, setRegimenFiscal] = useState();
    const [metodoPago, setMetodoPago] = useState();
    const [formaPago, setFormaPago] = useState();
    const [usoCFDI, setUsoCFDI] = useState();
    const [exportaciones, setExportaciones] = useState();

    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState("hidden");

    useEffect(() => {
        let result = {
            Receptor: receptor,
            RegimenFiscal: regimenFiscal,
            MetodoPago: metodoPago,
            FormaPago: formaPago,
            UsoCFDI: usoCFDI,
            Exportaciones: exportaciones,
        }

        enviarAlPadre(result)
    }, [receptor, regimenFiscal, metodoPago, formaPago, usoCFDI, exportaciones])
    
    function getReceptor(result) {
        if (result["Rfc"] == "XAXX010101000") {
            setHiddeInfoGlobal("") 
            result["DomicilioFiscalReceptor"] = "Mismo que Emisor"
        }
        else {
           setHiddeInfoGlobal("hidden") 
        }
        setReceptor(result)
    }

    return (
        <div className = "bg-white mx-4 p-4 shadow-xl rounded-md m-100">
            <h3 className = "card-title mb-6">Datos del Receptor</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                <div className = "">
                    <label className = "">Receptor</label>
                    <Select 
                        className = "select select-bordered w-full" 
                        url = "http://localhost:8080/Catalogos/Receptor" 
                        clave = "Nombre"
                        funcionPadre = {getReceptor}
                    />
                </div>
                <div className = "">
                    <label className = "">RFC</label>
                    <div>
                        <input type = "text" value = {receptor["Rfc"]} className = "input input-md input-bordered w-full" disabled/>
                    </div>
                </div>
                <div className = "">
                    <label className = "" >Domicilio Fiscal</label>
                    <div>
                        <input type = "text" value = {receptor["DomicilioFiscalReceptor"]} className = "input input-md input-bordered w-full" disabled/>
                    </div>
                </div>
                <div className = "">
                    <label className = "">Regimen Fiscal</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8080/Catalogos/RegimenFiscal"
                        funcionPadre = {setRegimenFiscal}
                    />
                </div>
                <div className = "">
                    <label className = "">Metodo de Pago</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8080/Catalogos/MetodoPago"
                        funcionPadre = {setMetodoPago}
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
                        url = "http://localhost:8080/Catalogos/FormaPago"
                        funcionPadre = {setFormaPago}
                    />
                </div>
                <div className = "">
                    <label className = "">Uso de CFDI</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8080/Catalogos/UsoCFDI"
                        funcionPadre = {setUsoCFDI}
                    />
                </div>
                <div className = "">
                    <label className = "">Exportaciones</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8080/Catalogos/Exportaciones"
                        funcionPadre = {setExportaciones}
                    />
                </div>
                <div className = {`sm:col-span-2 md:col-span-3 lg:col-span-6 divider w-full ${hiddeInfoGlobal}`} />
                <div className = {hiddeInfoGlobal}>
                    <label className = "text-slate-500" >Informacion<br/>Global</label>
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Periodicidad</label>
                    <Select className = "select select-bordered select-md w-full" url = "http://localhost:8080/Catalogos/Periodicidad"/>
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Meses</label>
                    <Select className = "select select-bordered select-md w-full" url = "http://localhost:8080/Catalogos/PeriodicidadMeses"/>
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

