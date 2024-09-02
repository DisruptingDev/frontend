"use client"
import Input from "@/components/Input/Input.jsx"

export default function Registro() {
  return (
    <main className="w-full h-screen flex items-center justify-center bg-gradient-to-r from-violet-500 to-fuchsia-500">
        <div className="card card-compact bg-gray-200/60 w-96 shadow-xl">
            <div className="card-body">
                <div className="w-full flex justify-center">
                    <h2 className="card-title text-black text-center">¡Registrate!</h2>
                </div>
                <div className="card-body">
                    <Input name = "Nombre" type = "text" placeholder = "Ingresa tu nombre"/>
                    <Input name = "Email" type = "email" placeholder = "Ingresa tu email"/>
                    <Input name = "Contraseña" type = "password" placeholder = "Ingresa tu contraseña"/>
                    <Input name = "Confirma tu contraseña" type = "password" placeholder = "Ingresa tu contraseña nuevamente"/>
                </div>
                <div className="card-actions justify-center">
                    <button className="btn btn-primary">Registrarse</button>
                </div>
            </div>
        </div>
    </main>
  );
}
