"use client";
//Generate page
import React from 'react';
import { useState, useEffect } from 'react';
import { useRouter } from "next/navigation";
import Header from '@/components/Header/Header.jsx';
import AltaSerie from '@/components/AltaSerie/AltaSerie';
import { Grid, Box } from '@mui/material';
import { isAuthenticated } from '@/utils/authRedirect';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';

export default function RegistroSeries() {
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
            setToken(token);
        }
    }, [router]);
    return (
        <div>
            <Header />
            <Grid container>
                <Grid>
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
                        <AltaSerie token={token} />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
