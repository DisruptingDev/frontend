import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

export default function AltaEmpresa({ onClose, issuerName, issuerRfc }) {
    const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm();
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    useEffect(() => {
        setValue("Nombre", issuerName);
        setValue("Rfc", issuerRfc);
    }, [issuerName, issuerRfc, setValue]);

    const validateAndSubmit = (data) => {
        if (!issuerName || !issuerRfc) {
            setSnackbarMessage('Se requiere subir el certificado CSD.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }
        handleSubmit(onSubmit)(data);
    };

    const onSubmit = async (data) => {
        const empresaData = {
            Emisor: {
                Rfc: data.Rfc,
                Nombre: data.Nombre,
                RegimenFiscal: data.RegimenFiscal,
                LugarExpedicion: data.LugarExpedicion,
            }
        };

        setLoading(true);

        try {
            const response = await fetch('http://31.220.31.152:8086/RegistroEmisor', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`, 
                },
                body: JSON.stringify(empresaData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                setSnackbarMessage('Error al guardar los datos.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            } else {
                setSnackbarMessage('Empresa guardada correctamente.');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                if (onClose) onClose();
            }
        } catch (error) {
            setSnackbarMessage('Ocurrió un error al guardar los datos.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
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
                    gridTemplateColumns="1.5fr 1fr 1.5fr 1fr"
                    gap={3}
                    alignItems="start"
                >
                    <TextField
                        label="Emisor"
                        fullWidth
                        margin="normal"
                        required
                        disabled
                        error={!!errors.Nombre}
                        helperText={errors.Nombre ? "Este campo es obligatorio" : ""}
                        {...register("Nombre", { required: true })}
                        onChange={(e) => setValue("Nombre", e.target.value)}
                        value={watch("Nombre", issuerName)}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <TextField
                        label="R.F.C."
                        fullWidth
                        margin="normal"
                        required
                        disabled
                        error={!!errors.Rfc}
                        helperText={errors.Rfc ? "Este campo es obligatorio" : ""}
                       register={register} // Pasa register como prop
                        onChange={(e) => setValue("Rfc", e.target.value)}
                        value={watch("Rfc", issuerRfc)}
                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <Select
                        nombre="RegimenFiscal"
                        url="http://31.220.31.152:8081/Catalogos/RegimenFiscal"
                        clave="Descripcion"
                        descripcion="Descripcion"
                        fullWidth
                        required
                        error={!!errors.RegimenFiscal}
                        helperText={errors.RegimenFiscal ? "Este campo es obligatorio" : ""}
                        register={register} // Pasa register como prop
                        onChange={(e) => setValue('RegimenFiscal', e.target.value)}
                        sx={{ alignSelf: 'start' }}
                    />
                    <TextField
                        label="Lugar Expedición"
                        fullWidth
                        placeholder="Ej: CDMX"
                        margin="normal"
                        required
                        error={!!errors.LugarExpedicion}
                        helperText={errors.LugarExpedicion ? "Este campo es obligatorio" : ""}
                        {...register("LugarExpedicion", { required: true })}
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
                        sx={{ width: '150px', backgroundColor: '#da0404'}}
                        type="button"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ width: '250px', backgroundColor:'#04b2ca' }}
                        type="button"
                        onClick={validateAndSubmit}
                        disabled={loading}
                    >
                        {loading ? "Guardando..." : "Guardar Empresa"}
                    </Button>
                </Box>
            </form>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                    }}
                    style={{ padding: '12px' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
