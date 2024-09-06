"use client";
import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button, TextField, Box, Snackbar, Alert, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import Image from 'next/image';

export default function AltaSerie() {


    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={4}>Alta de Serie</Typography>
            <form>
                <Box
                    my={2}
                    display="grid"
                    gridTemplateColumns="2fr 2fr 1fr 1fr 2fr"
                    gap={3}
                    alignItems="start"
                >

                    <Select
                        nombre="Empresa"
                        url=""
                        clave="Clave"
                        descripcion="Descripcion"
                        fullWidth
                        required

                    />
                    <Select
                        label="Tipo de Comprobante"
                        nombre="Empresa"
                        url=""
                        clave="Clave"
                        descripcion="Descripcion"
                        fullWidth
                        required

                    />
                    <TextField
                        label="Nombre"
                        fullWidth
                        placeholder="F"
                        margin="normal"
                        required

                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                    <TextField
                        label="Folio Inicial"
                        fullWidth
                        placeholder="F"
                        margin="normal"
                        required

                        sx={{ alignSelf: 'start', 'margin-top': '0px' }}
                    />
                </Box>




                <Box
                    my={4}
                    mx={0}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                >
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px', backgroundColor: '#da0404' }}
                        type="button"

                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{ width: '250px', backgroundColor: '#04b2ca' }}
                        type="button"

                    >
                        Guardar
                    </Button>
                </Box>
            </form>


        </Box>
    );
}
