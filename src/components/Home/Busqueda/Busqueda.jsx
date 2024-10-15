"use client";

import React, { useState, useEffect } from 'react';
import { get, useForm } from 'react-hook-form';
import { Box, Button, FormControl, InputLabel, MenuItem, Select as MuiSelect, Snackbar, Alert } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import PickersMinMax from "@/components/PickersMinMax/PickersMinMax.jsx";
import 'react-datepicker/dist/react-datepicker.css';
import { set } from 'date-fns';

import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';

export default function SearchFilter({setFiltro}) {
    const { register, handleSubmit, reset, setValue, getValues, formState: { errors } } = useForm({
        defaultValues: {
            FechaInicio: '',
            FechaFin: '',
            Emisor: '',
            Receptor: '',
            Estatus: ''
        }
    });

    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [emisor, setEmisor] = useState("");
    const [receptor, setReceptor] = useState("");
    const [estatus, setEstatus] = useState("");
    const [resetCalendario, setResetCalendario] = useState(false);

    // Función para manejar la búsqueda
    const onSubmit = () => {
        const fechaInicio = getValues("FechaInicio");
        const fechaFin = getValues("FechaFin");
        const emisor = getValues("Emisor");
        const receptor = getValues("Receptor");
        const estatus = getValues("Estatus");

        console.log(fechaInicio, fechaFin, emisor, receptor, estatus);

        // if (fechaInicio === '' || fechaFin === '' || emisor === '' || receptor === '' || estatus === '') {
        //     setSnackbarOpen(true);
        //     return;
        // } else {
            // Formatear fechas a "YYYY-MM-DDTHH:mm:ss"
            const formatDate = (date) => {
                console.log("Fecha", date);
                const d = new Date(date);
                // Obtener los componentes de la fecha y la hora
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0'); // Mes en formato dos dígitos
                const day = String(d.getDate()).padStart(2, '0'); // Día en formato dos dígitos
                const hours = String(d.getHours()).padStart(2, '0'); // Hora en formato dos dígitos
                const minutes = String(d.getMinutes()).padStart(2, '0'); // Minutos en formato dos dígitos
                const seconds = String(d.getSeconds()).padStart(2, '0'); // Segundos en formato dos dígitos

                return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            };

            const formattedFechaInicio = formatDate(fechaInicio);
            const formattedFechaFin = formatDate(fechaFin);
            console.log("FEchas", formattedFechaInicio, formattedFechaFin);

            // Formar un json con los datos de la búsqueda
            const data = {
                FechaInicio: formattedFechaInicio,
                FechaFin: formattedFechaFin,
                Emisor: emisor,
                Receptor: receptor,
                Estatus: estatus
            };
            
            console.log(data);
            setFiltro(data);
        // }
    };
    const Limpiar = () => {
        console.log("Limpiar");
        reset(); // Esto restablecerá todos los valores a los valores por defecto
        setEmisor("");
        setReceptor("");
        setResetCalendario(true);
        setEstatus("");
        console.log("Receptor", receptor);
        console.log(getValues("Emisor"), getValues("Receptor"), getValues("Estatus"), getValues("FechaInicio"), getValues("FechaFin"));
        const data = {
            FechaInicio: "",
            FechaFin: "",
            Emisor: "",
            Receptor: "",
            Estatus: ""
        };
        setFiltro(data);
    }

    // Manejar el cierre del snackbar
    const handleCloseSnackbar = () => {
        setSnackbarOpen(false);
    };
    const handleEmisorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            
            console.log(data);
            setEmisor(data["Rfc"]);
            console.log("Emisor", emisor);

        } catch (error) {
            console.error("El valor de emisor no es un JSON válido:", e.target.value);
        }
    };
    const handleReceptorChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            
            console.log(data);
            setReceptor(data["Rfc"]);
            console.log("Receptor", receptor);

        } catch (error) {
            console.error("El valor de emisor no es un JSON válido:", e.target.value);
        }
    };
    const handleEstatusChange = (e) => {
        console.log("Estatus", e.target.value);
        setValue("Estatus", e.target.value);
        setEstatus(e.target.value);
    };

    return (
        <Box
            sx={{
                backgroundColor: '#1d394d',
                padding: '16px',
                borderRadius: '8px',
                boxShadow: 1,
                margin: 1,
                mt: 1
            }}
        >
            <form>
                <Box
                    sx={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, 1fr) auto', // 4 columnas para los inputs y 1 auto para los botones
                        gap: 4,
                        alignItems: 'center'
                    }}
                >
                    <Box sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: '200px' }}>
                        <PickersMinMax register={register} setValue={setValue} resetCalendario={resetCalendario} setResetCalendario={setResetCalendario}/>
                    </Box>

                    <Select
                        register={register}
                        nombre="Emisor"
                        url="http://31.220.31.152:8081/Catalogos/Emisor"
                        clave="Rfc"
                        descripcion="Nombre"
                        opcion={true}
                        opcionText="Quitar Filtro"
                        sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: '200px' }}
                        variant="filled"
                        value={emisor||""}
                        onChange={handleEmisorChange}
                    />

                    <Select
                        register={register}
                        nombre="Receptor"
                        url="http://31.220.31.152:8081/Catalogos/Receptor"
                        clave="Rfc"
                        descripcion="Nombre"
                        opcion={true}
                        opcionText="Quitar Filtro"
                        sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: '200px' }}
                        variant="filled"
                        value={receptor || ""}
                        onChange={handleReceptorChange}
                    />

                    <FormControl fullWidth variant="filled" sx={{ background: "#e8e8e8", borderRadius: "5px", color: "black", minWidth: '200px' }}>
                        <InputLabel id="estatus-select-label">Estatus</InputLabel>
                        <MuiSelect
                            {...register("Estatus")}
                            labelId="estatus-select-label"
                            id="estatus-select"
                            label="Estatus"
                            value={estatus}
                            onChange={handleEstatusChange}
                           
                        >
                            <MenuItem value="">Quitar Filtro</MenuItem>
                            <MenuItem value="timbrada">Timbrada</MenuItem>
                            <MenuItem value="notimbrada">No timbrada</MenuItem>
                        </MuiSelect>
                    </FormControl>
                    <Box >
                         <Button
                        type="button"
                        variant="contained"
                        color="primary"
                        sx={{ height: '90%', fontWeight:'500', background: "#04b2ca", color:'white',  '&:hover': { backgroundColor: '#ffffff', color:'#04b2ca' }, marginRight: '10px' }}
                        onClick={onSubmit}  // Asegúrate de que esté configurado así
                    >
                        <SearchIcon />
                        Buscar
                    </Button>

                    <Button
                       type="button"
                       variant="contained"
                       color="primary"
                       sx={{ height: '90%', fontWeight:'500', background: "#ffffff", borderBlockColor:'#04b2ca',  '&:hover': { backgroundColor: '#10232f', color:'#ffffff'},color:'#10232f', marginRight: '10px' }}
                        onClick={Limpiar}
                    >
                        <ClearIcon />
                        Limpiar
                    </Button>
                    </Box>
                   
                </Box>
            </form>

            {/* Snackbar para mostrar los errores */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={3000}
                onClose={handleCloseSnackbar}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert onClose={handleCloseSnackbar} severity="error"  variant="filled" sx={{ width: '100%' }}>
                    Todos los campos son obligatorios.
                </Alert>
            </Snackbar>
        </Box>
    );
}
