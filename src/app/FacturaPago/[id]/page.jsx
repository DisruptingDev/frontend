"use client"
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { get, useForm } from 'react-hook-form';
import { Snackbar, Alert, Modal, Box, Button, Grid } from '@mui/material';
import { useParams } from 'next/navigation';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Pagos from "@/components/FormFactura/Pagos/Pagos";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
// import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPreviaRPE";
import FormatearFactura from "@/components/FormFactura/FormatearFactura";
import { isAuthenticated } from "@/utils/authRedirect";
import RecuperarFactura from "@/components/FormFactura/RecuperarFactura";
import GuardarFactura from "@/components/FormFactura/Timbrar";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function FacturaPago() {
    const { id } = useParams(); // Captura la ID de la URL
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [pagos, setPagos] = useState({
        numOperacion: 1, // Número de operación inicial
        totalPagado: 0,  // Total pagado inicial
        saldo: 0,        // Saldo restante inicial
    });
    const [conceptos, setConceptos] = useState([]);
    const [emisorData, setEmisorData] = useState([]);
    const [receptorData, setReceptorData] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('error');
    const [editIndex, setEditIndex] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [facturaEdit, setFacturaEdit] = useState(null); // Estado para almacenar la factura editada
    const router = useRouter(); // Inicializa el router
    const [token, setToken] = useState("");
    const [totalPago, setTotalPago] = useState(0);

    // Verifica la autenticación al montar el componente
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        } else {
            setToken(token);
            console.log("Token", token);
        }
    }, [router]);

    // Obtener la factura y los documentos relacionados
    useEffect(() => {
        const fetchFactura = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/facturas/ObtenerFactura/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setFacturaEdit(data);
                //console.log("Factura", data);

                // Extraer el total de la factura
                const totalFactura = data.factura.Total;
                //console.log("Total de la factura:", totalFactura);
                setTotalPago(totalFactura); // Actualiza el totalPago

                // Actualizar el saldo restante
                setPagos((prevPagos) => ({
                    ...prevPagos,
                    saldo: totalFactura, // Inicializa el saldo con el total de la factura
                }));

            } catch (error) {
                console.error('Error fetching factura:', error);
            }
        };

        const fetchDoctosRelacionados = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/doctosrelacionados/ObtenerDoctosRelacionados?FacturaMadreID=${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                console.log("Docto Relacionado", data);

                // Calcular el número de operación
                const numOperacion = data.length > 0 ? data[data.length - 1].NumParcialidad + 1 : 1;

                // Calcular el total pagado
                const totalPagado = data.reduce((sum, pago) => sum + pago.ImpPagado, 0);

                // Calcular el saldo restante
                const saldoRestante = totalPago - totalPagado;

                // Actualizar el estado de pagos
                setPagos({
                    numOperacion: numOperacion,
                    totalPagado: totalPagado,
                    saldo: saldoRestante,
                });

                console.log("Pagos calculados:", {
                    numOperacion: numOperacion,
                    totalPagado: totalPagado,
                    saldo: saldoRestante,
                });

            } catch (error) {
                console.error('Error fetching docto relacionado:', error);
            }
        };

        if (id && token) {
            fetchFactura(); // Obtener la factura
            fetchDoctosRelacionados(); // Obtener los documentos relacionados
        }
    }, [id, token, totalPago]); // Dependencia de totalPago para recalcular el saldo

    // Actualizar conceptos, emisor y receptor cuando se obtiene la factura
    useEffect(() => {
        if (facturaEdit) {
            console.log("Factura editada", facturaEdit);
            const { conceptos: Conceptos, emisor: Emisor, receptor: Receptor } = RecuperarFactura(facturaEdit);

            if (Conceptos) {
                console.log("Conceptos", Conceptos);
                setConceptos(Conceptos);
            }
            if (Emisor) {
                setEmisorData(Emisor);
            }
            if (Receptor) {
                setReceptorData(Receptor);
            }
            setValue("IdDocumento", facturaEdit.factura.uuid);
        }
    }, [facturaEdit, setValue]);

    // Enviar el formulario
    const onSubmit = (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto antes de crear la factura.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }

        //console.log("Data", data);
        //console.log("Conceptos antes de crear", conceptos);

        // Calcular el nuevo número de operación y el saldo restante
        const nuevoNumOperacion = pagos.numOperacion;
        const nuevoTotalPagado = pagos.totalPagado + parseFloat(data.Monto);
        const nuevoSaldoRestante = totalPago - nuevoTotalPagado;

        // Actualizar el estado de pagos
        setPagos({
            numOperacion: nuevoNumOperacion,
            totalPagado: nuevoTotalPagado,
            saldo: nuevoSaldoRestante,
        });

        // Formatear la factura y guardarla
        const factura = FormatearFactura(data, data, conceptos, "", "Pago");
        console.log('Factura creada:', factura);

        GuardarFactura(
            factura,
            (message) => { // Callback de éxito
                setSnackbarMessage(message);
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                setTimeout(() => {
                    router.push("/Home");
                }, 1000);
            },
            (errorMessage) => { // Callback de error
                setSnackbarMessage(errorMessage);
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            },
            { token }
        );
    };

    // Vista previa
    const handlePreview = handleSubmit(async (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }
        const factura = FormatearFactura(data, data, conceptos, "", "VistaPreviaRPE");
        const vistaPrevia = await generarVistaPrevia(factura);
        setPreviewContent(vistaPrevia);
        setOpenModal(true);
    });

    // Editar concepto
    const handleEditConcepto = (index) => {
        const conceptoToEdit = conceptos[index];
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

    // Eliminar concepto
    const handleDeleteConcepto = (index) => {
        setConceptos(prevConceptos => prevConceptos.filter((_, i) => i !== index));
    };

    return (
        <div>
            <Header />
            <Grid container sx={{ display: 'flex', height: '100vh' }}>
                <Grid item sx={{ width: '70px' }}>
                    <SideBarMenu />
                </Grid>
                <Grid item sx={{ flexGrow: 1, padding: '16px' }}>
                    <form onSubmit={handleSubmit(onSubmit)} method="post">
                        <Emisor
                            register={register}
                            setLugarExpedicion={setLugarExpedicion}
                            setValue={setValue}
                            getValues={getValues}
                            trigger={trigger}
                            errors={errors}
                            emisorData={emisorData}  // Usa emisorData aquí
                            disabled={facturaEdit ? true : false}
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
                            disabled={facturaEdit ? true : false}
                        />
                        <Pagos
                            emisorID={emisorData.ID}
                            conceptos={conceptos}
                            pagos={pagos}
                            total={totalPago}
                            register={register}
                            errors={errors}
                            getValues={getValues}
                            setValue={setValue}
                            token={token}
                        >
                            <div className="flex justify-end w-full space-x-2 mt-10">
                                <Button variant="contained" type="button" sx={{ backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }} onClick={() => router.push("/Home")}>Cancelar</Button>
                                {/* <button className="btn btn-secondary bg-red-700" type="button"  onClick={() => router.push("/Home")}>Cancelar</button> */}
                                <Button variant="contained" type="button" sx={{ backgroundColor: '#04b2ca', '&:hover': { backgroundColor: '#038a9e' } }} onClick={handlePreview}>Vista previa</Button>
                                {/* <button className="btn btn-accent" type="button" onClick={handlePreview}>Vista previa</button> */}
                                <Button variant="contained" type="submit" sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}>Crear Factura</Button>
                                {/* <button type="submit" className="btn" style={{backgroundColor: '#1b384a', '&:hover': {   backgroundColor: '#10232f'}}}>Crear Factura</button> */}
                            </div>
                        </Pagos>


                        {/* <Conceptos
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
                /> */}

                        {/* <Resumen
                    conceptos={conceptos}
                    subTotal={watch("Subtotal")}
                    handleEditConcepto={handleEditConcepto}
                    handleDeleteConcepto={handleDeleteConcepto}
                >
                   
                </Resumen> */}

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
                </Grid>
            </Grid>
        </div>
    );
}
