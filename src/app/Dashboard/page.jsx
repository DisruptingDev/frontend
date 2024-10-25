"use client"
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";
import SideBar from "@/components/Dashborard/SideBar";
import Cards from "@/components/Dashborard/Cards";
import Header from "@/components/Header/Header.jsx"
import UltimasFacturas from "@/components/Dashborard/UltimasFacturas";
import AccionesRapidas from "@/components/Dashborard/AccionesRapidas";

import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Typography } from "@mui/material";
import { Grid } from "@mui/material";
import { Button } from "@mui/material";
import { Paper } from "@mui/material";


export default function Dashboard() {
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
        else {
            setToken(token);
        }
    }, [router]);

    return (
        <Box sx={{ backgroundColor: '#f3f4f6', height:'98vh' }}>
            <Header />
            <SideBar />
            <Box sx={{ width: 'calc(100%  - 250px)', marginLeft: 'auto', padding: '1.5rem'}}>
                <Box sx>
                    <Cards />
                </Box>
                <Grid mt={2} container spacing={3} sx={{minHeight:'325px'}} >
                    <Grid item xs={12} md={6}>
                        <UltimasFacturas />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <AccionesRapidas />
                    </Grid>
                </Grid>
            </Box>


        </Box>
    );
}

