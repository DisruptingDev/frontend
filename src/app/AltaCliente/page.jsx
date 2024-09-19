"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente";
import { Box } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect"; 

export default function RegistroClientes() {
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');
    
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
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                <AltaCliente/>
            </Box>
        </div>
    );
}
