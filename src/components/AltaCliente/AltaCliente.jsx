"use client"
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AltaCliente({ onClose, cliente, setActualizar, token }) {
    const { register, reset, handleSubmit, setValue, watch, formState: { errors } } = useForm();
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
    const [editar, setEditar] = useState(false);
    const [regimenesFiltrados, setRegimenesFiltrados] = useState([]);
    const [catalogoCompleto, setCatalogoCompleto] = useState([]);

    // Definir los regímenes para cada tipo de contribuyente
    const regimenesFisicos = ["605", "606", "607", "608", "610", "611", "612", "614", "615", "616", "621", "625", "626"];
    const regimenesMorales = ["601", "603", "610", "620", "622", "623", "624", "626"];

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
                setCatalogoCompleto(data.regimenFiscal || []);
            } catch (error) {
                console.error("Error al cargar el catálogo:", error);
                setToast({
                    open: true,
                    message: "Error al cargar los regímenes fiscales",
                    severity: "error"
                });
            }
        };

        cargarCatalogo();
    }, [token]);

    // Filtrar regímenes cuando cambia el RFC o el catálogo
    useEffect(() => {
        if (!catalogoCompleto.length) return;

        const tipoContribuyente = obtenerTipoContribuyente(rfcValue);
        let filtrados = [];

        if (tipoContribuyente === "F") {
            filtrados = catalogoCompleto.filter(regimen =>
                regimenesFisicos.includes(regimen.Clave)
            );
        } else if (tipoContribuyente === "M") {
            filtrados = catalogoCompleto.filter(regimen =>
                regimenesMorales.includes(regimen.Clave)
            );
        }

        setRegimenesFiltrados(filtrados);

        // Resetear el valor seleccionado si los filtrados no lo contienen
        if (cliente?.RegimenFiscalReceptor && !filtrados.some(r => r.Clave === cliente.RegimenFiscalReceptor)) {
            setValue("RegimenFiscal", "");
        }
    }, [rfcValue, catalogoCompleto, cliente, setValue]);

    const obtenerTipoContribuyente = (rfc) => {
        if (!rfc) return null;
        const rfcLimpio = rfc.trim().toUpperCase();
        if (rfcLimpio.length === 13) return "F"; // Persona Física
        if (rfcLimpio.length === 12) return "M"; // Persona Moral
        return null;
    };

    // Efecto para rellenar los campos si se está editando un cliente
    useEffect(() => {
        //console.log("Cliente recibido para editar:", cliente);
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
            console.log("Token:", token);
            console.log("Cliente Data:", clienteData);

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
                console.log("JSON obtenido para editar:", JSON.stringify(result, null, 2));
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
                        margin="normal"
                        required
                        {...register("Rfc", {
                            required: "Este campo es obligatorio",
                            validate: (value) => {
                                const rfc = value?.trim().toUpperCase() || '';
                                return rfc.length === 12 || rfc.length === 13 || "RFC debe tener 12 (moral) o 13 (física) caracteres";
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

                    <Select
                        label="Régimen Fiscal*"
                        name="RegimenFiscal"
                        error={!!errors.RegimenFiscal}
                        helperText={errors.RegimenFiscal?.message || (
                            !rfcValue || rfcValue.length < 12 ?
                                "Ingrese un RFC válido primero" :
                                regimenesFiltrados.length === 0 ?
                                    "No hay regímenes disponibles para este tipo de RFC" :
                                    ""
                        )}
                        disabled={!rfcValue || rfcValue.length < 12 || regimenesFiltrados.length === 0}
                        {...register("RegimenFiscal", { required: "Seleccione un régimen fiscal" })}
                    >
                        <option value="">Seleccione un régimen</option>
                        {regimenesFiltrados.map(regimen => (
                            <option key={regimen.Clave} value={regimen.Clave}>
                                {regimen.Clave} - {regimen.Descripcion}
                            </option>
                        ))}
                    </Select>
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
                    gridTemplateColumns="0.7fr 0.4fr 0.4fr 0.4fr 0.4fr 0.4fr "
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
                <Box my={4} display="flex" justifyContent="flex-end" gap={3}>
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px', backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
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
