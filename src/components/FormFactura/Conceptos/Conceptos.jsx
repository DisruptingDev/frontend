"use client"

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

import React, { useState, useEffect } from 'react';

function CalcularSubtotal(cantidad, precioUnitario, descuento) {
    let sub = (cantidad * precioUnitario) - descuento
    if (sub >= 0) {
        return sub
    }
    return 0
}

function CalcularTotal(subtotal, monto) {
    let total = (subtotal - monto)
    return total
}

function CalcularMonto(baseImpuesto, tasa) {
    let monto = baseImpuesto * tasa;
    return monto
}

export default function Conceptos( {enviarAlPadre} ) {
    const [claveProductoServicio, setClaveProductoServicio] = useState();
    const [claveUnidad, setClaveUnidad] = useState({
        Clave: ""
    });
    const [descripcion, setDescripcion] = useState();
    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState(0);
    const [descuento, setDescuento] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [objetoImpuesto, setObjetoImpuesto] = useState({
        Clave: ""
    });
    const [impuesto, setImpuesto] = useState({
        Clave: "000"
    });
    const [tasa, setTasa] = useState(0);
    const [baseImpuesto, setBaseImpuesto] = useState(0);
    const [monto, setMonto] = useState(0);

    const [seccionImpuestos, setSeccionImpuestos] = useState([
        {
            Retenciones: {},
            Traslados: {}
        }
    ]);

    useEffect(() => {
        let sub = CalcularSubtotal(cantidad, precioUnitario, descuento)
        setSubtotal(sub)
        setBaseImpuesto(sub)
    }, [cantidad, precioUnitario, descuento])

    useEffect(() => {
        let monto = CalcularMonto(baseImpuesto, tasa)
        setMonto(monto)
    }, [baseImpuesto, tasa])

    useEffect(() => {
        switch (impuesto["Clave"]) {
            case '001':
                setTasa(0.5) 
            break;
            case '002':
                setTasa(0.16) 
            break;
            case '003':
                setTasa(0.1) 
            break;
            default:
                setTasa(0)
        }
    }, [impuesto])

    useEffect(() => {
        let total = CalcularTotal(subtotal, monto)
        let conceptos_data = {
            Total: total,
            SubTotal: subtotal,

            Conceptos: {
                TotalImpuestosTrasladados: 0,
                TotalImpuestosRetenidos: monto,
                ListaConceptos: [
                    {
                        //ClaveProdServ: claveProductoServicio,
                        ClaveProdServ: "50211503",
                        NoIdentificacion: "UT421511",
                        Cantidad: cantidad, 
                        ClaveUnidad: claveUnidad["Clave"], 
                        Unidad: claveUnidad["Descripcion"],
                        Descripcion: descripcion,
                        ValorUnitario: parseFloat(precioUnitario),
                        Descuento: parseFloat(descuento), 
                        Importe: subtotal,
                        ObjetoImp: objetoImpuesto["Clave"],
                        Impuestos: {
                            Retenciones: [
                                {
                                    Base: baseImpuesto,
                                    ImpuestoClave: impuesto["Clave"],
                                    TipoFactor: "Tasa",
                                    TasaOCuota: tasa,
                                    Importe: monto,
                                }
                            ]
                        }
                    }
                ]
            }
        }
        enviarAlPadre(conceptos_data)

    }, [claveProductoServicio, claveUnidad, descripcion, cantidad, precioUnitario, descuento, subtotal, objetoImpuesto, impuesto, tasa, baseImpuesto, monto])

    function ChangeDescripcion(event) {
        setDescripcion(event.target.value)
    }

    function ChangeCantidad(event) {
        setCantidad(event.target.value)
    }

    function ChangePrecioUnitario(event) {
        setPrecioUnitario(event.target.value)
    }

    function ChangeDescuento(event) {
        setDescuento(event.target.value)
    }

    function ClickAgregarImpuesto(event) {
        setSeccionImpuestos([...seccionImpuestos, { Nombre:"Caco" }]);
    }

    return (
        <div className = "bg-white my-6 mx-4 p-4 shadow-xl rounded-md">
            <h3 className = "card-title mb-6">Conceptos</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
                <div className = "">
                    <label className = "">Producto - Servicio</label>
                    <Select 
                        className = "select select-md select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/ClaveProdServ"
                        funcionPadre = {setClaveProductoServicio}
                    />
                </div>
                <div className = "">
                    <label className = "">Clave Unidad</label>
                    <Select 
                        className = "select select-md select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/ClaveUnidad"
                        funcionPadre = {setClaveUnidad}
                    />
                </div>
                <div className = "">
                    <label className = "">Descripcion</label>
                    <input type="text" className = "input input-bordered input-md w-full" onChange = {ChangeDescripcion}/>
                </div>
                <div className = "">
                    <label className = "">Cantidad</label>
                    <input type="number" className = "input input-bordered input-md w-full" defaultValue = "1" onChange = {ChangeCantidad}/>
                </div>
                <div className = "">
                    <label className = "">Precio Unitario</label>
                    <input type="number" className = "input input-bordered input-md w-full" onChange = {ChangePrecioUnitario}/>
                </div>
                <div className = "">
                    <label className = "">Descuento</label>
                    <input type="number" className = "input input-bordered input-md w-full" defaultValue = "0" onChange = {ChangeDescuento}/>
                </div>
                <div className = "">
                    <label className = "">Subtotal</label>
                    <input type="number" value={subtotal} name="" id="" className = "input input-bordered input-md w-full" disabled/>
                </div>

                {seccionImpuestos.map((seccion) => (
                    <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6 sm:col-span-2 md:col-span-3 lg:col-span-7">
                    
                    <div className = "sm:col-span-2 md:col-span-3 lg:col-span-7 divider"/>
                    <div className = "">
                        <label className = "">Objeto Impuesto</label>
                        <Select 
                            className = "select select-md select-bordered w-full" 
                            url = "http://localhost:8081/Catalogos/ObjetoImpuestos"
                            funcionPadre = {setObjetoImpuesto}
                        />
                    </div>
                    <div className = "">
                        <label className = "">Impuesto</label>
                        <Select 
                            className = "select select-md select-bordered w-full" 
                            url = "http://localhost:8081/Catalogos/ImpuestoClave"
                            funcionPadre = {setImpuesto}
                        />
                    </div>
                    <div className = "">
                        <label className = "">Tasa</label>
                        <input type="number" value = {tasa} className = "input input-bordered input-md w-full" disabled/>
                    </div>
                    <div className = "">
                        <label className = "">Base Impuesto</label>
                        <input type="number" value = {baseImpuesto} className = "input input-bordered input-md w-full" disabled/>
                    </div>
                    <div className = "">
                        <label className = "">Monto</label>
                        <input type="number" value = {monto} className = "input input-bordered input-md w-full" disabled/>
                    </div>
                </div>
                ))}

                <div className = "sm:col-span-2 md:col-span-3 lg:col-span-6">
                    <button type = "button" className="" onClick = {ClickAgregarImpuesto}>
                        <img src="add_circle.png" className = "mt-6" />
                    </button>
                </div>

                <div className = "sm:col-span-2 md:col-span-3 lg:col-span-6"/>
                <div>
                    <button type="button" className="btn bg-primary-dark-total text-white hover:underline hover:bg-primary-dark-total">Agregar Concepto</button>
                </div>
            </div>
        </div>
    )
}
