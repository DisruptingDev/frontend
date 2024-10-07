"use client"
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { get, useForm } from 'react-hook-form';
import { Snackbar, Alert, Modal, Box } from '@mui/material';
import { useParams } from 'next/navigation';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
import FormatearFactura from "@/components/FormFactura/FormatearFactura";
import { isAuthenticated } from "@/utils/authRedirect";

import GuardarFactura from "@/components/FormFactura/EditarFactura";



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
            // console.log("SEsion",!isAuthenticated());
            router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
        }
        else{
            setToken(token);
        }
    }, [router]);
    useEffect(() => {
        const fetchFactura = async () => {
            try {
                // const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
                const response = await fetch(`http://31.220.31.152:8087/ObtenerFactura/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setFacturaEdit(data.factura);
                console.log("Factura", data);
            } catch (error) {
                console.error('Error fetching factura:', error);
            }
        };

        if (id) {
            fetchFactura(); // Solo llama a la API si hay una ID
        }
    }, [id, token]);

    const getDatosEmisor = (FacturaEdit) => ({
        ID: FacturaEdit.EmisorID,
        Rfc: FacturaEdit.Emisor.Rfc,
        Nombre: FacturaEdit.Emisor.Nombre,
        RegimenFiscal: FacturaEdit.Emisor.RegimenFiscal,
        LugarExpedicion: FacturaEdit.Emisor.LugarExpedicion,
        Serie: FacturaEdit.Serie,
        Fecha: FacturaEdit.Fecha,
        TipoComprobante: FacturaEdit.TipoDeComprobante
    });
    const getDatosReceptor = (FacturaEdit) => ({
        ID: FacturaEdit.ReceptorID,
        Rfc: FacturaEdit.Receptor.Rfc,
        DomicilioFiscalReceptor: FacturaEdit.Receptor.DomicilioFiscalReceptor,
        Nombre: FacturaEdit.Receptor.Nombre,
        UsoCFDI: FacturaEdit.UsoCFDI,
        RegimenFiscal: FacturaEdit.Receptor.RegimenFiscalReceptor,
        LugarExpedicion: FacturaEdit.Receptor.LugarExpedicion,
        Calle: FacturaEdit.Receptor.Calle,
        NoExterior: FacturaEdit.Receptor.NoExterior,
        NoInterior: FacturaEdit.Receptor.NoInterior,
        Colonia: FacturaEdit.Receptor.Colonia,
        Municipio: FacturaEdit.Receptor.Municipio,
        Estado: FacturaEdit.Receptor.Estado,
        MetodoPago: FacturaEdit.MetodoPago,
        FormaPago: FacturaEdit.FormaPago,

        //informacion Global
        InformacionGlobal:{
            Año: FacturaEdit.InformacionGlobal.Año,
            Meses: FacturaEdit.InformacionGlobal.Meses,
            Periodicidad: FacturaEdit.InformacionGlobal.Periodicidad

        }

    });

  

   



    useEffect(() => {
        // Este bloque solo se ejecuta en el cliente
        const factura = JSON.parse(localStorage.getItem('EditFactura'));
        setFacturaEdit(factura);
    }, []);


    useEffect(() => {
        if (facturaEdit && facturaEdit.Conceptos && facturaEdit.Conceptos.ListaConceptos) {
             // Mapea los conceptos a la estructura deseada
             const ListaConceptos = facturaEdit.Conceptos.ListaConceptos.map((concepto) => {
                
                // Calcula el subtotal como ValorUnitario * Cantidad
                const Subtotal = concepto.ValorUnitario * concepto.Cantidad;
            
                // Mapea los impuestos para la estructura deseada
                const Impuestos = [
                    ...(concepto.Impuestos?.Retenciones || []), // Incluye las retenciones si existen
                    ...(concepto.Impuestos?.Traslados || [])   // Incluye los traslados si existen
                ];
                const Retenciones = [
                    ...(concepto.Impuestos?.Retenciones || [])
                ]
                const Traslados = [
                    ...(concepto.Impuestos?.Traslados || [])
                ]
            
                // Calcula los totales de retenciones y traslados
                const TotalRetenciones = concepto.Impuestos?.Retenciones.reduce((acc, ret) => acc + ret.Importe, 0) || 0;
                const TotalTraslados = concepto.Impuestos?.Traslados.reduce((acc, tras) => acc + tras.Importe, 0) || 0;
            
                return {
                    Cantidad: concepto.Cantidad,
                    ClaveProdServ: concepto.ClaveProdServ,
                    ClaveUnidad: concepto.ClaveUnidad,
                    Unidad: concepto.Unidad,
                    Descripcion: concepto.Descripcion,
                    Descuento: concepto.Descuento,
                    ObjetoImpuesto: concepto.ObjetoImpuesto || concepto.ObjetoImp,
                    Impuestos: Impuestos.map(impuesto => ({
                        
                        Impuesto: impuesto.ImpuestoCatalogoID,
                        ImpuestoClave: impuesto.ImpuestoClave,
                        Tasa:impuesto.TasaCatalogoID,
                        TasaOCuota: impuesto.TasaOCuota,
                        BaseImpuesto: impuesto.Base || Subtotal,
                        Monto: impuesto.Importe,
                        Tipo: impuesto.TipoFactor
                    })),
                    Retenciones: Retenciones.map(retencion => ({
                        BaseImpuesto: retencion.Base,
                        Impuesto:retencion.ImpuestoCatalogoID,
                        ImpuestoClave: retencion.ImpuestoClave,
                        Tasa:retencion.TasaCatalogoID,
                        TasaOCuota: retencion.TasaOCuota,
                        Monto: retencion.Importe,
                        Tipo : retencion.TipoFactor
                    })),
                    // Retenciones: concepto.Impuestos?.Retenciones || [],
                    Traslados: Traslados.map(traslado => ({
                        BaseImpuesto: traslado.Base,
                        Impuesto: traslado.ImpuestoCatalogoID,
                        ImpuestoClave: traslado.ImpuestoClave,
                        Tasa:traslado.TasaCatalogoID,
                        TasaOCuota: traslado.TasaOCuota,
                        Monto: traslado.Importe,
                        Tipo : traslado.Tipo
                    })),
                    // Traslados: concepto.Impuestos?.Traslados || [],
                    Subtotal: Subtotal,
                    TotalRetenciones: TotalRetenciones,
                    TotalTraslados: TotalTraslados,
                    ValorUnitario: concepto.ValorUnitario,
                };
            });
            console.log("Lista Concepto", ListaConceptos);
            setConceptos(ListaConceptos);
            setemisorData(getDatosEmisor(facturaEdit));
            setReceptorData(getDatosReceptor(facturaEdit));
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
        console.log("Conceptos ante de crear", conceptos);
        const factura = FormatearFactura(data, data, conceptos, id, "Factura");
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
                        <button className="btn btn-secondary bg-red-700" type="button"  onClick={() => router.push("/Home")}>Cancelar</button>
                        <button className="btn btn-accent" type="button" onClick={handlePreview}>Vista previa</button>
                        <button type="submit" className="btn btn-primary bg-primary-dark-total">Actualizar Factura</button>
                    </div>
                </Resumen>
                {/* <pre>
                    {JSON.stringify(watch(),null,2)}
                </pre> */}
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
        </div>
    );
}
