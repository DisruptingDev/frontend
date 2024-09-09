"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from "@/components/Select/Select.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente"; // Importa el componente

export default function Receptor({ register, watch, lugarExpedicion, getValues, trigger, errors, setValue, receptorData }) {
    const [receptor, setReceptor] = useState();
    const [metodoPago, setMetodoPago] = useState();
    const [usoCFDI, setUsoCFDI] = useState();
    const [formaPago, setFormaPago] = useState();
    const [rfc, setRFC] = useState();
    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState(false);
    const [domicilioFiscal, setDomicilioFiscal] = useState("");
    const [regimenFiscal, setRegimenFiscal] = useState("");
    const [openModal, setOpenModal] = useState(false);

    useEffect(() => {
        if (receptorData) {
            console.log("Receptor data", receptorData);
            setValue("ReceptorID", receptorData.ID);
            setRFC(receptorData.Rfc);
            setValue("RFCReceptor", receptorData.Rfc);
            setValue("NombreReceptor", receptorData.Nombre);
            setValue("Calle", receptorData.Calle);
            setValue("NoExterior", receptorData.NumeroExterior);
            // setValue("NoInterior", data["NoInterior"]);
            setValue("Colonia", receptorData.Colonia);
            setValue("Municipio", receptorData.Municipio);
            setValue("Estado", receptorData.Estado);

            // setDomicilioFiscal(receptorData.DomicilioFiscalReceptor);
            setValue("DomicilioFiscalReceptor", receptorData.DomicilioFiscalReceptor);
            // setRegimenFiscal(receptorData.RegimenFiscalReceptor);
            setValue("RegimenFiscalReceptor", receptorData.RegimenFiscalReceptor);
            // setFormaPago(receptorData.FormaPago);
            setValue("FormaPago", receptorData.FormaPago);
            // setMetodoPago(receptorData.MetodoPago);
            setValue("MetodoPago", receptorData.MetodoPago);
            // setUsoCFDI(receptorData.UsoCFDI);
            setValue("UsoCFDI", receptorData.UsoCFDI);

            
            if (rfc === "XAXX010101000") {
                setHiddeInfoGlobal(false);
              
            } else {
                setHiddeInfoGlobal(true);
            }

        }
    }, [receptorData, setValue, trigger, getValues]);

    useEffect(() => {
        if (receptor !== undefined) {
            let data = JSON.parse(receptor);
            if (data["Rfc"] !== "XAXX010101000") {
                setDomicilioFiscal(data["DomicilioFiscalReceptor"]);
                setValue("DomicilioFiscalReceptor", data["DomicilioFiscalReceptor"]);
                setHiddeInfoGlobal(false);
                setRegimenFiscal(data["RegimenFiscalReceptor"]);
                setValue("RegimenFiscal", data["RegimenFiscalReceptor"]);
            } else {
                setDomicilioFiscal(lugarExpedicion);
                setHiddeInfoGlobal(true);
            }
            setRFC(data["Rfc"]);
            setValue("RFCReceptor", data["Rfc"]);
            setValue("NombreReceptor", data["Nombre"]);
            setValue("Calle", data["Calle"]);
            setValue("NoExterior", data["NumeroExterior"]);
            setValue("NoInterior", data["NumeroInterior"]);
            setValue("Colonia", data["Colonia"]);
            setValue("Municipio", data["Municipio"]);
            setValue("Estado", data["Estado"]);



            console.log("RFCReceptor", data["Rfc"]);
            // Dispara la validación de estos campos
            trigger("RFCReceptor");
            trigger("DomicilioFiscalReceptor");
            trigger("RegimenFiscal");

        }
    }, [receptor, lugarExpedicion, trigger, setValue]);

    useEffect(() => {
        if (metodoPago !== undefined) {
            let data = JSON.parse(metodoPago);
            setValue("MetodoPagoDescripcion", data["Descripcion"]);
        }
    }, [metodoPago, setValue])

    useEffect(() => {
        if (formaPago !== undefined) {
            let data = JSON.parse(formaPago);
            setValue("FormaPagoDescripcion", data["Descripcion"]);
        }
    }, [formaPago, setValue])

    useEffect(() => {
        if (usoCFDI !== undefined) {
            let data = JSON.parse(usoCFDI);
            setValue("UsoCFDIDescripcion", data["Descripcion"]);
        }
    }, [usoCFDI, setValue])




    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
    };

    return (
        <Box bgcolor="white" mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={4}>Datos del Receptor</Typography>

            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1fr 0.6fr 0.5fr 0.5fr 1.2fr 0.2fr 0.2fr' //4.5
                }}
                gap={3}
            >
                <Select
                    register={register}
                    nombre="Receptor"
                    url="http://31.220.31.152:8081/Catalogos/Receptor"
                    id="ID"
                    descripcion="Nombre"
                    onChange={(e) => setReceptor(e.target.value)}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                    value={getValues("ReceptorID") || ""}
                />

                <TextField
                    label="RFC"
                    {...register("RFCReceptor", { required: "Este campo es obligatorio." })}
                    value={rfc || ""}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f', // Cambia el borde a rojo si hay error
                            }
                        }
                    }}
                    error={!!errors.RFCReceptor} // Muestra error si hay errores en RFCEmisor
                    helperText={errors.RFCReceptor && errors.RFCReceptor.message}
                    disabled
                />

                <TextField
                    label="Domicilio Fiscal"
                    {...register("DomicilioFiscalReceptor", { required: "Este campo es obligatorio." })}
                    value={domicilioFiscal}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f', // Cambia el borde a rojo si hay error
                            }
                        }
                    }}
                    error={!!errors.DomicilioFiscalReceptor} // Muestra error si hay errores en RFCEmisor
                    helperText={errors.DomicilioFiscalReceptor && errors.DomicilioFiscalReceptor.message}
                    disabled
                />
                <TextField
                    label="Regimen Fiscal"
                    {...register("RegimenFiscal", { required: "Este campo es obligatorio." })}
                    value={regimenFiscal}
                    fullWidth
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            '&.Mui-error fieldset': {
                                borderColor: '#d32f2f', // Cambia el borde a rojo si hay error
                            }
                        }
                    }}
                    error={!!errors.RegimenFiscal} // Muestra error si hay errores en RFCEmisor
                    helperText={errors.RegimenFiscal && errors.RegimenFiscal.message}
                    disabled
                />


                <Select
                    register={register}
                    nombre="MetodoPago"
                    url="http://31.220.31.152:8081/Catalogos/MetodoPago"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.MetodoPago}
                    helperText={errors.MetodoPago ? "Este campo es obligatorio" : ""}
                    onChange={(e) => setMetodoPago(e.target.value)}
                    value={getValues("MetodoPago") || ""}

                />



                <Button
                    variant="contained"
                    sx={{
                        backgroundColor: 'rgba(29, 57, 77, 1)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        '&:hover': {
                            backgroundColor: 'rgba(19, 47, 67, 1)',
                        }
                    }}
                    onClick={handleOpenModal}
                >
                    <AddCircleIcon sx={{ fontSize: '30px' }} />
                </Button>
            </Box>

            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1.1fr 1.3fr 0.7fr 1.8fr'
                }}
                gap={3}
                mt={4}
            >
                <Select
                    register={register}
                    nombre="FormaPago"
                    url="http://31.220.31.152:8081/Catalogos/FormaPago"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.FormaPago}
                    helperText={errors.FormaPago ? "Este campo es obligatorio" : ""}
                    onChange={(e) => setFormaPago(e.target.value)}
                    value={getValues("FormaPago") || ""}
                />

                <Select
                    register={register}
                    nombre="UsoCFDI"
                    url="http://31.220.31.152:8081/Catalogos/UsoCFDI"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.UsoCFDI}
                    helperText={errors.UsoCFDI ? "Este campo es obligatorio" : ""}
                    onChange={(e) => setUsoCFDI(e.target.value)}
                    value={getValues("UsoCFDI") || ""}
                />
                <Select
                        register={register}
                        nombre="Exportación"
                        url="http://31.220.31.152:8081/Catalogos/Exportacion"
                        clave="Clave"
                        descripcion="Exportación"
                    />
            </Box>
            {hiddeInfoGlobal && (
                <Box
                    display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 0.5fr 0.5fr',
                        lg: '0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 1.6fr'
                    }}
                    gap={3}
                    mt={4}
                >
                    
                    <Typography color="textSecondary" align='center'>Información Global</Typography>

                    <Select
                        register={register}
                        nombre="Periodicidad"
                        url="http://31.220.31.152:8081/Catalogos/Periodicidad"
                        clave="Clave"
                        descripcion="Descripcion"
                    />

                    <Select
                        register={register}
                        nombre="Meses"
                        url="http://31.220.31.152:8081/Catalogos/PeriodicidadMeses"
                        clave="Clave"
                        descripcion="Descripcion"
                    />
                    <TextField
                        label="Año"
                        type="number"
                        {...register("Año")}
                        fullWidth
                        inputProps={{
                            min: 1900,
                            max: 2100,
                            step: 1,
                        }}
                        onChange={(e) => {
                            const value = e.target.value;
                            if (value.length > 4) {
                                e.target.value = value.slice(0, 4);
                            }
                        }}
                    />
                </Box>
            )}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                fullWidth
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: '80%',
                        margin: 'auto',
                    }
                }}
            >
                <DialogTitle>Alta de Cliente</DialogTitle>
                <DialogContent>
                    <AltaCliente register={register} onClose={handleCloseModal} />
                </DialogContent>
            </Dialog>
        </Box>
    );
}
