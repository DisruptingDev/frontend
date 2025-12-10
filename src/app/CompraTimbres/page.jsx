"use client";

import { Box, Tabs, Tab, Typography, Grid } from '@mui/material';
import Planes from '@/components/CompraTimbres/Planes';
import Paquetes from '@/components/CompraTimbres/Paquetes';
import Header from '@/components/Header/Header';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/authRedirect";

export default function CompraTimbres() {

    // Estado para controlar el componente que se mostrará
    const [valorTab, setValorTab] = useState(0);
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else {
            setToken(token);
        }
    }, [router]);

    const manejarCambioTab = (event, newValue) => {
        setValorTab(newValue);
    };

    return (
        <div>
            <Header />
            <Grid >
                <Grid >
                    <SideBarMenu />
                </Grid>
                <Grid>
                    <Box
                        bgcolor="white"
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        <Tabs
                            value={valorTab}
                            onChange={manejarCambioTab}

                            textColor="#1b384a"
                            centered
                            sx={{

                                '& .MuiTabs-indicator': {
                                    backgroundColor: '#1b384a', // Cambiar el color del indicador aquí
                                },
                            }}
                        >
                            <Tab label="Paquetes" />
                            <Tab label="Planes" />
                        </Tabs>

                        {/* Mostrar el componente correspondiente */}
                        {valorTab === 0 ? <Paquetes token={token} /> : <Planes token={token} />}
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
