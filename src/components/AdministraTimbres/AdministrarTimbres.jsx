"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { Grid, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";

export default function AdministrarTimbres({ token }) {
    const router = useRouter();
    const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({
        defaultValues: {
            timbresAsignar: {},
            timbresRecuperar: {},
        }
    });

    const [empresasConSeries, setEmpresasConSeries] = useState([]);
    const [timbresDisponibles, setTimbresDisponibles] = useState(0);
    const [timbresRestantes, setTimbresRestantes] = useState(0);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');

    const fetchData = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`http://31.220.31.152:8081/Catalogos/Emisor`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    const empresasConSeries = [];
                    for (let empresa of data) {
                        const seriesResponse = await fetch(`http://31.220.31.152:8081/Catalogos/Serie?emisorID=${empresa.ID}`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                        });
                        const seriesData = await seriesResponse.json();
                        for (let serie of seriesData) {
                            empresasConSeries.push({
                                ...empresa,
                                SerieID: serie.ID,
                                SerieClave: serie.Clave,
                                TimbresDisponibles: serie.TimbresDisponibles || 0,
                            });
                            // Set default values for form inputs to 0
                            setValue(`timbresAsignar.${empresa.ID}-${serie.Clave}`, 0);
                            setValue(`timbresRecuperar.${empresa.ID}-${serie.Clave}`, 0);
                        }
                    }
                    setEmpresasConSeries(empresasConSeries);
                }
            } catch (error) {
                console.log("Error al cargar las empresas: " + error);
            }
        }
    }, [token, setValue]);

    const fetchTimbresDisponibles = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`http://31.220.31.152:8085/TimbresDisponibles`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    setTimbresDisponibles(data.TimbresDisponibles);
                    setTimbresRestantes(data.TimbresDisponibles);
                }
            } catch (error) {
                console.log("Error al cargar los timbres disponibles: " + error);
            }
        }
    }, [token]);

    useEffect(() => {
        if (token) {
            fetchTimbresDisponibles();
            fetchData();
        }
    }, [fetchData, fetchTimbresDisponibles, token]);

    const calcularTimbresRestantes = useCallback(() => {
        const timbresAsignar = watch('timbresAsignar');
        const timbresRecuperar = watch('timbresRecuperar');
        const totalRecuperados = Object.values(timbresRecuperar).reduce((a, b) => a + b, 0);
        const totalAsignados = Object.values(timbresAsignar).reduce((a, b) => a + b, 0);
        const nuevoTotalRestantes = timbresDisponibles + totalRecuperados - totalAsignados;
        setTimbresRestantes(nuevoTotalRestantes);
    }, [timbresDisponibles, watch]);

    // Este efecto se ejecuta cada vez que cambia un campo de asignar o recuperar
    useEffect(() => {
        const subscription = watch(() => {
            calcularTimbresRestantes();
        });
        return () => subscription.unsubscribe(); // Limpiar la suscripción al desmontar
    }, [calcularTimbresRestantes, watch]);

    const handleChange = (fieldName) => async () => {
        // Trigger validation when the field changes
        await trigger(fieldName);
    };
    const onSubmit = async (data) => {
        const series = empresasConSeries.map((empresa) => {
            const timbresAsignados = data.timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
            const timbresRecuperados = data.timbresRecuperar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
            const nuevoTotal = (empresa.TimbresDisponibles || 0) - timbresRecuperados + timbresAsignados;
            return {
                ID: empresa.SerieID,
                TimbresDisponibles: nuevoTotal,
                EmisorID: empresa.ID,
            };
        });

        const datosCompletos = { Series: series };
        console.log('Datos a enviar:', datosCompletos);

        try {
            const response = await fetch('http://31.220.31.152:8085/ActualizarTimbres', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(datosCompletos),
            });
            if (response.ok) {
                setSnackbarMessage('Los cambios se han aplicado correctamente.');
                setSnackbarSeverity('success');
                setTimeout(() => {
                    router.push("/Home");
                }, 1500);
            } else {
                setSnackbarMessage('Error al aplicar los cambios.');
                setSnackbarSeverity('error');
            }
        } catch (error) {
            console.error('Error al actualizar los datos:', error);
            setSnackbarMessage('Error al aplicar los cambios.');
            setSnackbarSeverity('error');
        }
        setOpenSnackbar(true);
    };

    const timbresData = empresasConSeries.map((empresa) => {
        const timbresAsignados = watch(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`) || 0;
        const timbresRecuperados = watch(`timbresRecuperar.${empresa.ID}-${empresa.SerieClave}`) || 0;
        const totalTimbresRestantes = (empresa.TimbresDisponibles || 0) - timbresRecuperados + timbresAsignados;

        return (
            <Box
                key={`${empresa.ID}-${empresa.SerieClave}`}
                display="grid"
                gap={3}
                my={2}
                mx={2}
                sx={{
                    gridTemplateColumns: {
                        xs: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr',
                        sm: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr',
                        md: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr',
                        lg: '1.5fr 0.5fr 0.8fr 0.8fr 0.8fr 0.8fr'
                    }
                }}
            >
                <TextField label="Nombre" fullWidth disabled value={empresa.Nombre} />
                <TextField label="Serie" fullWidth disabled value={empresa.SerieClave} />
                <TextField label="Timbres disponibles" fullWidth disabled value={empresa.TimbresDisponibles || 0} />
                <TextField
                    label="Timbres a recuperar"
                    fullWidth
                    type="number"
                    required
                    placeholder="0"
                    {...register(`timbresRecuperar.${empresa.ID}-${empresa.SerieClave}`, {
                        valueAsNumber: true,
                        validate: value => {
                            if (value < 0) return "No se permiten valores negativos";
                            if (totalTimbresRestantes < 0) return "No se pueden recuperar más del nuevo total de timbres";
                            return true;
                        }
                    })}
                    onChange={async (e) => {
                        setValue(`timbresRecuperar.${empresa.ID}-${empresa.SerieClave}`, e.target.value);

                        await trigger(`timbresRecuperar.${empresa.ID}-${empresa.SerieClave}`);
                    }}
                    error={!!errors.timbresRecuperar?.[`${empresa.ID}-${empresa.SerieClave}`]}
                    helperText={errors.timbresRecuperar?.[`${empresa.ID}-${empresa.SerieClave}`]?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} // Acepta solo números
                    onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }} // Elimina caracteres no numéricos
                />
                <TextField
                    label="Timbres a asignar"
                    fullWidth
                    type="number"
                    placeholder="0"
                    required
                    {...register(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`, {
                        valueAsNumber: true,
                        validate: value => {
                            if (value < 0) return "No se permiten valores negativos";
                            if ( timbresRestantes<0) return "No se pueden asignar más timbres de los restantes";
                            return true;
                        }
                    })}
                    error={!!errors.timbresAsignar?.[`${empresa.ID}-${empresa.SerieClave}`]}
                    helperText={errors.timbresAsignar?.[`${empresa.ID}-${empresa.SerieClave}`]?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} // Acepta solo números
                    // onChange={handleChange(`timbresRecuperar.${empresa.ID}-${empresa.SerieClave}`)}
                    onChange={async (e) => {
                        setValue(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`, e.target.value);

                        await trigger(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`);
                    }}
                    onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }} // Elimina caracteres no numéricos
                />
                
                <TextField label="Nuevo total de timbres" fullWidth disabled value={totalTimbresRestantes} />
            </Box>
        );
    });

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={3} marginTop={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: "#00ACC1" }}>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Disponibles: <strong>{timbresDisponibles}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Distribuidos: <strong>{Object.values(watch('timbresAsignar')).reduce((a, b) => a + b, 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Recuperados: <strong>{Object.values(watch('timbresRecuperar')).reduce((a, b) => a + b, 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Restantes: <strong>{timbresRestantes}</strong>
                        </Box>
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    {timbresData}
                </Grid>
                <Grid container justifyContent="flex-end" spacing={2} marginTop={3}>
                    <Grid item>
                        <Button variant="contained" type="button" onClick={() => router.push("/Home")} sx={{ backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' }}}>
                            Cancelar
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            sx={{ backgroundColor: '#04b2ca','&:hover': { backgroundColor: '#038a9e' }}}
                            type="submit"
                        >
                            Aplicar
                        </Button>
                    </Grid>
                </Grid>

            </Grid>
            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                        padding: '12px'
                    }}

                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
