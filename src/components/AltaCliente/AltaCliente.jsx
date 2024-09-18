"use client"
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

export default function AltaCliente({ onClose }) {
    const { register, handleSubmit, setValue, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);

    const onSubmit = async (data) => {
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
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 
                },
                body: JSON.stringify(clienteData), // Enviar el objeto correctamente estructurado
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error('Error al guardar:', errorData);
                alert('Error al guardar los datos');
            } else {
                const result = await response.json();
                console.log('Guardado exitoso:', result);
                if (onClose) onClose(); 
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            alert('Ocurrió un error al guardar los datos');
        } finally {
            setLoading(false);
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
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
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
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                   <Select
                    register={register} // Pasa register como prop
                    nombre="RegimenFiscal"
                    url="http://31.220.31.152:8081/Catalogos/RegimenFiscal"
                    clave="Clave"
                    descripcion="Descripcion"
                    onChange={(e) => setValue('RegimenFiscal', e.target.value)}
                    error={!!errors.RegimenFiscal}
                    helperText={errors.RegimenFiscal ? "Este campo es obligatorio" : ""}
                    sx={{ alignSelf: 'start' }}
                />
                    <TextField
                        label="Domicilio Fiscal"
                        fullWidth
                        placeholder="Ej: CDMX"
                        margin="normal"
                        required
                        error={!!errors.DomicilioFiscal}
                        helperText={errors.DomicilioFiscal ? "Este campo es obligatorio" : ""}
                        {...register("DomicilioFiscal", { required: true })}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
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
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <TextField
                        label="Número exterior"
                        fullWidth
                        placeholder="Ej: 742"
                        margin="normal"
                        error={!!errors.NumeroExterior}
                        helperText={errors.NumeroExterior ? "Este campo es obligatorio" : ""}
                        {...register("NumeroExterior", { required: false })}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <TextField
                        label="Número interior"
                        fullWidth
                        placeholder="Ej: 5"
                        margin="normal"
                        error={!!errors.NumeroInterior}
                        helperText={errors.NumeroInterior ? "Este campo es obligatorio" : ""}
                        {...register("NumeroInterior", { required: false })}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <TextField
                        label="Colonia"
                        fullWidth
                        placeholder="Ej: Centro"
                        margin="normal"
                        error={!!errors.Colonia}
                        helperText={errors.Colonia ? "Este campo es obligatorio" : ""}
                        {...register("Colonia", { required: false })}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <TextField
                        label="Municipio"
                        fullWidth
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Municipio}
                        helperText={errors.Municipio ? "Este campo es obligatorio" : ""}
                        {...register("Municipio", { required: false })}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                     <TextField
                        label="Estado"
                        fullWidth
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Estado}
                        helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                        {...register("Estado", { required: false })}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
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
                <Box
                    my={4}
                    mx={20}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                >
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px' }}
                        type="button"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ width: '250px' }}
                        type="button"
                        onClick={handleSubmit(onSubmit)} // Llama manualmente a handleSubmit
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar Cliente"}
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
