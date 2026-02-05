"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { Box, Grid } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import VistaBuzonTributario from "@/components/BuzonTributario/VistaBuzonTributario";

export default function BuzonTributarioPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [isAuth, setIsAuth] = useState(false);

    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
            setIsAuth(true);
        }
    }, [router]);

    if (!isAuth) {
        return null; // Or a loading spinner
    }

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
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                        minHeight="85vh" // Ensure some height
                    >
                        <VistaBuzonTributario token={token} />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
