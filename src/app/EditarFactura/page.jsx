"use client"
import { useState, useEffect, useMemo } from "react";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert, Modal, Box } from '@mui/material';

import Header from "@/components/Header/Header.jsx";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import Conceptos from "@/components/FormFactura/Conceptos/Conceptos.jsx";
import Resumen from "@/components/FormFactura/Resumen/Resumen.jsx";
import generarVistaPrevia from "@/components/Home/Factura/GenerarVistaPrevia";

export default function EditarFactura() {
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [conceptos, setConceptos] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [editIndex, setEditIndex] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [previewContent, setPreviewContent] = useState('');
    const [facturaEdit, setFacturaEdit] = useState(null); // Estado para almacenar la factura editada

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

    // Memoize emisorData para evitar renders innecesarios
    const emisorData = useMemo(() => facturaEdit ? getDatosEmisor(facturaEdit) : {}, [facturaEdit]); // Usa facturaEdit aquí
    const receptorData = useMemo(() => facturaEdit ? getDatosReceptor(facturaEdit) : {}, [facturaEdit]);
   

    const onSubmit = (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto antes de crear la factura.');
            setOpenSnackbar(true);
            return;
        }
        const factura = CrearObjetoFactura(data, data, conceptos);
        EnviarAEmisionTimbrado(factura);
    };

    const handlePreview = handleSubmit(async (data) => {
        if (conceptos.length === 0) {
            setSnackbarMessage('Debe agregar al menos un concepto para la vista previa.');
            setOpenSnackbar(true);
            return;
        }
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
