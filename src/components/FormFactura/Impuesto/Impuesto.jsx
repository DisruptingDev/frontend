"use client"

import { useEffect, useState } from 'react';

import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Impuesto( {register, setValue, index, baseImpuesto} ) {
    const [tasa, setTasa] = useState(0)
    const [monto, setMonto] = useState(0)

    useEffect(() => {
        let resultado = tasa * baseImpuesto
        setMonto(resultado) 
        setValue(`impuestos[${index}].Monto`, resultado)
    }, [tasa, baseImpuesto])

    useEffect(() => {
        setValue(`impuestos[${index}].BaseImpuesto`, baseImpuesto)
    }, [baseImpuesto])

    const ChangeSelectImpuesto = (e) => {
        let data = JSON.parse(e.target.value)
        setTasa(data.Tasa)
        setValue(`impuestos[${index}].Tasa`, data.Tasa)
    }

    return (
        <div className = "grid gap-6 sm:col-span-2 md:col-span-3 lg:col-span-7">
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
                    onChange = {(e) => ChangeSelectImpuesto(e)}
                />
            </div>
            <div>
                <label>Tasa</label>
                <input
                    type="number"
                    {...register(`impuestos[${index}].Tasa`)}
                    value = {tasa}
                    className="input input-bordered input-md w-full"
                    disabled
                />
            </div>
            <div>
                <label>Base Impuesto</label>
                <input
                    type="number"
                    value = {baseImpuesto}
                    {...register(`impuestos[${index}].BaseImpuesto`)}
                    className="input input-bordered input-md w-full"
                    disabled
                />
            </div>
            <div>
                <label>Monto</label>
                <input
                    type="number"
                    value = {monto}
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
    )
}
