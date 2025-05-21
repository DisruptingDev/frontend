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
import SeleccionarFacturas from "@/components/FormFactura/NotaCredito/SeleccionarFacturas.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function GenerarEgreso() {
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
    const [receptorData, setReceptorData] = useState(null);
    const [tipoComprobante, setTipoComprobante] = useState("");
    const [facturasRelacionadas, setFacturasRelacionadas] = useState([]);
    const [motivoNotaCredito, setMotivoNotaCredito] = useState("");
    const [emisorID, setEmisorID] = useState("");
    const [receptorID, setReceptorID] = useState(null);
    

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
        console.log("Conceptos antes de crear", conceptos);
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
            { token }
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
        await generatePDF(vistaPrevia);
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

    const handleFacturasSeleccionadas = ({ facturas, motivo }) => {
        // Datos dummy para prueba
        const facturasDummy = [
            {
                _id: "1",
                Folio: "F-001",
                Fecha: new Date(),
                Total: 1000.50,
                UUID: "dummy-uuid-123"
            },
            {
                _id: "2",
                Folio: "F-002",
                Fecha: new Date(),
                Total: 2000.75,
                UUID: "dummy-uuid-456"
            },
            {
                _id: "3",
                Folio: "F-003",
                Fecha: new Date(),
                Total: 1500.00,
                UUID: "dummy-uuid-789"
            },
            {
                _id: "4",
                Folio: "F-004",
                Fecha: new Date(),
                Total: 2500.25,
                UUID: "dummy-uuid-101"
            },
            {
                _id: "5",
                Folio: "F-005",
                Fecha: new Date(),
                Total: 1750.80,
                UUID: "dummy-uuid-102"
            },
            {
                _id: "6",
                Folio: "F-006",
                Fecha: new Date(),
                Total: 3000.00,
                UUID: "dummy-uuid-103"
            },
            {
                _id: "7",
                Folio: "F-007",
                Fecha: new Date(),
                Total: 1200.60,
                UUID: "dummy-uuid-104"
            },
            {
                _id: "8",
                Folio: "F-008",
                Fecha: new Date(),
                Total: 2200.10,
                UUID: "dummy-uuid-105"
            },
            {
                _id: "9",
                Folio: "F-009",
                Fecha: new Date(),
                Total: 1950.45,
                UUID: "dummy-uuid-106"
            },
            {
                _id: "10",
                Folio: "F-010",
                Fecha: new Date(),
                Total: 2750.90,
                UUID: "dummy-uuid-107"
            }
        ];

        setFacturasRelacionadas(facturasDummy);
        setMotivoNotaCredito(motivo || "01"); // Motivo por defecto

        console.log("Facturas dummy seleccionadas:", facturasDummy);
        console.log("Motivo:", motivo || "01");

        setSnackbarMessage('Datos dummy de nota de crédito agregados');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);

    };

    const handleReceptorSelect = (receptor) => {
        setReceptorData(receptor);
        console.log("Receptor seleccionado:", receptor);
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid>
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
                        mb={6}
                    >
                        <form onSubmit={handleSubmit(onSubmit)} method="post">
                            <Emisor
                                register={register}
                                setLugarExpedicion={setLugarExpedicion}
                                setValue={setValue}
                                getValues={getValues}
                                trigger={trigger}
                                errors={errors}
                                setTipoComprobante={setTipoComprobante} // Nuevo prop
                                setEmisorID={setEmisorID} // Nuevo prop
                            />
                            <Receptor
                                register={register}
                                lugarExpedicion={lugarExpedicion}
                                errors={errors}
                                setValue={setValue}
                                getValues={getValues}
                                trigger={trigger}
                                token={token}
                                setReceptorID={setReceptorID} // Nuevo prop
                            />
                            {tipoComprobante === "E" && receptorID != null && (
                                <SeleccionarFacturas
                                    receptor={receptorData}
                                    token={token}
                                    onFacturasSeleccionadas={handleFacturasSeleccionadas}
                                    emisorID={emisorID}
                                    receptorID={receptorID}
                                />
                            )}
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
                                    <Button variant="contained" type="button" sx={{ backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }} onClick={() => router.push("/Home")}>Cancelar</Button>
                                    <Button variant="contained" type="button" sx={{ backgroundColor: '#04b2ca', '&:hover': { backgroundColor: '#038a9e' } }} onClick={handlePreview}>Vista previa</Button>
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
