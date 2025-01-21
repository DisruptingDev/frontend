"use client"
import React, { useState, useEffect, use } from 'react';
import { TextField, Box, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { format, parseISO } from 'date-fns';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Receptor({ register, trigger, datosReceptor, setValue, getValues }) {
    const [receptor, setReceptor] = useState({});
    const [regimenFiscal, setRegimenFiscal] = useState('');
    const [usoCFDIURL, setUsoCFDIURL] = useState('');

    useEffect(() => {
        if (datosReceptor) {
            console.log('Receptor', datosReceptor);
            setReceptor(datosReceptor);
            setValue("Receptor", datosReceptor.ID);

            trigger("Receptor");

        }
    }, [datosReceptor, setValue, trigger]);

    useEffect(() => {
        if (receptor) {
            console.log('Receptor', receptor);
            setValue("Receptor", receptor.ID);
            setValue("ReceptorID", receptor.ID);
            setRegimenFiscal(receptor.RegimenFiscalReceptor);
            setUsoCFDIURL(`${apiUrl}/api/catalogos/Catalogos/UsoCFDI?regimenFiscalClave=${receptor.RegimenFiscalReceptor}`);
            trigger("Receptor");

        }
    }, [receptor, setValue, trigger]);

    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setReceptor(data);
            console.log(data);
        } catch (error) {
            console.error("El valor de receptor no es un JSON válido:", e.target.value);
        }
    }

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
                <Select
                    register={register}
                    nombre="Receptor"
                    trigger={trigger}
                    url={`${apiUrl}/api/catalogos/Catalogos/Receptor`}
                    id="ID"
                    descripcion="Nombre"
                    onChange={handleReceptorChange}
                    value={getValues("ReceptorID") || ""}
                />
                <Select
                    register={register}
                    nombre="MetodoPago"
                    url={`${apiUrl}/api/catalogos/Catalogos/MetodoPago`}
                    clave="Clave"
                    descripcion="Descripcion"

                    // onChange={(e) => {
                    //     setMetodoPago(e.target.value);
                    // }}
                // value={getValues("MetodoPago") || ""}

                />

                <Select
                    register={register}
                    nombre="FormaPago"
                    url={`${apiUrl}/api/catalogos/Catalogos/FormaPago`}
                    clave="Clave"
                    descripcion="Descripcion"

                    // onChange={(e) => setFormaPago(e.target.value)}
                // value={getValues("FormaPago") || ""}

                />
                <Select
                    register={register}
                    nombre="UsoCFDI"
                    // url="`${apiUrl}/Catalogos/UsoCFDI"
                    url={usoCFDIURL}
                    clave="Clave"
                    descripcion="Descripcion"
                   
                    // onChange={(e) => setUsoCFDI(e.target.value)}
                    value={getValues("UsoCFDI") || ""}
                />



              
            </Box>
            {/* <pre>{JSON.stringify(usoCFDIURL || "No hay valor", null, 2)}</pre> */}
        </Box>
    )
}