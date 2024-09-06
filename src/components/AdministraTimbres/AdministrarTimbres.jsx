import React from 'react';
import { Grid, TextField, Select, MenuItem, Button, Typography, Box, FormControl, InputLabel } from '@mui/material';

export default function AdministrarTimbres() {
    const empresas = [
        { nombre: 'Empresa Demo S.A. de C.V.', series: ['F', 'RP'] },
        { nombre: 'Empresa Demo Dos S.A. de C.V.', series: ['RP'] },
    ];

    const timbresData = empresas.map((empresa, index) => (
        <Grid container spacing={2} key={index} mx={2} alignItems="center">
            <Grid item xs={12} sm={2} my={2}>
                <TextField
                    label="Nombre"
                    fullWidth
                    placeholder="F"
         
                    disabled
                    value={empresa.nombre}


                />

            </Grid>
            <Grid item xs={12} sm={1}>
                <FormControl fullWidth variant="outlined">
                    <InputLabel>Serie</InputLabel>
                    <Select
                        defaultValue={empresa.series[0]}
                        label="Serie"
                    >
                        {empresa.series.map((serie, idx) => (
                            <MenuItem key={idx} value={serie}>
                                {serie}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={2}>
              
                <TextField fullWidth defaultValue="1,000"  label="Timbres disponibles"/>
            </Grid>
            <Grid item xs={12} sm={2}>
            <TextField fullWidth defaultValue="1,000"  label="Timbres a asignar"/>
            </Grid>
            <Grid item xs={12} sm={2}>
            <TextField fullWidth defaultValue="1,000"  label="Nuevo total"/>
            </Grid>
        </Grid>
    ));

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6">Administrar de timbres.</Typography>
            <Grid container spacing={3} marginTop={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: "#00ACC1" }}>
                        Timbres Disponibles: <strong>10,000</strong> Timbres Distribuidos: <strong>2,000</strong> Timbres Restantes: <strong>8,000</strong>
                    </Typography>
                </Grid>
                {timbresData}
                <Grid container justifyContent="flex-end" spacing={2} marginTop={3}>
                    <Grid item>
                        <Button variant="contained" style={{ backgroundColor: '#da0404', color: 'white' }}>
                            Cancelar
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button variant="contained" style={{ backgroundColor: '#04b2ca', color: 'white' }}>
                            Aplicar
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
};


