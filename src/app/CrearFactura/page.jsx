"use client"
import {useState} from "react"

import Header from "@/components/Header/Header.jsx"
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx"
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx"
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx"
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx"

export default function CrearFactura() {
    const [emisor, setEmisor] = useState();
    const [receptor, setReceptor] = useState();

    const [lugarExpedicion, setLugarExpedicion] = useState();

    function handleSubmit(e) {
        e.preventDefault();
        console.log(emisor)
        console.log(receptor)
    };

    return (
        <div>
            <Header /> 
            <form onSubmit={handleSubmit} method="post">
                <Emisor enviarAlPadre={setEmisor} /> 
                <Receptor enviarAlPadre={setReceptor}/> 
                <Conceptos /> 
                <Resumen> 
                    <div className = "flex justify-end w-full space-x-2 mt-10">
                        <button className="btn btn-secondary bg-red-700">Cancelar</button>
                        <button className="btn btn-accent">Vista previa</button>
                        <button type = "submit" className="btn btn-primary bg-primary-dark-total">Crear Factura</button>
                    </div>
                </Resumen> 
            </form>
        </div>
    );
}

