"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente";
import VistaClientes from "@/components/VistaClientes/VistaClientes";
import { Box, Button, Dialog, DialogTitle, DialogContent, Grid } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { WithPermission } from '@/components/WithPermission';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export default function RegistroClientes() {
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');
    const [cliente, setCliente] = useState([]); // Cliente a editar o agregar

    const [openModal, setOpenModal] = useState(false); // Estado del modal
    const [isModalClosed, setIsModalClosed] = useState(false); // Detectar si el modal fue cerrado

    const [clienteIdEditar, setClienteIdEditar] = useState(''); // ID del cliente a editar
    const [actualizar, setActualizar] = useState(false); // Estado para indicar si se debe actualizar la lista de clientes

    const router = useRouter(); // Hook de navegación de Next.js
    const [token, setToken] = useState(""); // Token de autenticación

    // Efecto para verificar autenticación y obtener el token
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion"); // Redirige al login si no está autenticado
        } else {
            setToken(token);
        }
    }, [router]);

    // Efecto para cargar datos del cliente a editar
    useEffect(() => {
        if (clienteIdEditar) {
            async function fetchData() {
                try {
                    const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor/${clienteIdEditar}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    console.log(response);
                    if (response.ok) {
                        const data = await response.json();
                        setCliente(data); // Configura los datos del cliente en el estado
                        setOpenModal(true); // Abre el modal para edición
                    } else {
                        console.log("Error al cargar los clientes");
                    }
                } catch (error) {
                    console.log("Error al cargar los clientes" + error);
                }
            }
            fetchData();
        }
    }, [clienteIdEditar, token]);

    // Abrir el modal para agregar cliente
    const handleOpenModal = () => {
        setOpenModal(true);
    };

    // Cerrar el modal
    const handleCloseModal = () => {
        setCliente(''); // Limpia los datos del cliente
        setClienteIdEditar(''); // Limpia el ID del cliente a editar
        setOpenModal(false); // Cierra el modal
        setIsModalClosed(true); // Indica que el modal fue cerrado
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
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        <Box display="flex" justifyContent="flex-end" mb={2} gap={2} width="100%">
                            <WithPermission permission="crear_receptores">
                                <Button
                                    variant="contained"
                                    sx={{
                                        backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' },
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                    }}
                                    onClick={handleOpenModal}
                                >
                                    Agregar Cliente
                                </Button>
                            </WithPermission>
                        </Box>
                        <VistaClientes setClienteIdEditar={setClienteIdEditar} actualizar={actualizar} token={token} />
                    </Box>
                </Grid>
            </Grid>
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                fullWidth
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: '80%',
                        margin: 'auto',
                    }
                }}
            >
                <DialogTitle>Alta de Cliente</DialogTitle>
                <DialogContent>
                    <AltaCliente cliente={cliente} onClose={handleCloseModal} setActualizar={setActualizar} token={token} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
