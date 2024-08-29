"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";

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
        conceptos // Ya es un array, así que se incluye tal cual
    };

    console.log(factura);
    // Aquí puedes enviar la factura a tu backend o procesarla como sea necesario
}

export default function CrearFactura() {
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [conceptos, setConceptos] = useState([]);
    
    const onSubmit = (data) => {
        console.log("Datos del formulario:", data);
        console.log("Datos de conceptos:", conceptos);
        
        // Aquí se llama a la función para construir la factura
        EnviarAEmisionTimbrado(data, data, conceptos);
    };

    // Función para manejar la vista previa, también realiza la validación
    const handlePreview = handleSubmit((data) => {
        console.log("Vista previa de los datos:", data);
        // Lógica para mostrar la vista previa
    });

    return (
        <div>
            <Header /> 
            <form onSubmit={handleSubmit(onSubmit)} method="post">
                <Emisor 
                    register={register} 
                    setLugarExpedicion={setLugarExpedicion} 
                    setValue={setValue} 
                    trigger={trigger} 
                    errors={errors} 
                /> 
                <Receptor register={register} lugarExpedicion={lugarExpedicion} errors={errors}  setValue={setValue} 
                    trigger={trigger}  /> 
                <Conceptos 
                    register={register} 
                    watch={watch} 
                    setValue={setValue} 
                    getValues={getValues} 
                    setConceptos={setConceptos}
                /> 
                <Resumen conceptos={conceptos} subTotal={watch("Subtotal")}> 
                    <div className="flex justify-end w-full space-x-2 mt-10">
                        <button className="btn btn-secondary bg-red-700" type="button">Cancelar</button>

                        <button className="btn btn-accent" type="button" onClick={handlePreview}>Vista previa</button>
                        <button type="submit" className="btn btn-primary bg-primary-dark-total">Crear Factura</button>
                    </div>
                </Resumen> 
            </form>
        </div>
    );
}
