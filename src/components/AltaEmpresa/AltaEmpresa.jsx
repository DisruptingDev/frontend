"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import Image from 'next/image';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AltaEmpresa({ onClose, issuerName, issuerRfc, empresa, editar, token, setActualizar }) {
    const { register, handleSubmit, setValue, getValues, formState: { errors }, watch, trigger } = useForm();
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imagePath, setImagePath] = useState('');

    const rfcValue = watch("Rfc"); // Observar el valor del RFC

    const [regimenFiscal, setRegimenFiscal] = useState('');

    useEffect(() => {
        console.log("cliente", empresa);
        if (empresa && Object.keys(empresa).length > 0) {
            // setEditar(true);
            console.log(empresa);
            //Rellena los campos con los datos del cliente
            setValue('Nombre', empresa.Nombre);
            setValue('Rfc', empresa.Rfc);
            setValue('RegimenFiscal', empresa.RegimenFiscal);
            setRegimenFiscal(empresa.RegimenFiscal);
            setValue('LugarExpedicion', empresa.LugarExpedicion);
            setValue('Calle', empresa.Calle);
            setValue('NumeroExterior', empresa.NumeroExterior);
            setValue('NumeroInterior', empresa.NumeroInterior);
            setValue('Colonia', empresa.Colonia);
            setValue('Municipio', empresa.Municipio);
            setValue('Estado', empresa.Estado);
            setImagePreview(empresa.LogoPath);

        }

    }, [empresa, setValue]);

    useEffect(() => {
        if (issuerName && issuerRfc) {
            setValue("Nombre", issuerName);
            setValue("Rfc", issuerRfc);
        }

    }, [issuerName, issuerRfc, setValue]);

    const validateAndSubmit = (data) => {
        // if (!issuerName || !issuerRfc) {
        console.log("Nombre", getValues("Nombre"));
        if (!getValues("Nombre") || !getValues("Rfc")) {
            console.log("Nombre", getValues("Nombre"));
            setSnackbarMessage('Se requiere subir el certificado CSD.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }
        handleSubmit(onSubmit)(data);
    };
    //Fuccion para reiniciar y cerrar si existe el onclose
    const handleReset = () => {

        console.log('Resetting form...', getValues("RegimenFiscal"));
        setValue("Nombre", "");
        setValue("Rfc", "");
        setValue("RegimenFiscal", "");
        setRegimenFiscal("");
        setValue("LugarExpedicion", "");
        setValue("Calle", "");
        setValue("NumeroExterior", "");
        setValue("NumeroInterior", "");
        setValue("Colonia", "");
        setValue("Municipio", "");
        setValue("Estado", "");
        setImage(null);
        setImagePreview('');
        setImagePath('');
        console.log('Resetting form...', getValues("RegimenFiscal"));
        if (onClose) onClose();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            // Crear vista previa de la imagen seleccionada
            setImage(file);
            setImagePreview(URL.createObjectURL(file));

            // Subir imagen al servidor para obtener la ruta
            const formData = new FormData();
            formData.append('logo', file);
            formData.append('rfcEmisor', rfcValue); // Añadir RFC al FormData

            try {
                const response = await fetch(`${apiUrl}/api/gestores/SubirLogo`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`, // Agrega el token en los encabezados
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Error al subir la imagen');
                }

                const result = await response.json();
                console.log('Ruta del archivo:', result.filePath);
                setImagePath(result.filePath); // Guardar la ruta de la imagen
                setSnackbarMessage('Imagen subida correctamente.');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
            } catch (error) {
                console.error('Error al subir la imagen:', error);
                setSnackbarMessage('Error al subir la imagen.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            }
        }
    };

    const handleRegimenFiscalChange = async (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setValue("RegimenFiscal", data.Clave);
            setRegimenFiscal(data.Clave);
        } catch (error) {

        }
    };

    const onSubmit = async (data) => {
        if (editar) {
            const empresaData = {

                // Rfc: data.Rfc,
                // Nombre: data.Nombre,
                ID: empresa.ID,
                RegimenFiscal: data.RegimenFiscal,
                LugarExpedicion: data.LugarExpedicion,
                LogoPath: imagePath, // Incluye la ruta de la imagen en los datos
                Calle: data.Calle || "",
                NumeroExterior: data.NumeroExterior || "",
                NumeroInterior: data.NumeroInterior || "",
                Colonia: data.Colonia || "",
                Municipio: data.Municipio || "",
                Estado: data.Estado || "",

            };
            console.log('EmpresaData:', JSON.stringify(empresaData));
            setLoading(true);

            try {
                const response = await fetch(`${apiUrl}/api/gestores/EditarEmisor`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(empresaData),
                });
                const data = await response.json(); // Obtén la respuesta JSON
                console.log('Data received from API:', data);
                if (!response.ok) {

                    setSnackbarMessage('Error al guardar los datos.');
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                } else {
                    setSnackbarMessage('Empresa guardada correctamente.');
                    setSnackbarSeverity('success');
                    setOpenSnackbar(true);
                    if(setActualizar)setActualizar(true);
                    setTimeout(() => {


                        if (onClose) onClose();
                        if(setActualizar)setActualizar(false);
                    }, 2000);
                }
            } catch (error) {
                setSnackbarMessage('Ocurrió un error al guardar los datos.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }


        }
        else {
            const empresaData = {
                Emisor: {
                    Rfc: data.Rfc,
                    Nombre: data.Nombre,
                    RegimenFiscal: data.RegimenFiscal,
                    LugarExpedicion: data.LugarExpedicion,
                    LogoPath: imagePath, // Incluye la ruta de la imagen en los datos
                    Calle: data.Calle || "",
                    NumeroExterior: data.NumeroExterior || "",
                    NumeroInterior: data.NumeroInterior || "",
                    Colonia: data.Colonia || "",
                    Municipio: data.Municipio || "",
                    Estado: data.Estado || "",
                }
            };
            console.log('EmpresaData:', JSON.stringify(empresaData));

            setLoading(true);

            try {
                const response = await fetch(`${apiUrl}/api/gestores/RegistroEmisor`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(empresaData),
                });
                const data = await response.json(); // Obtén la respuesta JSON
                console.log('Data received from API:', data);

                if (!response.ok) {

                    setSnackbarMessage('Error al guardar los datos.');
                    setSnackbarSeverity('error');
                    setOpenSnackbar(true);
                } else {
                    setSnackbarMessage('Empresa guardada correctamente.');
                    setSnackbarSeverity('success');
                    setOpenSnackbar(true);
                    if(setActualizar)setActualizar(true);
                    setTimeout(() => {


                        if (onClose) onClose();
                        if(setActualizar)setActualizar(false);
                    }, 2000);

                }
            } catch (error) {
                setSnackbarMessage('Ocurrió un error al guardar los datos.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
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
                        // onChange={(e) => setValue("Nombre", e.target.value)}
                        // value={watch("Nombre", issuerName)}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    {/* <TextField
                        label="Nombre del Cliente"
                        fullWidth
                        placeholder=""
                        margin="normal"
                        required
                        error={!!errors.Nombre}
                        helperText={errors.Nombre ? "Este campo es obligatorio" : ""}
                        {...register("Nombre", { required: true })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    /> */}
                    <TextField
                        label="R.F.C."
                        fullWidth
                        margin="normal"
                        required
                        disabled
                        error={!!errors.Rfc}
                        helperText={errors.Rfc ? "Este campo es obligatorio" : ""}
                        {...register("Rfc", { required: "El RFC es obligatorio" })} // Añadir validación requerida
                        // onChange={(e) => setValue("Rfc", e.target.value)}
                        // value={watch("Rfc", issuerRfc)}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    <Select
                        nombre="RegimenFiscal"
                        label={"Régimen Fiscal*"}
                        url={`${apiUrl}/api/catalogos/Catalogos/RegimenFiscal`}
                        clave="Clave"
                        descripcion="Descripcion"
                        fullWidth
                        required
                        value={regimenFiscal}
                        error={!!errors.RegimenFiscal}
                        helperText={errors.RegimenFiscal ? "Este campo es obligatorio" : ""}
                        register={register} // Pasa register como prop
                        onChange={handleRegimenFiscalChange}
                        sx={{ alignSelf: 'start' }}
                    />
                    <TextField
                        label="Lugar Expedición"
                        fullWidth
                        placeholder="Ej: 72000"
                        margin="normal"
                        required
                        error={!!errors.LugarExpedicion}
                        helperText={errors.LugarExpedicion ? "Este campo es obligatorio" : ""}
                        {...register("LugarExpedicion", { required: true })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
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
                        sx={{ alignSelf: 'start', margin: '0px' }}
                    />
                    <TextField
                        label="Número exterior"
                        fullWidth
                        placeholder="Ej: 742"
                        margin="normal"
                        error={!!errors.NumeroExterior}
                        helperText={errors.NumeroExterior ? "Este campo es obligatorio" : ""}
                        {...register("NumeroExterior", { required: false })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    <TextField
                        label="Número interior"
                        fullWidth
                        placeholder="Ej: 5"
                        margin="normal"
                        error={!!errors.NumeroInterior}
                        helperText={errors.NumeroInterior ? "Este campo es obligatorio" : ""}
                        {...register("NumeroInterior", { required: false })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    <TextField
                        label="Colonia"
                        fullWidth
                        placeholder="Ej: Centro"
                        margin="normal"
                        error={!!errors.Colonia}
                        helperText={errors.Colonia ? "Este campo es obligatorio" : ""}
                        {...register("Colonia", { required: false })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    <TextField
                        label="Municipio"
                        fullWidth
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Municipio}
                        helperText={errors.Municipio ? "Este campo es obligatorio" : ""}
                        {...register("Municipio", { required: false })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                    <TextField
                        label="Estado"
                        fullWidth
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Estado}
                        helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                        {...register("Estado", { required: false })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                </Box>

                {rfcValue && ( // Mostrar input de subir imagen solo si RFC tiene valor
                    <Box my={2}>
                        <Typography variant="h6">Subir Logo</Typography>
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <Box mt={2}>
                                <Image src={imagePreview} alt="Vista previa" width={120} height={70} />
                            </Box>
                        )}
                    </Box>
                )}

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
                        sx={{ width: '150px', backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
                        type="button"
                        onClick={handleReset}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            width: '250px', backgroundColor: '#04b2ca', '&:hover': {
                                backgroundColor: '#038a9e',
                            },
                        }}
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
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                        padding: '12px'
                    }}

                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
