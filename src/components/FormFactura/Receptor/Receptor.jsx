"use client";
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from "@/components/Select/Select.jsx";
import AltaCliente from "@/components/AltaCliente/AltaCliente"; // Importa el componente

export default function Receptor({ register, watch, lugarExpedicion, getValues }) {
    const [receptor, setReceptor] = useState();
    const [rfc, setRFC] = useState();
    const [hiddeInfoGlobal, setHiddeInfoGlobal] = useState(false);
    const [domicilioFiscal, setDomicilioFiscal] = useState("");
    const [openModal, setOpenModal] = useState(false); // Estado para controlar la visibilidad de la ventana modal

    useEffect(() => {
        if (receptor !== undefined) {
            let data = JSON.parse(receptor);
            if (data["Rfc"] !== "XAXX010101000") {
                setDomicilioFiscal(data["DomicilioFiscalReceptor"]);
                setHiddeInfoGlobal(false);
            } else {
                setDomicilioFiscal(lugarExpedicion);
                setHiddeInfoGlobal(true);
            }
            setRFC(data["Rfc"]);
        }
    }, [receptor, lugarExpedicion]);

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
                    clave="Rfc"
                    descripcion="Nombre"
                    onChange={(e) => setReceptor(e.target.value)}
                />

                <TextField
                    label="RFC"
                    value={rfc || ""}
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                    disabled
                />

                <TextField
                    label="Domicilio Fiscal"
                    {...register("DomicilioFiscalReceptor")}
                    value={domicilioFiscal}
                    fullWidth
                    InputProps={{
                        readOnly: true,
                    }}
                    disabled
                />

                <Select
                    register={register}
                    nombre="RegimenFiscal"
                    url="http://31.220.31.152:8081/Catalogos/RegimenFiscal"
                    clave="Clave"
                    descripcion="Descripcion"
                />

                <Select
                    register={register}
                    nombre="MetodoPago"
                    url="http://31.220.31.152:8081/Catalogos/MetodoPago"
                    clave="Clave"
                    descripcion="Descripcion"
                />

                <Select
                    register={register}
                    nombre="FormaPago"
                    url="http://31.220.31.152:8081/Catalogos/FormaPago"
                    clave="Clave"
                    descripcion="Descripcion"
                />

                <Select
                    register={register}
                    nombre="UsoCFDI"
                    url="http://31.220.31.152:8081/Catalogos/UsoCFDI"
                    clave="Clave"
                    descripcion="Descripcion"
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
                    onClick={handleOpenModal} // Abre la ventana modal al hacer clic
                >
                    <AddCircleIcon sx={{ fontSize: '30px' }} />
                </Button>
            </Box>
            {hiddeInfoGlobal && ( // Solo muestra si "hiddeInfoGlobal" es true
                <Box
                    display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',                 // Una columna en pantallas extra pequeñas
                        sm: '1fr 1fr',             // Dos columnas en pantallas pequeñas
                        md: '1fr 0.5fr 0.5fr',     // Tres columnas en pantallas medianas
                        lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr 1.6fr'  // Configuración completa en pantallas grandes
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
                                e.target.value = value.slice(0, 4);  // Limita a 4 caracteres
                            }
                        }}
                    />

                </Box>
            )}
            <Dialog
                open={openModal}
                onClose={handleCloseModal}
                fullWidth
                maxWidth={false} // Desactiva el tamaño máximo predeterminado
                PaperProps={{
                    sx: {
                        width: '65%', // Ancho del 90%
                        margin: 'auto', // Centrar horizontalmente
                    }
                }}
            >
                <DialogTitle>Alta de Cliente</DialogTitle>
                <DialogContent>
                    <AltaCliente register={register} />
                </DialogContent>
                <DialogActions>
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px' }}
                        onClick={handleCloseModal}>
                        Cancelar
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ width: '250px' }} // Ajusta el ancho del botón
                        onClick={handleCloseModal}>
                        Guardar
                    </Button>

                </DialogActions>
            </Dialog>

        </Box>
    );
}
