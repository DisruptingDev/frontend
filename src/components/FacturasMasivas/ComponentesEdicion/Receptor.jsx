"use client" // Indica que es un componente del lado del cliente
import React, { useState, useEffect } from 'react'; // Importa React y los hooks useState y useEffect
import { Box, Typography } from '@mui/material'; // Importa componentes de Material-UI para la interfaz
import Select from "@/components/Select/Select.jsx"; // Importa el componente Select personalizado

const apiUrl = process.env.NEXT_PUBLIC_API_URL; // Obtiene la URL del API desde las variables de entorno

// Componente para seleccionar el Receptor
export default function Receptor({
    register, // Función de registro de react-hook-form
    trigger,  // Función para activar la validación de react-hook-form
    datosReceptor, // Datos del receptor a editar
    setValue, // Función para establecer los valores del formulario
    getValues, // Función para obtener los valores del formulario
    errors // Función para obtener los errores del formulario
}) {
    const [receptor, setReceptor] = useState({}); // Estado para almacenar el receptor seleccionado
    const [regimenFiscal, setRegimenFiscal] = useState(''); // Estado para el régimen fiscal
    const [usoCFDIURL, setUsoCFDIURL] = useState(''); // Estado para la URL de consulta del UsoCFDI

    // Efecto para rellenar los valores del formulario cuando se va a editar 
    useEffect(() => {
        if (datosReceptor) {
            console.log('Receptor', datosReceptor);
            //Asignas los valores
            setValue("MetodoPago", datosReceptor.MetodoPago);
            setValue("Receptor", datosReceptor.ID);
            setValue("ReceptorID", datosReceptor.ID);
            setValue("ReceptorNombre", datosReceptor.Nombre);
            setValue("ReceptorRFC", datosReceptor.RFC);
            setValue("RegimenFiscal", datosReceptor.RegimenFiscal);
            setUsoCFDIURL(`${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${datosReceptor.RegimenFiscal}`); // Actualiza la URL de consulta del UsoCFDI
            setValue("UsoCFDI", datosReceptor.UsoCFDI);
            setValue("UsoCFDIID", datosReceptor.UsoCFDIID);
            setValue("FormaPago", datosReceptor.FormaPago);

            // Llama a los triggers para actualizar los valores
            trigger("UsoCFDIID", "ReceptorID", "MetodoPago", "Receptor");
        }
    }, [datosReceptor, setValue, trigger]);

    // Efecto para actualizar los valores del formulario cuando cambia receptor
    useEffect(() => {

        if (Object.keys(receptor).length !== 0) { // Si hay un receptor seleccionado
            console.log('Receptor seleccionado', receptor);
            // Recupera y establece los valores del formulario
            setValue("Receptor", receptor.ID);
            setValue("ReceptorID", receptor.ID);
            setValue("ReceptorNombre", receptor.Nombre);
            setValue("ReceptorRFC", receptor.Rfc);
            setValue("ReceptorRegimenFiscal", receptor.RegimenFiscalReceptor);
            setRegimenFiscal(receptor.RegimenFiscalReceptor); // Establece el régimen fiscal
            setUsoCFDIURL(`${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${receptor.RegimenFiscalReceptor}`); // Actualiza la URL de consulta del UsoCFDI

            trigger("Receptor");
        }
    }, [receptor, setValue, trigger]);

    // Maneja el cambio del receptor seleccionado
    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setReceptor(data);
            console.log("Nuevo receptor seleccionado", data);
        } catch (error) {
            console.error("El valor del receptor no es un JSON válido:", e.target.value);
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
            <Typography variant='h6'>Receptor</Typography>
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
                    error={!!errors.UsoCFDI}
                    helperText={errors.UsoCFDI ? "Este campo es obligatorio" : ""}
                />
            </Box>
        </Box>
    );
}
