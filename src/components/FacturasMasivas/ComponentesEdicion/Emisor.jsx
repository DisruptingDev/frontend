"use client" // Indica que es un componente del lado del cliente
import React, { useState, useEffect } from 'react'; // Importa React y los hooks useState y useEffect
import { TextField, Box, Typography } from '@mui/material'; // Importa componentes de Material-UI para la interfaz
import Select from "@/components/Select/Select.jsx"; // Importa el componente Select personalizado
import { format, parseISO } from 'date-fns'; // Importa funciones para formateo de fechas

const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Obtiene la URL del API desde las variables de entorno

// Componente para seleccionar el Emisor
export default function Emisor({
    datosEmisor, // Datos del emisor a editar
    register, // Función de registro de react-hook-form
    getValues, // Función para obtener los valores del formulario
    setValue, // Función para establecer los valores del formulario
    trigger, // Función para activar la validación de react-hook-form
    errors // Función para obtener los errores de react-hook-form
}) {
    const [emisor, setEmisor] = useState(null); // Estado para almacenar la información del emisor seleccionado
    const [serieUrl, setSerieUrl] = useState(''); // Estado para manejar la URL de consulta de la serie

    // Efecto para rellenar los valores del formulario cuando se va a editar 
    useEffect(() => {
        if (datosEmisor) {
            console.log('Datos emisor', datosEmisor);
            //Asignas los valores
            setValue("EmisorID", datosEmisor.ID);
            setValue("Emisor", datosEmisor.ID);
            setValue("EmisorNombre", datosEmisor.Nombre);
            setValue("EmisorRFC", datosEmisor.RFC);
            setValue("EmisorLugarExpedicion", datosEmisor.LugarExpedicion);
            //Lanza la actualización de los valores
            trigger("EmisorID", "Emisor", "EmisorNombre", "EmisorRFC", "LugarExpedicion");

            setSerieUrl(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${datosEmisor.ID}`); // Actualiza la URL de consulta de la serie

            console.log("Serie", datosEmisor.Serie);

            setValue("Serie", datosEmisor.Serie); // Establece la serie seleccionada
            trigger("Serie"); // Activa la validación de la serie
        }
    }, [datosEmisor, setValue, trigger]);

    // Maneja el cambio del emisor seleccionado
    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setEmisor(data);
            console.log("Nuevo emisor seleccionado", data);
        } catch (error) {
            console.error("Error al parsear el emisor seleccionado", error);
        }
    };

    // Maneja el cambio de serie seleccionada
    const handleSerieChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            console.log("Nueva serie seleccionada", data);
            setValue("TipoComprobante", data.TipoComprobante); // Establece el tipo de comprobante
        } catch (error) {
            console.error("El valor de la serie no es un JSON válido:", e.target.value);
        }
    };

    // Efecto para actualizar los valores del formulario cuando cambia emisor
    useEffect(() => {
        if (emisor) {
            console.log("Emisor actualizado", emisor);
            // Recupera y establece los valores del formulario
            setValue("Emisor", emisor.ID);
            setValue("EmisorID", emisor.ID);
            setValue("EmisorNombre", emisor.Nombre);
            setValue("EmisorRFC", emisor.Rfc);
            setValue("EmisorLugarExpedicion", emisor.LugarExpedicion);
            setSerieUrl(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisor.ID}`); // Actualiza la URL de consulta de la serie
        }
    }, [emisor, setValue]);

    return (
        <Box>
            <Typography variant="h6">Emisor</Typography>
            <Box
                display="grid"
                gap={3}
                sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: '1fr 1fr '
                    }
                }}
            >
                {/* Selector de Emisor */}
                <Select
                    register={register}
                    trigger={trigger}
                    nombre="Emisor"
                    url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                    id="ID"
                    clave=""
                    descripcion="Nombre"
                    onChange={handleEmisorChange}
                    value={getValues("Emisor") || ''}
                    error={!!errors.Emisor}
                    helperText={errors.Emisor ? "Este campo es obligatorio" : ""}
                />
                {/* Selector de Serie */}
                <Select
                    register={register}
                    nombre="Serie"
                    url={serieUrl}
                    id="Clave"
                    clave='Clave'
                    descripcion="TimbresDisponibles"
                    value={getValues("Serie") || ""}
                    onChange={handleSerieChange}
                    error={!!errors.Serie}
                    helperText={errors.Serie ? "Este campo es obligatorio" : ""}
                />
            </Box>
        </Box>
    );
}
