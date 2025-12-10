"use client";
import React, { use, useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Container, Box, Button, Typography, TextField, IconButton, InputAdornment, Collapse, Alert } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useParams } from 'next/navigation';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


const AltaUsuarios = () => {

    const { correo: encodedCorreo, token } = useParams();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const router = useRouter();


    const decodedCorreo = decodeURIComponent(encodedCorreo);

    const [formData, setFormData] = useState({
        nombre: '',
        correo: decodedCorreo || '',
        contraseña: '',
        confirmacionContraseña: ''
    });

    useEffect(() => {
        console.log('Correo:', decodedCorreo);
        console.log('Token:', token);
        setFormData((prevFormData) => ({
            ...prevFormData,
            correo: decodedCorreo,
        }));
    }, [decodedCorreo, token]);

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleClickShowConfirmPassword = () => {
        setShowConfirmPassword(!showConfirmPassword);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        // Handle form submission logic here
        console.log(formData);
        try {
            const response = await fetch(`${apiUrl}/api/registrousuarios/RegistroUsuario/${token}`, {
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
                    // console.log('Login exitoso', result.token)
                    //Despues de un tiempo redirige a la pagina de inicio
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);


                } else {
                    setAlert({ open: true, message: result.error, severity: 'error' });



                }
            } else {
                setAlert({ open: true, message: 'Error en el registro', severity: 'error' });
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
        <Container maxWidth className="flex items-center justify-center h-screen bg-primary-dark-total">
            <Box sx={{
                width: 420,
                backgroundColor: "white",
                padding: 4,
                borderRadius: 5,
                boxShadow: 3,
                textAlign: "center"
            }}>
                <Box
                    mb={2}
                    display="flex"
                    justifyContent="center"
                >
                    <Image src="/images/Logo_wise_factura.png" alt="Descripción de la imagen" width={300} height={64} />
                </Box>
                <Collapse in={alert.open}>
                    <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
                        {alert.message}
                    </Alert>
                </Collapse>
                {/* <Typography variant="h4" component="h1" gutterBottom>
                    Registrar Usuario
                </Typography> */}
                <form onSubmit={handleSubmit}>
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
                        disabled
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
                    {/* <TextField
                        label="Confirmación de Contraseña"
                        name="confirmacionContraseña"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmacionContraseña}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={handleClickShowConfirmPassword}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    /> */}
                    <Button sx={{
                        mt: 2,
                        backgroundColor: 'rgba(16, 150, 138, var(--tw-bg-opacity, 1))', '&:hover': {
                            backgroundColor: '#0398a6', // Color al hacer hover
                        },
                    }} variant="contained" fullWidth type="submit">
                        Registrar
                    </Button>
                </form>
            </Box>
        </Container>
    );
};

export default AltaUsuarios;