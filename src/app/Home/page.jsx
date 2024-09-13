"use client"
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx"
import SearchFilter from "@/components/Home/Busqueda/Busqueda.jsx"

import Tabla from "@/components/Home/Tabla/Tabla.jsx"
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa.jsx"
import AltaCliente from "@/components/AltaCliente/AltaCliente.jsx"
import { isAuthenticated } from "@/utils/authRedirect"; 


export default function Home() {
    const { register } = useForm();
    const router = useRouter(); // Inicializa el router

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        if (!isAuthenticated()) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
    }, [router]);
    
    return (
        <div>
            <Header />  
            <SearchFilter register = {register}/>
            <Tabla />
        </div>
    );
}

