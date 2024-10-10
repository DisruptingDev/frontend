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
import { Box } from "@mui/material"; // Add this line to import Box


export default function Home() {
    const { register } = useForm();
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    const [filtro, setFiltro] = useState(null);

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else{
            setToken(token);
        }
    }, [router]);
    
    return (
        <Box>
            <Header />  
            <SearchFilter register = {register} setFiltro={setFiltro} />
            <Tabla token = {token} filtro={filtro} />
        </Box>
    );
}

