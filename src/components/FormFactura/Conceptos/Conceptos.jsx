"use client"

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"
import { useForm, useFieldArray } from 'react-hook-form';

import React, { useState, useEffect } from 'react';

export default function Conceptos( {register, watch, setValue} ) {
    const [seccionImpuestos, setSeccionImpuestos] = useState([])
    const [cantidad, setCantidad] = useState(1)
    const [precioUnitario, setPrecioUnitario] = useState(0)
    const [descuento, setDescuento] = useState(0)
    const [subTotal, setSubtotal] = useState(0)
    const [baseImpuesto, setBaseImpuesto] = useState(0)

    useEffect(() => {
        let sub = CalcularSubtotal(cantidad, precioUnitario, descuento)
        setValue("SubTotal", sub)
        setSubtotal(sub)
        setBaseImpuesto(sub)
    }, [cantidad, precioUnitario, descuento])

    /*
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
    */

    const { control } = useForm({
        defaultValues: {
            impuestos: [{ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' }]
        }
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'impuestos'
    });

    const calculateMonto = (baseImpuesto, tasa) => {
        return baseImpuesto * tasa;
    };

    const calculateTasa = (impuesto) => {
        const tasas = {
            'Impuesto1': 0.16,
            'Impuesto2': 0.08,
        };
        return tasas[impuesto] || 0;
    };

    useEffect(() => {
        fields.forEach((field, index) => {
            const baseImpuesto = watch(`impuestos[${index}].BaseImpuesto`);
            const impuesto = watch(`impuestos[${index}].Impuesto`);

            if (baseImpuesto !== undefined && impuesto !== undefined) {
                const tasa = calculateTasa(impuesto);
                setValue(`impuestos[${index}].Tasa`, tasa);
                const monto = calculateMonto(baseImpuesto, tasa);
                setValue(`impuestos[${index}].Monto`, monto);
            }
        });
    }, [fields, watch, setValue]);

    return (
        <div className = "bg-white my-6 mx-4 p-4 shadow-xl rounded-md">
            <h3 className = "card-title mb-6">Conceptos</h3>
            <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-6">
                <div className = "">
                    <label className = "">Producto - Servicio</label>
                    <Select 
                        register = {register}
                        nombre = "ClaveProdServ"
                        className = "select select-md select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/ClaveProdServ"
                    />
                </div>
                <div className = "">
                    <label className = "">Clave Unidad</label>
                    <Select 
                        register = {register}
                        nombre = "ClaveProdServ"
                        className = "select select-md select-bordered w-full" 
                        url = "http://localhost:8081/Catalogos/ClaveUnidad"
                    />
                </div>
                <div className = "">
                    <label className = "">Descripcion</label>
                    <input 
                        type="text" 
                        {...register("Descripcion")}
                        className = "input input-bordered input-md w-full" 
                        />
                </div>
                <div className = "">
                    <label className = "">Cantidad</label>
                    <input 
                        type="number" 
                        {...register("Cantidad")}
                        value = {cantidad}
                        className = "input input-bordered input-md w-full" 
                        onChange = {(e) => setCantidad(e.target.value)}
                        />
                </div>
                <div className = "">
                    <label className = "">Precio Unitario</label>
                    <input 
                        type="number" 
                        {...register("ValorUnitario")}
                        value = {precioUnitario}
                        className = "input input-bordered input-md w-full" 
                        onChange = {(e) => setPrecioUnitario(e.target.value)}
                        />
                </div>
                <div className = "">
                    <label className = "">Descuento</label>
                    <input 
                        type="number" 
                        {...register("Descuento")}
                        value = {descuento}
                        className = "input input-bordered input-md w-full" 
                        onChange = {(e) => setDescuento(e.target.value)}
                        />
                </div>
                <div className = "">
                    <label className = "">Subtotal</label>
                    <input 
                        type="number" 
                        {...register("SubTotal")}
                        value = {subTotal}
                        className = "input input-bordered input-md w-full" 
                        disabled/>
                </div>
                {fields.map((field, index) => (
                <div key={field.id} className = "grid gap-6 sm:col-span-2 md:col-span-3 lg:col-span-7">
                    <div className="sm:col-span-2 md:col-span-3 lg:col-span-7 divider" />
                    <div>
                        <label>Objeto Impuesto</label>
                        <Select
                            register={register}
                            nombre={`impuestos[${index}].ObjetoImpuesto`}
                            className="select select-md select-bordered w-full"
                            url="http://localhost:8081/Catalogos/ObjetoImpuestos"
                        />
                    </div>
                    <div>
                        <label>Impuesto</label>
                        <Select
                            register={register}
                            nombre={`impuestos[${index}].Impuesto`}
                            className="select select-md select-bordered w-full"
                            url="http://localhost:8081/Catalogos/ImpuestoClave"
                        />
                    </div>
                    <div>
                        <label>Tasa</label>
                        <input
                            type="number"
                            {...register(`impuestos[${index}].Tasa`)}
                            className="input input-bordered input-md w-full"
                            disabled
                        />
                    </div>
                    <div>
                        <label>Base Impuesto</label>
                        <input
                            type="number"
                            {...register(`impuestos[${index}].BaseImpuesto`)}
                            className="input input-bordered input-md w-full"
                            disabled
                        />
                    </div>
                    <div>
                        <label>Monto</label>
                        <input
                            type="number"
                            {...register(`impuestos[${index}].Monto`)}
                            className="input input-bordered input-md w-full"
                            disabled
                        />
                    </div>
                    <div className="sm:col-span-2 md:col-span-3 lg:col-span-6">
                        <button type="button" onClick={() => remove(index)}>
                            <img src="remove_circle.png" className="mt-6" alt="Eliminar" />
                        </button>
                    </div>
                </div>
            ))}
            <div className="sm:col-span-2 md:col-span-3 lg:col-span-6">
                <button
                    type="button"
                    onClick={() => append({ ObjetoImpuesto: '', Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' })}
                >
                    <img src="add_circle.png" className="mt-6" alt="Agregar" />
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
