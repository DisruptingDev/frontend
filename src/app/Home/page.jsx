"use client"; // Indica que este componente se renderiza en el cliente

// Importación de hooks y utilidades
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Importación de componentes personalizados
import Header from "@/components/Header/Header.jsx";
import SearchFilter from "@/components/Home/Busqueda/Busqueda.jsx";
import Tabla from "@/components/Home/Tabla/Tabla.jsx";

// Importación de utilidades para autenticación y diseño
import { isAuthenticated } from "@/utils/authRedirect"; 

// Componente de diseño de Material-UI
import { Box } from "@mui/material"; 

// Componente principal de la página Home
export default function Home() {

    // Hook para manejar la navegación
    const router = useRouter();

    // Estados para manejar el token de autenticación y el filtro de búsqueda
    const [token, setToken] = useState("");
    const [filtro, setFiltro] = useState(null);

    // useEffect: se ejecuta al montar el componente
    useEffect(() => {
        // Verifica si el usuario está autenticado
        const token = isAuthenticated(); // Devuelve el token si está autenticado
        if (!token) {
            // Redirige a la página de inicio de sesión si no está autenticado
            router.push("/IniciaSesion");
        } else {
            // Guarda el token en el estado
            setToken(token);
        }
    }, [router]); // Se ejecuta cada vez que cambia el router

    // Renderizado del componente
    return (
        <Box>
            {/* Componente del encabezado */}
            <Header />  
            
            {/* Componente para búsqueda y filtros */}
            <SearchFilter setFiltro={setFiltro} />

            {/* Componente de la tabla, recibe el token y el filtro como props */}
            <Tabla token={token} filtro={filtro} />
        </Box>
    );
}
