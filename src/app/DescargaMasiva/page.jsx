"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { Box, Grid, Paper, Typography, Button } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import { WithPermission } from "@/components/WithPermission";
import DescargaMasivaView from "@/components/DescargaMasiva/DescargaMasivaView";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";

function AccesoRestringidoDescarga() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="75vh" p={3}>
            <Paper elevation={3} sx={{ p: 5, textAlign: 'center', maxWidth: 560, borderRadius: 3, border: '1px solid #e0e0e0' }}>
                <Box
                    sx={{
                        width: 70,
                        height: 70,
                        borderRadius: '50%',
                        bgcolor: 'primary.light',
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 20px',
                    }}
                >
                    <LockOutlinedIcon sx={{ fontSize: 38 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1.5, color: '#1d394d' }}>
                    Módulo de Descarga Masiva SAT
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 2, lineHeight: 1.6 }}>
                    Este módulo requiere activación y permisos asignados por el administrador de tu cuenta.
                </Typography>
                <Typography variant="body2" sx={{ mb: 4, color: '#666', bgcolor: '#f8f9fa', p: 2, borderRadius: 2 }}>
                    Si deseas contratar o activar este servicio para tu empresa o usuario, comunícate con el administrador de la cuenta o el equipo de soporte.
                </Typography>
                <Button variant="contained" color="primary" href="/Home" sx={{ px: 4, py: 1.2, textTransform: 'none', fontWeight: 600 }}>
                    Volver al Inicio
                </Button>
            </Paper>
        </Box>
    );
}

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
                    <WithPermission permission="DESCARGA_MASIVA_ACCESO" fallback={<AccesoRestringidoDescarga />}>
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
                    </WithPermission>
                </Grid>
            </Grid>
        </div>
    );
}

