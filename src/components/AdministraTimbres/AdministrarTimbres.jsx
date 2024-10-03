import React, { useEffect, useState } from 'react';
import { Grid, TextField, Button, Typography, Box, Snackbar, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';

export default function AdministrarTimbres() {
    const { register } = useForm();
    const [empresas, setEmpresas] = useState([]);
    const [empresasConSeries, setEmpresasConSeries] = useState([]);
    const [timbresAsignar, setTimbresAsignar] = useState({});
    const [timbresRecuperar, setTimbresRecuperar] = useState({});
    const [timbresDisponibles, setTimbresDisponibles] = useState(0);
    const [timbresRestantes, setTimbresRestantes] = useState(0);
    const [errorMessages, setErrorMessages] = useState({});

    const [openSnackbar, setOpenSnackbar] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
const [snackbarSeverity, setSnackbarSeverity] = useState('success'); // 'success' | 'error'

    useEffect(() => {
        async function fetchData() {
            try {
                const response = await fetch(`http://31.220.31.152:8081/Catalogos/Emisor`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    const empresasConSeries = [];

                    for (let empresa of data) {
                        const seriesResponse = await fetch(`http://31.220.31.152:8081/Catalogos/Serie?emisorID=${empresa.ID}`, {
                            headers: {
                                'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                            },
                        });
                        const seriesData = await seriesResponse.json();

                        for (let serie of seriesData) {
                            empresasConSeries.push({
                                ...empresa,
                                SerieClave: serie.Clave,
                                TimbresDisponibles: serie.TimbresDisponibles || 0,
                            });
                        }
                    }
                    setEmpresasConSeries(empresasConSeries);
                } else {
                    console.log("Error al cargar las empresas");
                }
            } catch (error) {
                console.log("Error al cargar las empresas: " + error);
            }
        }

        async function fetchTimbresDisponibles() {
            try {
                const response = await fetch(`http://31.220.31.152:8085/TimbresDisponibles`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    },
                });
                if (response.ok) {
                    const data = await response.json();
                    setTimbresDisponibles(data.TimbresDisponibles);
                    setTimbresRestantes(data.TimbresDisponibles);
                } else {
                    console.log("Error al cargar los timbres disponibles");
                }
            } catch (error) {
                console.log("Error al cargar los timbres disponibles: " + error);
            }
        }

        fetchTimbresDisponibles();
        fetchData();
    }, []);

    useEffect(() => {
        calcularTimbresRestantes();
    }, [timbresAsignar, timbresRecuperar, timbresDisponibles]);

    const handleTimbresAsignarChange = (empresaID, serieClave, event) => {
        const timbresAAsignar = parseInt(event.target.value) || 0;
        setTimbresAsignar((prevAsignar) => ({
            ...prevAsignar,
            [`${empresaID}-${serieClave}`]: timbresAAsignar,
        }));
    };

    const handleTimbresRecuperarChange = (empresaID, serieClave, event) => {
        const timbresARecuperar = parseInt(event.target.value) || 0;
        setTimbresRecuperar((prevRecuperar) => ({
            ...prevRecuperar,
            [`${empresaID}-${serieClave}`]: timbresARecuperar,
        }));
    };

    const calcularTimbresRestantes = () => {
        const totalRecuperados = Object.values(timbresRecuperar).reduce((a, b) => a + b, 0);
        const totalAsignados = Object.values(timbresAsignar).reduce((a, b) => a + b, 0);
        const nuevoTotalRestantes = timbresDisponibles + totalRecuperados - totalAsignados;

        setTimbresRestantes(nuevoTotalRestantes);
    };

    const validarDatos = () => {
        const nuevosErrores = {};
        const totalRecuperados = Object.values(timbresRecuperar).reduce((a, b) => a + b, 0);
        const totalAsignados = Object.values(timbresAsignar).reduce((a, b) => a + b, 0);

        empresasConSeries.forEach((empresa) => {
            const timbresRecuperados = timbresRecuperar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
            const timbresAsignados = timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0;

            if (timbresRecuperados > empresa.TimbresDisponibles) {
                nuevosErrores[`${empresa.ID}-${empresa.SerieClave}`] = "No hay suficientes timbres disponibles para recuperar.";
            }
            // if (timbresAsignados > timbresRestantes) {
            //     nuevosErrores[`${empresa.ID}-${empresa.SerieClave}`] = "No hay suficientes timbres restantes.";
            // }
            if(timbresRestantes<0){
                nuevosErrores[`${empresa.ID}-${empresa.SerieClave}`] = "No hay suficientes timbres restantes.";
            }
        });

        if (Object.keys(nuevosErrores).length > 0) {
            setErrorMessages(nuevosErrores);
            return false; // Si hay errores, retornar falso
        }

        setErrorMessages({});
        return true; // Si no hay errores, retornar verdadero
    };

    const compilarDatos = () => {
        if (!validarDatos()) {
            setSnackbarMessage('Por favor, corrige los errores antes de aplicar.');
            setSnackbarSeverity('error');
            setOpenSnackbar(true);
            return; // Si hay errores, no continuar
        }
    
        const datosCompletos = empresasConSeries.map((empresa) => {
            const timbresAsignados = timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
            const timbresRecuperados = timbresRecuperar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
    
            // Calcular timbres restantes
            const totalTimbresRestantes = (empresa.TimbresDisponibles || 0) - timbresRecuperados + timbresAsignados;
    
            return {
                empresaID: empresa.ID,
                nombre: empresa.Nombre,
                serieSeleccionada: empresa.SerieClave,
                timbresAsignados,
                timbresRecuperados,
                nuevoTotal: totalTimbresRestantes,
            };
        });
    
        console.log(datosCompletos);
        // Mostrar mensaje de éxito
        setSnackbarMessage('Los cambios se han aplicado correctamente.');
        setSnackbarSeverity('success');
        setOpenSnackbar(true);
    };
    const timbresData = empresasConSeries.map((empresa) => {
        const timbresAsignados = timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0;
        const timbresRecuperados = timbresRecuperar[`${empresa.ID}-${empresa.SerieClave}`] || 0;

        const totalTimbresRestantes = (empresa.TimbresDisponibles || 0) - timbresRecuperados + timbresAsignados;

        return (
            <Box
                fullWidth
                key={`${empresa.ID}-${empresa.SerieClave}`}
                display="grid"
                gap={3}
                my={2}
                mx={2}
                sx={{
                    gridTemplateColumns: {
                        xs: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr',
                        sm: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr',
                        md: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr ',
                        lg: '1.5fr 0.5fr 0.8fr 0.8fr 0.8fr 0.8fr '
                    }
                }}
            >
                <TextField
                    label="Nombre"
                    fullWidth
                    disabled
                    value={empresa.Nombre}
                />
                <TextField
                    label="Serie"
                    fullWidth
                    disabled
                    value={empresa.SerieClave}
                />
                <TextField
                    fullWidth
                    value={empresa.TimbresDisponibles || 0}
                    label="Timbres disponibles"
                    disabled
                />
                <TextField
                
                    fullWidth
                    label="Timbres a asignar"
                    placeholder="0"
                    type="number"
                    value={timbresAsignados}
                    onChange={(event) => handleTimbresAsignarChange(empresa.ID, empresa.SerieClave, event)}
                    error={ timbresRestantes < 0}
                    helperText={ timbresRestantes < 0 ? "Timbres insuficientes" : ""}
                />
                <TextField
                    fullWidth
                    label="Timbres a recuperar"
                    placeholder="0"
                    type="number"
                    value={timbresRecuperados}
                    onChange={(event) => handleTimbresRecuperarChange(empresa.ID, empresa.SerieClave, event)}
                    error={ timbresRecuperados > empresa.TimbresDisponibles}
                    helperText={timbresRecuperados > empresa.TimbresDisponibles ? "Timbres insuficientes": ""}
                />
                <TextField
                    fullWidth
                    label="Nuevo total de timbres"
                    value={totalTimbresRestantes}
                    disabled
                />
            </Box>
        );
    });


    return (
        <Box>
            <Typography variant="h6">Administrar de timbres.</Typography>
            <Grid container spacing={3} marginTop={2}>
                <Grid item xs={12} sm={12}>
                    <Typography variant="subtitle1" sx={{ color: "#00ACC1" }}>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Disponibles: <strong>{timbresDisponibles}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Distribuidos: <strong>{Object.values(timbresAsignar).reduce((a, b) => a + b, 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Recuperados: <strong>{Object.values(timbresRecuperar).reduce((a, b) => a + b, 0)}</strong>
                        </Box>
                        <Box component="span" sx={{ marginRight: 2 }}>
                            Timbres Restantes: <strong>{timbresRestantes}</strong>
                        </Box>
                    </Typography>
                </Grid>
                {timbresData}
            </Grid>
            <Grid container justifyContent="flex-end" spacing={2} marginTop={3}>
                    <Grid item>
                        <Button variant="contained" style={{ backgroundColor: '#da0404', color: 'white' }}>
                            Cancelar
                        </Button>
                    </Grid>
                    <Grid item>
                        <Button
                            variant="contained"
                            style={{ backgroundColor: '#04b2ca', color: 'white' }}
                            onClick={compilarDatos}
                        >
                            Aplicar
                        </Button>
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
