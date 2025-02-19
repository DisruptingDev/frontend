"use client";
// Importación de hooks y utilidades
import React, { useState } from "react";
import { useForm } from "react-hook-form";

import { Box, Button, FormControl, InputLabel, MenuItem, Select as MuiSelect, Snackbar, Alert } from "@mui/material";
import Select from "@/components/Select/Select.jsx"; // Componente para selectores
import PickersMinMax from "@/components/PickersMinMax/PickersMinMax.jsx"; // Componente para seleccionar fechas
//Iconos
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import "react-datepicker/dist/react-datepicker.css";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function SearchFilter({ setFiltro }) {
    // react-hook-form para manejar formularios
    const { register, reset, setValue, getValues } = useForm({
        defaultValues: {
            FechaInicio: "",
            FechaFin: "",
            Emisor: "",
            Receptor: "",
            Estatus: "",
        },
    });

    // Estados locales
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [emisor, setEmisor] = useState("");
    const [receptor, setReceptor] = useState("");
    const [estatus, setEstatus] = useState("");
    const [resetCalendario, setResetCalendario] = useState(false);

    // Formatea la fecha al formato "YYYY-MM-DDTHH:mm:ss"
    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hours = String(d.getHours()).padStart(2, "0");
        const minutes = String(d.getMinutes()).padStart(2, "0");
        const seconds = String(d.getSeconds()).padStart(2, "0");
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    // Manejador del botón de búsqueda
    const onSubmit = () => {
        const fechaInicio = getValues("FechaInicio");
        const fechaFin = getValues("FechaFin");

        // Formateo de las fechas
        const formattedFechaInicio = fechaInicio ? formatDate(fechaInicio) : "";
        const formattedFechaFin = fechaFin ? formatDate(fechaFin) : "";

        const data = {
            FechaInicio: formattedFechaInicio,
            FechaFin: formattedFechaFin,
            Emisor: emisor,
            Receptor: receptor,
            Estatus: estatus,
        };

        console.log("Filtro aplicado:", data);
        setFiltro(data);
    };

    // Manejador del botón de limpiar
    const Limpiar = () => {
        reset();
        setEmisor("");
        setReceptor("");
        setResetCalendario(true);
        setEstatus("");
        setFiltro({
            FechaInicio: "",
            FechaFin: "",
            Emisor: "",
            Receptor: "",
            Estatus: "",
        });
    };

    // Manejo de cambios en los selectores
    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setEmisor(data["Rfc"]);
        } catch (error) {
            console.error("El valor del emisor no es un JSON válido:", e.target.value);
        }
    };

    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setReceptor(data["Rfc"]);
        } catch (error) {
            console.error("El valor del receptor no es un JSON válido:", e.target.value);
        }
    };

    const handleEstatusChange = (e) => {
        setValue("Estatus", e.target.value);
        setEstatus(e.target.value);
    };

    // Manejo del cierre del Snackbar
    const handleCloseSnackbar = () => setSnackbarOpen(false);

    return (
        <Box
            sx={{
                backgroundColor: "#063F53",
                padding: "16px",
                borderRadius: "8px",
                boxShadow: 1,
                margin: 1,
                mt: 1,
            }}
        >
            <form>
                <Box
                    sx={{
                        display: "grid",
                        gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr) auto" }, // Responsivo
                        gap: 4,
                        alignItems: "center",
                    }}
                >
                    {/* Selector de fechas */}
                    <Box sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: "200px" }}>
                        <PickersMinMax register={register} setValue={setValue} resetCalendario={resetCalendario} setResetCalendario={setResetCalendario} />
                    </Box>
    
                    {/* Selector de emisor */}
                    <Select
                        register={register}
                        nombre="Emisor"
                        url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                        clave="Rfc"
                        descripcion="Nombre"
                        opcion={true}
                        opcionText="Quitar Filtro"
                        sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: "200px" }}
                        variant="filled"
                        value={emisor || ""}
                        onChange={handleEmisorChange}
                    />
    
                    {/* Selector de receptor */}
                    <Select
                        register={register}
                        nombre="Receptor"
                        url={`${apiUrl}/api/catalogos/Catalogos/Receptor`}
                        clave="Rfc"
                        descripcion="Nombre"
                        opcion={true}
                        opcionText="Quitar Filtro"
                        sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: "200px" }}
                        variant="filled"
                        value={receptor || ""}
                        onChange={handleReceptorChange}
                    />
    
                    {/* Selector de estatus */}
                    <FormControl fullWidth variant="filled" sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: "200px" }}>
                        <InputLabel id="estatus-select-label">Estatus</InputLabel>
                        <MuiSelect
                            {...register("Estatus")}
                            labelId="estatus-select-label"
                            id="estatus-select"
                            value={estatus}
                            onChange={handleEstatusChange}
                        >
                            <MenuItem value="">Quitar Filtro</MenuItem>
                            <MenuItem value="timbrada">Timbrada</MenuItem>
                            <MenuItem value="notimbrada">No timbrada</MenuItem>
                        </MuiSelect>
                    </FormControl>
    
                    {/* Botones */}
                    <Box
                        sx={{
                            display: "grid",
                            flexDirection: { xs: "column", sm: "row" }, // Responsivo
                            gap: 2,
                        }}
                    >
                        <Button
                            type="button"
                            variant="contained"
                            sx={{
                                background: "#10968A",
                                color: "white",
                                "&:hover": { backgroundColor: "#ffffff", color: "#10968A" },
                            }}
                            onClick={onSubmit}
                        >
                            <SearchIcon />
                            Buscar
                        </Button>
    
                        <Button
                            type="button"
                            variant="contained"
                            sx={{
                                background: "#ffffff",
                                color: "#10968A",
                                "&:hover": { backgroundColor: "red", color: "#ffffff" },
                            }}
                            onClick={Limpiar}
                        >
                            <ClearIcon />
                            Limpiar
                        </Button>
                    </Box>
                </Box>
            </form>
    
            {/* Snackbar para errores */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: "top", horizontal: "right" }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error" variant="filled" sx={{ width: "100%" }}>
                    Todos los campos son obligatorios.
                </Alert>
            </Snackbar>
        </Box>
    );
}
