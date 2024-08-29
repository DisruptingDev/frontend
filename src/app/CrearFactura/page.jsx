"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert } from '@mui/material';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";

async function EnviarAEmisionTimbrado(emisor, receptor, conceptos) {
    // Calcula el subtotal y total
    const subtotal = conceptos.reduce((acc, c) => acc + c.Subtotal, 0);
    const total = subtotal + conceptos.reduce((acc, c) => (c.TotalTraslados || 0) + (c.TotalRetenciones || 0), 0);
    const fechaISO = new Date(`${emisor.Fecha}T00:00:00`).toISOString();
    let factura = {
        UUID: "",
        Version: "4.0",
        Serie: emisor.Serie,
        Folio: "2080427804",
        Fecha:fechaISO, // Asegúrate de que la fecha esté en formato ISO-8601
        Sello: "",
        FormaPago: receptor.FormaPago,
        NoCertificado: "",
        Certificado: "",
        CondicionesDePago: "Condiciones de Pago",
        SubTotal: subtotal,
        Moneda: emisor.Divisa || "MXN", // Usa "MXN" si no se especifica una divisa
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
                ClaveProdServ: String(concepto.ClaveProdServ), // Asegúrate de que esté en formato de cadena
                NoIdentificacion: concepto.NoIdentificacion || "",
                Cantidad: parseInt(concepto.Cantidad, 10),
                ClaveUnidad: String(concepto.ClaveUnidad), // Asegúrate de que esté en formato de cadena
                Unidad: concepto.Unidad || "",
                Descripcion: concepto.Descripcion,
                ValorUnitario: concepto.ValorUnitario,
                Importe: concepto.Subtotal,
                Descuento: concepto.Descuento,
                ObjetoImp: concepto.ObjetoImp || "02",
                Impuestos: {
                    Retenciones: concepto.Retenciones ? concepto.Retenciones.map(retencion => ({
                        Base: retencion.BaseImpuesto,
                        ImpuestoClave: String(retencion.Impuesto), // Asegúrate de que esté en formato de cadena
                        TipoFactor: "Tasa", // Ajusta el valor si es necesario
                        TasaOCuota: retencion.Tasa,
                        Importe: retencion.Monto
                    })) : [],
                    Traslados: concepto.Traslados ? concepto.Traslados.map(traslado => ({
                        Base: traslado.BaseImpuesto,
                        ImpuestoClave: String(traslado.Impuesto), // Asegúrate de que esté en formato de cadena
                        TipoFactor: "Tasa", // Ajusta el valor si es necesario
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

    const prueba = JSON.stringify(factura)
    console.log(prueba);
    try {
        const token = localStorage.getItem('authToken');
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

    const onSubmit = (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto antes de crear la factura.');
            setOpenSnackbar(true);
            return;
        }
        console.log("Datos del formulario:", data);
        console.log("Datos de conceptos:", conceptos);

        EnviarAEmisionTimbrado(data, data, conceptos); // Enviar datos al backend
    };

    const handlePreview = handleSubmit((data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setOpenSnackbar(true);
            return;
        }
        console.log("Vista previa de los datos:", data);
    });

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
                <Receptor register={register} lugarExpedicion={lugarExpedicion} errors={errors} setValue={setValue} trigger={trigger} /> 
                <Conceptos 
                    register={register} 
                    watch={watch} 
                    setValue={setValue} 
                    getValues={getValues} 
                    setConceptos={setConceptos}
                /> 
                <Resumen conceptos={conceptos} subTotal={watch("Subtotal")}> 
                    <div className="flex justify-end w-full space-x-2 mt-10">
                        <button className="btn btn-secondary bg-red-700" type="button">Cancelar</button>
                        <button className="btn btn-accent" type="button" onClick={handlePreview}>Vista previa</button>
                        <button type="submit" className="btn btn-primary bg-primary-dark-total">Crear Factura</button>
                    </div>
                </Resumen> 
            </form>

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
