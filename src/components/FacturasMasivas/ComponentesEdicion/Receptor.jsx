"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, TextField } from "@mui/material";
import Select from "@/components/Select/Select.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Receptor({
    register,
    trigger,
    datosReceptor,
    setValue,
    getValues,
    errors,
}) {
    const [receptor, setReceptor] = useState({});
    const [regimenFiscal, setRegimenFiscal] = useState("");
    const [usoCFDIURL, setUsoCFDIURL] = useState("");
    const [mostrarRFC, setMostrarRFC] = useState(false);
    const [usoCFDIValido, setUsoCFDIValido] = useState(true);

    // Efecto para rellenar los valores del formulario cuando se va a editar
    useEffect(() => {
        if (datosReceptor) {
            console.log("Receptor", datosReceptor);
            const regimen = datosReceptor.RegimenFiscal || 601;
            const urlUsoCFDI = `${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${regimen}`;
            
            setValue("MetodoPago", datosReceptor.MetodoPago);
            setValue("Receptor", datosReceptor.ID);
            setValue("ReceptorID", datosReceptor.ID);
            setValue("ReceptorNombre", datosReceptor.Nombre);
            setValue("ReceptorRFC", datosReceptor.RFC);
            setValue("RegimenFiscal", regimen);
            setUsoCFDIURL(urlUsoCFDI);

            // Verificar si el UsoCFDI actual es compatible con el nuevo régimen
            if (datosReceptor.UsoCFDIID) {
                verificarUsoCFDIValido(datosReceptor.UsoCFDIID, urlUsoCFDI);
            }

            setValue("UsoCFDI", datosReceptor.UsoCFDI);
            setValue("UsoCFDIID", datosReceptor.UsoCFDIID);
            setValue("FormaPago", datosReceptor.FormaPago);

            trigger("UsoCFDIID", "ReceptorID", "MetodoPago", "Receptor");

            if (datosReceptor.ID) {
                setMostrarRFC(true);
            }
        }
    }, [datosReceptor, setValue, trigger]);

    // Efecto para actualizar los valores del formulario cuando cambia receptor
    useEffect(() => {
        if (Object.keys(receptor).length !== 0) {
            const regimen = receptor.RegimenFiscalReceptor || 601;
            const urlUsoCFDI = `${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${regimen}`;
            
            console.log("Receptor seleccionado", receptor);
            setValue("Receptor", receptor.ID);
            setValue("ReceptorID", receptor.ID);
            setValue("ReceptorNombre", receptor.Nombre);
            setValue("ReceptorRFC", receptor.Rfc || "XAXX010101000");
            setValue("ReceptorRegimenFiscal", regimen);
            setRegimenFiscal(regimen);
            setUsoCFDIURL(urlUsoCFDI);

            // Verificar si el UsoCFDI actual es compatible con el nuevo régimen
            const usoCFDIID = getValues("UsoCFDIID");
            if (usoCFDIID) {
                verificarUsoCFDIValido(usoCFDIID, urlUsoCFDI);
            }

            trigger("Receptor");
            console.log("Regimen Fiscal Receptor Seleccionado: ", regimen);

            if (receptor.ID) {
                setMostrarRFC(true);
            }
        }
    }, [receptor, setValue, trigger]);

    // Función para verificar si el UsoCFDI seleccionado es válido para el régimen actual
    const verificarUsoCFDIValido = async (usoCFDIID, url) => {
        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${token}`, // Asegúrate de tener acceso al token
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                const data = await response.json();
                const usoValido = data.some(item => item.ID === usoCFDIID);
                setUsoCFDIValido(usoValido);
                
                if (!usoValido) {
                    // Resetear el UsoCFDI si no es válido
                    setValue("UsoCFDI", "");
                    setValue("UsoCFDIID", "");
                }
            }
        } catch (error) {
            console.error("Error al verificar UsoCFDI:", error);
        }
    };

    // Maneja el cambio del receptor seleccionado
    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setReceptor(data);
            console.log("Nuevo receptor seleccionado", data);

            if (data.ID) {
                setMostrarRFC(true);
            } else {
                setMostrarRFC(false);
            }
        } catch (error) {
            console.error("El valor del receptor no es un JSON válido:", e.target.value);
            setMostrarRFC(false);
        }
    };

    // Maneja el cambio de UsoCFDI seleccionado
    const handleUsoCDFIChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            console.log("UsoCFDI seleccionado", data);
            setValue("UsoCFDIID", data.ID);
            setUsoCFDIValido(true); // Asumimos que la selección es válida
        } catch (error) {
            console.error("El valor de UsoCFDI no es un JSON válido:", e.target.value);
            setUsoCFDIValido(false);
        }
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
                        lg: "1fr 1fr ",
                    },
                }}
            >
                {/* Selector de Receptor */}
                <Select
                    register={register}
                    nombre="Receptor"
                    trigger={trigger}
                    url={`${apiUrl}/api/catalogos/Catalogos/Receptor`}
                    id="ID"
                    descripcion="Nombre"
                    onChange={handleReceptorChange}
                    value={getValues("ReceptorID") || ""}
                    error={!!errors.Receptor}
                    helperText={errors.Receptor ? "Este campo es obligatorio" : ""}
                />

                {/* Campo de RFC del Receptor (solo lectura) */}
                {mostrarRFC && (
                    <TextField
                        {...register("ReceptorRFC")}
                        label="RFC del Receptor"
                        value={getValues("ReceptorRFC") || ""}
                        fullWidth
                        disabled
                        error={!!errors.ReceptorRFC}
                        helperText={errors.ReceptorRFC ? "Este campo es obligatorio" : ""}
                    />
                )}

                {/* Selector de Método de Pago */}
                <Select
                    register={register}
                    nombre="MetodoPago"
                    url={`${apiUrl}/api/catalogos/Catalogos/MetodoPago`}
                    clave="Clave"
                    descripcion="Descripcion"
                    value={getValues("MetodoPago") || ""}
                    error={!!errors.MetodoPago}
                    helperText={errors.MetodoPago ? "Este campo es obligatorio" : ""}
                />

                {/* Selector de Forma de Pago */}
                <Select
                    register={register}
                    nombre="FormaPago"
                    url={`${apiUrl}/api/catalogos/Catalogos/FormaPago`}
                    clave="Clave"
                    descripcion="Descripcion"
                    value={getValues("FormaPago") || ""}
                    error={!!errors.FormaPago}
                    helperText={errors.FormaPago ? "Este campo es obligatorio" : ""}
                />

                {/* Selector de UsoCFDI */}
                <Select
                    register={register}
                    nombre="UsoCFDI"
                    url={usoCFDIURL}
                    clave="Clave"
                    descripcion="Descripcion"
                    onChange={handleUsoCDFIChange}
                    value={getValues("UsoCFDI") || ""}
                    error={!!errors.UsoCFDI || !usoCFDIValido}
                    helperText={
                        errors.UsoCFDI ? "Este campo es obligatorio" : 
                        !usoCFDIValido ? "El Uso CFDI seleccionado no es válido para este régimen fiscal" : ""
                    }
                    disabled={!receptor}
                />
            </Box>
        </Box>
    );
}