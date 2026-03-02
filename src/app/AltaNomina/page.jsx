"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Grid } from "@mui/material";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import CargaNomina from "@/components/FacturasMasivas/CargaNomina";

export default function AltaNomina() {
    const router = useRouter();
    const [token, setToken] = useState("");

    useEffect(() => {
        const tok = isAuthenticated();
        if (!tok) {
            router.push("/IniciaSesion");
        } else {
            setToken(tok);
        }
    }, [router]);

    return (
        <div>
            <Header />
            <Grid container wrap="nowrap">
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item xs={true} sx={{ minWidth: 0, overflow: 'hidden' }}>
                    <Box
                        ml={10}
                        mr={1}
                        mt={2}
                        sx={{ maxWidth: "100%", overflow: "hidden" }}
                    >
                        <CargaNomina token={token} />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
