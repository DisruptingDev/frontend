import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Conceptos() {
  return (
    <main className="w-full p-10 flex items-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500">
        <div className="card card-compact bg-gray-200/60 w-96 shadow-xl">
            <div className="card-body">

                <div className="w-full flex justify-center">
                    <h2 className="card-title text-black text-center">Formulario de Conceptos</h2>
                </div>

                <div className="card-body">
                    <Select name = "Clave Producto o Servicio" url = "http://31.220.31.152:8081/Catalogos/usocfdi"/>

                    <Input name = "NoIdentificacion" type = "text" placeholder = "Numero de identificacion"/>
                    <Input name = "Cantidad" type = "number" placeholder = "Ingresa la cantidad"/>
                    <Select name = "ClaveUnidad" url = "http://31.220.31.152:8081/Catalogos/usocfdi"/>

                    <Input name = "Descripcion" type = "text" placeholder = "Descripcion"/>
                    <Input name = "Valor Unitario" type = "number" placeholder = "Valor Unitario"/>

                    <Input name = "Importe" type = "number" placeholder = "Importe"/>
                    <Input name = "Descuento" type = "number" placeholder = "Descuento"/>

                </div>

                <div className="card-actions justify-center">
                    <button className="btn btn-primary">Registrarse</button>
                </div>
            </div>
        </div>
    </main>
  );
}


