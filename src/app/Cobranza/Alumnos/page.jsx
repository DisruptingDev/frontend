'use client';
import { Box, Grid } from '@mui/material';
import Header from '@/components/Header/Header.jsx';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';
import AlumnosView from '@/components/Cobranza/AlumnosView';

export default function AlumnosPage() {
    return (
        <div>
            <Header title="Gestión del Padrón de Alumnos y Asignación de Empresas Emisoras" />
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
                        <AlumnosView />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
