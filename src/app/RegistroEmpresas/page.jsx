import Input from "@/components/Input/Input.jsx"
import FileInput from "@/components/FileInput/FileInput.jsx"
import Select from "@/components/Select/Select.jsx"

export default function Registro() {
  return (
    <main className="py-10 flex items-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500">
        <div className="card card-compact bg-gray-200/60 w-96 shadow-xl">
            <div className="card-body">

                <div className="w-full flex justify-center">
                    <h2 className="card-title text-black text-center">¡Registra una empresa!</h2>
                </div>

                <div className="card-body">
                    <Input name = "Nombre" type = "text" placeholder = "Ingresa el nombre del cliente"/>
                    <Input name = "RFC" type = "text" placeholder = "Ingresa el RFC del cliente"/>
                    <Select name = "Regimen Fiscal" url = "http://localhost:8080/regimenfiscal" />

                    <div className="divider divider-success">FILES</div>
                    <div className="label">
                        <label className="font-bold text-gray-700">Sube los archivos del certificado</label> 
                    </div>
                    <FileInput name = "Archivo (.cer)"/>
                    <FileInput name = "Archivo (.key)"/>
                </div>

                <div className="card-actions justify-center">
                    <button className="btn btn-primary">Registrarse</button>
                </div>
            </div>
        </div>
    </main>
  );
}
