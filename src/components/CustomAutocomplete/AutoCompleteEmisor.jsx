"use client";

import React, { useState, useEffect } from "react";
import { Autocomplete, TextField } from "@mui/material";

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

export default function AutocompleteEmisor({
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
}) {
    const [opciones, setOpciones] = useState([]);
    const [inputValue, setInputValue] = useState("");
    const [selectedOption, setSelectedOption] = useState(null);

    useEffect(() => {
        if (url) {
            obtener_opciones(url).then((data) => setOpciones(data));
        }
    }, [url]);

    useEffect(() => {
        if (value && opciones.length > 0) {
            const selected = opciones.find((opt) => opt[id] === value);
            if (selected) {
                setSelectedOption(selected);
                setInputValue(clave ? `${selected[clave]} - ${selected[descripcion]}` : selected[descripcion]);
            }
        }
    }, [value, opciones, id, clave, descripcion]);

    const handleChange = (event, newValue) => {
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

    return (
        <Autocomplete
            disabled={disabled}
            options={opciones}
            getOptionLabel={(option) =>
                clave ? `${option[clave]} - ${option[descripcion]}` : option[descripcion]
            }
            value={selectedOption}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={(e, newInputValue) => setInputValue(newInputValue)}
            noOptionsText={noOptionsText}
            renderInput={(params) => (
                <>
                    <TextField
                        {...params}
                        label={label}
                        fullWidth
                        error={error}
                        helperText={helperText}
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
            isOptionEqualToValue={(option, value) => option[id] === value[id]}
        />
    );
}
