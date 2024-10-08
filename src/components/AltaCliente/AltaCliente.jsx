"use client"
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { set } from 'date-fns';

export default function AltaCliente({ onClose, cliente, setActualizar, token }) {
    const { register, getValues, reset, handleSubmit, setValue, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [editar, setEditar] = useState(false);


    useEffect(() => {
        console.log("cliente", cliente);
        if (cliente && Object.keys(cliente).length > 0) {
            setEditar(true);
            console.log(cliente);
            //Rellena los campos con los datos del cliente
            setValue('Nombre', cliente.Nombre);
            setValue('Rfc', cliente.Rfc);
            setValue('RegimenFiscal', cliente.RegimenFiscalReceptor);
            setValue('DomicilioFiscal', cliente.DomicilioFiscalReceptor);
            setValue('Calle', cliente.Calle);
            setValue('NumeroExterior', cliente.NumeroExterior);
            setValue('NumeroInterior', cliente.NumeroInterior);
            setValue('Colonia', cliente.Colonia);
            setValue('Municipio', cliente.Municipio);
            setValue('Estado', cliente.Estado);

        }

    }, [cliente, reset, setValue]);
    const handleClose = () => {
        setToast({ ...toast, open: false });
    };
    const handleCancelar = () => {
        //Resetea los campos del formulario

        onClose();
        reset();

    };

    const onSubmit = async (data) => {
        console.log(editar);
        if (!editar) {
            console.log("entro registro");

            // Construir el objeto de datos como lo espera la API
            const clienteData = {
                Receptor: {
                    Rfc: data.Rfc,
                    Nombre: data.Nombre,
                    RegimenFiscalReceptor: data.RegimenFiscal,
                    DomicilioFiscalReceptor: data.DomicilioFiscal,
                    Calle: data.Calle,
                    NumeroExterior: parseInt(data.NumeroExterior, 10), // Convertir a número si es necesario
                    NumeroInterior: parseInt(data.NumeroInterior, 10), // Convertir a número si es necesario
                    Colonia: data.Colonia,
                    Municipio: data.Municipio,
                    Estado: data.Estado,
                }
            };


            setLoading(true);

            try {
                const response = await fetch('http://31.220.31.152:8086/RegistroReceptor', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(clienteData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error al guardar:', errorData);
                    const error = "Error al guardar los datos: "+ errorData.message;
                    console.log(error);
                    setToast({ open: true, message: error , severity: 'error' });
                } else {
                    const result = await response.json();
                    console.log('Guardado exitoso:', result);
                    setToast({ open: true, message: 'Cliente guardado exitosamente', severity: 'success' });
                    if(setActualizar)setActualizar(true);
                    setTimeout(() => {
                        reset();
                        
                        if (onClose) onClose();
                        if(setActualizar)setActualizar(false);
                    }, 2000);
                }
            } catch (error) {
                console.error('Error en la solicitud:', error);
                setToast({ open: true, message: 'Ocurrió un error al guardar los datos', severity: 'error' });
            } finally {
                setLoading(false);
            }
        }
        else {
            // Construir el objeto de datos como lo espera la API
            const clienteData = {
                ID: cliente.ID,                            // Integer
                Rfc: data.Rfc,              // String
                Nombre: data.Nombre,    // String
                RegimenFiscalReceptor: data.RegimenFiscal,      // String (es un código fiscal)
                DomicilioFiscalReceptor: data.DomicilioFiscal,  // String (es un código postal)
                ResidenciaFiscal: "",              // String (puede ser vacío si no aplica)
                NumRegIdTrib: "",                  // String (puede ser vacío si no aplica)
                UsoCFDI: "",                       // String (puede ser vacío si no aplica)
                Calle: data.Calle,               // String
                NumeroExterior: data.NumeroExterior,              // String (en algunos casos puede ser alfanumérico)
                NumeroInterior: data.NumeroInterior,               // String (en algunos casos puede ser alfanumérico)
                Colonia: data.Colonia,         // String
                Municipio: data.Municipio,       // String
                Estado: data.Estado         // String
            };
            try {
                const response = await fetch('http://31.220.31.152:8086/EditarReceptor ', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(clienteData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Error al guardar:', errorData);
                    setToast({ open: true, message: 'Error al guardar los datos', severity: 'error' });
                } else {
                    const result = await response.json();
                    console.log('Guardado exitoso:', result);
                    setToast({ open: true, message: 'Cliente guardado exitosamente', severity: 'success' });
                   //Depues de un tiempo resetea los campos del formulario
                   if(setActualizar)setActualizar(true);
                    setTimeout(() => {
                        reset();
                        
                        if (onClose) onClose();
                        if(setActualizar)setActualizar(false);
                    }, 2000);
                 
                }
            } catch (error) {
                console.error('Error en la solicitud:', error);
                setToast({ open: true, message: 'Ocurrió un error al guardar los datos', severity: 'error' });
            } finally {
                setLoading(false);
            }
        }

    };

    return (
        <Box bgcolor="white">
            <form>
                <Box
                    my={2}
                    display="grid"
                    gridTemplateColumns="1.5fr 1fr 1.5fr 1fr "
                    gap={3}
                    alignItems="start"
                >
                    <TextField
                        label="Nombre del Cliente"
                        fullWidth
                        placeholder=""
                        margin="normal"
                        required
                        error={!!errors.Nombre}
                        helperText={errors.Nombre ? "Este campo es obligatorio" : ""}
                        {...register("Nombre", { required: true })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <TextField
                        label="R.F.C."
                        fullWidth
                        placeholder="EDS156842456"
                        margin="normal"
                        required
                        error={!!errors.Rfc}
                        helperText={errors.Rfc ? "Este campo es obligatorio" : ""}
                        {...register("Rfc", { required: true })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <Select
                        register={register} // Pasa register como prop
                        label={"Regimen Fiscal*"}
                        nombre="RegimenFiscal"
                        url="http://31.220.31.152:8081/Catalogos/RegimenFiscal"
                        clave="Clave"
                        descripcion="Descripcion"
                        onChange={(e) => setValue('RegimenFiscal', e.target.value)}
                        error={!!errors.RegimenFiscal}
                        helperText={errors.RegimenFiscal ? "Este campo es obligatorio" : ""}
                        sx={{ alignSelf: 'start' }}
                        value={cliente ? cliente.RegimenFiscalReceptor : ""}
                    />
                    <TextField
                        label="Domicilio Fiscal"
                        fullWidth
                        placeholder="Ej: 72000"
                        margin="normal"
                        required
                        error={!!errors.DomicilioFiscal}
                        helperText={errors.DomicilioFiscal ? "Este campo es obligatorio" : ""}
                        {...register("DomicilioFiscal", { required: true })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} // Acepta solo números
                        onInput={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }} // Elimina caracteres no numéricos
                    />
                </Box>
                <Box
                    my={2}
                    display="grid"
                    gridTemplateColumns="0.7fr 0.4fr 0.4fr 0.4fr 0.4fr 0.7fr "
                    gap={3}
                    alignItems="end"
                >
                    <TextField
                        label="Calle"
                        fullWidth
                        placeholder="Ej: Av. Siempre Viva"
                        margin="normal"
                        error={!!errors.Calle}
                        helperText={errors.Calle ? "Este campo es obligatorio" : ""}
                        {...register("Calle", { required: false })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <TextField
                        label="Número exterior"
                        fullWidth
                        placeholder="Ej: 742"
                        margin="normal"
                        error={!!errors.NumeroExterior}
                        helperText={errors.NumeroExterior ? "Este campo es obligatorio" : ""}
                        {...register("NumeroExterior", { required: false })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <TextField
                        label="Número interior"
                        fullWidth
                        placeholder="Ej: 5"
                        margin="normal"
                        error={!!errors.NumeroInterior}
                        helperText={errors.NumeroInterior ? "Este campo es obligatorio" : ""}
                        {...register("NumeroInterior", { required: false })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <TextField
                        label="Colonia"
                        fullWidth
                        placeholder="Ej: Centro"
                        margin="normal"
                        error={!!errors.Colonia}
                        helperText={errors.Colonia ? "Este campo es obligatorio" : ""}
                        {...register("Colonia", { required: false })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <TextField
                        label="Municipio"
                        fullWidth
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Municipio}
                        helperText={errors.Municipio ? "Este campo es obligatorio" : ""}
                        {...register("Municipio", { required: false })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    <TextField
                        label="Estado"
                        fullWidth
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Estado}
                        helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                        {...register("Estado", { required: false })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />
                    {/* <Select
                        nombre="Estado"
                        url="http://31.220.31.152:8081/Catalogos/Estados"
                        clave="Nombre"
                        descripcion="Nombre"
                        fullWidth
                        error={!!errors.Estado}
                        helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                        {...register("Estado", { required: true })}
                        onChange={(e) => setValue('Estado', e.target.value)}
                    /> */}
                </Box>
                <Box my={4} display="flex" justifyContent="flex-end" gap={3}>
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px', backgroundColor: '#da0404' }}
                        type="button"
                        onClick={handleCancelar}
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
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar Cliente"}
                    </Button>
                </Box>
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
