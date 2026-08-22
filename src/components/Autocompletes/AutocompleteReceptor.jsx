"use client";

import React, { useState, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography, CircularProgress } from "@mui/material";
import AddCircleIcon from "@mui/icons-material/AddCircle";

async function obtener_opciones(url) {
    try {
        const token =
            localStorage.getItem("authToken") ||
            sessionStorage.getItem("authToken");

        const response = await fetch(url, {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        });

        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error("Error al obtener opciones:", error);
        return [];
    }
}

export default function AutocompleteReceptor({
    nombre,
    label = nombre,
    url,
    id = "ID",
    clave = "",
    descripcion = "",
    onChange,
    value = "",
    setValue = () => { },
    register = () => ({}),
    error = false,
    helperText = "",
    disabled = false,
    noOptionsText = "No hay opciones disponibles",
    onAddNewOption, // Nueva prop para manejar la creación de nuevo receptor
}) {
    const [opciones, setOpciones] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (url) {
            setLoading(true);
            obtener_opciones(url)
                .then((data) => setOpciones(data))
                .finally(() => setLoading(false));
        }
    }, [url]);

    useEffect(() => {
        if (value && opciones.length > 0) {
            const selected = opciones.find((opt) => String(opt[id]) === String(value));
            if (selected) {
                setSelectedOption(selected);
                setInputValue(clave ? `${selected[clave]} - ${selected[descripcion]}` : selected[descripcion]);
            }
        }
    }, [value, opciones, id, clave, descripcion]);

    const handleChange = (event, newValue) => {
        if (newValue?.isAddOption) {
            // Si se selecciona la opción de agregar nuevo
            if (onAddNewOption) {
                onAddNewOption(searchTerm);
            }
            return;
        }

        setSelectedOption(newValue);
        if (newValue) {
            setInputValue(clave ? `${newValue[clave]} - ${newValue[descripcion]}` : newValue[descripcion]);
            setValue(nombre, newValue[id]); // sincroniza con react-hook-form
            if (onChange) {
                onChange({ target: { value: JSON.stringify(newValue) } });
            }
        } else {
            setValue(nombre, "");
        }
    };

    const filterOptions = (options, { inputValue }) => {
        const filtered = options.filter(option =>
            option[descripcion]?.toLowerCase().includes(inputValue.toLowerCase()) ||
            (clave && option[clave]?.toLowerCase().includes(inputValue.toLowerCase()))
        );

        if (inputValue.trim() && !filtered.length && onAddNewOption) {
            return [{
                isAddOption: true,
                [id]: 'add-new',
                [descripcion]: `Agregar "${inputValue}" como nuevo`
            }];
        }
        return filtered;
    };

    return (
        <Autocomplete
            disabled={disabled}
            options={opciones}
            getOptionLabel={(option) =>
                option.isAddOption ? 
                    `Agregar "${searchTerm}" como nuevo` : 
                    (clave ? `${option[clave]} - ${option[descripcion]}` : option[descripcion])
            }
            value={selectedOption}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={(e, newInputValue) => {
                setInputValue(newInputValue);
                setSearchTerm(newInputValue);
            }}
            noOptionsText={noOptionsText}
            loading={loading}
            filterOptions={filterOptions}
            isOptionEqualToValue={(option, value) => String(option[id]) === String(value?.[id] || value)}
            renderOption={(props, option) => (
                <li {...props} key={option[id]}>
                    {option.isAddOption ? (
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                width: '100%',
                                padding: '8px 16px',
                                color: '#0e8e85',
                                backgroundColor: 'rgba(29, 57, 77, 0.1)',
                                '&:hover': {
                                    backgroundColor: 'rgba(29, 57, 77, 0.2)',
                                }
                            }}
                        >
                            <AddCircleIcon sx={{ color: '#0e8e85', mr: 1 }} />
                            <Typography fontWeight="bold">
                                {`Agregar "${searchTerm}" como nuevo`}
                            </Typography>
                        </Box>
                    ) : (
                        clave ? `${option[clave]} - ${option[descripcion]}` : option[descripcion]
                    )}
                </li>
            )}
            renderInput={(params) => (
                <>
                    <TextField
                        {...params}
                        label={label}
                        fullWidth
                        error={error}
                        helperText={helperText}
                        InputProps={{
                            ...params.InputProps,
                            endAdornment: (
                                <>
                                    {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                    {params.InputProps.endAdornment}
                                </>
                            ),
                        }}
                    />
                    <input
                        type="hidden"
                        {...register(nombre, {
                            required: "Este campo es obligatorio",
                        })}
                        value={selectedOption?.[id] || ""}
                    />
                </>
            )}
        />
    );
}