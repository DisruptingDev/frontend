"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from "@/components/Select/Select.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente"; // Importa el componente
import { set } from 'date-fns';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Receptor({ register, watch, lugarExpedicion, getValues, trigger, errors, setValue, receptorData, token, disabled=false }) {
    const [receptor, setReceptor] = useState();
    const [metodoPago, setMetodoPago] = useState();
    const [usoCFDI, setUsoCFDI] = useState();
    const [formaPago, setFormaPago] = useState();
    const [rfc, setRFC] = useState();
    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState(false);
    const [domicilioFiscal, setDomicilioFiscal] = useState("");
    const [regimenFiscal, setRegimenFiscal] = useState("");
    const [usoCFDIURL, setUsoCFDIURL] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [isModalClosed, setIsModalClosed] = useState(false);  // Nuevo estado
    const [exportacion, setExportacion] = useState("01");

    // Reiniciar o recargar los datos del select cuando el modal se cierra
    useEffect(() => {
        if (isModalClosed) {
            setIsModalClosed(false);  // Resetea el estado
            // Aquí puedes agregar cualquier lógica adicional si necesitas resetear más cosas
        }
    }, [isModalClosed]);

    useEffect(() => {
        if (receptorData) {
            console.log("Receptor data", receptorData);
            setValue("ReceptorID", receptorData.ID);
            setValue("Receptor",receptorData.ID);
            setRFC(receptorData.Rfc);
            setValue("RFCReceptor", receptorData.Rfc);
            setValue("NombreReceptor", receptorData.Nombre);
            setValue("Calle", receptorData.Calle);
            setValue("NoExterior", receptorData.NoExterior);
            setValue("NoInterior", receptorData.NoInterior);
            setValue("Colonia", receptorData.Colonia);
            setValue("Municipio", receptorData.Municipio);
            setValue("Estado", receptorData.Estado);

            setDomicilioFiscal(receptorData.DomicilioFiscalReceptor);
            setValue("DomicilioFiscalReceptor", receptorData.DomicilioFiscalReceptor);
            setRegimenFiscal(receptorData.RegimenFiscal);
            setValue("RegimenFiscal", receptorData.RegimenFiscal);
            // setFormaPago(receptorData.FormaPago);
            setValue("FormaPago", receptorData.FormaPago);
            setValue("FormaPagoDescripcion", receptorData.FormaPagoDescripcion);
            // setMetodoPago(receptorData.MetodoPago);
            setValue("MetodoPago", receptorData.MetodoPago);
            setValue("MetodoPagoDescripcion", receptorData.MetodoPagoDescripcion);
            // setUsoCFDI(receptorData.UsoCFDI);
            setValue("UsoCFDI", receptorData.UsoCFDI);
            setValue("UsoCFDIDescripcion", receptorData.UsoCFDIDescripcion);

            
            if (rfc === "XAXX010101000") {
                
                setValue("Año", receptorData.InformacionGlobal.Año);
                setValue("Meses", receptorData.InformacionGlobal.Meses);
                setValue("Periodicidad", receptorData.InformacionGlobal.Periodicidad);

                setHiddeInfoGlobal(true);
                setDomicilioFiscal(lugarExpedicion);
                setValue("DomicilioFiscalReceptor", lugarExpedicion);
                setRegimenFiscal("616");
                setValue("RegimenFiscal", "616");
                setHiddeInfoGlobal(true);
              
            } else {
                setHiddeInfoGlobal(false);
            }
            setUsoCFDIURL(`${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${regimenFiscal}`);

            trigger("RFCReceptor");
            trigger("DomicilioFiscalReceptor");
            trigger("RegimenFiscal");
        }
    }, [receptorData, setValue, trigger, getValues, rfc, lugarExpedicion]);

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
                setValue("DomicilioFiscalReceptor", lugarExpedicion);
                setRegimenFiscal("616");
                setValue("RegimenFiscal", "616");
                
                setHiddeInfoGlobal(true);
            }
            // setUsoCFDI("");
            setValue("UsoCFDI", "");
            setValue("UsoCFDIDescripcion", "");
            setUsoCFDIURL(`${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${regimenFiscal}`);

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
    }, [receptor, lugarExpedicion, trigger, setValue, rfc]);

    useEffect(() => {
        if (metodoPago !== undefined) {
            let data = JSON.parse(metodoPago);
            setValue("MetodoPagoDescripcion", data["Descripcion"]);
            console.log("Forma de pago", data["Clave"]);
            if(data["Clave"]==="PPD"){
                console.log("Forma de pago", data["Clave"]);
                setValue("FormaPago", 99);
                trigger("FormaPago");
            }
           
        }
    }, [metodoPago, setValue, trigger])

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


    useEffect(() => {
        async function fetchData() {
            if (regimenFiscal) {
                console.log("REGIMEN", token);
                // const token = localStorage.getItem('authToken');
                fetch(`${apiUrl}/api/catalogos/Catalogos/RegimenFiscal`, {
                    // method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    console.log(data);
                    // console.log("TIPO", impuestoEditor.TipoFactor);
                    
                  const opcionSeleccionada = data.find(opt => opt.Clave == regimenFiscal);
                  if (opcionSeleccionada) {
                   setRegimenFiscal(opcionSeleccionada.Clave + " - " + opcionSeleccionada.Descripcion);
                }
                    
                  

                  // setValue(`impuestos[${index}].ImpuestoClave`, data[0].TasaOCuota || 0);
                })

            }
        }
        fetchData();
    }, [regimenFiscal]);

    const handleOpenModal = () => {
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setIsModalClosed(true);
        
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
                    lg: '1fr 0.6fr 0.3fr 0.8fr 1.1fr 0.2fr' //4.5
                }}
                gap={3}
            >
                <Select
                    register={register}
                    nombre="Receptor"
                    url={`${apiUrl}/api/catalogos/Catalogos/Receptor`}
                    id="ID"
                    descripcion="Nombre"
                    onChange={(e) => setReceptor(e.target.value)}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                    value={getValues("ReceptorID") || ""}
                    reset={isModalClosed}  // Pasa el estado al componente Select
                    disabled={disabled}
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
                    url={`${apiUrl}/api/catalogos/Catalogos/MetodoPago`}
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.MetodoPago}
                    helperText={errors.MetodoPago ? "Este campo es obligatorio" : ""}
                    onChange={(e) => {
                        setMetodoPago(e.target.value);
                    }}
                    value={getValues("MetodoPago") || ""}
                    disabled={disabled}
                    

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
                    disabled={disabled}
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
                    url={`${apiUrl}/api/catalogos/Catalogos/FormaPago`}
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.FormaPago}
                    helperText={errors.FormaPago ? "Este campo es obligatorio" : ""}
                    onChange={(e) => setFormaPago(e.target.value)}
                    value={getValues("FormaPago") || ""}
                    disabled={disabled}
                />

                <Select
                    register={register}
                    nombre="UsoCFDI"
                    // url="`${apiUrl}/Catalogos/UsoCFDI"
                    url={usoCFDIURL}
                    clave="Clave"
                    descripcion="Descripcion"
                    error={!!errors.UsoCFDI}
                    helperText={errors.UsoCFDI ? "Este campo es obligatorio" : ""}
                    onChange={(e) => setUsoCFDI(e.target.value)}
                    value={getValues("UsoCFDI") || ""}
                    disabled={disabled}
                />
                <Select
                        // register={register}
                        nombre="Exportación"
                       url={`${apiUrl}/api/catalogos/Catalogos/Exportaciones`}
                        clave="Clave"
                        value={exportacion}
                        descripcion="Descripcion"
                        disabled={disabled}
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
                        url={`${apiUrl}/api/catalogos/Catalogos/Periodicidad`}
                        clave="Clave"
                        descripcion="Descripcion"
                        error={!!errors.Periodicidad}
                        helperText={errors.Periodicidad ? "Este campo es obligatorio" : ""}
                        value={getValues("Periodicidad") || ""}
                    />

                    <Select
                        register={register}
                        nombre="Meses"
                        url={`${apiUrl}/api/catalogos/Catalogos/PeriodicidadMeses`}
                        clave="Clave"
                        descripcion="Descripcion"
                        error={!!errors.Meses}
                        helperText={errors.Meses ? "Este campo es obligatorio" : ""}
                        value={getValues("Meses") || ""}
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
            {/* <pre> {JSON.stringify(getValues("FormaPago"),null,2)}</pre>  */}
        </Box>
         
    );
}
