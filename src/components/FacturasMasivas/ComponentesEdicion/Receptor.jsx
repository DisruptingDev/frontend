"use client";
import React, { useState, useEffect } from "react";
import { Box, Typography, TextField } from "@mui/material"; // Importa TextField
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
    const [mostrarRFC, setMostrarRFC] = useState(false); // Estado para controlar la visibilidad del RFC

    // Efecto para rellenar los valores del formulario cuando se va a editar
    useEffect(() => {
        if (datosReceptor) {
            console.log("Receptor", datosReceptor);
            setValue("MetodoPago", datosReceptor.MetodoPago);
            setValue("Receptor", datosReceptor.ID);
            setValue("ReceptorID", datosReceptor.ID);
            setValue("ReceptorNombre", datosReceptor.Nombre);
            setValue("ReceptorRFC", datosReceptor.RFC); // Establece el RFC del receptor
            setValue("RegimenFiscal", datosReceptor.RegimenFiscal);
            setUsoCFDIURL(
                `${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${datosReceptor.RegimenFiscal}`
            );

            // Asegúrate de establecer el valor de UsoCFDI y su ID
            setValue("UsoCFDI", datosReceptor.UsoCFDI);
            setValue("UsoCFDIID", datosReceptor.UsoCFDIID);
            setValue("FormaPago", datosReceptor.FormaPago);

            // Llama a los triggers para actualizar los valores
            trigger("UsoCFDIID", "ReceptorID", "MetodoPago", "Receptor");

            // Muestra el RFC si hay un receptor válido
            if (datosReceptor.ID) {
                setMostrarRFC(true);
            }
        }
    }, [datosReceptor, setValue, trigger]);

    // Efecto para actualizar los valores del formulario cuando cambia receptor
    useEffect(() => {
        if (Object.keys(receptor).length !== 0) {
            console.log("Receptor seleccionado", receptor);
            setValue("Receptor", receptor.ID);
            setValue("ReceptorID", receptor.ID);
            setValue("ReceptorNombre", receptor.Nombre);
            setValue("ReceptorRFC", receptor.Rfc || "XAXX010101000"); // Establece el RFC del receptor
            setValue("ReceptorRegimenFiscal", receptor.RegimenFiscalReceptor || 601);
            setRegimenFiscal(receptor.RegimenFiscalReceptor || "");
            setUsoCFDIURL(
                `${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${receptor.RegimenFiscalReceptor}`
            );

            trigger("Receptor");

            // Muestra el RFC si hay un receptor válido
            if (receptor.ID) {
                setMostrarRFC(true);
            }
        }
    }, [receptor, setValue, trigger]);

    // Maneja el cambio del receptor seleccionado
    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setReceptor(data);
            console.log("Nuevo receptor seleccionado", data);

            // Verifica si el receptor seleccionado coincide con el catálogo
            if (data.ID) { // Si tiene un ID válido, muestra el RFC
                setMostrarRFC(true);
            } else {
                setMostrarRFC(false); // Oculta el RFC si no hay un receptor válido
            }
        } catch (error) {
            console.error("El valor del receptor no es un JSON válido:", e.target.value);
            setMostrarRFC(false); // Oculta el RFC si hay un error
        }
    };

    // Maneja el cambio de UsoCFDI seleccionado
    const handleUsoCDFIChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            console.log("UsoCFDI seleccionado", data);
            setValue("UsoCFDIID", data.ID);
        } catch (error) {
            console.error("El valor de UsoCFDI no es un JSON válido:", e.target.value);
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
                {mostrarRFC && ( // Muestra el RFC solo si mostrarRFC es true
                    <TextField
                        {...register("ReceptorRFC")} // Registra el campo en el formulario
                        label="RFC del Receptor"
                        value={getValues("ReceptorRFC") || ""} // Obtiene el valor del RFC
                        fullWidth
                        disabled // Hace que el campo sea de solo lectura
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
                    value={getValues("UsoCFDI") || ""} // Asegúrate de pasar el valor correcto
                    error={!!errors.UsoCFDI}
                    helperText={errors.UsoCFDI ? "Este campo es obligatorio" : ""}
                    disabled={!receptor} // Deshabilita el campo si no hay receptor seleccionado
                />
            </Box>
        </Box>
    );
}   