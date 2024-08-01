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

export default function Conceptos() {

    const [cantidad, setCantidad] = useState(1);
    const [precioUnitario, setPrecioUnitario] = useState(0);
    const [subtotal, setSubtotal] = useState(0);
    const [descuento, setDescuento] = useState(0);

    useEffect(() => {
        let sub = CalcularSubtotal(cantidad, precioUnitario, descuento)
        setSubtotal(sub)
    }, [cantidad, precioUnitario, descuento])

    function ChangeCantidad(event) {
        setCantidad(event.target.value)
    }

    function ChangePrecioUnitario(event) {
        setPrecioUnitario(event.target.value)
    }

    function ChangeDescuento(event) {
        setDescuento(event.target.value)
    }

    return (
        <div className = "bg-white my-6 mx-4 p-4 shadow-xl rounded-md">
            <h3 className = "card-title mb-6">Conceptos</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
                <div className = "">
                    <label className = "">Producto - Servicio</label>
                    <Select className = "select select-md select-bordered w-full" url = "http://localhost:8080/Catalogos/ClaveProdServ"/>
                </div>
                <div className = "">
                    <label className = "">Clave Unidad</label>
                    <Select className = "select select-md select-bordered w-full" url = "http://localhost:8080/Catalogos/ClaveUnidad"/>
                </div>
                <div className = "">
                    <label className = "">Descripcion</label>
                    <input type="text" className = "input input-bordered input-md w-full"/>
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

                <div className = "sm:col-span-2 md:col-span-3 lg:col-span-7 divider"/>
                <div className = "">
                    <label className = "">Objeto Impuesto</label>
                    <Select className = "select select-md select-bordered w-full" url = "http://localhost:8080/Catalogos/ObjetoImpuestos"/>
                </div>
                <div className = "">
                    <label className = "">Impuesto</label>
                    <Select className = "select select-md select-bordered w-full" url = "http://localhost:8080/Catalogos/ImpuestoClave"/>
                </div>
                <div className = "">
                    <label className = "">Base Impuesto</label>
                    <input type="number" value="100" name="" id="" className = "input input-bordered input-md w-full" disabled/>
                </div>
                <div className = "">
                    <label className = "">Monto</label>
                    <input type="number" value="100" name="" id="" className = "input input-bordered input-md w-full" disabled/>
                </div>
                <div>
                    <button className="">
                        <img src="add_circle.png" className = "mt-6" />
                    </button>
                </div>

                <div className = "sm:col-span-2 md:col-span-3 lg:col-span-6"/>
                <div>
                    <button className="btn bg-primary-dark-total text-white hover:underline hover:bg-primary-dark-total">Agregar Concepto</button>
                </div>
            </div>
        </div>
    )
}
