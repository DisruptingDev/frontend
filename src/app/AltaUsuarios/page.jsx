"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Container, Box, Button, Typography, TextField, IconButton, InputAdornment, Collapse, Alert, Grid } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import TaskOutlinedIcon from '@mui/icons-material/TaskOutlined';
import AddShoppingCartOutlinedIcon from '@mui/icons-material/AddShoppingCartOutlined';


const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const AltaUsuarios = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const router = useRouter();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
    });

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Handle form submission logic here
        console.log(formData);
        try {
            const response = await fetch(`${apiUrl}/api/registrousuarios/RegistroUsuario`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Nombre: formData.nombre,
                    Email: formData.correo,
                    Password: formData.password,
                }),
            });

            const text = await response.text();
            console.log('Respuesta del servidor:', text);

            if (response.ok) {
                const result = JSON.parse(text);

                if (result.status === 'success') {
                    setAlert({ open: true, message: 'Registro exitoso', severity: 'success' });
                    console.log('Login exitoso', result)
                    //Despues de un tiempo redirige a la pagina de inicio
                    setTimeout(async () => {
                        try {
                            // router.push('/');
                            router.push('/ConfirmacionCorreo'); // Redirige a la página de confirmación de correo
                        } catch (error) {
                            console.error('Error en la solicitud de login:', error);
                        }

                    }, 1000);


                } else {
                    setAlert({ open: true, message: result.error, severity: 'error' });



                }
            } else {
                setAlert({ open: true, message: 'Correo electrónico ya registrado', severity: 'error' });
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            setAlert({ open: true, message: 'Error en la conexión al servidor', severity: 'error' });
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };


    return (
        <Container maxWidth="full" className="flex flex-col items-center justify-center min-h-screen bg-primary-dark-total gap-8 py-8">
            <Grid container spacing={4} alignItems="center" justifyContent="center" >
                <Grid item xs={12} md={4}>
                    <Box sx={{
                        width: '100%',
                        backgroundColor: "white",
                        padding: 4,
                        borderRadius: 5,
                        boxShadow: 3,
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        minHeight: '600px',
                        borderRadius: 10
                    }}>
                        <Box mb={2} display="flex" justifyContent="center">
                            <Image src="/images/Logo_wise_factura.png" alt="Descripción de la imagen" width={300} height={64} />
                        </Box>
                        <Collapse in={alert.open}>
                            <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
                                {alert.message}
                            </Alert>
                        </Collapse>
                        <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                            <TextField
                                label="Nombre"
                                name="nombre"
                                value={formData.nombre}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Correo"
                                name="correo"
                                type="email"
                                value={formData.correo}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                required
                            />
                            <TextField
                                label="Contraseña"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={handleChange}
                                fullWidth
                                margin="normal"
                                required
                                InputProps={{
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <IconButton
                                                aria-label="toggle password visibility"
                                                onClick={handleClickShowPassword}
                                                edge="end"
                                            >
                                                {showPassword ? <VisibilityOff /> : <Visibility />}
                                            </IconButton>
                                        </InputAdornment>
                                    ),
                                }}
                            />
                            <Button sx={{
                                backgroundColor: 'rgba(16, 150, 138, var(--tw-bg-opacity, 1))', '&:hover': {
                                    backgroundColor: '#0398a6',
                                },
                                mt: 2
                            }} variant="contained" fullWidth type="submit">
                                Registrar
                            </Button>
                        </form>
                    </Box>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, textAlign: 'center', minHeight: '600px', borderRadius: 10 }}>
                                <FactCheckOutlinedIcon sx={{ fontSize: 150, color: 'rgba(16, 150, 138, var(--tw-bg-opacity, 1))', marginBottom: 5 }} />
                                <Typography variant="h4" sx={{ marginBottom: 2 }}>Paso 1</Typography>
                                <Typography variant="h3">Registrate y valida tu correo</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, textAlign: 'center', minHeight: '600px', borderRadius: 10 }}>
                                <TaskOutlinedIcon sx={{ fontSize: 150, color: 'rgba(16, 150, 138, var(--tw-bg-opacity, 1))', marginBottom: 5 }} />
                                <Typography variant="h4" sx={{ marginBottom: 2 }}>Paso 2</Typography>
                                <Typography variant="h3">Inicia sesión, y registra tu empresa</Typography>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Box sx={{ bgcolor: 'white', p: 3, borderRadius: 2, textAlign: 'center', minHeight: '600px', borderRadius: 10 }}>
                                <AddShoppingCartOutlinedIcon sx={{ fontSize: 150, color: 'rgba(16, 150, 138, var(--tw-bg-opacity, 1))', marginBottom: 5 }} />
                                <Typography variant="h4" sx={{ marginBottom: 2 }}>Paso 3</Typography>
                                <Typography variant="h3">Selecciona y compra tu paquete de folios</Typography>
                            </Box>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
        </Container>
    );
};

export default AltaUsuarios;