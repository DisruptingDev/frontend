"use client"
import {useState} from "react"

import Header from "@/components/Header/Header.jsx"
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx"
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx"
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx"
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx"

function EnviarAEmisionTimbrado(emisor, receptor, conceptos) {
    let factura = {
        Version: "4.0",
        Folio: "2080427802",
        Sello: "",
        NoCertificado: "",
        Certificado: "",
        CondicionesDePago: "Condiciones de Pago",
        Moneda: "MXN",
        TipoCambio: "1",
        TipoDeComprobante: "I",
        Exportacion: "01",
        Confirmacion: "",
        InformacionGlobal: {    
            Periodicidad: "01",
            Meses: "01",
            Año: "2024"
        },
        ...emisor,
        ...receptor,
        ...conceptos
    }
    console.log(factura);
    const url = 'http://localhost:8080/TimbradoSimple';
    const opciones = {
        method: 'POST',
        headers: {
           'Content-Type': 'application/json'
        },
        body: JSON.stringify(factura)
    };

    fetch(url, opciones)
        .then(response => {
            return response.json(); // Convierte la respuesta a JSON
        })
        .then(data => {
            console.log('Éxito:', data);
        })
}

export default function CrearFactura() {
    const [emisor, setEmisor] = useState({
        LugarExpedicion: ""
    });
    const [receptor, setReceptor] = useState();
    const [conceptos, setConceptos] = useState();

    function handleSubmit(e) {
        e.preventDefault();
        EnviarAEmisionTimbrado(emisor, receptor, conceptos)
    }

    return (
        <div>
            <Header /> 
            <form onSubmit={handleSubmit} method="post">
                <Emisor enviarAlPadre={setEmisor} /> 
                <Receptor enviarAlPadre={setReceptor} emisor = {emisor}/> 
                <Conceptos enviarAlPadre={setConceptos}/> 
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

