"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormHelperText,
    CircularProgress
} from "@mui/material";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Receptor({
    register,
    trigger,
    datosReceptor,
    setValue,
    getValues,
    errors,
    control
}) {
    const [receptor, setReceptor] = useState({});
    const [receptores, setReceptores] = useState([]);
    const [metodosPago, setMetodosPago] = useState([]);
    const [formasPago, setFormasPago] = useState([]);
    const [usosCFDI, setUsosCFDI] = useState([]);
    const [regimenFiscal, setRegimenFiscal] = useState("");
    const [loading, setLoading] = useState({
        receptores: false,
        metodosPago: false,
        formasPago: false,
        usosCFDI: false
    });

    // Cargar datos iniciales
    useEffect(() => {
        if (datosReceptor) {
            const regimen = datosReceptor.RegimenFiscal || datosReceptor.RegimenFiscalReceptor || 601;
            setValue("MetodoPago", datosReceptor.MetodoPago);
            setValue("ReceptorID", String(datosReceptor.ID));
            setValue("ReceptorNombre", datosReceptor.Nombre);
            setValue("ReceptorRFC", datosReceptor.RFC || datosReceptor.Rfc);
            setValue("RegimenFiscal", regimen);
            setValue("UsoCFDIID", String(datosReceptor.UsoCFDIID || ""));
            setValue("FormaPago", datosReceptor.FormaPago);
            setRegimenFiscal(regimen);
        }

        // Cargar catálogos
        cargarReceptores();
        cargarMetodosPago();
        cargarFormasPago();
    }, [datosReceptor]);

    // Cargar usos CFDI cuando cambia el régimen fiscal
    useEffect(() => {
        if (regimenFiscal) {
            cargarUsosCFDI(regimenFiscal);
        }
    }, [regimenFiscal]);

    const cargarReceptores = async () => {
        setLoading(prev => ({ ...prev, receptores: true }));
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            const arr = Array.isArray(data) ? data : [];
            setReceptores(arr);

            if (datosReceptor) {
                const recInicial = arr.find(r => String(r.ID) === String(datosReceptor.ID));
                if (recInicial) {
                    setReceptor(recInicial);
                }
            }
        } catch (error) {
            console.error("Error cargando receptores:", error);
        } finally {
            setLoading(prev => ({ ...prev, receptores: false }));
        }
    };

    const cargarMetodosPago = async () => {
        setLoading(prev => ({ ...prev, metodosPago: true }));
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/MetodoPago`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setMetodosPago(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando métodos de pago:", error);
        } finally {
            setLoading(prev => ({ ...prev, metodosPago: false }));
        }
    };

    const cargarFormasPago = async () => {
        setLoading(prev => ({ ...prev, formasPago: true }));
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/FormaPago`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setFormasPago(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Error cargando formas de pago:", error);
        } finally {
            setLoading(prev => ({ ...prev, formasPago: false }));
        }
    };

    const cargarUsosCFDI = async (regimen) => {
        setLoading(prev => ({ ...prev, usosCFDI: true }));
        try {
            const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${regimen}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                }
            });
            const data = await response.json();
            setUsosCFDI(Array.isArray(data) ? data : []);

            // Validar si el UsoCFDI actual es válido
            const usoCFDIActual = getValues("UsoCFDIID");
            if (usoCFDIActual && !data.some(item => String(item.ID) === String(usoCFDIActual))) {
                setValue("UsoCFDIID", "");
                trigger("UsoCFDIID");
            }
        } catch (error) {
            console.error("Error cargando usos CFDI:", error);
        } finally {
            setLoading(prev => ({ ...prev, usosCFDI: false }));
        }
    };

    const handleReceptorChange = (e) => {
        const selectedId = e.target.value;
        const selectedReceptor = receptores.find(r => r.ID === selectedId);

        if (selectedReceptor) {
            setReceptor(selectedReceptor);
            const regimen = selectedReceptor.RegimenFiscalReceptor || 601;
            setValue("ReceptorID", String(selectedId));
            setValue("ReceptorNombre", selectedReceptor.Nombre);
            setValue("ReceptorRFC", selectedReceptor.Rfc || "XAXX010101000");
            setValue("RegimenFiscal", regimen);
            setRegimenFiscal(regimen);
            trigger("ReceptorID");
        }
    };

    const handleUsoCFDIChange = (e) => {
        const selectedId = e.target.value;
        const selectedUsoCFDI = usosCFDI.find(u => u.ID === selectedId);

        if (selectedUsoCFDI) {
            setValue("UsoCFDIID", String(selectedId));
            setValue("UsoCFDI", selectedUsoCFDI.Clave); // Guardamos la clave
            setValue("UsoCFDIDescripcion", selectedUsoCFDI.Descripcion); // Opcional: guardar descripción
        } else {
            setValue("UsoCFDIID", "");
            setValue("UsoCFDI", "");
            setValue("UsoCFDIDescripcion", "");
        }
        trigger("UsoCFDIID");
    };
    const handleMetodoPagoChange = (e) => {
        setValue("MetodoPago", e.target.value);
        trigger("MetodoPago");
    };

    const handleFormaPagoChange = (e) => {
        setValue("FormaPago", e.target.value);
        trigger("FormaPago");
    };

    return (
        <Box>
            <Typography variant="h6">Receptor</Typography>
            <Box
                display="grid"
                gap={3}
                sx={{
                    gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, 1fr)",
                        md: "repeat(3, 1fr)",
                        lg: "1fr 1fr",
                    },
                }}
            >
                {/* Selector de Receptor */}
                <FormControl fullWidth error={!!errors.ReceptorID}>
                    <InputLabel>Receptor</InputLabel>
                    <Select
                        {...register("ReceptorID", { required: "Seleccione un receptor" })}
                        value={getValues("ReceptorID") || ""}
                        label="Receptor"
                        onChange={handleReceptorChange}
                        disabled={loading.receptores}
                    >
                        <MenuItem value="" disabled>
                            {loading.receptores ? "Cargando..." : "Seleccione un receptor"}
                        </MenuItem>
                        {receptores.map((item) => (
                            <MenuItem key={item.ID} value={String(item.ID)}>
                                {item.Nombre}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.ReceptorID && (
                        <FormHelperText>{errors.ReceptorID.message}</FormHelperText>
                    )}
                </FormControl>

                {/* RFC del Receptor */}
                <TextField
                    {...register("ReceptorRFC")}
                    label="RFC del Receptor"
                    value={getValues("ReceptorRFC") || ""}
                    fullWidth
                    disabled
                    error={!!errors.ReceptorRFC}
                    helperText={errors.ReceptorRFC?.message || ""}
                />

                {/* Régimen Fiscal */}
                <TextField
                    {...register("RegimenFiscal")}
                    label="Régimen Fiscal"
                    value={getValues("RegimenFiscal") || ""}
                    fullWidth
                    disabled
                    error={!!errors.RegimenFiscal}
                    helperText={errors.RegimenFiscal?.message || ""}
                />

                {/* Método de Pago */}
                <FormControl fullWidth error={!!errors.MetodoPago}>
                    <InputLabel>Método de Pago</InputLabel>
                    <Select
                        {...register("MetodoPago", { required: "Seleccione un método de pago" })}
                        value={getValues("MetodoPago") || ""}
                        label="Método de Pago"
                        onChange={handleMetodoPagoChange}
                        disabled={loading.metodosPago}
                    >
                        <MenuItem value="" disabled>
                            {loading.metodosPago ? "Cargando..." : "Seleccione un método"}
                        </MenuItem>
                        {metodosPago.map((item) => (
                            <MenuItem key={item.Clave} value={item.Clave}>
                                {item.Clave} - {item.Descripcion}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.MetodoPago && (
                        <FormHelperText>{errors.MetodoPago.message}</FormHelperText>
                    )}
                </FormControl>

                {/* Forma de Pago */}
                <FormControl fullWidth error={!!errors.FormaPago}>
                    <InputLabel>Forma de Pago</InputLabel>
                    <Select
                        {...register("FormaPago", { required: "Seleccione una forma de pago" })}
                        value={getValues("FormaPago") || ""}
                        label="Forma de Pago"
                        onChange={handleFormaPagoChange}
                        disabled={loading.formasPago}
                    >
                        <MenuItem value="" disabled>
                            {loading.formasPago ? "Cargando..." : "Seleccione una forma"}
                        </MenuItem>
                        {formasPago.map((item) => (
                            <MenuItem key={item.Clave} value={item.Clave}>
                                {item.Clave} - {item.Descripcion}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.FormaPago && (
                        <FormHelperText>{errors.FormaPago.message}</FormHelperText>
                    )}
                </FormControl>

                {/* Uso CFDI */}
                <FormControl fullWidth error={!!errors.UsoCFDIID}>
                    <InputLabel>Uso CFDI</InputLabel>
                    <Select
                        {...register("UsoCFDIID", {
                            required: "Seleccione un uso CFDI",
                            validate: (value) => {
                                if (!value) return "Seleccione un uso CFDI";
                                if (!usosCFDI.some(item => item.ID === value)) {
                                    return "Seleccione un uso CFDI válido";
                                }
                                return true;
                            }
                        })}
                        value={getValues("UsoCFDIID") || ""}
                        label="Uso CFDI"
                        onChange={handleUsoCFDIChange}
                        disabled={loading.usosCFDI || !receptor}
                    >
                        <MenuItem value="" disabled>
                            {loading.usosCFDI ? "Cargando..." : receptor ? "Seleccione un uso" : "Seleccione un receptor primero"}
                        </MenuItem>
                        {usosCFDI.map((item) => (
                            <MenuItem key={item.ID} value={String(item.ID)}>
                                {item.Clave} - {item.Descripcion}
                            </MenuItem>
                        ))}
                    </Select>
                    {errors.UsoCFDIID && (
                        <FormHelperText>{errors.UsoCFDIID.message}</FormHelperText>
                    )}
                </FormControl>
            </Box>
        </Box>
    );
}