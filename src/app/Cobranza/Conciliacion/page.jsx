'use client';
import { WithPermission } from '@/components/WithPermission';
import { Box, Paper, Typography, Button, Grid } from '@mui/material';
import Header from '@/components/Header/Header.jsx';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';
import ConciliacionTab from '@/app/Cobranza/Dashboard/tabs/ConciliacionTab';
import { useRouter } from 'next/navigation';

function AccesoDenegado() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" p={4}>
            <Paper elevation={4} sx={{ p: 5, textAlign: 'center', maxWidth: 500, borderRadius: 3 }}>
                <Typography variant="h1" color="error" sx={{ fontSize: '4rem', mb: 1 }}>
                    🚫
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1b384a' }}>
                    Acceso Restringido
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                    No cuentas con los permisos necesarios (<strong>PAGOS_VER</strong> o <strong>CONCILIACION_EJECUTAR</strong>) para acceder a Conciliación Bancaria.
                </Typography>
                <Button variant="contained" color="primary" href="/Home">
                    Volver al Inicio
                </Button>
            </Paper>
        </Box>
    );
}

export default function ConciliacionPage() {
    const router = useRouter();

    return (
        <WithPermission permission="PAGOS_VER" fallback={<AccesoDenegado />}>
            <div>
                <Header title="Conciliación Bancaria Automatizada y Asignación de Pagos" />
                <Grid container>
                    <Grid item>
                        <SideBarMenu />
                    </Grid>
                    <Grid item xs>
                        <Box
                            bgcolor="white"
                            ml={{ xs: 10, md: 10 }}
                            mr={2}
                            mt={2}
                            p={3}
                            boxShadow={3}
                            borderRadius={2}
                            width={{ xs: "80%", md: "93%" }}
                        >
                            <ConciliacionTab
                                onNavigateToTab={(tabIdx) => router.push(`/Cobranza/Dashboard?tab=${tabIdx}`)}
                            />
                        </Box>
                    </Grid>
                </Grid>
            </div>
        </WithPermission>
    );
}
