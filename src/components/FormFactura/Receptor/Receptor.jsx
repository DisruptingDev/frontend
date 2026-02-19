"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from "@/components/Select/Select.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente"; // Importa el componente
import AutocompleteReceptor from "@/components/Autocompletes/AutocompleteReceptor";
import { set } from 'date-fns';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Receptor({ register, watch, lugarExpedicion, getValues, trigger, errors, setValue, receptorData, token, disabled = false, setReceptorID, data }) {
    const [receptor, setReceptor] = useState();
    const [metodoPago, setMetodoPago] = useState();
    const [usoCFDI, setUsoCFDI] = useState();
    const [formaPago, setFormaPago] = useState();
    const [rfc, setRFC] = useState();
    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState(false);
    const [domicilioFiscal, setDomicilioFiscal] = useState("");
    const [regimenFiscal, setRegimenFiscal] = useState("");
    const [regimenFiscalText, setRegimenFiscalText] = useState("");
    const [usoCFDIURL, setUsoCFDIURL] = useState("");
    const [openModal, setOpenModal] = useState(false);
    const [isModalClosed, setIsModalClosed] = useState(false);  // Nuevo estado
    const [exportacion, setExportacion] = useState("01");
    const [dataReceptor, setDataReceptor] = useState(data || {});

    // Reiniciar o recargar los datos del select cuando el modal se cierra
    useEffect(() => {
        if (isModalClosed) {
            setIsModalClosed(false);  // Resetea el estado
            // Aquí puedes agregar cualquier lógica adicional si necesitas resetear más cosas
        }
    }, [isModalClosed]);

    useEffect(() => {
        if (receptorData) {
            setValue("ReceptorID", receptorData.ID);
            setValue("Receptor", receptorData.ID);
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

            // Notificar al padre el ID del receptor
            if (setReceptorID) {
                setReceptorID(receptorData.ID);
            }

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

            trigger(["RFCReceptor", "DomicilioFiscalReceptor", "RegimenFiscalReceptor"]);
        }
    }, [receptorData, setValue, trigger, getValues, rfc, lugarExpedicion, setReceptorID]);

    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setReceptor(data); // tu estado local

            // Actualiza el valor en el formulario
            setValue("Receptor", data.ID);
            setValue("ReceptorID", data.ID);

            if (setReceptorID) {
                setReceptorID(data.ID);
            }
        } catch (error) {
            console.error("El valor de receptor no es un JSON válido:", e.target.value);
        }
    };

    useEffect(() => {
        if (receptor !== undefined) {
            let data = receptor;
            // Notificar al padre el ID del receptor
            if (setReceptorID) {
                setReceptorID(data.ID);
            }

            // Actualizar los valores del formulario
            setValue("Receptor", data.ID);
            setValue("ReceptorID", data.ID);
            
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

            // Dispara la validación de estos campos
            trigger("RFCReceptor");
            trigger("DomicilioFiscalReceptor");
            trigger("RegimenFiscal");

        }
    }, [receptor, lugarExpedicion, trigger, setValue, rfc, setReceptorID]);

    useEffect(() => {
        if (metodoPago !== undefined) {
            let data = JSON.parse(metodoPago);
            setValue("MetodoPagoDescripcion", data["Descripcion"]);
            if (data["Clave"] === "PPD") {
                setValue("FormaPago", "99");
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
                fetch(`${apiUrl}/api/catalogos/Catalogos/RegimenFiscal`, {
                    // method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        const opcionSeleccionada = data.find(opt => opt.Clave == regimenFiscal);
                        if (opcionSeleccionada) {
                            setRegimenFiscalText(opcionSeleccionada.Clave + " - " + opcionSeleccionada.Descripcion);
                        }
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
        <Box bgcolor="white" mx={4} p={4} boxShadow={3} borderRadius={2}
            sx={{ padding: '1rem', margin: 'auto', marginTop: '1rem', marginBottom: '1rem', }}>
            <Typography variant="h6" mb={4}>Datos del Receptor</Typography>

            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: '1fr 0.5fr 0.5fr 0.5fr 1.1fr 0.2fr' //4.5
                }}
                gap={3}
            >

                <AutocompleteReceptor
                    nombre="Receptor"
                    label="Receptor"
                    url={`${apiUrl}/api/catalogos/Catalogos/Receptor`}
                    id="ID"
                    clave=""
                    descripcion="Nombre"
                    register={register}
                    setValue={setValue}
                    value={getValues("Receptor")}
                    onChange={handleReceptorChange}
                    error={!!errors.Receptor}
                    helperText={errors.Receptor ? "Este campo es obligatorio" : ""}
                    onAddNewOption={(searchTerm) => handleOpenModal(searchTerm)} // Función para abrir el modal
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
                    {...register("RegimenFiscal" || "616", { required: "Este campo es obligatorio." })}
                    value={regimenFiscalText}
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
                    token={token}
                >
                    <AddCircleIcon sx={{ fontSize: '30px' }} />
                </Button>
            </Box>

            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: '1fr 1fr 1fr 3fr'
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
                    <AltaCliente register={register} token={token} onClose={handleCloseModal} />
                </DialogContent>
            </Dialog>
            {/* <pre> {JSON.stringify(usoCFDIURL,null,2)}</pre>   */}
            {/* <pre> {JSON.stringify(getValues("Ser"),null,2)}</pre>   */}
        </Box>

    );
}