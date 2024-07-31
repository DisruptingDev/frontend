import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Conceptos() {
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
                    <input type="number" className = "input input-bordered input-md w-full" defaultValue = "1"/>
                </div>
                <div className = "">
                    <label className = "">Precio Unitario</label>
                    <input type="number" className = "input input-bordered input-md w-full"/>
                </div>
                <div className = "">
                    <label className = "">Descuento</label>
                    <input type="number" className = "input input-bordered input-md w-full"/>
                </div>
                <div className = "">
                    <label className = "">Subtotal</label>
                    <input type="number" value="100" name="" id="" className = "input input-bordered input-md w-full" disabled/>
                </div>
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
