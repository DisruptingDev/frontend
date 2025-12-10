"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa.jsx";
import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD.jsx";
import { Box, Grid } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";

export default function RegistroEmisores() {
    // Estados para gestionar el nombre y RFC del emisor
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');

    // Estado para almacenar el token de autenticación
    const [token, setToken] = useState("");

    const router = useRouter(); // Hook de navegación de Next.js

    // Efecto para verificar la autenticación al montar el componente
    useEffect(() => {
        const token = isAuthenticated(); // Verifica si el usuario está autenticado
        if (!token) {
            router.push("/IniciaSesion"); // Redirige al login si no está autenticado
        } else {
            setToken(token); // Guarda el token si está autenticado
        }
    }, [router]);

    // Función para actualizar el nombre y RFC del emisor
    const handleUpdateEmpresa = (name, rfc) => {
        setIssuerName(name); // Actualiza el nombre del emisor
        setIssuerRfc(rfc); // Actualiza el RFC del emisor
    };

    return (
        <div>
            {/* Header del componente */}
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item sx={{ flexGrow: 1 }}>
                    {/* Contenedor principal */}
                    <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                        {/* Componente para manejar el Certificado CSD */}
                        <CertificadoCSD onUpdateEmpresa={handleUpdateEmpresa} token={token} />

                        {/* Componente para manejar la alta de empresas */}
                        <AltaEmpresa
                            issuerName={issuerName} // Nombre del emisor seleccionado
                            issuerRfc={issuerRfc}   // RFC del emisor seleccionado
                            token={token}           // Token de autenticación
                        />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
