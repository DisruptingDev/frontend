'use client';
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert, Modal, Box, Button, Grid } from '@mui/material';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
import FormatearFactura from "@/components/FormFactura/FormatearFactura";
import { isAuthenticated } from "@/utils/authRedirect";
import GuardarFactura from "@/components/FormFactura/Timbrar";
import SideBarMenu from "@/components/Dashborard/SideBarMenu.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function CrearFactura() {
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [conceptos, setConceptos] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error'); // Nuevo estado para la severidad del Snackbar
    const [editIndex, setEditIndex] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const router = useRouter();
    const [token, setToken] = useState("");

    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        }
        else {
            setToken(token);
        }
    }, [router]);

    const onSubmit = (data) => {
        console.log("Datos del formulario", data);
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto antes de crear la factura.');
            setSnackbarSeverity('error'); // Configura el Snackbar como error
            setOpenSnackbar(true);
            return;
        }
        console.log("Conceptos ante de crear", conceptos);
        const factura = FormatearFactura(data, data, conceptos, "", "Factura");
        console.log('Factura creada:', factura);
        GuardarFactura(
            factura,
            (message) => { // Callback de éxito
                setSnackbarMessage(message);
                setSnackbarSeverity('success'); // Configura el Snackbar como éxito
                setOpenSnackbar(true);
                // Redirige después de un pequeño retraso para permitir que el Snackbar se muestre
             setTimeout(() => {
                router.push("/Home"); // Cambia "/pagina-destino" por la ruta deseada
            }, 1000); // Espera 3 segundos antes de redirigir
            },
            (errorMessage) => { // Callback de error
                setSnackbarMessage(errorMessage);
                setSnackbarSeverity('error'); // Configura el Snackbar como error
                setOpenSnackbar(true);
            },
            {token}
        );
    };

    const generatePDF = async (htmlContent) => {
        const response = await fetch('/api/generate-pdf', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ htmlContent }),
          });
        
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
        
          const a = document.createElement('a');
          a.href = url;
          a.download = 'generated.pdf';
          document.body.appendChild(a);
          a.click();
          a.remove();
        };

    const handlePreview = handleSubmit(async (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }
        const factura = FormatearFactura(data, data, conceptos, "", "VistaPrevia");
        const vistaPrevia = await generarVistaPrevia(factura);
        console.log('Vista previa generada:', vistaPrevia);
        const html = '<h1>Mi contenido dinámico</h1>'
        // await generatePDF(vistaPrevia);
        setPreviewContent(vistaPrevia);
        setOpenModal(true);
    });

    const handleEditConcepto = (index) => {
        const conceptoToEdit = conceptos[index];
        console.log("Editando Concepto Impuestos", conceptoToEdit.Impuestos);
        setEditIndex(index);
        setValue('Descripcion', conceptoToEdit.Descripcion);
        setValue('ClaveProdServ', conceptoToEdit.ClaveProdServ);
        setValue('ClaveUnidad', conceptoToEdit.ClaveUnidad);
        setValue('Unidad', conceptoToEdit.Unidad);
        setValue('Cantidad', conceptoToEdit.Cantidad);
        setValue('ValorUnitario', conceptoToEdit.ValorUnitario);
        setValue('Descuento', conceptoToEdit.Descuento);
        setValue('impuestos', conceptoToEdit.Impuestos);
    };

    const handleDeleteConcepto = (index) => {
        setConceptos(prevConceptos => prevConceptos.filter((_, i) => i !== index));
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item sx={{ flexGrow: 1 }}>
                    <Box sx={{ padding: '.8rem', paddingTop: '0rem', xs: 4, md: 8, lg: 8, xl: 8  }}>
                        <form onSubmit={handleSubmit(onSubmit)} method="post">
                            <Emisor
                                register={register}
                                setLugarExpedicion={setLugarExpedicion}
                                setValue={setValue}
                                getValues={getValues}
                                trigger={trigger}
                                errors={errors}
                            />
                            <Receptor
                                register={register}
                                lugarExpedicion={lugarExpedicion}
                                errors={errors}
                                setValue={setValue}
                                getValues={getValues}
                                trigger={trigger}
                                token={token}
                            />
                            <Conceptos
                                trigger={trigger}
                                register={register}
                                watch={watch}
                                setValue={setValue}
                                getValues={getValues}
                                setConceptos={setConceptos}
                                conceptos={conceptos}
                                editIndex={editIndex}
                                setEditIndex={setEditIndex}
                                token={token}
                            />
                            <Resumen
                                conceptos={conceptos}
                                subTotal={watch("Subtotal")}
                                handleEditConcepto={handleEditConcepto}
                                handleDeleteConcepto={handleDeleteConcepto}
                            >
                                <div className="flex justify-end w-full space-x-2 mt-10">
                                    <Button variant="contained" type="button" sx={{ backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' }}} onClick={() => router.push("/Home")}>Cancelar</Button>
                                    <Button variant="contained" type="button" sx={{ backgroundColor: '#04b2ca','&:hover': { backgroundColor: '#038a9e' }}} onClick={handlePreview}>Vista previa</Button>
                                    <Button variant="contained" type="submit" sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}>Crear Factura</Button>
                                </div>
                            </Resumen>
                        </form>
                        <Modal
                            open={openModal}
                            onClose={() => setOpenModal(false)}
                            aria-labelledby="modal-vista-previa"
                            aria-describedby="vista-previa-factura"
                        >
                            <Box sx={{ maxHeight: '100vh', overflowY: 'auto', p: 4, bgcolor: 'background.paper', margin: 'auto', width: '100%', maxWidth: '850px' }}>
                                <div dangerouslySetInnerHTML={{ __html: previewContent }} />
                            </Box>
                        </Modal>
                        <Snackbar
                            open={openSnackbar}
                            autoHideDuration={3000}
                            onClose={() => setOpenSnackbar(false)}
                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                        >
                            <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} variant="filled">
                                {snackbarMessage}
                            </Alert>
                        </Snackbar>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
