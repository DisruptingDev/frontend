"use client";
import { useState } from "react";
import { useForm } from 'react-hook-form';
import { TextField, Button, Alert, Collapse, Box } from "@mui/material";
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function PasswordResetPage() {
    const { register, handleSubmit, watch, formState: { errors } } = useForm();
    const [alert, setAlert] = useState({ 
        open: false, 
        message: '', 
        severity: 'success' 
    });
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();
    const token = searchParams.get('token');

    const onSubmit = async (data) => {
        setIsLoading(true);
        try {
            // Validar que las contraseñas coincidan
            if (data.password !== data.confirmPassword) {
                setAlert({ 
                    open: true, 
                    message: 'Las contraseñas no coinciden', 
                    severity: 'error' 
                });
                setIsLoading(false);
                return;
            }

            const response = await fetch(`${apiUrl}/api/reestablecercontrasena/Reestablecer`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    Password: data.password
                }),
            });

            const result = await response.json();

            if (response.ok) {
                setAlert({ 
                    open: true, 
                    message: 'Contraseña actualizada correctamente. Redirigiendo al login...', 
                    severity: 'success' 
                });
                // Redirigir al login después de 3 segundos
                setTimeout(() => router.push('/IniciaSesion'), 3000);
            } else {
                setAlert({ 
                    open: true, 
                    message: result.message || 'Error al actualizar la contraseña', 
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

    if (!token) {
        return (
            <Box
                sx={{
                    width: 420,
                    backgroundColor: "white",
                    padding: 4,
                    borderRadius: 5,
                    boxShadow: 3,
                    textAlign: "center",
                    margin: 'auto'
                }}
            >
                <Box mb={2} display="flex" justifyContent="center">
                    <Image 
                        src="/images/Logo_wise_factura.png" 
                        alt="Logo Wise Factura" 
                        width={300} 
                        height={64} 
                        priority
                    />
                </Box>
                <Alert severity="error" sx={{ mt: 2 }}>
                    Token no válido o faltante. Por favor utiliza el enlace que recibiste por correo.
                </Alert>
                <Button 
                    sx={{ 
                        color: '#10968A',
                        '&:hover': { backgroundColor: 'transparent' },
                        textTransform: 'none',
                        mt: 2
                    }} 
                    variant="text" 
                    fullWidth 
                    onClick={() => router.push('/ReestablecerContrasena')}
                >
                    Solicitar nuevo enlace
                </Button>
            </Box>
        );
    }

    return (
        <>
            <h2 style={{ marginBottom: '20px', color: '#10968A' }}>
                Restablecer Contraseña
            </h2>

            <Collapse in={alert.open}>
                <Alert 
                    severity={alert.severity} 
                    onClose={() => setAlert({ ...alert, open: false })}
                    sx={{ mb: 2 }}
                >
                    {alert.message}
                </Alert>
            </Collapse>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <TextField
                    label="Nueva Contraseña"
                    type="password"
                    {...register("password", { 
                        required: 'Este campo es requerido',
                        minLength: {
                            value: 8,
                            message: 'La contraseña debe tener al menos 8 caracteres'
                        },
                        pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/,
                            message: 'Debe contener al menos una mayúscula, una minúscula y un número'
                        }
                    })}
                    fullWidth
                    margin="normal"
                    error={!!errors.password}
                    helperText={errors.password?.message}
                    sx={{ mb: 2 }}
                />
                
                <TextField
                    label="Confirmar Contraseña"
                    type="password"
                    {...register("confirmPassword", { 
                        required: 'Este campo es requerido',
                        validate: value => 
                            value === watch('password') || 'Las contraseñas no coinciden'
                    })}
                    fullWidth
                    margin="normal"
                    error={!!errors.confirmPassword}
                    helperText={errors.confirmPassword?.message}
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
                    {isLoading ? 'Actualizando...' : 'Actualizar Contraseña'}
                </Button>
            </form>
        </>
    );
}