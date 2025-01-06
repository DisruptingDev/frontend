"use client"; // Indica que este componente se renderiza en el cliente

// Importación de hooks y utilidades
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

// Importación de componentes personalizados
import Header from "@/components/Header/Header.jsx";
import SearchFilter from "@/components/Home/Busqueda/Busqueda.jsx";
import Tabla from "@/components/Home/Tabla/Tabla.jsx";
import ModalWizard from "@/components/Home/Modales/modalWizard";

// Importación de utilidades para autenticación y diseño
import { isAuthenticated } from "@/utils/authRedirect"; 

// Componente de diseño de Material-UI
import { Box } from "@mui/material"; 

// Componente principal de la página Home
export default function Home() {

    // Hook para manejar la navegación
    const router = useRouter();

    //Nuevo usuario
    const [newUser, setNewUser] = useState(null);
    // const [newUser, setNewUser] = useState("true");
    const [open, setOpen] = useState(false);

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


    useEffect(() => {
        // Solo se ejecuta en el cliente
        const storedNewUser = sessionStorage.getItem('newUser');
        setNewUser(storedNewUser);
      }, []);
    useEffect(() => {
      console.log('newUser', newUser);
       if (newUser === "true"){
         setOpen(true);
         sessionStorage.setItem('newUser', "false");
       }
      

    }
    , [newUser]);


    // Renderizado del componente
    return (
        <Box>

               
             <ModalWizard  open={open} handleClose={() => setOpen(false)} token={token} />
   
            {/* Componente del encabezado */}
            <Header />  
            
            {/* Componente para búsqueda y filtros */}
            <SearchFilter setFiltro={setFiltro} />

            {/* Componente de la tabla, recibe el token y el filtro como props */}
            <Tabla token={token} filtro={filtro} />
        </Box>
    );
}
