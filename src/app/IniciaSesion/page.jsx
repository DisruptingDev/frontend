"use client";
import { useState, useEffect } from "react";
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation'; // Importa useRouter de next/navigation
import { TextField, Button, Box, Checkbox, FormControlLabel, Link, Alert, Collapse } from "@mui/material";
import Image from 'next/image';

export default function Login() {
    const { register, handleSubmit } = useForm();
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false); // Estado para verificar si el componente está montado

    useEffect(() => {
        setIsMounted(true); // Marca el componente como montado
    }, []);

    const onSubmit = async (data) => {
        try {
            const response = await fetch('https://facturacioncfditotal.com/api/login/Login', {
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

                if (result.error) {
                    setAlert({ open: true, message: result.error, severity: 'error' });
                } else {
                    const currentDate = new Date().toISOString(); // Obtiene la fecha actual en formato ISO
                    // localStorage.setItem('authToken', result.token);
                    // localStorage.setItem('loginDate', currentDate); // Guarda la fecha del login
                    // Almacena el token dependiendo de "Recuérdame"
                    localStorage.setItem('correo', data.usuario);

                    // Extraer todo lo antes del '@'
                    const nombreUsuario = data.usuario.split('@')[0];

                    // Guardar en localStorage
                    localStorage.setItem('usuario', nombreUsuario);

                    localStorage.setItem('superUser', result.sudo);

                    if (data.remember) {
                        console.log('Recuérdame activado');
                        sessionStorage.removeItem("authToken");

                        localStorage.setItem('authToken', result.token); // Guarda en Local Storage
                        localStorage.setItem('loginDate', currentDate); // Guarda la fecha del login
                    } else {
                        console.log('Recuérdame desactivado');
                        localStorage.removeItem("authToken");
                        localStorage.removeItem("loginDate");
                        sessionStorage.setItem('authToken', result.token); // Guarda en Session Storage
                    }
                    setAlert({ open: true, message: 'Login exitoso', severity: 'success' });
                    console.log('Login exitoso', result.token, currentDate);

                    if (isMounted) { // Solo redirige si el componente está montado
                       if(result.sudo){
                            router.push('/Dashboard');
                        }
                        else{
                            router.push('/Home');
                       }
                    }
                }
            }
            else {
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
                    {/*
                    <Link href="#" variant="body2" sx={{ display: 'block', marginBottom: 2, textAlign: 'initial' }}>
                        ¿Olvidaste tu contraseña?
                    </Link> */}
                    <Button sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }} variant="contained" fullWidth type="submit">
                        Iniciar sesión
                    </Button>
                </Box>
            </Box>
        </main>
    );
}
