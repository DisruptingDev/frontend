"use client"
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Button, TextField, Box, Snackbar, Alert, FormControl, InputLabel, MenuItem, Select as MUISelect, FormHelperText, Accordion, AccordionSummary, AccordionDetails, Typography } from '@mui/material';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Definir los regímenes para cada tipo de contribuyente como Sets
const REGIMENES_FISICOS = new Set(["605", "606", "607", "608", "610", "611", "612", "614", "615", "616", "621", "625", "626"]);
const REGIMENES_MORALES = new Set(["601", "603", "610", "620", "622", "623", "624", "626"]);

export default function AltaCliente({ onClose, cliente, setActualizar, token, data }) {
    const { register, reset, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [editar, setEditar] = useState(false);
    const [regimenesFiltrados, setRegimenesFiltrados] = useState([]);
    const [catalogoCompleto, setCatalogoCompleto] = useState([]);
    const effectRunCount = useRef(0); // Para depuración
    const selectedRegimen = watch("RegimenFiscal");

    // Observar cambios en el RFC
    const rfcValue = watch("Rfc", "");

    // Cargar catálogo completo al montar el componente
    useEffect(() => {
        const cargarCatalogo = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/RegimenFiscal`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                        "Accept": "application/json"
                    }
                });

                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data = await response.json();
                setCatalogoCompleto(data || []); // Ajuste aquí para el formato de respuesta
            } catch (error) {
                setToast({
                    open: true,
                    message: "Error al cargar los regímenes fiscales",
                    severity: "error"
                });
            }
        };

        cargarCatalogo();
    }, [token]);

    // Función mejorada para obtener tipo de contribuyente
    const obtenerTipoContribuyente = (rfc) => {
        if (!rfc) return null;
        const rfcLimpio = rfc.trim().toUpperCase();

        // Validación más estricta del RFC
        const regexFisica = /^[A-ZÑ&]{4}\d{6}[A-Z0-9]{3}$/;
        const regexMoral = /^[A-ZÑ&]{3}\d{6}[A-Z0-9]{3}$/;

        if (regexFisica.test(rfcLimpio)) return "F";
        if (regexMoral.test(rfcLimpio)) return "M";

        return null;
    };

    // Efecto para filtrar regímenes cuando cambia el RFC o el catálogo
    useEffect(() => {
        effectRunCount.current += 1;

        if (!catalogoCompleto || catalogoCompleto.length === 0) {
            setRegimenesFiltrados([]);
            return;
        }

        const tipoContribuyente = obtenerTipoContribuyente(rfcValue);
        let filtrados = [];
        const rfcValido = tipoContribuyente !== null;

        if (rfcValido) {
            const regimenesPermitidos = tipoContribuyente === "F" ? REGIMENES_FISICOS : REGIMENES_MORALES;

            filtrados = catalogoCompleto.filter(regimen => {
                const clave = regimen.Clave.toString(); // Asegurar que es string
                const incluido = regimenesPermitidos.has(clave);
                return incluido;
            });
        }

        setRegimenesFiltrados(filtrados);

        // Resetear valor si es necesario
        const regimenActual = watch("RegimenFiscal");
        if (regimenActual && !filtrados.some(r => r.Clave.toString() === regimenActual.toString())) {
            setValue("RegimenFiscal", "");
        }
    }, [rfcValue, catalogoCompleto, setValue, watch]);

    // Efecto para rellenar los campos si se está editando un cliente
    useEffect(() => {
        if (cliente && Object.keys(cliente).length > 0) {
            setEditar(true);
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
            setValue('Email', cliente.Email);
        }
    }, [cliente, setValue]);

    useEffect(() => {
        if (data) {
            setValue('Nombre', data.NombreReceptor || '');
            setValue('Rfc', data.RFCReceptor || '');
            setValue('RegimenFiscal', data.RegimenFiscalReceptor || '');
            setValue('DomicilioFiscal', data.DomicilioFiscalReceptor || '');
        }
    }, [data, setValue]);

    // Cerrar el Snackbar
    const handleClose = () => {
        setToast({ ...toast, open: false });
    };

    // Cancelar el formulario y resetear campos
    const handleCancelar = () => {
        onClose();
        reset();

    };


    // Función para manejar el envío del formulario
    const onSubmit = async (data) => {
        setLoading(true);

        const clienteData = editar
            ? { // Datos para editar cliente
                ID: cliente.ID,
                Rfc: data.Rfc,
                Nombre: data.Nombre,
                RegimenFiscalReceptor: data.RegimenFiscal,
                DomicilioFiscalReceptor: data.DomicilioFiscal,
                ResidenciaFiscal: "",
                NumRegIdTrib: "",
                UsoCFDI: "",
                Calle: data.Calle,
                NumeroExterior: data.NumeroExterior,
                NumeroInterior: data.NumeroInterior,
                Colonia: data.Colonia,
                Municipio: data.Municipio,
                Estado: data.Estado,
                Email: data.Email,
            }
            : { // Datos para registrar nuevo cliente
                Receptor: {
                    Rfc: data.Rfc,
                    Nombre: data.Nombre,
                    RegimenFiscalReceptor: data.RegimenFiscal,
                    DomicilioFiscalReceptor: data.DomicilioFiscal,
                    Calle: data.Calle,
                    NumeroExterior: data.NumeroExterior,
                    NumeroInterior: data.NumeroInterior,
                    Colonia: data.Colonia,
                    Municipio: data.Municipio,
                    Estado: data.Estado,
                    Email: data.Email,
                }
            };

        try {
            const url = editar
                ? `${apiUrl}/api/gestores/EditarReceptor`
                : `${apiUrl}/api/gestores/RegistroReceptor`;

            const method = editar ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(clienteData),
            });

            if (response.ok) {
                const result = await response.json();
                setToast({ open: true, message: 'Cliente guardado exitosamente', severity: 'success' });
                if (setActualizar) setActualizar(true);
                setTimeout(() => {
                    reset();
                    if (onClose) onClose();
                    if (setActualizar) setActualizar(false);
                }, 2000);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al guardar los datos');
            }
        } catch (error) {
            setToast({ open: true, message: `Error: ${error.message}`, severity: 'error' });
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
                        label="Nombre del Cliente"
                        fullWidth
                        required
                        error={!!errors.Nombre}
                        helperText={errors.Nombre ? "Este campo es obligatorio" : ""}
                        {...register("Nombre", { required: true })}
                        inputProps={{ style: { textTransform: 'uppercase' } }}
                        onBlur={(e) => {
                            const valor = e.target.value.toUpperCase().trimEnd();
                            setValue("Nombre", valor);
                        }}
                        sx={{ alignSelf: 'start', marginTop: '0px' }}
                    />

                    <TextField
                        label="R.F.C."
                        fullWidth
                        margin="normal"
                        required
                        {...register("Rfc", {
                            required: "Este campo es obligatorio",
                            validate: (value) => {
                                const rfc = value?.trim().toUpperCase() || '';
                                return rfc.length === 12 || rfc.length === 13 || "RFC debe tener al menos 12 caracteres";
                            }
                        })}
                        error={!!errors.Rfc}
                        helperText={errors.Rfc?.message}
                        inputProps={{
                            maxLength: 13,
                            onInput: (e) => {
                                e.target.value = e.target.value.toUpperCase();
                            }
                        }}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
                    />

                    <FormControl fullWidth margin="normal" error={!!errors.RegimenFiscal} disabled={!rfcValue || rfcValue.length < 12 || regimenesFiltrados.length === 0} sx={{ alignSelf: 'start', marginTop: '0px' }}>
                        <InputLabel id="regimen-label">Régimen Fiscal*</InputLabel>
                        <MUISelect
                            labelId="regimen-label"
                            id="RegimenFiscal"
                            value={selectedRegimen || ""}
                            label="Régimen Fiscal*"
                            onChange={(e) => setValue("RegimenFiscal", e.target.value)}
                            name="RegimenFiscal"
                        >
                            <MenuItem value="">Seleccione un régimen</MenuItem>
                            {regimenesFiltrados.map(regimen => (
                                <MenuItem key={regimen.Clave} value={regimen.Clave}>
                                    {`${regimen.Clave} - ${regimen.Descripcion}`}
                                </MenuItem>
                            ))}
                        </MUISelect>
                        {errors.RegimenFiscal && <FormHelperText>Este campo es obligatorio</FormHelperText>}
                    </FormControl>

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
                    <TextField
                        label="Correo electrónico *"
                        fullWidth
                        placeholder="mail@mail.com"
                        margin="normal"
                        error={!!errors.Estado}
                        helperText={errors.Estado ? "Este campo es obligatorio" : ""}
                        {...register("Email", { required: true })}
                        sx={{ alignSelf: 'start', 'marginTop': '0px' }}
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
                            gridTemplateColumns={{ xs: "1fr", sm: "1fr 1fr", md: "0.7fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr" }}
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


                        </Box>
                    </AccordionDetails>
                </Accordion>

                <Box
                    my={4}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                    flexDirection={{ xs: "column", sm: "row" }}
                >
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: { xs: '100%', sm: '150px' }, backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
                        type="button"
                        onClick={handleCancelar}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            width: { xs: '100%', sm: '250px' },
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
