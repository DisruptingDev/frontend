"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert, Typography, FormControl, InputLabel, MenuItem, Select as MuiSelect, FormHelperText } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import Image from 'next/image';
import { useRouter } from "next/navigation";

export default function AltaSerie({ token }) {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const [selectedValue, setSelectedValue] = useState('');
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const router = useRouter(); // Inicializa el router
    const handleChange = (event) => {
        setSelectedValue(event.target.value);
    };
    const handleClose = () => {
        setToast({ ...toast, open: false });
    };


    const onSubmit = async (data) => {
        // Construir el objeto de datos como lo espera la API
        console.log(data);
        const datos = {
            Clave: data.Nombre,
            Descripcion: "Serie " + data.Nombre,
            UltimoFolio: parseInt(data.Folio) - 1,
            TipoComprobante: data.TipoComprobante,
            TimbresDisponibles: 0,
            EmisorID: data.Empresa
        }
        console.log("Formateo", datos);

        try {
            const response = await fetch('http://31.220.31.152:8089/CrearSerie', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(datos),
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al guardar:', errorData);
                setToast({ open: true, message: 'Error al guardar los datos', severity: 'error' });
            } else {
                const result = await response.json();
                console.log('Guardado exitoso:', result);
                setToast({ open: true, message: 'Serie guardada exitosamente', severity: 'success' });

            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            setToast({ open: true, message: 'Ocurrió un error al guardar los datos', severity: 'error' });
        }
    };
    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={4}>Alta de Serie</Typography>
            <form>
                <Box
                    my={2}
                    display="grid"
                    gridTemplateColumns="2fr 2fr 1fr 1fr 2fr"
                    gap={3}
                    alignItems="start"
                >

                    <Select
                        register={register}
                        nombre="Empresa"
                        label={"Empresa*"}
                        url="http://31.220.31.152:8081/Catalogos/Emisor"
                        id="ID"
                        clave=""
                        descripcion="Nombre"
                        fullWidth
                        onChange={e => setValue('Empresa', JSON.parse(e.target.value))}
                        error={!!errors.Empresa}
                        helperText={errors.Empresa ? "Campo requerido" : ""}
                    />
                    <Select
                        register={register}
                        nombre="TipoComprobante"
                        label={"Tipo Comprobante*"}
                        url="http://31.220.31.152:8081/Catalogos/TipoComprobante"

                        clave="Clave"
                        descripcion="Descripcion"
                        fullWidth
                        onChange={e => setValue('TipoComprobante', JSON.parse(e.target.value))}
                        error={!!errors.TipoComprobante}
                        helperText={errors.TipoComprobante ? "Campo requerido" : ""}
                    />
                    {/*                     
                    <FormControl fullWidth>
                        <InputLabel id="demo-simple-select-label">Tipo de Comprobante</InputLabel>
                        <MuiSelect
                        {...register("TipoComprobante", {
                            required: "Este campo es obligatorio",
                            onChange: handleChange 
                        })}
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={selectedValue}
                            label="Tipo de Comprobante"
                            onChange={handleChange}
                        >
                            <MenuItem value={"I"}>Ingreso</MenuItem>
                            
                        </MuiSelect>
                    </FormControl> */}

                    <TextField
                        label="Nombre"
                        fullWidth
                        placeholder="F"
                        margin="normal"
                        required
                        error={!!errors.Nombre}
                        helperText={errors.Nombre ? "Campo requerido" : ""}
                        {...register("Nombre", { required: true })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    <TextField
                        label="Folio Inicial"
                        fullWidth
                        placeholder="1"
                        margin="normal"
                        required
                        type="number" // Acepta solo valores numéricos
                        defaultValue={1} // El valor inicial será 1
                        error={!!errors.Folio}
                        helperText={errors.Folio ? "Campo requerido y mayor a 0" : ""}
                        {...register("Folio", {
                            required: "Campo requerido",
                            min: {
                                value: 1,
                                message: "El folio debe ser mayor o igual a 1" // Mensaje si el valor es menor a 1
                            }
                        })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                </Box>




                <Box
                    my={4}
                    mx={0}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                >
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px', backgroundColor: '#da0404' }}
                        type="button"
                        onClick={() => router.push("/Home")}
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
                        type="button"
                        onClick={handleSubmit(onSubmit)}

                    >
                        Guardar
                    </Button>
                </Box>
            </form>
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>


        </Box>
    );
}
