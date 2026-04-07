"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Grid, Tabs, Tab, Typography } from "@mui/material";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import CargaNomina from "@/components/FacturasMasivas/CargaNomina";
import VistaTrabajadores from "@/components/VistaTrabajadores/VistaTrabajadores";
import AddBoxIcon from '@mui/icons-material/AddBox';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import DataTableMRT from "@/components/Home/Tabla/DataTableMRT";
import EmisorNomina from "@/components/FacturasMasivas/RegistroEmisorNomina"


export default function NominasPage() {
    const router = useRouter();
    const [token, setToken] = useState("");
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        const tok = isAuthenticated();
        if (!tok) {
            router.push("/IniciaSesion");
        } else {
            setToken(tok);
        }
    }, [router]);

    const handleTabChange = (event, newValue) => {
        setActiveTab(newValue);
    };

    const irANominasEmitidas = () => {
        setActiveTab(0);
    };

    return (
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Header />
            <Grid container wrap="nowrap">
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item xs={true} sx={{ minWidth: 0, overflow: 'hidden' }}>
                    <Box
                        ml={10}
                        mr={2}
                        mt={2}
                        mb={4}
                        sx={{ maxWidth: "100%", overflow: "hidden" }}
                    >
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs
                                value={activeTab}
                                onChange={handleTabChange}
                                aria-label="sub-menu nominas"
                                sx={{
                                    '.MuiTab-root': {
                                        fontWeight: 'bold',
                                        textTransform: 'none',
                                        minHeight: 64,
                                    },
                                    '.Mui-selected': {
                                        color: '#1b384a !important',
                                    },
                                    '.MuiTabs-indicator': {
                                        backgroundColor: '#1b384a',
                                    }
                                }}
                            >
                                <Tab
                                    icon={<ReceiptIcon />} // Nóminas Emitidas
                                    iconPosition="start"
                                    label="Nóminas Emitidas"
                                />
                                <Tab
                                    icon={<AddBoxIcon />} // Registros Patronales (registro/alta)
                                    iconPosition="start"
                                    label="Registros Patronales"
                                />
                                <Tab
                                    icon={<PeopleIcon />} // Alta de Trabajadores (personas)
                                    iconPosition="start"
                                    label="Alta de Trabajadores"
                                />
                                <Tab
                                    icon={<AddBoxIcon />} // Alta de Nómina (registro/alta)
                                    iconPosition="start"
                                    label="Alta de Nómina"
                                />
                            </Tabs>
                        </Box>

                        <Box>
                            {activeTab === 0 && (
                                <Box bgcolor="white" p={1} borderRadius={2} boxShadow={2}>
                                    <DataTableMRT token={token} filterType="ONLY_N" />
                                </Box>
                            )}
                            {activeTab === 1 && <EmisorNomina token={token} />}
                            {activeTab === 2 && <VistaTrabajadores token={token} />}
                            {activeTab === 3 && (
                                <CargaNomina
                                    token={token}
                                    onSuccess={irANominasEmitidas}
                                />
                            )}
                        </Box>
                    </Box>
                </Grid>
            </Grid>
        </Box>
    );
}
