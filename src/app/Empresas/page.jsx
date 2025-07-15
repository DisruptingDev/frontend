"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaEmpresas from "@/components/VistaEmpresas/VistaEmpresas";
import { Box, Button, Dialog, DialogTitle, DialogContent, Typography, Divider, Grid } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa";
import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AdministraEmpresas() {

    const [empresaIdEditar, setEmpresaIdEditar] = useState('');
    const [empresa, setEmpresa] = useState([]);
    const [editar, setEditar] = useState(false);
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');

    const [actualizar, setActualizar] = useState(false);
    const [openModal, setOpenModal] = useState(false);

    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");

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
        setEmpresa('');
        setEmpresaIdEditar('');
        setEditar(false);
        setOpenModal(false);
        // setIsModalClosed(true);

    };

    useEffect(() => {
        if (empresaIdEditar) {
            // setOpenModal(true);
            async function fetchData() {
                try {
                    const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor/${empresaIdEditar}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
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

    }, [empresaIdEditar, token]);


    const handleUpdateEmpresa = (name, rfc) => {
        setIssuerName(name);
        setIssuerRfc(rfc);
    };
    return (
        <div>
            <Header />
            <Grid container>
                <Grid>
                    <SideBarMenu />
                </Grid>
                <Grid >
                    <Box
                        bgcolor="white"
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >

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


                        <VistaEmpresas setEmpresaIdEditar={setEmpresaIdEditar} token={token} actualizar={actualizar} />
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
                                <CertificadoCSD onUpdateEmpresa={handleUpdateEmpresa} editar={editar} empresaIdEditar={empresaIdEditar} token={token} />
                                <Divider sx={{ marginY: 2 }} />
                                <AltaEmpresa editar={editar} empresa={empresa} onClose={handleCloseModal} issuerName={issuerName} issuerRfc={issuerRfc} token={token} setActualizar={setActualizar} btnCancelar={true} />
                            </DialogContent>
                        </Dialog>

                    </Box>
                </Grid>
            </Grid>

        </div>
    );
}
