"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Dialog, DialogTitle, DialogContent } from "@mui/material";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
import ModalCSV from "@/components/FacturasMasivas/ModalCSV";
import VistaFacturasImportadas from "@/components/FacturasMasivas/VistaFacturasImportadas";
export default function ImportarFacturas(){
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [facturas, setFacturas] = useState([]);

    const [token, setToken] = useState("");
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
        }
    }, [router]);

    const handleOpenModal = () => {
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
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
                        Importar Facturas
                    </Button>
                </Box>
                <VistaFacturasImportadas facturasRecuperadas={facturas} token={token}/>
                <ModalCSV token={token} open={openModal}  handleClose={handleCloseModal} handleUpload={setFacturas} />
            </Box>

        </div>
    )
}