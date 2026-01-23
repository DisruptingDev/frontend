"use client";

import AdministrarTimbres from "@/components/AdministraTimbres/AdministrarTimbres";
import Header from "@/components/Header/Header";
import { isAuthenticated } from "@/utils/authRedirect";
import { Button, Snackbar, Alert, Modal, Box, Grid, Container } from "@mui/material";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";

export default function Timbres() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [menuExpanded, setMenuExpanded] = useState(false); // Estado para controlar el ancho del menú

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
        }
    }, [router]);

    const handleMenuToggle = () => {
        setMenuExpanded(!menuExpanded); // Alterna el estado del menú
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item xs>
                    <Box
                        bgcolor="white"
                        ml={{ xs: 10, md: 10 }}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                        width={{ xs: "80%", md: "95%" }}
                    >
                        <AdministrarTimbres token={token} />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
