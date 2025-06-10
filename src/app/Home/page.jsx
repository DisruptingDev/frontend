"use client";

// Importación de hooks y utilidades
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
// Importación de componentes personalizados
import Header from "@/components/Header/Header.jsx";

import SideBarMenu from "@/components/Dashborard/SideBarMenu.jsx";
// import SearchFilter from "@/components/Home/Busqueda/Busqueda.jsx";
// import Tabla from "@/components/Home/Tabla/Tabla.jsx";
import DataTable from "@/components/Home/Tabla/DataTable.jsx";
import ModalWizard from "@/components/Home/Modales/modalWizard";

// Importación de utilidades para autenticación y diseño
import { isAuthenticated } from "@/utils/authRedirect";

// Componente de diseño de Material-UI
import { Box, Button } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';

import { driver } from "driver.js";
import "driver.js/dist/driver.css";

import HelpIcon from '@mui/icons-material/Help';

// Componente principal de la página Home
export default function Home() {

    // Hook para manejar la navegación
    const router = useRouter();

    //Nuevo usuario
    const [newUser, setNewUser] = useState(null);
    const [openWizard, setOpenWizard] = useState(false);
    const [setOpen] = useState(false);

    // Estados para manejar el token de autenticación y el filtro de búsqueda
    const [token, setToken] = useState("");
    // const [filtro, setFiltro] = useState(null);

    // Referencias para los elementos que serán destacados en el tour
    const headerRef = useRef(null);
    const sidebarRef = useRef(null);
    const datatableRef = useRef(null);
    const searchRef = useRef(null);


    // useEffect: se ejecuta al montar el componente
    useEffect(() => {
        // Verifica si el usuario está autenticado
        const token = isAuthenticated(); // Devuelve el token si está autenticado
        if (!token) {
            // Redirige a la página de inicio de sesión si no está autenticado
            router.push("/IniciaSesion");
        } else {
            // Guarda el token en el estado
            setToken(token);
        }

    }, [router]); // Se ejecuta cada vez que cambia el router


    useEffect(() => {
        // Solo se ejecuta en el cliente
        const storedNewUser = sessionStorage.getItem('newUser');
        setNewUser(storedNewUser);
    }, []);

    useEffect(() => {
        console.log('newUser', newUser);
        if (newUser === "true") {
            setOpenWizard(true);
            sessionStorage.setItem('newUser', "false");
            setDrawerOpen(true);
            // Iniciar el tour después de que el componente se monte
            setTimeout(() => {
                startTour();
            }, 1000);
        }
    }, [newUser]);

    const handleCloseWizard = () => {
        setOpenWizard(false);
    };

    const startTour = () => {
        const driverObj = driver({
            className: 'driverjs-theme',
            animate: true,
            opacity: 0.75,
            padding: 10,
            allowClose: true,
            overlayClickNext: false,
            doneBtnText: 'Finalizar',
            closeBtnText: 'Cerrar',
            nextBtnText: 'Siguiente',
            prevBtnText: 'Anterior',
            steps: [
                {
                    element: headerRef.current,
                    popover: {
                        title: 'Encabezado',
                        description: 'Aquí puedes comprar timbres, ver tus órdenes, invitar miembros a tu equipo y cerrar sesión.',
                        side: "bottom",
                        align: 'end'
                    }
                },
                {
                    element: sidebarRef.current,
                    popover: {
                        title: 'Menú Lateral',
                        description: 'Navega entre las diferentes secciones de la aplicación.',
                        side: "right",
                        align: 'start'
                    }
                },
                {
                    element: datatableRef.current,
                    popover: {
                        title: 'Tabla de Datos',
                        description: 'Aquí puedes ver y gestionar la información principal.',
                        position: 'top'
                    }
                }
            ]
        });

        driverObj.drive();
    };


    return (
        <div>
            <div ref={headerRef}>
                <Header token={token} />
            </div>
            <Grid container>
                <Grid>
                    <div ref={sidebarRef}>
                        <SideBarMenu ref={sidebarRef} />
                    </div>
                </Grid>

                <ModalWizard
                    open={openWizard}
                    handleClose={handleCloseWizard}
                    token={token}
                // Puedes pasar otras props necesarias para el wizard aquí
                />

                {/* Contenedor principal que ocupa el espacio restante */}
                <Grid>
                    <Box
                        //bgcolor="white"
                        ml={10}
                        mr={1}
                        //p={2}
                        //boxShadow={3}
                        borderRadius={2}
                        //mb={6}
                        mb={10}
                    >
                        {/* <SearchFilter setFiltro={setFiltro} />
                        <Tabla token={token} filtro={filtro} /> */}
                        <div ref={datatableRef}>
                            <DataTable token={token} />
                        </div>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={startTour}
                            startIcon={<HelpIcon />}
                        >
                            Iniciar Tour
                        </Button>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}