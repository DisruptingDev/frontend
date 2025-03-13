import React, { useState, useEffect } from 'react'; // Importa React y los hooks useState y useEffect
import { Modal, Box, Typography, Button } from '@mui/material'; // Importa componentes de Material-UI para la interfaz
import Emisor from './ComponentesEdicion/Emisor'; // Importa el componente de edición del emisor
import Receptor from './ComponentesEdicion/Receptor'; // Importa el componente de edición del receptor
import Concepto from './ComponentesEdicion/Concepto'; // Importa el componente de edición del concepto
import { useForm } from 'react-hook-form'; // Importa react-hook-form para el manejo de formularios

const ModalEdicion = ({
    open, // Estado para abrir o cerrar el modal
    handleClose, // Función para cerrar el modal
    token,  // Token de autenticación
    facturaEditar, // Factura a editar
    actualizarFactura  //Fuinción para actualizar la factura
}) => {

    // Estados locales para almacenar los datos de la factura a editar
    const [emisor, setEmisor] = useState({});
    const [receptor, setReceptor] = useState({});
    const [concepto, setConcepto] = useState({});
    const [impuesto, setImpuesto] = useState({});


    // Configuración del formulario con react-hook-form
    const { control, register, watch, handleSubmit, setValue, getValues, trigger, reset, formState: { errors }, setError } = useForm();

    // Efecto para cargar los datos de la factura a editar
    useEffect(() => {
        if (facturaEditar) { // Si hay una factura a editar
            // Separa los datos de la factura a editar
            setEmisor(facturaEditar.Emisor);
            setReceptor(facturaEditar.Receptor);
            setConcepto(facturaEditar.Concepto);
            setImpuesto(facturaEditar.Impuesto);
            // Valida los datos de la factura, para que se muestren resaltados
            if (facturaEditar.Emisor.Error) { // Si hay un error en el emisor
                console.error("Error en emisor", facturaEditar.Emisor.Error);

                setError("Emisor", { // Muestra un mensaje de error
                    type: "manual",
                    message: "El nombre del emisor es obligatorio",
                });
            }
            if (facturaEditar.Receptor.Error) { // Si hay un error en el receptor
                console.error("Error en receptor", facturaEditar.Receptor.Error);
                setError("Receptor", { // Muestra un mensaje de error
                    type: "manual",
                    message: "El nombre del receptor es obligatorio",
                });
            }
            if (facturaEditar.Concepto.Error) { // Si hay un error en el concepto
                console.error("Error en concepto", facturaEditar.Concepto.Error);
                setError("Concepto", { // Muestra un mensaje de error
                    type: "manual",
                    message: "El nombre del concepto es obligatorio",
                });
            }
        }
    }, [facturaEditar]);


    // Maneja la actualización de la factura
    const onSubmit = (data) => {
        //console.log("Entro a onSubmit");
        console.log("Datos del formulario", data);

        // Creación del objeto emisor
        const emisor = {
            ID: data.Emisor,
            Nombre: data.EmisorNombre,
            RFC: data.EmisorRFC,
            LugarExpedicion: data.EmisorLugarExpedicion,
            Serie: data.Serie,
        }
        console.log("Emisor", emisor);
        // Creación del objeto receptor
        const receptor = {
            ID: data.ReceptorID,
            Nombre: data.ReceptorNombre,
            RFC: data.ReceptorRFC,
            MetodoPago: data.MetodoPago,
            UsoCFDI: data.UsoCFDI,
            UsoCFDIID: data.UsoCFDIID,
            FormaPago: data.FormaPago,
            RegimenFiscal: data.ReceptorRegimenFiscal,
        }
        console.log("Receptor", receptor);
        // Creación del objeto concepto
        const concepto = {
            Cantidad: data.Cantidad,
            ClaveProductoServicio: data.ClaveProdServ,
            ClaveUnidad: data.ClaveUnidad,
            Descripcion: data.DescripcionConcepto,
            PrecioUnitario: data.PrecioUnitario,
            Descuento: data.Descuento,

        }
        //console.log("Concepto", concepto);
        // Creación del objeto impuesto
        const impuesto = {
            BaseImpuesto: data.BaseImpuesto,
            ClaveImpuesto: data.ClaveImpuesto,
            ImpuestoClaveID: data.ImpuestoClaveID,
            Monto: data.Monto,
            ObjetoImpuesto: data.ObjetoImpuesto,
            ObjetoImpuestoID: data.ObjetoImpuestoID,
            TasaOCuota: data.TasaOCuota,
            TasaOCuotaID: data.TasaOCuotaID,
            Tipo: data.Tipo,
        };
        //console.log("Impuesto", impuesto);

        // Creación del objeto factura con los datos actualizado
        const factura = {
            Emisor: emisor,
            Receptor: receptor,
            Concepto: concepto,
            Impuesto: impuesto,

        };
        console.log("Factura a actualizar", factura);
        actualizarFactura(factura); // Actualiza la factura
        handleClose(); // Cierra el modal
    };

    // Maneja el reseteo del formulario al cerrar el modal
    const onClose = () => {
        handleClose(); // Cierra el modal
        reset();
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
            disableAutoFocus={true} // Evita que el Modal maneje el foco automáticamente
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                maxHeight: '80vh',
                overflowY: 'auto',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: '16px',
            }}
                aria-hidden={false}
            >
                <Typography id="modal-modal-title" variant="h5" component="h2" sx={{ my: 2 }}>
                    Editar Factura
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)} method="POST">
                    {/* Formulario de edición de la factura */}
                    <Emisor
                        datosEmisor={emisor}
                        register={register}
                        getValues={getValues}
                        setValue={setValue}
                        trigger={trigger}
                        errors={errors}
                    />
                    <Receptor
                        datosReceptor={receptor}
                        register={register}
                        trigger={trigger}
                        setValue={setValue}
                        getValues={getValues}
                        errors={errors}
                    />
                    <Concepto
                        control={control}
                        register={register}
                        getValues={getValues}
                        setValue={setValue}
                        trigger={trigger}
                        token={token}
                        datosConcepto={concepto}
                        datosImpuesto={impuesto}
                        errors={errors}
                    />
                    <Box my={4} display="flex" justifyContent="flex-end" gap={3}>
                        {/* Botones para cancelar y actualizar la factura */}
                        <Button
                            variant="contained"
                            color="error"
                            sx={{ width: '150px', backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
                            type="button"
                            onClick={onClose}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{
                                width: '250px',
                                backgroundColor: '#04b2ca',
                                '&:hover': { backgroundColor: '#038a9e' },
                            }}
                            type="submit"
                        >
                            Actualizar
                        </Button>
                    </Box>
                </form>
            </Box>
        </Modal>
    );
};

export default ModalEdicion;
