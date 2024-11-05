"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaConceptos from "@/components/VistaConceptos/VistoConceptos";
import { Box, Button, Dialog, DialogTitle, DialogContent } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos";

export default function ModuloConceptos() {

    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else {
            setToken(token);
        }
    }, [router]);


    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
      
        setOpenModal(false);
        // setIsModalClosed(true);
        
    };


    return (
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
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
                        Agregar Concepto
                    </Button>
                </Box>
                    <VistaConceptos token={token} />
            </Box>
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                fullWidth
                maxWidth={false}
                // PaperProps={{
                //     sx: {
                //         width: '80%',
                //         margin: 'auto',
                //     }
                // }}
            >
                {/* <DialogTitle>Alta de Cliente</DialogTitle> */}
                
                   <Conceptos token={token}  editIndex={null} />
           
            </Dialog>
        </div>
    );
}


