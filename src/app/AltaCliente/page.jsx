"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente";
import VistaClientes from "@/components/ViastaClientes/VistaClientes";
import { Box, Button, Dialog, DialogTitle, DialogContent} from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export default function RegistroClientes() {
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');
    const [cliente, setCliente] = useState([]);

    const [openModal, setOpenModal] = useState(false);
    const [isModalClosed, setIsModalClosed] = useState(false);

    const [clienteIdEditar, setClienteIdEditar] = useState('');

    const [actualizar, setActualizar] = useState(false);

    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");

    useEffect(() => {
        
        const token = isAuthenticated();
        if (!token) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else
        {
            setToken(token);
        }
    }, [router]);

    useEffect(() => {
        if(clienteIdEditar){
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
        
    }, [clienteIdEditar, token]);


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
                            backgroundColor: '#1b384a', '&:hover': {   backgroundColor: '#10232f'},
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                           
                        }}
                        onClick={handleOpenModal}
                    >
                        Agregar Cliente
                    </Button>
                </Box>
                {/* <AltaCliente /> */}

                <VistaClientes  setClienteIdEditar={setClienteIdEditar} actualizar={actualizar} token={token}/>

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
                    <AltaCliente cliente={cliente} onClose={handleCloseModal} setActualizar={setActualizar} token={token}/>
                </DialogContent>
            </Dialog>
        </div>
    );
}
