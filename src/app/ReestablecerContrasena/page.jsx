"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { TextField, Button, Box, Alert, Collapse } from "@mui/material";
import Image from 'next/image';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function RequestPasswordReset() {
    const { register, handleSubmit, formState: { errors } } = useForm();
    const [alert, setAlert] = useState({ 
      open: false, 
      message: '', 
      severity: 'success' 
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            const response = await fetch(
              `${apiUrl}/api/reestablecercontrasena/Reestablecer?email=${encodeURIComponent(data.email)}`, 
              {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
              }
            );

            const result = await response.json();

            if (response.ok) {
                setAlert({ 
                  open: true, 
                  message: 'Se ha enviado un correo con instrucciones para restablecer tu contraseña', 
                  severity: 'success' 
                });
            } else {
                setAlert({ 
                  open: true, 
                  message: result.message || 'Error al enviar el correo de recuperación', 
                  severity: 'error' 
                });
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            setAlert({ 
              open: true, 
              message: 'Error en la conexión al servidor', 
              severity: 'error' 
            });
        } finally {
            setIsLoading(false);
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
                    <Image 
                        src="/images/Logo_wise_factura.png" 
                        alt="Logo Wise Factura" 
                        width={300} 
                        height={64} 
                        priority
                    />
                </Box>

                <h2 style={{ marginBottom: '20px', color: '#10968A' }}>
                    Recuperar Contraseña
                </h2>
                <p style={{ marginBottom: '20px' }}>
                    Ingresa tu correo electrónico para recibir instrucciones
                </p>

                <Collapse in={alert.open}>
                    <Alert 
                      severity={alert.severity} 
                      onClose={() => setAlert({ ...alert, open: false })}
                      sx={{ mb: 2 }}
                    >
                        {alert.message}
                    </Alert>
                </Collapse>

                <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate sx={{ mt: 2 }}>
                    <TextField
                        label="Correo Electrónico"
                        type="email"
                        {...register("email", { 
                            required: 'Este campo es requerido',
                            pattern: {
                                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                                message: 'Correo electrónico no válido'
                            }
                        })}
                        fullWidth
                        margin="normal"
                        error={!!errors.email}
                        helperText={errors.email?.message}
                        sx={{ mb: 2 }}
                    />

                    <Button 
                        sx={{ 
                            backgroundColor: '#10968A', 
                            '&:hover': { backgroundColor: '#10232f' },
                            marginTop: 2,
                            marginBottom: 2
                        }} 
                        variant="contained" 
                        fullWidth 
                        type="submit"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Enviando...' : 'Enviar Instrucciones'}
                    </Button>

                    <Button 
                        sx={{ 
                            color: '#10968A',
                            '&:hover': { backgroundColor: 'transparent' },
                            textTransform: 'none'
                        }} 
                        variant="text" 
                        fullWidth 
                        onClick={() => router.push('/IniciaSesion')}
                    >
                        Volver al inicio de sesión
                    </Button>
                </Box>
            </Box>
        </main>
    );
}