"use client";
import React, { useEffect, useState, useCallback } from 'react';
import { TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { useRouter } from "next/navigation";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

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
                const response = await fetch(`${apiUrl}/api/administraciontimbres/TimbresDisponibles`, {
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
        const totalRecuperados = Object.values(timbresRecuperar).reduce((a, b) => a + (b || 0), 0);
        const totalAsignados = Object.values(timbresAsignar).reduce((a, b) => a + (b || 0), 0);
        const nuevoTotalRestantes = timbresDisponibles + totalRecuperados - totalAsignados;
        setTimbresRestantes(nuevoTotalRestantes);
    }, [timbresDisponibles, watch]);

    useEffect(() => {
        const subscription = watch(() => {
            calcularTimbresRestantes();
        });
        return () => subscription.unsubscribe();
    }, [calcularTimbresRestantes, watch]);

    const handleClose = () => {
        setToast({ ...toast, open: false });
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
            const response = await fetch(`${apiUrl}/api/administraciontimbres/ActualizarTimbres`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(datosCompletos),
            });
            if (response.ok) {
                setToast({ open: true, message: 'Los cambios se han aplicado correctamente.', severity: 'success' });
                setTimeout(() => {
                    router.push("/Home");
                }, 1500);
            } else {
                setToast({ open: true, message: 'Error al aplicar los cambios.', severity: 'error' });
            }
        } catch (error) {
            console.error('Error al actualizar los datos:', error);
            setToast({ open: true, message: 'Error al aplicar los cambios.', severity: 'error' });
        }
    };

    return (
        <Box bgcolor="white" my={0} mx={2} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={4}>Administrar Timbres</Typography>
            <form onSubmit={handleSubmit(onSubmit)}>
                <Box
                    my={2}
                    display="grid"
                    gridTemplateColumns="1fr"
                    gap={3}
                    alignItems="start"
                >
                    <Typography variant="subtitle1" sx={{ color: "#00ACC1" }}>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Disponibles: <strong>{timbresDisponibles}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Distribuidos: <strong>{Object.values(watch('timbresAsignar')).reduce((a, b) => a + (b || 0), 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Recuperados: <strong>{Object.values(watch('timbresRecuperar')).reduce((a, b) => a + (b || 0), 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Restantes: <strong>{timbresRestantes}</strong>
                        </Box>
                    </Typography>

                    {empresasConSeries.map((empresa) => {
                        const timbresAsignados = watch(`timbresAsignar.${empresa.ID}-${empresa.SerieClave}`) || 0;
                        const timbresRecuperados = watch(`timbresRecuperar.${empresa.ID}-${empresa.SerieClave}`) || 0;
                        const totalTimbresRestantes = (empresa.TimbresDisponibles || 0) - timbresRecuperados + timbresAsignados;

                        return (
                            <Box
                                key={`${empresa.ID}-${empresa.SerieClave}`}
                                display="grid"
                                gap={3}
                                my={2}
                                sx={{
                                    gridTemplateColumns: {
                                        xs: '1fr 0.25fr 0.25fr 0.25fr 0.25fr 0.25fr',
                                        sm: '1fr 0.25fr 0.25fr 0.25fr 0.25fr 0.25fr',
                                        md: '1fr 0.25fr 0.25fr 0.25fr 0.25fr 0.25fr',
                                        lg: '1fr 0.25fr 0.25fr 0.25fr 0.25fr 0.25fr',
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
                                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                                    onInput={(e) => {
                                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                                    }}
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
                                <TextField label="Nuevo total de timbres" fullWidth disabled value={totalTimbresRestantes} />
                            </Box>
                        );
                    })}
                </Box>

                <Box
                    my={1}
                    mx={0}
                    display="flex"
                    justifyContent="flex-end"
                    gap={3}
                >
                    <Button
                        variant="contained"
                        color="error"
                        sx={{ width: '150px', backgroundColor: '#da0404', '&:hover': { backgroundColor: '#a00303' } }}
                        type="button"
                        onClick={() => router.push("/Home")}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        sx={{
                            width: '250px',
                            backgroundColor: '#04b2ca',
                            '&:hover': { backgroundColor: '#038a9e' },
                        }}
                        type="submit"
                    >
                        Aplicar
                    </Button>
                </Box>
            </form>
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert onClose={handleClose} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                    {toast.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}