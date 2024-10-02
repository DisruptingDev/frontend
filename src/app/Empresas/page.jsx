"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaEmpresas from "@/components/VistaEmpresas/VistaEmpresas";
import { Box, Button, Dialog, DialogTitle, DialogContent, Typography, Divider } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa";
import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD";


export default function AdministraEmpresas() {

    const [empresaIdEditar, setEmpresaIdEditar] = useState('');
    const [empresa, setEmpresa] = useState([]);
    const [editar, setEditar] = useState(false);
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');


    const [openModal, setOpenModal] = useState(false);

    const handleOpenModal = () => {
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setEmpresa('');
        setEmpresaIdEditar('');
        setEditar(false);
        setOpenModal(false);
        // setIsModalClosed(true);

    };

    useEffect(() => {
        if(empresaIdEditar){
            // setOpenModal(true);
            async function fetchData() {
            try {
                const response = await fetch(`http://31.220.31.152:8081/Catalogos/Emisor/${empresaIdEditar}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });
                console.log(response);
                if (response.ok) {
                    const data = await response.json();
                    console.log(data);
                    setEmpresa(data);
                    setEditar(true);
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
        
    }, [empresaIdEditar]);


const handleUpdateEmpresa = (name, rfc) => {
        setIssuerName(name);
        setIssuerRfc(rfc);
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
                        Agregar Empresa
                    </Button>
                </Box>

                <VistaEmpresas setEmpresaIdEditar={setEmpresaIdEditar}  />
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
                    {/* <DialogTitle>Alta de Cliente</DialogTitle> */}
                    <DialogContent>
                        {/* {editar ? <Typography variant="h5" mb={2}>Editar Empresa</Typography> : ''} */}
                        <CertificadoCSD  onUpdateEmpresa={handleUpdateEmpresa} editar={editar} empresaIdEditar={empresaIdEditar}/>
                        <Divider  sx={{marginY:2}} />
                        <AltaEmpresa editar={editar} empresa={empresa} onClose={handleCloseModal} issuerName={issuerName} issuerRfc={issuerRfc}/>
                    </DialogContent>
                </Dialog>

            </Box>

        </div>
    );
}
