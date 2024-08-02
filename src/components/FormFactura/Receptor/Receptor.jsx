"use client"
import React, { useState, useEffect } from 'react';

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Receptor( {enviarAlPadre, emisor} ) {
    const [receptor, setReceptor] = useState({
        Rfc: "",
        DomicilioFiscalReceptor: ""
    });
    const [regimenFiscal, setRegimenFiscal] = useState()
    const [usoCFDI, setUsoCFDI] = useState()
    const [metodoPago, setMetodoPago] = useState({
        Clave: ""
    });
    const [formaPago, setFormaPago] = useState({
        Clave: ""
    });
    const [exportaciones, setExportaciones] = useState();

    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState("hidden");

    useEffect(() => {
        let result = {
            Receptor: receptor,
            MetodoPago: metodoPago["Clave"],
            FormaPago: formaPago["Clave"],
        }

        enviarAlPadre(result)
    }, [receptor, regimenFiscal, usoCFDI, metodoPago, formaPago])

    useEffect(() => {
        if (receptor["Rfc"] === "XAXX010101000") {
            setReceptor(prevEstado => ({
                ...prevEstado,
                DomicilioFiscalReceptor: emisor["LugarExpedicion"]
            }));
        }
    }, [emisor])
    
    function getReceptor(result) {
        if (result["Rfc"] === "XAXX010101000") {
            result["DomicilioFiscalReceptor"] = emisor["LugarExpedicion"]
            setHiddeInfoGlobal("") 
        }
        else {
           setHiddeInfoGlobal("hidden") 
        }
        setReceptor(result)
    }

    function ChangeUsoCFDI(result) {
        setUsoCFDI(result)
        receptor["UsoCFDI"] = result["Clave"]
    }

    function ChangeRegimenFiscal(result) {
        setRegimenFiscal(result)
        receptor["RegimenFiscalReceptor"] = result["Clave"]
    }

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
                        url = "http://localhost:8081/Catalogos/RegimenFiscal"
                        funcionPadre = {ChangeRegimenFiscal}
                    />
                </div>
                <div className = "">
                    <label className = "">Metodo de Pago</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/MetodoPago"
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
                        url = "http://localhost:8081/Catalogos/FormaPago"
                        funcionPadre = {setFormaPago}
                    />
                </div>
                <div className = "">
                    <label className = "">Uso de CFDI</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/UsoCFDI"
                        funcionPadre = {ChangeUsoCFDI}
                    />
                </div>
                <div className = "">
                    <label className = "">Exportaciones</label>
                    <Select 
                        className = "select select-bordered select-md w-full" 
                        url = "http://localhost:8081/Catalogos/Exportaciones"
                        funcionPadre = {setExportaciones}
                    />
                </div>
                <div className = {`sm:col-span-2 md:col-span-3 lg:col-span-6 divider w-full ${hiddeInfoGlobal}`} />
                <div className = {hiddeInfoGlobal}>
                    <label className = "text-slate-500" >Informacion<br/>Global</label>
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Periodicidad</label>
                    <Select className = "select select-bordered select-md w-full" url = "http://localhost:8081/Catalogos/Periodicidad"/>
                </div>
                <div className = {hiddeInfoGlobal}>
                    <label className = "">Meses</label>
                    <Select className = "select select-bordered select-md w-full" url = "http://localhost:8081/Catalogos/PeriodicidadMeses"/>
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

