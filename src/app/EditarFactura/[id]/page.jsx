"use client"
import { useState, useEffect, useMemo } from "react";
import { get, useForm } from 'react-hook-form';
import { Snackbar, Alert, Modal, Box } from '@mui/material';
import { useParams } from 'next/navigation';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
function CrearObjetoFactura(emisor, receptor, conceptos, id) {
    // Calcula el subtotal y total
    const subtotal = conceptos.reduce((acc, c) => acc + c.Subtotal, 0);
    const total = subtotal + conceptos.reduce((acc, c) => (c.TotalTraslados || 0) + (c.TotalRetenciones || 0), 0);
    const fechaISO = new Date(`${emisor.Fecha}T00:00:00`).toISOString();
    const now = new Date();
    const horaActual = now.toTimeString().split(' ')[0]; // Obtiene solo "HH:MM:SS"

    // Concatenar la fecha con la hora actual
    const fechaFormateada = `${emisor.Fecha}T${horaActual}`;
    let factura = {
        ID: parseInt(id),
        Version: "4.0",
        Fecha: fechaFormateada,
      
        FormaPago: receptor.FormaPago,
        Serie: emisor.Serie,
        SubTotal: subtotal,
        Descripcion: "",
        Moneda: emisor.Divisa || "MXN",
        TipoCambio: "1",
        Total: total,
        TipoDeComprobante: "I",
        Exportacion: "01",
        MetodoPago: receptor.MetodoPago,

        LugarExpedicion: emisor.LugarExpedicion,
        Confirmacion: "",
        InformacionGlobal: {
            Periodicidad: "01",
            Meses: "01",
            Año: "2024"
        },
        EmisorID: emisor.Emisor,
        ReceptorID: receptor.Receptor,
        Conceptos: {
            ListaConceptos: conceptos.map(concepto => ({
                ClaveProdServ: String(concepto.ClaveProdServ),
                NoIdentificacion: concepto.NoIdentificacion || "",
                Cantidad: parseInt(concepto.Cantidad, 10),
                ClaveUnidad: String(concepto.ClaveUnidad),
                Unidad: concepto.Unidad || "",
                Descripcion: concepto.Descripcion,
                ValorUnitario: concepto.ValorUnitario,
                Importe: concepto.Subtotal,
                Descuento: concepto.Descuento,
                ObjetoImp: concepto.ObjetoImp || "02",
                Impuestos: {
                    Retenciones: concepto.Retenciones ? concepto.Retenciones.map(retencion => ({
                        Base: retencion.BaseImpuesto,
                        ImpuestoClave: String(retencion.ImpuestoClave),
                        TipoFactor: "Tasa",
                        TasaOCuota: retencion.Tasa,
                        Importe: retencion.Monto
                    })) : [],
                    Traslados: concepto.Traslados ? concepto.Traslados.map(traslado => ({
                        Base: traslado.BaseImpuesto,
                        ImpuestoClave: String(traslado.ImpuestoClave),
                        TipoFactor: "Tasa",
                        TasaOCuota: traslado.Tasa,
                        Importe: traslado.Monto
                    })) : []
                }
            })),
            TotalImpuestosTrasladados: conceptos.reduce((acc, c) => acc + (c.TotalTraslados || 0), 0),
            TotalImpuestosRetenidos: conceptos.reduce((acc, c) => acc + (c.TotalRetenciones || 0), 0),

        }
    };
    console.log(factura);
    return factura;
}
function FacturaVistaPrevia(emisor, receptor, conceptos) {
   const subtotal = conceptos.reduce((acc, c) => acc + c.Subtotal, 0);
   const total = subtotal + conceptos.reduce((acc, c) => (c.TotalTraslados || 0) + (c.TotalRetenciones || 0), 0);
   const fechaISO = new Date(`${emisor.Fecha}T00:00:00`).toISOString();
       let factura = {
           UUID: "",
           Version: "4.0",
           Serie: emisor.Serie,
           Folio: "2080427804",
           Fecha: fechaISO,
           Sello: "",
           FormaPago: receptor.FormaPago,
           FormaPagoDescripcion: receptor.FormaPagoDescripcion,
           NoCertificado: "",
           Certificado: "",
           CondicionesDePago: "Condiciones de Pago",
           SubTotal: subtotal,
           Moneda: emisor.Divisa || "MXN",
           TipoCambio: "1",
           Total: total,
           TipoDeComprobante: "I",
           Exportacion: "01",
           MetodoPago: receptor.MetodoPago,
           MetodoPagoDescripcion: receptor.MetodoPagoDescripcion,
           LugarExpedicion: emisor.LugarExpedicion,
           Confirmacion: "",
           InformacionGlobal: {
               Periodicidad: "01",
               Meses: "01",
               Año: "2024"
           },
           EmisorID: emisor.Emisor,
           EmisorNombre: emisor.NombreEmisor,
           EmisorRFC: emisor.RFCEmisor,
           EmisorDireccion: emisor.Calle + " # " + emisor.NoExterior + "," + emisor.ColoniaEmisor + "," + emisor.MunicipioEmisor + "," + emisor.EstadoEmisor,
           EmisorRegimenFiscal: emisor.RegimenFiscal,
           EmisorLogo:emisor.LogoEmisor,

           ReceptorID: receptor.Receptor,
           ReceptorNombre: receptor.NombreReceptor,
           ReceptorRFC: receptor.RFCReceptor,
           ReceptorRegimenFiscal: receptor.RegimenFiscal,
           ReceptorDireccion: receptor.Calle + " # " + receptor.NoExterior + "," + receptor.Colonia + "," + receptor.Municipio + "," + receptor.Estado,
           ReceptorUsoCFDI: receptor.UsoCFDI,
           ReceptorUsoCFDIDescripcion: receptor.UsoCFDIDescripcion,
           Conceptos: {
               ListaConceptos: conceptos.map(concepto => ({
                   ClaveProdServ: String(concepto.ClaveProdServ),
                   NoIdentificacion: concepto.NoIdentificacion || "",
                   Cantidad: parseInt(concepto.Cantidad, 10),
                   ClaveUnidad: String(concepto.ClaveUnidad),
                   Unidad: concepto.Unidad || "",
                   Descripcion: concepto.Descripcion,
                   ValorUnitario: concepto.ValorUnitario,
                   Importe: concepto.Subtotal,
                   Descuento: concepto.Descuento,
                   ObjetoImp: concepto.ObjetoImp || "02",
                   Impuestos: {
                       Retenciones: concepto.Retenciones ? concepto.Retenciones.map(retencion => ({
                        NombreImpuesto: retencion.NombreImpuesto || retencion.Nombre  || "",
                        Base: retencion.BaseImpuesto || retencion.Base,
                           ImpuestoClave: String(retencion.Impuesto),
                           TipoFactor: retencion.Tipo,
                           TasaOCuota: retencion.Tasa,
                           Importe: retencion.Monto
                       })) : [],
                       Traslados: concepto.Traslados ? concepto.Traslados.map(traslado => ({
                        NombreImpuesto: traslado.NombreImpuesto || traslado.Nombre  || "",
                        Base: traslado.BaseImpuesto || traslado.Base,
                           ImpuestoClave: String(traslado.Impuesto),
                           TipoFactor: traslado.Tipo,
                           TasaOCuota: traslado.Tasa,
                           Importe: traslado.Monto
                       })) : []
                   }
               })),
               TotalImpuestosTrasladados: conceptos.reduce((acc, c) => acc + (c.TotalTraslados || 0), 0),
               TotalImpuestosRetenidos: conceptos.reduce((acc, c) => acc + (c.TotalRetenciones || 0), 0),
               GrupoID: 1
           }
       };
       console.log(factura);
       return factura;
}
async function EnviarAEmisionTimbrado(factura) {


    try {
        if (typeof window !== 'undefined') {
            const token = localStorage.getItem('authToken');
            // Continúa con el uso de token 
            const response = await fetch('http://31.220.31.152:8087/EditarFactura', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(factura)
            });

            if (!response.ok) {
                throw new Error('Error al guardar la factura');
            }

            const result = await response.json();
            console.log('Factura creada con éxito:', result);

        }
        // const token = localStorage.getItem('authToken');

    } catch (error) {
        console.error('Error al enviar la factura:', error);
    }
}

