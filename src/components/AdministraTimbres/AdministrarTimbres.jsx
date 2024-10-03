import React, { useEffect, useState } from 'react';
import { Grid, TextField, Button, Typography, Box } from '@mui/material';
import { useForm } from 'react-hook-form';

export default function AdministrarTimbres() {
    const { register } = useForm();
    const [empresas, setEmpresas] = useState([]);
    const [empresasConSeries, setEmpresasConSeries] = useState([]); // Nueva lista de empresas con series
    const [timbresAsignar, setTimbresAsignar] = useState({});
    const [timbresRecuperar, setTimbresRecuperar] = useState({});
    const [totalTimbres, setTotalTimbres] = useState({});
    const [timbresDisponibles, setTimbresDisponibles] = useState(0);

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

                    // Obtener las series para cada empresa y aplanar la estructura
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

    const compilarDatos = () => {
        const datosCompletos = empresasConSeries.map((empresa) => ({
            empresaID: empresa.ID,
            nombre: empresa.Nombre,
            serieSeleccionada: empresa.SerieClave,
            timbresAsignados: timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0,
            timbresRecuperados: timbresRecuperar[`${empresa.ID}-${empresa.SerieClave}`] || 0,
            nuevoTotal: totalTimbres[`${empresa.ID}-${empresa.SerieClave}`] || empresa.TimbresDisponibles,
        }));
        console.log(datosCompletos);
    };

    const timbresData = empresasConSeries.map((empresa) => (
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
                defaultValue={0}
                type="number"
                onChange={(event) => handleTimbresAsignarChange(empresa.ID, empresa.SerieClave, event)}
            />
            <TextField
                fullWidth
                label="Timbres a recuperar"
                placeholder="0"
                defaultValue={0}
                type="number"
                onChange={(event) => handleTimbresRecuperarChange(empresa.ID, empresa.SerieClave, event)}
            />
            <TextField
                fullWidth
                label="Nuevo total de timbres"
                value={
                    (empresa.TimbresDisponibles || 0)
                    - (timbresRecuperar[`${empresa.ID}-${empresa.SerieClave}`] || 0)
                    + (timbresAsignar[`${empresa.ID}-${empresa.SerieClave}`] || 0)
                }
                disabled
            />
        </Box>
    ));

    return (
        <Box >
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
                            Timbres Restantes: <strong>
                                {timbresDisponibles
                                    - Object.values(timbresAsignar).reduce((a, b) => a + b, 0)
                                    + Object.values(timbresRecuperar).reduce((a, b) => a + b, 0)}
                            </strong>
                        </Box>
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
                        <Button
                            variant="contained"
                            style={{ backgroundColor: '#04b2ca', color: 'white' }}
                            onClick={compilarDatos}
                        >
                            Aplicar
                        </Button>
                    </Grid>
                </Grid>
            </Grid>
        </Box>
    );
}
