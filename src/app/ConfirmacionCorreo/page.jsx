"use client";
import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Container, Box, Button, Typography } from '@mui/material';

const VerificaCorreo = () => {
    const router = useRouter();

    const handleLoginClick = () => {
        router.push('/IniciaSesion');
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
                    <Image src="/images/Logo_wise_factura.png" alt="Logo Wise Factura" width={300} height={64} />
                </Box>
                
                <Box sx={{ mt: 2 }}>
                    <Typography variant="h5" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
                        Verifica tu correo electrónico
                    </Typography>
                    <Typography variant="body1" sx={{ mt: 2, mb: 3 }}>
                        Te hemos enviado un enlace de verificación a tu correo electrónico.
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
                        Por favor revisa tu bandeja de entrada y haz clic en el enlace para completar tu registro.
                    </Typography>
                    
                    <Box sx={{ display: 'flex', justifyContent: 'center', }}>
                        <Image 
                            src="/images/email-illustration.png"
                            alt="Correo electrónico" 
                            width={100} 
                            height={100} 
                        />
                    </Box>
                </Box>

                <Button 
                    sx={{
                        backgroundColor: 'rgba(16, 150, 138, var(--tw-bg-opacity, 1))',
                        '&:hover': {
                            backgroundColor: '#0398a6',
                        },
                        mt: 2,
                        py: 1.5,
                        fontSize: '1rem'
                    }} 
                    variant="contained" 
                    fullWidth 
                    onClick={handleLoginClick}
                >
                    Iniciar Sesión
                </Button>

                <Typography variant="body2" sx={{ mt: 3, color: 'text.secondary' }}>
                    ¿No recibiste el correo? <span style={{ color: '#10968a', cursor: 'pointer' }}>Reenviar correo</span>
                </Typography>
            </Box>
        </Container>
    );
};

export default VerificaCorreo;