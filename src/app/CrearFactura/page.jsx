"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert,Modal, Box } from '@mui/material';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
// import generatePDF from "@/components/Home/Factura/GenerarPDF.js";
// import dynamic from 'next/dynamic';

// const generatePDF = dynamic(
//   () => import('@/components/Home/Factura/GenerarPDF.js').then(mod => {
//     console.log('Módulo GenerarPDF importado:', mod);
//     return mod.default;
//   }),
//   { ssr: false }
// );

function CrearObjetoFactura(emisor, receptor, conceptos) {
     // Calcula el subtotal y total
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
                         ImpuestoClave: String(retencion.Impuesto),
                         TipoFactor: "Tasa",
                         TasaOCuota: retencion.Tasa,
                         Importe: retencion.Monto
                     })) : [],
                     Traslados: concepto.Traslados ? concepto.Traslados.map(traslado => ({
                         Base: traslado.BaseImpuesto,
                         ImpuestoClave: String(traslado.Impuesto),
                         TipoFactor: "Tasa",
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
            const response = await fetch('http://31.220.31.152:8087/GuardarFactura', {
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

export default function CrearFactura() {
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [conceptos, setConceptos] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const onSubmit = (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto antes de crear la factura.');
            setOpenSnackbar(true);
            return;
        }
        const factura=CrearObjetoFactura(data, data, conceptos);
        EnviarAEmisionTimbrado(factura);
    };

    const handlePreview = handleSubmit(async (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setOpenSnackbar(true);
            return;
        }
        console.log("Vista previa de los datos:", data);
        // const factura=CrearObjetoFactura(data, data, conceptos);
        const factura = {
            Certificado: "",
            Conceptos: {
                GrupoID: 1,
                ListaConceptos: [
                    {
                        Cantidad: 1,
                        ClaveProdServ: "10101501",
                        ClaveUnidad: "28",
                        Descripcion: "Prueba",
                        Descuento: 0,
                        Importe: 100,
                        Impuestos: {
                            Retenciones: [
                                {
                                    Base: 100,
                                    ImpuestoClave: "2",
                                    TipoFactor: "Tasa",
                                    TasaOCuota: 0.16,
                                    Importe: 16
                                },
                                {
                                    Base: 100,
                                    ImpuestoClave: "4",
                                    TipoFactor: "Tasa",
                                    TasaOCuota: 0,
                                    Importe: 0
                                }
                            ],
                            Traslados: []
                        },
                        NoIdentificacion: "",
                        ObjetoImp: "02",
                        Unidad: "",
                        ValorUnitario: 100
                    },
                    {
                        Cantidad: 2,
                        ClaveProdServ: "10151902",
                        ClaveUnidad: "29",
                        Descripcion: "prueba2",
                        Descuento: 0,
                        Importe: 400,
                        Impuestos: {
                            Retenciones: [],
                            Traslados: [
                                {
                                    Base: 400,
                                    ImpuestoClave: "1",
                                    TipoFactor: "Tasa",
                                    TasaOCuota: 0.5,
                                    Importe: 200
                                }
                            ]
                        },
                        NoIdentificacion: "",
                        ObjetoImp: "02",
                        Unidad: "",
                        ValorUnitario: 200
                    }
                ],
                TotalImpuestosRetenidos: 16,
                TotalImpuestosTrasladados: 200
            },
            CondicionesDePago: "Condiciones de Pago",
            Confirmacion: "",
            EmisorID: 93,
            Exportacion: "01",
            Fecha: "2024-08-29T06:00:00.000Z",
            Folio: "2080427804",
            FormaPago: "01",
            InformacionGlobal: {
                Año: "2024",
                Meses: "01",
                Periodicidad: "01"
            },
            LugarExpedicion: "72580",
            MetodoPago: "PUE",
            Moneda: "MXN",
            NoCertificado: "",
            ReceptorID: 28,
            Sello: "",
            Serie: "F",
            SubTotal: 500,
            TipoCambio: "1",
            TipoDeComprobante: "I",
            Total: 700,
            UUID: "",
            Version: "4.0"
        };    
       console.log('Llamando a generatePDF con la factura:', factura);
       const vistaPrevia = generarVistaPrevia(factura);
       setPreviewContent(vistaPrevia);
       setOpenModal(true);

    // if (generatePDF) {
    //     console.log('generatePDF está definido, llamando a generatePDF...');
    //     generatePDF(factura);
    // } else {
    //     console.error('generatePDF no está definido.');
    // }
    });

    const handleEditConcepto = (index) => {
        console.log("Edit concepto");
        const conceptoToEdit = conceptos[index];
        setEditIndex(index);
        // Setear los valores del concepto en el formulario
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
                    trigger={trigger} 
                    errors={errors} 
                /> 
                <Receptor 
                    register={register} 
                    lugarExpedicion={lugarExpedicion} 
                    errors={errors} 
                    setValue={setValue} 
                    trigger={trigger} 
                /> 
                
                <Conceptos
                    register={register}
                    watch={watch}
                    setValue={setValue}
                    getValues={getValues}
                    setConceptos={setConceptos}
                    conceptos={conceptos} // Pasar los conceptos
                    editIndex={editIndex} // Pasar editIndex
                    setEditIndex={setEditIndex} // Pasar setEditIndex
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
            </form>
            <Modal
                open={openModal}
                onClose={() => setOpenModal(false)}
                aria-labelledby="modal-vista-previa"
                aria-describedby="vista-previa-factura"
            >
                <Box sx={{ maxHeight: '90vh', overflowY: 'auto', p: 4, bgcolor: 'background.paper', margin: 'auto', width: '80%', maxWidth: '800px' }}>
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
