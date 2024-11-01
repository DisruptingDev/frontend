"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaConceptos from "@/components/VistaConceptos/VistoConceptos";
import { Box } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";

export default function Conceptos() {

    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");

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
    <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                <VistaConceptos token={token} />
            </Box>
        </div>
  );
}


