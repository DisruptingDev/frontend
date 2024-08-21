"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Checkbox, FormControlLabel, Link, Alert, Collapse } from "@mui/material";
import Image from 'next/image';

export default function Login() {
    const { register, handleSubmit } = useForm();
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });

    const onSubmit = async (data) => {
        try {
            const response = await fetch('http://31.220.31.152:8084/Login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    Email: data.usuario,
                    Password: data.password,
                }),
            });

            const text = await response.text();
            console.log('Respuesta del servidor:', text);

            if (response.ok) {
                const result = JSON.parse(text);

                // Verifica si la respuesta contiene un error
                if (result.error) {
                    setAlert({ open: true, message: result.error, severity: 'error' });
                } else {
                    // Almacenar el token en localStorage
                    localStorage.setItem('authToken', result.token);
                    setAlert({ open: true, message: 'Login exitoso', severity: 'success' });
                    console.log('Login exitoso', result.token);
                }
            } else {
                setAlert({ open: true, message: 'Error en la autenticación', severity: 'error' });
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            setAlert({ open: true, message: 'Error en la conexión al servidor', severity: 'error' });
        }
    };

    return (
        <main className="flex items-center justify-center h-screen bg-primary-dark-total">
            <Box
                sx={{
                    width: 420,
                    backgroundColor: "white",
                    padding: 4,
                    borderRadius: 5,
                    boxShadow: 3,
                    textAlign: "center"
                }}
            >
                <Box
                    mb={2}
                    display="flex"
                    justifyContent="center"
                >
                    <Image src="/images/logo2.png" alt="Descripción de la imagen" width={300} height={64} />
                </Box>

                {/* Alert Component */}
                <Collapse in={alert.open}>
                    <Alert severity={alert.severity} onClose={() => setAlert({ ...alert, open: false })}>
                        {alert.message}
                    </Alert>
                </Collapse>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
                    <TextField
                        label="Usuario"
                        type="email"
                        {...register("usuario", { required: true })}
                        fullWidth
                        margin="normal"
                    />
                    <TextField
                        label="Contraseña"
                        type="password"
                        {...register("password", { required: true })}
                        fullWidth
                        margin="normal"
                    />
                    <FormControlLabel
                        control={<Checkbox {...register("remember")} />}
                        label="Recordar cuenta"
                        sx={{
                            marginBottom: 2,
                            display: 'block',
                            textAlign: 'left',
                            '& .MuiFormControlLabel-label': {
                                marginLeft: '8px',
                            },
                        }}
                    />
                    <Link href="#" variant="body2" sx={{ display: 'block', marginBottom: 2, textAlign: 'initial' }}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                    <Button sx={{
                        backgroundColor: 'rgba(29, 57, 77, var(--tw-bg-opacity, 1))',
                    }} variant="contained" fullWidth type="submit">
                        Iniciar sesión
                    </Button>
                </Box>
            </Box>
        </main>
    );
}
