"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { Grid, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AsignarTimbresPlan({ token }) {
    const router = useRouter();
    const { register, handleSubmit, watch, trigger, setValue, formState: { errors } } = useForm({
        defaultValues: {
            timbresAsignar: {}
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
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                });
                if (response.ok) {
                    const data = await response.json();
                    const empresasConSeries = [];
                    for (let empresa of data) {
                        const seriesResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${empresa.ID}`, {
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
                            setValue(`timbresAsignar.${empresa.ID}-${serie.Clave}`, 0);
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
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/TimbresDisponibles`, {
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
        const totalAsignados = Object.values(timbresAsignar).reduce((a, b) => a + (b || 0), 0);
        const nuevoTotalRestantes = timbresDisponibles - totalAsignados;
        setTimbresRestantes(nuevoTotalRestantes);
    }, [timbresDisponibles, watch]);

    useEffect(() => {
        const subscription = watch(() => {
            calcularTimbresRestantes();
        });
        return () => subscription.unsubscribe();
    }, [calcularTimbresRestantes, watch]);

    const onSubmit = async (data) => {
        const series = empresasConSeries.map((empresa) => {
            const timbresAsignados = data.timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
            const nuevoTotal = (empresa.TimbresDisponibles || 0) - timbresAsignados;
            return {
                ID: empresa.SerieID,
                TimbresDisponibles: nuevoTotal,
                EmisorID: empresa.ID,
            };
        });

        const datosCompletos = { Series: series };
        console.log('Datos a enviar:', datosCompletos);

        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/ActualizarTimbres`, {
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
        const totalTimbresRestantes = (empresa.TimbresDisponibles || 0) - timbresAsignados;

        return (
            <Box
                key={`${empresa.ID}-${empresa.SerieClave}`}
                display="grid"
                gap={3}
                my={2}
                mx={2}
                sx={{
                    gridTemplateColumns: {
                        xs: '1.5fr 0.5fr 0.5fr 0.5fr',
                        sm: '1.5fr 0.5fr 0.5fr 0.5fr',
                        md: '1.5fr 0.5fr 0.5fr 0.5fr',
                        lg: '1.5fr 0.5fr 0.5fr 0.5fr'
                    }
                }}
            >
                <TextField label="Nombre" fullWidth disabled value={empresa.Nombre} />
                <TextField label="Serie" fullWidth disabled value={empresa.SerieClave} />
                {/* <TextField label="Timbres disponibles" fullWidth disabled value={empresa.TimbresDisponibles || 0} /> */}
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
                            if (timbresRestantes < 0) return "No se pueden asignar más timbres de los restantes";
                            return true;
                        }
                    })}
                    error={!!errors.timbresAsignar?.[`${empresa.ID}-${empresa.SerieClave}`]}
                    helperText={errors.timbresAsignar?.[`${empresa.ID}-${empresa.SerieClave}`]?.message}
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                    onChange={async (e) => {
                        setValue(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`, e.target.value);
                        await trigger(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`);
                    }}
                    onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }}
                />
                {/* <TextField label="Nuevo total de timbres" fullWidth disabled value={totalTimbresRestantes} /> */}
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
                            Timbres Distribuidos: <strong>{Object.values(watch('timbresAsignar')).reduce((a, b) => a + (b || 0), 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Restantes: <strong>{timbresRestantes}</strong>
                        </Box>
                    </Typography>
                </Grid>
                <Grid item xs={12}>
                    {timbresData}
                </Grid>
                <Grid container justifyContent="flex-end" spacing={2} sx={{ paddingRight: 2, marginTop: 2 }}>
                    <Button variant="contained" color="primary" type="submit">Guardar</Button>
                </Grid>
            </Grid>
            <Snackbar open={openSnackbar} autoHideDuration={6000} onClose={() => setOpenSnackbar(false)}>
                <Alert onClose={() => setOpenSnackbar(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
