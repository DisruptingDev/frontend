"use client";
import React, { useState, useEffect, use } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { format, parseISO } from 'date-fns';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Emisor({ datosEmisor, register, getValues, setValue, trigger }) {

    const [emisor, setEmisor] = useState({});
    const [serieUrl, setSerieUrl] = useState('');
    useEffect(() => {

        if (datosEmisor) {
            if (datosEmisor.Error) {
                //console.log('Emisor Error', datosEmisor.Error);
            }
            else {
                setEmisor(datosEmisor);
                //console.log('Emisor', datosEmisor.ID);
                setValue("EmisorID", datosEmisor.ID);
                setValue("Emisor", datosEmisor.ID);
                setValue("Nombre", datosEmisor.Nombre);
                trigger("EmisorID", "Emisor");


                setSerieUrl(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${datosEmisor.ID}`);
                if (datosEmisor["Serie-Error"]) {
                    //console.log(datosEmisor["Serie-Error"]);
                } else {
                    //console.log("Serie", datosEmisor.Serie);
                    setValue("Serie", datosEmisor.Serie);
                    trigger("Serie");
                }
            }

        }
    }, [datosEmisor, setValue, trigger]);

    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setEmisor(data);
            //console.log(data);
        } catch (error) {

        }
    };

    const handleSerieChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            //console.log("SERie", data);
            setValue("TipoComprobante", data.TipoComprobante);
        } catch (error) {
            console.error("El valor de emisor no es un JSON válido:", e.target.value);
        }
    }

    useEffect(() => {
        if (emisor) {
            setValue("Emisor", emisor.ID);
            setSerieUrl(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisor.ID}`);
        }

    }, [emisor, setValue]);

    return (
        <Box >
            <Typography variant="h6" >Emisor</Typography>
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
                <Select
                    register={register}
                    trigger={trigger}
                    nombre="Emisor"
                    url={`${apiUrl}/api/catalogos/Catalogos/Emisor`}
                    id="ID"
                    clave=""
                    descripcion="Nombre"
                    onChange={handleEmisorChange}
                    value={getValues("Nombre") || ''}
                />
                <Select
                    register={register}
                    nombre="Serie"
                    url={serieUrl}
                    id="Clave"
                    clave='Clave'
                    descripcion="TimbresDisponibles"

                    value={getValues("Serie") || ""}
                    onChange={handleSerieChange}
                />
            </Box>
        </Box>
    )
}