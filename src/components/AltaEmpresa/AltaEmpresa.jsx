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
    Menu,
    MenuItem,
    ListItemIcon,
    Dialog,
    DialogContent,
    IconButton
} from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import Image from 'next/image';
import { WithPermission } from '@/components/WithPermission';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AltaEmpresa({ onClose, issuerName, issuerRfc, empresa, editar, token, setActualizar, setRegistroEmpresa, btnCancelar }) {
    const { register, handleSubmit, setValue, getValues, formState: { errors }, watch, trigger } = useForm();
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
    const [plantillasAgrupadas, setPlantillasAgrupadas] = useState({});
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null);
    const [menuAnchor, setMenuAnchor] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [imagenModal, setImagenModal] = useState('');

    const rfcValue = watch("Rfc");

    useEffect(() => {
        console.log("cliente", empresa);
        if (empresa && Object.keys(empresa).length > 0) {
            console.log(empresa);
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

            // Si hay plantilla seleccionada en la empresa
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

    // Cargar plantillas al montar el componente
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

                // Agrupar plantillas por categoría
                const agrupadas = data.reduce((acc, plantilla) => {
                    const categoria = plantilla.Categoria || 'Default';
                    if (!acc[categoria]) {
                        acc[categoria] = [];
                    }
                    acc[categoria].push(plantilla);
                    return acc;
                }, {});

                setPlantillasAgrupadas(agrupadas);
            }
        } catch (error) {
            console.error('Error al cargar plantillas:', error);
        }
    };

    const handleSeleccionarPlantilla = (plantilla) => {
        setPlantillaSeleccionada(plantilla.ID);
        setValue('PlantillaID', plantilla.ID);
        setMenuAnchor(null);
    };

    const handleAbrirMenu = (event, categoria) => {
        setMenuAnchor(event.currentTarget);
    };

    const handleCerrarMenu = () => {
        setMenuAnchor(null);
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
        console.log('Resetting form...', getValues("RegimenFiscal"));
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
        console.log('Resetting form...', getValues("RegimenFiscal"));
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
                console.log('Ruta del archivo:', result.filePath);
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
        if (editar) {
            const empresaData = {
                ID: empresa.ID,
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
                const data = await response.json();
                console.log('Data received from API:', data);
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
                        if (onClose) onClose();
                        if (setActualizar) setActualizar(false);
                    }, 2000);
                }
            } catch (error) {
                setSnackbarMessage('Ocurrió un error al guardar los datos.');
                setSnackbarSeverity('error');
                setOpenSnackbar(true);
            } finally {
                setLoading(false);
            }
        } else {
            const empresaData = {
                Emisor: {
                    Rfc: data.Rfc,
                    Nombre: data.Nombre,
                    RegimenFiscal: data.RegimenFiscal,
                    LugarExpedicion: data.LugarExpedicion,
                    LogoPath: imagePath,
                    Calle: data.Calle || "",
                    NumeroExterior: data.NumeroExterior || "",
                    NumeroInterior: data.NumeroInterior || "",
                    Colonia: data.Colonia || "",
                    Municipio: data.Municipio || "",
                    Estado: data.Estado || "",
                    PlantillaID: plantillaSeleccionada,
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
                const data = await response.json();
                console.log('Data received from API:', data);

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
        }
    };

    return (
        <Box bgcolor="white">
            <form>
                {/* Campos existentes */}
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
                        placeholder="Ej: Benito Juárez"
                        margin="normal"
                        error={!!errors.Estado}
                        helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                        {...register("Estado", { required: false })}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />
                </Box>

                {/* Sección de Selección de Plantilla (versión mejorada) */}
                <Box my={4}>
                    <Typography variant="h6" gutterBottom>
                        Seleccionar Plantilla
                    </Typography>

                    <Grid container spacing={3}>
                        {Object.keys(plantillasAgrupadas).map((categoria) => {
                            const opciones = plantillasAgrupadas[categoria];

                            // Siempre usar la primera plantilla de la categoría como miniatura por defecto
                            const plantillaPorDefecto = opciones[0];

                            // Encontrar la plantilla seleccionada actual (si pertenece a esta categoría)
                            const plantillaSeleccionadaEnCategoria = opciones.find(p => p.ID === plantillaSeleccionada);

                            // Plantilla a mostrar en la miniatura (la seleccionada o la primera por defecto)
                            const plantillaAMostrar = plantillaSeleccionadaEnCategoria || plantillaPorDefecto;

                            return (
                                <Grid item xs={12} sm={6} md={4} key={categoria}>
                                    <Card
                                        variant="outlined"
                                        sx={{
                                            p: 2,
                                            borderRadius: 2,
                                            border: plantillaSeleccionadaEnCategoria ? '2px solid #04b2ca' : '1px solid #e0e0e0',
                                            backgroundColor: plantillaSeleccionadaEnCategoria ? '#f0fafa' : 'white'
                                        }}
                                    >
                                        <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                                            {categoria}
                                        </Typography>

                                        {/* Miniatura siempre visible */}
                                        <Box mt={1} textAlign="center">
                                            <CardActionArea
                                                onClick={() => handleVerImagen(plantillaAMostrar.VistaPrevia)}
                                                sx={{ borderRadius: 1 }}
                                            >
                                                <CardMedia
                                                    component="img"
                                                    height="140"
                                                    image={plantillaAMostrar.VistaPrevia || '/placeholder-image.jpg'}
                                                    alt={plantillaAMostrar.Nombre}
                                                    sx={{
                                                        objectFit: 'contain',
                                                        borderRadius: 1,
                                                        border: '1px solid #e0e0e0',
                                                        mx: 'auto'
                                                    }}
                                                />
                                            </CardActionArea>

                                            {/* Botones de acción */}
                                            <Box mt={1} display="flex" justifyContent="center" gap={1}>
                                                <Button
                                                    size="small"
                                                    startIcon={<VisibilityIcon />}
                                                    onClick={() => handleVerImagen(plantillaAMostrar.VistaPrevia)}
                                                    sx={{ fontSize: '0.75rem' }}
                                                >
                                                    Ver
                                                </Button>

                                                {plantillaAMostrar.ID !== plantillaSeleccionada && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        color="primary"
                                                        onClick={() => handleSeleccionarPlantilla(plantillaAMostrar)}
                                                        sx={{
                                                            fontSize: '0.75rem',
                                                            backgroundColor: '#04b2ca',
                                                            '&:hover': {
                                                                backgroundColor: '#038a9e',
                                                            },
                                                        }}
                                                    >
                                                        Seleccionar
                                                    </Button>
                                                )}

                                                {plantillaAMostrar.ID === plantillaSeleccionada && (
                                                    <Button
                                                        size="small"
                                                        variant="outlined"
                                                        color="success"
                                                        sx={{ fontSize: '0.75rem' }}
                                                        disabled
                                                    >
                                                        Seleccionada
                                                    </Button>
                                                )}
                                            </Box>
                                        </Box>

                                        {/* Dropdown para seleccionar entre todas las plantillas de la categoría */}
                                        <Box mt={2}>
                                            <Typography variant="body2" color="textSecondary" gutterBottom>
                                                O elegir otro modelo:
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                value={plantillaSeleccionadaEnCategoria ? plantillaSeleccionadaEnCategoria.ID : ''}
                                                onChange={(e) => {
                                                    const seleccionada = opciones.find(p => p.ID === Number(e.target.value));
                                                    if (seleccionada) {
                                                        handleSeleccionarPlantilla(seleccionada);
                                                    }
                                                }}
                                            >
                                                <MenuItem value="">
                                                    <em>Seleccionar modelo...</em>
                                                </MenuItem>
                                                {opciones.map((plantilla) => (
                                                    <MenuItem key={plantilla.ID} value={plantilla.ID}>
                                                        {plantilla.Nombre}
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Box>

                                        {/* Indicador de plantilla seleccionada */}
                                        {plantillaSeleccionadaEnCategoria && (
                                            <Box mt={1} textAlign="center">
                                                <Typography
                                                    variant="body2"
                                                    color="success.main"
                                                    fontWeight="bold"
                                                    sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}
                                                >
                                                    <span>✓</span> Plantilla seleccionada
                                                </Typography>
                                            </Box>
                                        )}
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </Box>

                {rfcValue && (
                    <Box my={2}>
                        <WithPermission permission="subir_logo">
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
                        </WithPermission>
                    </Box>
                )}

                <Box
                    my={4}
                    mx={0}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                >
                    {btnCancelar == true && (
                        <Button
                            variant="contained"
                            color="error"
                            sx={{ width: '150px', backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
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

            {/* Modal para vista previa de imagen */}
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