export default function EditarFactura() {
    const { id } = useParams(); // Captura la ID de la URL
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [conceptos, setConceptos] = useState([]);
    const [emisorData, setemisorData] = useState([])
    const [receptorData, setReceptorData] = useState([])
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [facturaEdit, setFacturaEdit] = useState(null); // Estado para almacenar la factura editada

    useEffect(() => {
        const fetchFactura = async () => {
            try {
                const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
                const response = await fetch(`http://31.220.31.152:8087/ObtenerFactura/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });
                const data = await response.json();
                setFacturaEdit(data);
                console.log("Factura", data);
            } catch (error) {
                console.error('Error fetching factura:', error);
            }
        };

        if (id) {
            fetchFactura(); // Solo llama a la API si hay una ID
        }
    }, [id]);

    const getDatosEmisor = (FacturaEdit) => ({
        ID: FacturaEdit.EmisorID,
        Rfc: FacturaEdit.Emisor.Rfc,
        Nombre: FacturaEdit.Emisor.Nombre,
        RegimenFiscal: FacturaEdit.Emisor.RegimenFiscal,
        LugarExpedicion: FacturaEdit.Emisor.LugarExpedicion,
        Serie: FacturaEdit.Serie,
        Fecha: FacturaEdit.Fecha
    });
    const getDatosReceptor = (FacturaEdit) => ({
        ID: FacturaEdit.ReceptorID,
        Rfc: FacturaEdit.Receptor.Rfc,
        DomicilioFiscalReceptor: FacturaEdit.Receptor.DomicilioFiscal,
        Nombre: FacturaEdit.Receptor.Nombre,
        UsoCFDI: FacturaEdit.Receptor.UsoCFDI,
        RegimenFiscal: FacturaEdit.Receptor.RegimenFiscal,
        LugarExpedicion: FacturaEdit.Receptor.LugarExpedicion,
        Calle: FacturaEdit.Receptor.Calle,
        NoExterior: FacturaEdit.Receptor.NoExterior,
        NoInterior: FacturaEdit.Receptor.NoInterior,
        Colonia: FacturaEdit.Receptor.Colonia,
        Municipio: FacturaEdit.Receptor.Municipio,
        Estado: FacturaEdit.Receptor.Estado,
        MetodoPago: FacturaEdit.MetodoPago,
        FormaPago: FacturaEdit.FormaPago

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
                    Impuestos: Impuestos.map(impuesto => ({
                        ObjetoImpuesto: impuesto.ObjetoImpuesto || concepto.ObjetoImp,
                        Impuesto: impuesto.ImpuestoClave,
                        Tasa: impuesto.TasaOCuota,
                        BaseImpuesto: impuesto.Base || Subtotal,
                        Monto: impuesto.Importe
                    })),
                    Retenciones: Retenciones.map(retencion => ({
                        BaseImpuesto: retencion.Base,
                        ImpuestoClave: retencion.ImpuestoClave,
                        Tasa: retencion.TasaOCuota,
                        Monto: retencion.Importe,
                        Tipo : retencion.TipoFactor
                    })),
                    // Retenciones: concepto.Impuestos?.Retenciones || [],
                    Traslados: Traslados.map(traslado => ({
                        BaseImpuesto: traslado.Base,
                        ImpuestoClave: traslado.ImpuestoClave,
                        Tasa: traslado.TasaOCuota,
                        Monto: traslado.Importe,
                        Tipo : traslado.TipoFactor
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
            setOpenSnackbar(true);
            return;
        }
        const factura = CrearObjetoFactura(data, data, conceptos, id);
        console.log('Factura creada:', factura);
        // EnviarAEmisionTimbrado(factura);
    };

    const handlePreview = handleSubmit(async (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setOpenSnackbar(true);
            return;
        }
        console.log('CONCEPTOS EN EDIT',conceptos)
        const factura = FacturaVistaPrevia(data, data, conceptos);

        console.log('Llamando a generatePDF con la factura:', factura);
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
                />
                <Resumen
                    conceptos={conceptos}
                    subTotal={watch("Subtotal")}
                    handleEditConcepto={handleEditConcepto}
                    handleDeleteConcepto={handleDeleteConcepto}
                >
                    <div className="flex justify-end w-full space-x-2 mt-10">
                        <button className="btn btn-secondary bg-red-700" type="button">Cancelar</button>
                        <button className="btn btn-accent" type="button" onClick={handlePreview}>Vista previa</button>
                        <button type="submit" className="btn btn-primary bg-primary-dark-total">Crear Factura</button>
                    </div>
                </Resumen>
                <pre>
                    {JSON.stringify(watch(),null,2)}
                </pre>
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
                <Alert onClose={() => setOpenSnackbar(false)} severity="error" variant="filled">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}
