"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { Box, Grid } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import DescargaMasivaView from "@/components/DescargaMasiva/DescargaMasivaView";

export default function DescargaMasivaPage() {
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
        return null;
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
                        ml={{ xs: 1, sm: 4, md: 10 }}
                        mr={{ xs: 1, sm: 2, md: 3 }}
                        p={{ xs: 2, md: 3 }}
                        boxShadow={3}
                        borderRadius={2}
                        minHeight="85vh"
                    >
                        <DescargaMasivaView token={token} />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
