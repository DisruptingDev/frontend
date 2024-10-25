"use client";

import Header from '@/components/Header/Header';
import { Box, Typography } from '@mui/material';
import Pagos from '@/components/Pagos/Pagos';
import SideBar from '@/components/Dashborard/SideBar';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/authRedirect";
export default function AsignarTimbres() {
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else {
            console.log('Token', token);
            setToken(token);
        }
    }, [router]);
    return (
        // <div>
        //     <Header />
        //     <Box bgcolor="white" my={4} mx={4} p={4} boxShadow={3} borderRadius={2}>

        //         <Pagos token={token}/>
        //     </Box>
        // </div>
        <Box sx={{ backgroundColor: '#f3f4f6', height: '98vh' }}>
            <Header />
            <SideBar />
            <Box
                sx={{
                    width: 'calc(100% - 250px)',  // Ajuste del ancho restando el tamaño de la barra lateral
                    height: 'calc(99vh - 6em)', // Ajuste de la altura restando el tamaño del header
                    marginLeft: 'auto',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    overflowY: 'auto'

                }}
            >
                <Pagos token={token} />
            </Box>
        </Box>

    );
}