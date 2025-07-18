"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert, Typography, Select as MuiSelect, FormHelperText } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { useRouter } from "next/navigation";
import { WithPermission } from '@/components/WithPermission';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
        const datos = {
            Clave: data.Nombre,
            Descripcion: "Serie " + data.Nombre,
            UltimoFolio: parseInt(data.Folio) - 1,
            TipoComprobante: data.TipoComprobante,
            TimbresDisponibles: 0,
            EmisorID: data.Empresa
        };
    
        try {
            const response = await fetch(`${apiUrl}/api/series/CrearSerie`, {
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
                setToast({ 
                    open: true, 
                    message: errorData.error || 'Error al guardar los datos', 
                    severity: 'error' 
                });
            } else {
                const result = await response.json();
                console.log('Guardado exitoso:', result);
                setToast({ 
                    open: true, 
                    message: 'Serie guardada exitosamente', 
                    severity: 'success' 
                });
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            setToast({ 
                open: true, 
                message: 'Ocurrió un error al guardar los datos', 
                severity: 'error' 
            });
        }
    };    
    
    return (
        <Box>
            <Typography variant="h6" mb={4}>Alta de Serie</Typography>
            <form>
                <Box
                    my={2}
                    display="grid"
                    gridTemplateColumns="1fr 1fr 1fr 1fr"
                    gap={3}
                    alignItems="start"
                >

                    <Select
                        register={register}
                        nombre="Empresa"
                        label={"Empresa*"}
                        url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
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
                        url={`${apiUrl}/api/catalogos/Catalogos/TipoComprobante`}

                        clave="Clave"
                        descripcion="Descripcion"
                        fullWidth
                        onChange={e => setValue('TipoComprobante', JSON.parse(e.target.value))}
                        error={!!errors.TipoComprobante}
                        helperText={errors.TipoComprobante ? "Campo requerido" : ""}
                    />
                    <TextField
                        label="Nombre"
                        fullWidth
                        placeholder="Ingresa el nombre"
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
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} // Acepta solo números
                        onInput={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }} // Elimina caracteres no numéricos
                    />
                </Box>
                <WithPermission permission="crear_series">
                <Box
                    my={1}
                    mx={0}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                >
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px', backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
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
                </WithPermission>
            </form>
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}
