"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaConceptos from "@/components/VistaConceptos/VistoConceptos";
import { Box, Button, Dialog, DialogTitle, DialogContent, Snackbar, Alert, Grid } from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos";
import Impuesto from "@/components/FormFactura/Impuesto/Impuesto";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ModuloConceptos() {

    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [conceptos, setConceptos] = useState([]);
    const [actualizar, setActualizar] = useState(false);
    const [openAlert, setOpenAlert] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [tipoAlert, setTipoAlert] = useState('success');

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

    useEffect(() => {
        async function fetchData() {
            if (conceptos.length === 0) {
                return;
            }
            console.log('Conceptos Principal:', conceptos);
            try {
                const Concepto = {
                    Nombre: conceptos[0].Nombre,
                    NoIdentificacion: '',
                    Cantidad: conceptos[0].Cantidad,
                    Unidad: conceptos[0].Unidad,
                    ClaveUnidad: conceptos[0].ClaveUnidad,
                    Descripcion: conceptos[0].Descripcion,
                    ValorUnitario: conceptos[0].ValorUnitario,
                    Importe: conceptos[0].Subtotal,
                    Descuento: conceptos[0].Descuento,
                    ObjetoImp: conceptos[0].ObjetoImpuesto,
                    ClaveProdServ: conceptos[0].ClaveProdServ,
                    Impuestos: {
                        Retenciones: conceptos[0].Retenciones.map(retencion => ({
                            Base: retencion.BaseImpuesto,
                            ImpuestoClave: String(retencion.Impuesto),
                            TipoFactor: retencion.Tipo,
                            TasaOCuota: retencion.Tasa,
                            Importe: retencion.Monto,
                            ImpuestoCatalogoID: retencion.Impuesto
                        })),
                        Traslados: conceptos[0].Traslados.map(traslado => ({
                            Base: traslado.BaseImpuesto,
                            ImpuestoClave: String(traslado.Impuesto),
                            TipoFactor: traslado.Tipo,
                            TasaOCuota: traslado.Tasa,
                            Importe: traslado.Monto,
                            ImpuestoCatalogoID: traslado.Impuesto
                        }))
                    }

                }

                const response = await fetch(`${apiUrl}/api/conceptos/GuardarConcepto`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(Concepto),
                });
                const data = await response.json();
                console.log('Concepto Prueba:', data);
                console.log('Response:', response);

                if (data.status === 'OK') {

                    console.log('Concepto Agregado:', data);
                    setConceptos([]);
                    setActualizar(true);
                    setOpenAlert(true);
                    setMensaje('Concepto agregado correctamente');
                    setTipoAlert('success');

                }
                else {
                    console.error('Error al agregar el concepto:', data);
                    setOpenAlert(true);
                    setMensaje('Error al agregar el concepto');
                    setTipoAlert('error');
                }



            } catch (error) {

                console.error('Error:', error);
                setOpenAlert(true);
                setMensaje('Error al agregar el concepto');
                setTipoAlert('error');
            }
        }




        fetchData();
        console.log('Conceptos Principal:', conceptos);
    }, [conceptos, token]);


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
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid>
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
                        <VistaConceptos token={token} actualizar={actualizar} setActualizar={setActualizar} />
                    </Box>

                </Grid>
            </Grid>
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

                <Conceptos token={token} editIndex={null} modalAgregarConcepto={true} onClose={handleCloseModal} setConceptos={setConceptos} />

            </Dialog>
            <Snackbar open={openAlert} autoHideDuration={6000} onClose={() => setOpenAlert(false)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
                <Alert onClose={() => setOpenAlert(false)} severity={tipoAlert} sx={{ width: '100%' }} variant="filled">
                    {mensaje}
                </Alert>
            </Snackbar>


        </div>
    );
}


