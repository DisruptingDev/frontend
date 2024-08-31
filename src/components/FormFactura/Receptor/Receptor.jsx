"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from "@/components/Select/Select.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente"; // Importa el componente

export default function Receptor({ register, watch, lugarExpedicion, getValues, trigger, errors, setValue}) {
    const [receptor, setReceptor] = useState();
    const [rfc, setRFC] = useState();
    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState(false);
    const [domicilioFiscal, setDomicilioFiscal] = useState("");
    const [regimenFiscal, setRegimenFiscal] = useState("");
    const [openModal, setOpenModal] = useState(false);

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
            console.log("RFCReceptor", data["Rfc"]);
             // Dispara la validación de estos campos
             trigger("RFCReceptor");
             trigger("DomicilioFiscalReceptor");
             trigger("RegimenFiscal");
 
        }
    }, [receptor, lugarExpedicion,trigger,setValue]);

   
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
                    lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.2fr 0.2fr'
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

                {/* <Select
                    register={register}
                    nombre="RegimenFiscal"
                    url="http://31.220.31.152:8081/Catalogos/RegimenFiscal"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.RegimenFiscal}
                    helperText={errors.RegimenFiscal ? "Este campo es obligatorio" : ""}
                /> */}

                <Select
                    register={register}
                    nombre="MetodoPago"
                    url="http://31.220.31.152:8081/Catalogos/MetodoPago"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.MetodoPago}
                    helperText={errors.MetodoPago ? "Este campo es obligatorio" : ""}
                />

                <Select
                    register={register}
                    nombre="FormaPago"
                    url="http://31.220.31.152:8081/Catalogos/FormaPago"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.FormaPago}
                    helperText={errors.FormaPago ? "Este campo es obligatorio" : ""}
                />

                <Select
                    register={register}
                    nombre="UsoCFDI"
                    url="http://31.220.31.152:8081/Catalogos/UsoCFDI"
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.UsoCFDI}
                    helperText={errors.UsoCFDI ? "Este campo es obligatorio" : ""}
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
            {hiddeInfoGlobal && (
                <Box
                    display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 0.5fr 0.5fr',
                        lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr 1.6fr'
                    }}
                    gap={3}
                    mt={4}
                >
                    <Select
                        register={register}
                        nombre="Exportación"
                        url="http://31.220.31.152:8081/Catalogos/Exportacion"
                        clave="Clave"
                        descripcion="Exportación"
                    />
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
