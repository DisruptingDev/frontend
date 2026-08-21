"use client"
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { get, useForm } from 'react-hook-form';
import { Snackbar, Alert, Modal, Box, Button, Grid } from '@mui/material';
import { useParams } from 'next/navigation';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
import FormatearFactura from "@/components/FormFactura/FormatearFactura";
import { isAuthenticated } from "@/utils/authRedirect";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";

import GuardarFactura from "@/components/FormFactura/EditarFactura";
import RecuperarFactura from "@/components/FormFactura/RecuperarFactura";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;



export default function EditarFactura() {
    const { id } = useParams(); // Captura la ID de la URL
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [conceptos, setConceptos] = useState([]);
    const [emisorData, setemisorData] = useState([])
    const [receptorData, setReceptorData] = useState([])
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error');
    const [editIndex, setEditIndex] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [facturaEdit, setFacturaEdit] = useState(null); // Estado para almacenar la factura editada
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState(""); // Estado para almacenar el token

    useEffect(() => {
        // Verifica la autenticación al montar el componente
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else {
            setToken(token);
        }
    }, [router]);

    function convertirCamposANumericos(obj) {
        if (typeof obj !== 'object' || obj === null) {
            return obj;
        }

        if (Array.isArray(obj)) {
            return obj.map(item => convertirCamposANumericos(item));
        }

        const resultado = {};

        for (const [key, value] of Object.entries(obj)) {
            // Si es un objeto o array, procesar recursivamente
            if (typeof value === 'object' && value !== null) {
                resultado[key] = convertirCamposANumericos(value);
                continue;
            }

            // Si la clave no termina en "String" y existe una versión con "String"
            if (!key.endsWith('String') && typeof value === 'string') {
                const stringKey = key + 'String';

                // Verificar si existe la versión con "String" en el mismo nivel
                if (obj.hasOwnProperty(stringKey)) {
                    // Intentar convertir a número
                    const numero = parseFloat(value);
                    resultado[key] = isNaN(numero) ? value : numero;
                    continue;
                }
            }

            // Mantener el valor original
            resultado[key] = value;
        }

        return resultado;
    }

    useEffect(() => {

        const fetchFactura = async () => {
            try {
                let response = await fetch(`/api/facturas/ObtenerFactura/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                if (!response.ok && apiUrl) {
                    response = await fetch(`${apiUrl}/api/facturas/ObtenerFactura/${id}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                    });
                }

                const data = await response.json();
                const facturaConvertida = convertirCamposANumericos(data);
                setFacturaEdit(facturaConvertida);
            } catch (error) {
                console.error('Error fetching factura:', error);
            }
        };

        if (id && token) {
            fetchFactura(); // Solo llama a la API si hay una ID
        }
    }, [id, token]);

    useEffect(() => {
        if (facturaEdit) {
            const { conceptos: Conceptos, emisor: Emisor, receptor: Receptor } = RecuperarFactura(facturaEdit);

            if (Conceptos) {
                setConceptos(Conceptos);
            }
            if (Emisor) {
                setemisorData(Emisor);
            }
            if (Receptor) {
                setReceptorData(Receptor);
            }
        }

    }, [facturaEdit]);

    // Memoize emisorData para evitar renders innecesarios



    const onSubmit = (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto antes de crear la factura.');
            setSnackbarSeverity('error'); // Configura el Snackbar como error
            setOpenSnackbar(true);
            return;
        }
        const factura = FormatearFactura(data, data, conceptos, id, "Factura");
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

    const handlePreview = handleSubmit(async (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        const factura = FormatearFactura(data, data, conceptos, "", "VistaPrevia");
        const vistaPrevia = await generarVistaPrevia(factura);
        setPreviewContent(vistaPrevia);
        setOpenModal(true);
    });

    const handleEditConcepto = (index) => {
        const conceptoToEdit = conceptos[index];
        setEditIndex(index);
        setValue('Descripcion', conceptoToEdit.Descripcion);
        setValue('ClaveProdServ', conceptoToEdit.ClaveProdServ);
        setValue('ClaveUnidad', conceptoToEdit.ClaveUnidad);
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
                    >

                        <form onSubmit={handleSubmit(onSubmit)} method="post">
                            <Emisor
                                register={register}
                                setLugarExpedicion={setLugarExpedicion}
                                setValue={setValue}
                                getValues={getValues}
                                trigger={trigger}
                                errors={errors}
                                emisorData={emisorData}  // Usa emisorData aquí
                            />
                            <Receptor
                                register={register}
                                lugarExpedicion={lugarExpedicion}
                                errors={errors}
                                setValue={setValue}
                                getValues={getValues}
                                trigger={trigger}
                                receptorData={receptorData}
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
                                    <Button variant="contained" type="button" sx={{ backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }} onClick={() => router.push("/Home")}>Cancelar</Button>
                                    {/* <button className="btn btn-secondary bg-red-700" type="button"  onClick={() => router.push("/Home")}>Cancelar</button> */}
                                    <Button variant="contained" type="button" sx={{ backgroundColor: '#04b2ca', '&:hover': { backgroundColor: '#038a9e' } }} onClick={handlePreview}>Vista previa</Button>
                                    {/* <button className="btn btn-accent" type="button" onClick={handlePreview}>Vista previa</button> */}
                                    <Button variant="contained" type="submit" sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}>Actualizar Factura</Button>
                                    {/* <button type="submit" className="btn" style={{backgroundColor: '#1b384a', '&:hover': {   backgroundColor: '#10232f'}}}>Crear Factura</button> */}
                                </div>
                            </Resumen>
                        </form>
                        <Modal
                            open={openModal}
                            onClose={() => setOpenModal(false)}
                            aria-labelledby="modal-vista-previa"
                            aria-describedby="vista-previa-factura"
                        >
                            <Box
                                sx={{
                                    maxHeight: '100vh',
                                    overflowY: 'auto',
                                    p: 4,
                                    bgcolor: 'background.paper',
                                    margin: 'auto',
                                    width: '100%',
                                    maxWidth: '850px',
                                    position: 'relative',
                                }}
                            >
                                <button
                                    onClick={() => setOpenModal(false)}
                                    style={{
                                        position: 'absolute',
                                        top: '10px',
                                        right: '10px',
                                        background: 'none',
                                        border: 'none',
                                        color: '#000',
                                        fontSize: '16px',
                                        cursor: 'pointer',
                                    }}
                                >
                                    ✖
                                </button>
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
