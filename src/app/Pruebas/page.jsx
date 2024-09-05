"use client";

import { Button,Snackbar, Alert,Modal, Box } from '@mui/material';

import { useState } from "react";


// import generatePDF from "@/components/Home/Factura/GenerarPDF.js";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";
// import dynamic from 'next/dynamic';

// // const generatePDF = dynamic(
// //   () => import('@/components/Home/Factura/GenerarPDF.js').then(mod => {
// //     console.log('Módulo GenerarPDF importado:', mod);
// //     return mod.default;
// //   }),
// //   { ssr: false }
// // );

// const generatePDF = dynamic(
//     () =>
//         import('@/components/Home/Factura/GenerarPDF.js')
//             .then(mod => {
//                 console.log('Módulo importado:', mod);
//                 return mod.default;
//             })
//             .catch(error => {
//                 console.error('Error al importar el módulo:', error);
//             }),
//     { ssr: false }
// );

export default function Pruebas() {
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');

    const handlePreview = async() => {
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

        const vistaPrevia = await generarVistaPrevia(factura);
        console.log('Vista previa generada:', vistaPrevia);
        setPreviewContent(vistaPrevia);
        setOpenModal(true);
 
    };


    return (
        <div>
            <Button className="btn btn-accent" type="button" onClick={handlePreview}>
                Vista previa
            </Button>
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
        </div>
        
    );
}
