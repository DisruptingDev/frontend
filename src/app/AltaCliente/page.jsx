"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente";
import VistaClientes from "@/components/ViastaClientes/VistaClientes";
import { Box, Button, Dialog, DialogTitle, DialogContent} from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";


export default function RegistroClientes() {
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');
    const [cliente, setCliente] = useState([]);

    const [openModal, setOpenModal] = useState(false);
    const [isModalClosed, setIsModalClosed] = useState(false);

    const [clienteIdEditar, setClienteIdEditar] = useState('');

    const router = useRouter(); // Inicializa el router

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        if (!isAuthenticated()) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
    }, [router]);

    useEffect(() => {
        if(clienteIdEditar){
            async function fetchData() {
            try {
                const response = await fetch(`http://31.220.31.152:8081/Catalogos/Receptor/${clienteIdEditar}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });
                console.log(response);
                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    setCliente(data);
                    setOpenModal(true);
                } else {
                    console.log("Error al cargar los clientes");
                }
            } catch (error) {
                console.log("Error al cargar los clientes" + error);
            }
        }
        fetchData();
        }
        
    }, [clienteIdEditar]);

    // useEffect(() => {
    //     try {

    //         const token = localStorage.getItem("token");
    //         console.log(token);
    //         const response = fetch("http://31.220.31.152:8081/Catalogos/Receptor", {
    //             method: "GET",
    //             headers: {
    //                 Authorization: `Bearer ${token}`,
    //             },
    //         });
    //         if (response.ok) {
    //             const data = response.json();
    //             setClientes(data);k
    //         }
    //         else {
    //             console.log("Error al cargar los clientes");
    //         }
    //     } catch (error) {
    //         console.log("Error al cargar los clientes");
    //     }


    // }, []);

    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setCliente('');
        setClienteIdEditar('');
        setOpenModal(false);
        setIsModalClosed(true);
        
    };




    return (
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
                    <Button
                        variant="contained"
                        sx={{
                            backgroundColor: 'rgba(29, 57, 77, 1)',
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            '&:hover': {
                                backgroundColor: 'rgba(19, 47, 67, 1)',
                            }
                        }}
                        onClick={handleOpenModal}
                    >
                        Agregar Cliente
                    </Button>
                </Box>
                {/* <AltaCliente /> */}

                <VistaClientes  setClienteIdEditar={setClienteIdEditar} />

            </Box>
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
                    <AltaCliente cliente={cliente} onClose={handleCloseModal} />
                </DialogContent>
            </Dialog>
        </div>
    );
}
