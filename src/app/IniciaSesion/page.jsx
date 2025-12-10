"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Checkbox, FormControlLabel, Link, Alert, Collapse } from "@mui/material";
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth'; // Asegúrate de que la ruta sea correcta

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Login() {
    const { register, handleSubmit } = useForm();
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const { login } = useAuth();

    const onSubmit = async (data) => {
        try {
            await login(data, data.remember);
            
            // No necesitas redireccionar aquí porque el hook useAuth ya lo maneja
            setAlert({ open: true, message: 'Login exitoso', severity: 'success' });
            
        } catch (error) {
            console.error('Error en el login:', error);
            setAlert({ 
                open: true, 
                message: error.message || 'Error en la autenticación', 
                severity: 'error' 
            });
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
                    <Image src="/images/Logo_wise_factura.png" alt="Descripción de la imagen" width={300} height={64} />
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
                        required
                    />
                    <TextField
                        label="Contraseña"
                        type="password"
                        {...register("password", { required: true })}
                        fullWidth
                        margin="normal"
                        required
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
                    <Button 
                        sx={{ 
                            backgroundColor: '#10968A', 
                            '&:hover': { backgroundColor: '#10232f' } 
                        }} 
                        variant="contained" 
                        fullWidth 
                        type="submit"
                    >
                        Iniciar sesión
                    </Button>
                    <Link href="/AltaUsuarios" variant="body2" sx={{ display: 'block', marginTop: 2 }}>
                        ¿No tienes una cuenta? Regístrate
                    </Link>
                    <Link href="/ReestablecerContrasena" variant="body2" sx={{ display: 'block', marginTop: 2 }}>
                        ¿Olvidaste tu contraseña? Recupérala
                    </Link>
                </Box>
            </Box>
        </main>
    );
}
