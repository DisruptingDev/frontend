import Input from "@/components/Input/Input.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Registro() {
  return (
    <main className="h-full flex items-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500">
        <div className="card card-compact bg-gray-200/60 w-96 shadow-xl">
            <div className="card-body">

                <div className="w-full flex justify-center">
                    <h2 className="card-title text-black text-center">Registro de Emisores</h2>
                </div>

                <div className="card-body">
                    <Input name = "Nombre" type = "text" placeholder = "Ingresa el nombre del cliente"/>
                    <Input name = "RFC" type = "text" placeholder = "Ingresa el RFC del cliente"/>
                    <Select name = "Regimen Fiscal" url = "http://localhost:8080/regimenfiscal" />
                </div>

                <div className="card-actions justify-center">
                    <button className="btn btn-primary">Registrarse</button>
                </div>
            </div>
        </div>
    </main>
  );
}


