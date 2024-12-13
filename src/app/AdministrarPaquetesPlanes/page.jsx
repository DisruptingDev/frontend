/* 
Página para administrar los paquetes y planes 
*/
"use client"

import Header from "@/components/Header/Header"
import SideBar from '@/components/Dashborard/SideBar';
import Paquetes from "@/components/AdministrarPaquetesPlanes/Paquetes";
import Planes from "@/components/AdministrarPaquetesPlanes/Planes";
import ModalPaquete from "@/components/AdministrarPaquetesPlanes/ModalPaquete";
import ModalPlan from "@/components/AdministrarPaquetesPlanes/ModalPlan";

import { Box, Tabs, Tab, Typography, Button } from '@mui/material';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/authRedirect";

export default function AdministraPaquetesPlanes() {
    const [valorTab, setValorTab] = useState(0);
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    const [paquetes, setPaquetes] = useState([]);
    const [planes, setPlanes] = useState([]);

    const [openModalPaquetes, setOpenModalPaquetes] = useState(false);
    const [openModalPlanes, setOpenModalPlanes] = useState(false);

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else {
            console.log('Token', token);
            setToken(token);
        }
    }, [router]);


    const fetchPaquetes = useCallback(async () => {
        if (token != '') {
            console.log('Fetching paquetes', token);
            try {
                console.log('Token:', token);
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Paquetes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                console.log('Data:', data);
                if (response.ok) {
                    console.log('Paquetes:', data);
                    setPaquetes(data);
                } else {
                    console.error('Error fetching paquetes:', data);
                }
            } catch (error) {
                console.error('Error fetching paquetes:', error);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchPaquetes();
    }, [fetchPaquetes, token]);

    const fetchPlanes = useCallback(async () => {
        if (token != '') {
            console.log('Fetching plan', token);
            try {
                console.log('Token:', token);
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Planes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                console.log('Data:', data);
                if (response.ok) {
                    console.log('plan:', data);
                    setPlanes(data);
                } else {
                    console.error('Error fetching plan:', data);
                }
            } catch (error) {
                console.error('Error fetching plan:', error);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchPlanes();
    }, [fetchPlanes, token]);

    const manejarCambioTab = (event, newValue) => {
        setValorTab(newValue);
    };
    const handleAgregar = () => {
        if (valorTab === 0) {
            setOpenModalPaquetes(true);
        }
        else {
            setOpenModalPlanes(true);
        }
    }

    return (
        <Box sx={{ backgroundColor: '#f3f4f6', height: '98vh' }}>
            <Header />
            <SideBar />
            <Box
                sx={{
                    width: 'calc(100% - 250px)',  // Ajuste del ancho restando el tamaño de la barra lateral
                    height: 'calc(99vh - 6em)', // Ajuste de la altura restando el tamaño del header
                    marginLeft: 'auto',
                    padding: '1.5rem',
                    backgroundColor: 'white',
                    overflowY: 'auto'

                }}
            >
                <Tabs
                    value={valorTab}
                    onChange={manejarCambioTab}

                    textColor="#1b384a"
                    centered
                    sx={{
                        marginBottom: '0.5rem',

                        '& .MuiTabs-indicator': {
                            backgroundColor: '#1b384a', // Cambiar el color del indicador aquí
                        },
                    }}
                >
                    <Tab label="Paquetes" />
                    <Tab label="Planes" />
                </Tabs>

                <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
                    <Button
                        variant="contained"
                        sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                        onClick={handleAgregar}
                    >
                        {valorTab === 0 ? 'Agregar Paquete' : 'Agregar Plan'}
                    </Button>
                </Box>

                {/* Mostrar el componente correspondiente */}
                {valorTab === 0 ? <Paquetes paquetes={paquetes} /> : <Planes planes={planes} />}

            </Box>
            <ModalPaquete open={openModalPaquetes} handleClose={() => setOpenModalPaquetes(false)} />
            <ModalPlan open={openModalPlanes} handleClose={() => setOpenModalPlanes(false)} />
        </Box>
    );

}
