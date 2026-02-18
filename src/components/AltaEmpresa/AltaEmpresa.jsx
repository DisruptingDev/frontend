"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import {
    Button,
    TextField,
    Box,
    Snackbar,
    Alert,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardActionArea,
    Dialog,
    DialogContent,
    IconButton,
    Accordion,
    AccordionSummary,
    AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Select from "@/components/Select/Select.jsx";
import Image from 'next/image';
import { WithPermission } from '@/components/WithPermission';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import FileInput from "@/components/FileInput/FileInput";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AltaEmpresa({ onClose, issuerName, issuerRfc, empresa, editar, token, setActualizar, setRegistroEmpresa, btnCancelar }) {
    const { register, handleSubmit, setValue, getValues, formState: { errors }, watch } = useForm();
    const [loading, setLoading] = useState(false);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [imagePath, setImagePath] = useState('');
    const [regimenFiscal, setRegimenFiscal] = useState('');

    // Estados para las plantillas
    const [plantillas, setPlantillas] = useState([]);
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [imagenModal, setImagenModal] = useState('');

    const rfcValue = watch("Rfc");

    useEffect(() => {
        if (empresa && Object.keys(empresa).length > 0) {
            setValue('Nombre', empresa.Nombre);
            setValue('Rfc', empresa.Rfc);
            setValue('RegimenFiscal', empresa.RegimenFiscal);
            setRegimenFiscal(empresa.RegimenFiscal);
            setValue('LugarExpedicion', empresa.LugarExpedicion);
            setValue('Email', empresa.Email);
            setValue('Calle', empresa.Calle);
            setValue('NumeroExterior', empresa.NumeroExterior);
            setValue('NumeroInterior', empresa.NumeroInterior);
            setValue('Colonia', empresa.Colonia);
            setValue('Municipio', empresa.Municipio);
            setValue('Estado', empresa.Estado);
            setImagePreview(empresa.LogoPath);

            if (empresa.PlantillaID) {
                setPlantillaSeleccionada(empresa.PlantillaID);
            }
        }
    }, [empresa, setValue]);

    useEffect(() => {
        if (issuerName && issuerRfc) {
            setValue("Nombre", issuerName);
            setValue("Rfc", issuerRfc);
        }
    }, [issuerName, issuerRfc, setValue]);

    useEffect(() => {
        cargarPlantillas();
    }, []);

    const cargarPlantillas = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Plantillas`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPlantillas(data);
            }
        } catch (error) {
            console.error('Error al cargar plantillas:', error);
        }
    };

    const handleSeleccionarPlantilla = (plantilla) => {
        setPlantillaSeleccionada(plantilla.ID);
        setValue('PlantillaID', plantilla.ID);
    };

    const handleVerImagen = (imagenUrl) => {
        setImagenModal(imagenUrl);
        setModalOpen(true);
    };

    const handleCerrarModal = () => {
        setModalOpen(false);
        setImagenModal('');
    };

    const validateAndSubmit = (data) => {
        if (!getValues("Nombre") || !getValues("Rfc")) {
            setSnackbarMessage('Se requiere subir el certificado CSD.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return;
        }
        handleSubmit(onSubmit)(data);
    };

    const handleReset = () => {
        setValue("Nombre", "");
        setValue("Rfc", "");
        setValue("RegimenFiscal", "");
        setRegimenFiscal("");
        setValue("LugarExpedicion", "");
        setValue("Email", "");
        setValue("Calle", "");
        setValue("NumeroExterior", "");
        setValue("NumeroInterior", "");
        setValue("Colonia", "");
        setValue("Municipio", "");
        setValue("Estado", "");
        setImage(null);
        setImagePreview('');
        setImagePath('');
        setPlantillaSeleccionada(null);
        if (onClose) onClose();
    };

    const handleImageChange = async (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));

            const formData = new FormData();
            formData.append('logo', file);
            formData.append('rfcEmisor', rfcValue);

            try {
                const response = await fetch(`${apiUrl}/api/gestores/SubirLogo`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                    body: formData,
                });

                if (!response.ok) {
                    throw new Error('Error al subir la imagen');
                }

                const result = await response.json();
                setImagePath(result.filePath);
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
            // Manejar error
        }
    };

    const onSubmit = async (data) => {
        const commonData = {
            RegimenFiscal: data.RegimenFiscal,
            LugarExpedicion: data.LugarExpedicion,
            Email: data.Email,
            LogoPath: imagePath,
            Calle: data.Calle || "",
            NumeroExterior: data.NumeroExterior || "",
            NumeroInterior: data.NumeroInterior || "",
            Colonia: data.Colonia || "",
            Municipio: data.Municipio || "",
            Estado: data.Estado || "",
            PlantillaID: plantillaSeleccionada,
        };

        setLoading(true);

        try {
            let response;
            if (editar) {
                const empresaData = {
                    ID: empresa.ID,
                    ...commonData
                };
                response = await fetch(`${apiUrl}/api/gestores/EditarEmisor`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(empresaData),
                });
            } else {
                const empresaData = {
                    Emisor: {
                        Rfc: data.Rfc,
                        Nombre: data.Nombre,
                        ...commonData
                    }
                };
                response = await fetch(`${apiUrl}/api/gestores/RegistroEmisor`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`,
                    },
                    body: JSON.stringify(empresaData),
                });
            }

            if (!response.ok) {
                setSnackbarMessage('Error al guardar los datos.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            } else {
                setSnackbarMessage('Empresa guardada correctamente.');
                setSnackbarSeverity('success');
                setOpenSnackbar(true);
                if (setActualizar) setActualizar(true);
                setTimeout(() => {
                    if (setRegistroEmpresa) setRegistroEmpresa(true);
                    if (onClose) onClose();
                    if (setActualizar) setActualizar(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Error al guardar los datos:', error);
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
                    gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "1.5fr 1fr 1.5fr 1fr" }}
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
                        value={watch("Nombre", issuerName)}
                        InputLabelProps={{ shrink: true }}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />

                    <TextField
                        label="R.F.C."
                        fullWidth
                        margin="normal"
                        required
                        disabled
                        error={!!errors.Rfc}
                        helperText={errors.Rfc ? "Este campo es obligatorio" : ""}
                        {...register("Rfc", { required: "El RFC es obligatorio" })}
                        value={watch("Rfc", issuerRfc)}
                        InputLabelProps={{ shrink: true }}
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
                        inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                        onInput={(e) => {
                            e.target.value = e.target.value.replace(/[^0-9]/g, '');
                        }}
                    />
                    <TextField
                        label="Email"
                        fullWidth
                        placeholder="Ej: ejemplo@correo.com"
                        margin="normal"
                        required
                        error={!!errors.Email}
                        helperText={errors.Email ? "Este campo es obligatorio" : ""}
                        {...register("Email", {
                            required: "El email es obligatorio",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Formato de email inválido"
                            }
                        })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                </Box>
                <Accordion sx={{ mt: 2 }}>
                    <AccordionSummary
                        expandIcon={<ExpandMoreIcon />}
                        aria-controls="panel1a-content"
                        id="panel1a-header"
                    >
                        <Typography>Dirección</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                        <Box
                            display="grid"
                            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "0.7fr 0.4fr 0.4fr 0.4fr 0.4fr 0.7fr" }}
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
                                label="Municipio / Alcaldía"
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
                                placeholder="Ej: CDMX"
                                margin="normal"
                                error={!!errors.Estado}
                                helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                                {...register("Estado", { required: false })}
                                sx={{ alignSelf: 'start', marginTop: '0px' }}
                            />
                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Box my={2}>
                    <WithPermission permission="subir_logo">
                        {/* <Typography variant="h6">Subir Logo</Typography> */}
                        <FileInput
                            name="Subir Logo"
                            accept="image/"
                            onChange={handleImageChange}
                        />
                        {imagePreview && (
                            <Box mt={2}>
                                <img src={imagePreview} alt="Vista previa" width={120} height={70} />
                            </Box>
                        )}
                    </WithPermission>
                </Box>

                <Box my={4}>
                    <Typography variant="h6" gutterBottom>
                        Seleccionar Plantilla
                    </Typography>

                    <Grid container spacing={2} columns={{ xs: 2, sm: 8, md: 12, lg: 10 }}>
                        {plantillas.map((plantilla) => {
                            const isSelected = plantilla.ID === plantillaSeleccionada;

                            return (
                                <Grid item xs={2} sm={4} md={4} lg={2} key={plantilla.ID}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            p: 1,
                                            height: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            borderRadius: 2,
                                            border: isSelected ? '2px solid #04b2ca' : '1px solid #e0e0e0',
                                            backgroundColor: isSelected ? '#f0fafa' : 'white',
                                            transition: 'all 0.2s',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                boxShadow: 2
                                            }
                                        }}
                                    >
                                        <Typography variant="subtitle2" fontWeight="bold" align="center" noWrap title={plantilla.Nombre} gutterBottom>
                                            {plantilla.Nombre}
                                        </Typography>

                                        <CardActionArea
                                            onClick={() => handleVerImagen(plantilla.VistaPrevia)}
                                            sx={{ borderRadius: 1, flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}
                                        >
                                            <CardMedia
                                                component="img"
                                                height="120"
                                                image={plantilla.VistaPrevia || '/placeholder-image.jpg'}
                                                alt={plantilla.Nombre}
                                                sx={{
                                                    objectFit: 'contain',
                                                    borderRadius: 1,
                                                }}
                                            />
                                        </CardActionArea>

                                        <Box mt="auto" display="flex" flexDirection="column" gap={1}>
                                            <Box display="flex" justifyContent="center" gap={1}>
                                                <Button
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleVerImagen(plantilla.VistaPrevia)}
                                                    sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                                                >
                                                    Ver
                                                </Button>

                                                {isSelected ? (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="success"
                                                        sx={{ fontSize: '0.7rem', px: 1 }}
                                                        disabled
                                                    >
                                                        Seleccionada
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleSeleccionarPlantilla(plantilla)}
                                                        sx={{
                                                            fontSize: '0.7rem',
                                                            backgroundColor: '#04b2ca',
                                                            '&:hover': { backgroundColor: '#038a9e' },
                                                            px: 1
                                                        }}
                                                    >
                                                        Seleccionar
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>

                <Box
                    my={4}
                    mx={0}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                    flexDirection={{ xs: "column", sm: "row" }}
                >
                    {btnCancelar == true && (
                        <Button
                            variant="contained"
                            color="error"
                            sx={{ width: { xs: '100%', sm: '150px' }, backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
                            type="button"
                            onClick={handleReset}
                        >
                            Cancelar
                        </Button>
                    )}

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            width: { xs: '100%', sm: '250px' }, backgroundColor: '#04b2ca', '&:hover': {
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

            <Dialog
                open={modalOpen}
                onClose={handleCerrarModal}
                maxWidth="lg"
                fullWidth
            >
                <DialogContent sx={{ position: 'relative', p: 0 }}>
                    <IconButton
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                            color: 'white',
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            '&:hover': {
                                backgroundColor: 'rgba(0,0,0,0.7)',
                            },
                            zIndex: 1
                        }}
                        onClick={handleCerrarModal}
                    >
                        <CloseIcon />
                    </IconButton>
                    {imagenModal && (
                        <img
                            src={imagenModal}
                            alt="Vista previa completa"
                            style={{ width: '100%', height: 'auto', display: 'block' }}
                        />
                    )}
                </DialogContent>
            </Dialog>

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