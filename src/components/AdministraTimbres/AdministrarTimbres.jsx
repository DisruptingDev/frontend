import React, { useEffect, useState } from 'react';
import { Grid, TextField, Button, Typography, Box } from '@mui/material';
import Select from '../Select/Select';
import { useForm } from 'react-hook-form';

export default function AdministrarTimbres() {
    const { register, setValue } = useForm();
    const [empresas, setEmpresas] = useState([]);
    const [seriesSeleccionadas, setSeriesSeleccionadas] = useState({});
    const [timbres, setTimbres] = useState({});
    const [timbresAsignar, setTimbresAsignar] = useState({});
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
                    setEmpresas(data);
                } else {
                    console.log("Error al cargar los clientes");
                }
            } catch (error) {
                console.log("Error al cargar los clientes: " + error);
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
                    console.log(data.TimbresDisponibles);
                    setTimbresDisponibles(data.TimbresDisponibles);
                } else {
                    console.log("Error al cargar los clientes");
                }
            } catch (error) {
                console.log("Error al cargar los clientes: " + error);
            }
        }

        fetchTimbresDisponibles();
        fetchData();
    }, []);

    const obtenerTimbres = async (empresaID, serieClave) => {
        try {
            const response = await fetch(`http://31.220.31.152:8081/Catalogos/Serie?emisorID=${empresaID}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                    'Content-Type': 'application/json',
                }
            });
            if (response.ok) {
                const data = await response.json();
                const opcionSeleccionada = data.find((opcion) => opcion.Clave === serieClave);
                return opcionSeleccionada?.TimbresDisponibles || 0;
            } else {
                console.log("Error al cargar los timbres");
            }
        } catch (error) {
            console.log("Error al cargar los timbres: " + error);
        }
    };

    const handleSerieChange = async (empresaID, event) => {
        const nuevaSerie = event.target.value;
        const serie = JSON.parse(nuevaSerie);

        setSeriesSeleccionadas((prev) => ({
            ...prev,
            [empresaID]: serie.Clave,
        }));

        const timbresDisponibles = await obtenerTimbres(empresaID, serie.Clave);

        setTimbres((prevTimbres) => ({
            ...prevTimbres,
            [empresaID]: timbresDisponibles,
        }));

        // Re-inicializa el total de timbres al cambiar la serie
        setTotalTimbres((prevTotal) => ({
            ...prevTotal,
            [empresaID]: timbresDisponibles,
        }));
    };

    const handleTimbresAsignarChange = (empresaID, event) => {
        const timbresAAsignar = parseInt(event.target.value) || 0;

        setTimbresAsignar((prevAsignar) => ({
            ...prevAsignar,
            [empresaID]: timbresAAsignar,
        }));

        // Actualiza el total de timbres solamente sumando timbres disponibles y asignados
        setTotalTimbres((prevTotal) => ({
            ...prevTotal,
            [empresaID]: (timbres[empresaID] || 0) + timbresAAsignar,
        }));
    };

    const compilarDatos = () => {
        const datosCompletos = empresas.map((empresa) => ({
            empresaID: empresa.ID,
            nombre: empresa.Nombre,
            serieSeleccionada: seriesSeleccionadas[empresa.ID] || null,
            timbresAsignados: timbresAsignar[empresa.ID] || 0,
            nuevoTotal: totalTimbres[empresa.ID] || timbres[empresa.ID] || 0,
        }));
        console.log(datosCompletos);
    };

    const timbresData = empresas.map((empresa) => (
        <Box
            key={empresa.ID}
            display="grid"
            gap={3}
            my={2}
            mx={2}
            sx={{
                gridTemplateColumns: {
                    xs: '1fr',
                    sm: 'repeat(2, 1fr)',
                    md: 'repeat(3, 1fr)',
                    lg: '1.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr '
                }
            }}
        >
            <TextField
                label="Nombre"
                fullWidth
                placeholder="F"
                disabled
                value={empresa.Nombre}
            />
            <Select
                register={register}
                nombre="Serie"
                url={`http://31.220.31.152:8081/Catalogos/Serie?emisorID=${empresa.ID}`}
                id="Clave"
                descripcion="Clave"
                value={seriesSeleccionadas[empresa.ID] || "F"}
                onChange={(event) => handleSerieChange(empresa.ID, event)}
            />
            <TextField
                fullWidth
                value={timbres[empresa.ID] || 0}
                label="Timbres disponibles"
                disabled
            />
            <TextField
                fullWidth
                label="Timbres a asignar"
                placeholder="0"
                defaultValue={0}
                type="number"
                onChange={(event) => handleTimbresAsignarChange(empresa.ID, event)}
            />
            <TextField
                fullWidth
                label="Nuevo total de timbres"
                value={totalTimbres[empresa.ID] || 0}
                type="number"
                disabled
            />
        </Box>
    ));

    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6">Administrar de timbres.</Typography>
            <Grid container spacing={3} marginTop={2}>
                <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: "#00ACC1" }}>
                        Timbres Disponibles: <strong>{timbresDisponibles}</strong> Timbres Distribuidos: <strong>{Object.values(timbresAsignar).reduce((a, b) => a + b, 0)}</strong> Timbres Restantes: <strong>{timbresDisponibles - Object.values(timbresAsignar).reduce((a, b) => a + b, 0)}</strong>
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
