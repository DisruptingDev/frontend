"use client";
import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Container,
    Box,
    Button,
    Typography,
    TextField,
    IconButton,
    InputAdornment,
    Collapse,
    Alert,
    Grid,
    CircularProgress,
    Stack,
    Chip
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import MarkEmailReadRoundedIcon from '@mui/icons-material/MarkEmailReadRounded';
import DomainAddRoundedIcon from '@mui/icons-material/DomainAddRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ShieldOutlinedIcon from '@mui/icons-material/ShieldOutlined';
import BoltRoundedIcon from '@mui/icons-material/BoltRounded';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const AltaUsuarios = () => {
    const router = useRouter();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ open: false, message: '', severity: 'success' });
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        password: '',
    });

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setLoading(true);
        setAlert({ open: false, message: '', severity: 'success' });

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

            if (response.ok) {
                let result = {};
                try {
                    result = JSON.parse(text);
                } catch (e) {
                    result = { status: 'success' };
                }

                if (result.status === 'success' || response.status === 200 || response.status === 201) {
                    setAlert({
                        open: true,
                        message: '¡Registro exitoso! Enviamos un enlace de confirmación a tu correo.',
                        severity: 'success'
                    });

                    // Disparar evento de Meta Pixel para medir registros
                    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
                        window.fbq('track', 'CompleteRegistration', {
                            content_name: 'Registro de Usuario',
                            status: 'success'
                        });
                    }

                    setTimeout(() => {
                        router.push('/ConfirmacionCorreo');
                    }, 1200);
                } else {
                    setAlert({
                        open: true,
                        message: result.error || 'Ocurrió un error al procesar el registro.',
                        severity: 'error'
                    });
                }
            } else {
                setAlert({
                    open: true,
                    message: 'El correo electrónico ya se encuentra registrado.',
                    severity: 'error'
                });
            }
        } catch (error) {
            console.error('Error en la solicitud:', error);
            setAlert({
                open: true,
                message: 'No pudimos conectar con el servidor. Revisa tu conexión a internet.',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // Los 3 pasos del proceso de bienvenida
    const pasosRegistro = [
        {
            numero: '01',
            titulo: 'Crea tu cuenta',
            subtitulo: 'Regístrate y valida tu correo',
            descripcion: 'Ingresa tus datos básicos y confirma tu dirección para activar tu acceso seguro.',
            icono: <MarkEmailReadRoundedIcon sx={{ fontSize: 32, color: '#2dd4bf' }} />,
            badge: 'Paso Actual',
            activo: true,
        },
        {
            numero: '02',
            titulo: 'Registra tu empresa',
            subtitulo: 'Carga tu RFC y CSD',
            descripcion: 'Configura tu primera empresa emisor con tu Certificado de Sello Digital en 1 clic.',
            icono: <DomainAddRoundedIcon sx={{ fontSize: 32, color: '#38bdf8' }} />,
            badge: 'Siguiente Paso',
            activo: false,
        },
        {
            numero: '03',
            titulo: '5 Folios de regalo',
            subtitulo: 'Acreditación automática',
            descripcion: 'Tu primera empresa recibe de inmediato 5 timbres sin costo en su Serie F para emitir hoy mismo.',
            icono: <CardGiftcardRoundedIcon sx={{ fontSize: 32, color: '#facc15' }} />,
            badge: '¡Bono Gratis!',
            activo: false,
            destacado: true,
        },
    ];

    return (
        <Box
            sx={{
                minHeight: '100vh',
                width: '100%',
                position: 'relative',
                overflow: 'hidden',
                background: 'radial-gradient(ellipse 90% 70% at 50% -10%, #0c7682 0%, #063F53 60%, #032533 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, md: 6 },
                px: { xs: 2, sm: 3 },
            }}
        >
            {/* Luces de fondo (glows ambientales) */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '-100px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: { xs: '320px', md: '750px' },
                    height: { xs: '320px', md: '500px' },
                    background: 'radial-gradient(circle, rgba(16, 150, 138, 0.45) 0%, rgba(6, 63, 83, 0) 70%)',
                    filter: 'blur(75px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />
            <Box
                sx={{
                    position: 'absolute',
                    bottom: '-80px',
                    right: '-40px',
                    width: '360px',
                    height: '360px',
                    background: 'radial-gradient(circle, rgba(45, 212, 191, 0.25) 0%, rgba(6, 63, 83, 0) 70%)',
                    filter: 'blur(80px)',
                    pointerEvents: 'none',
                    zIndex: 0,
                }}
            />

            <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
                <Grid container spacing={{ xs: 4, md: 5 }} alignItems="center" justifyContent="center">
                    
                    {/* COLUMNA IZQUIERDA: Formulario de Registro */}
                    <Grid item xs={12} md={5}>
                        <Box
                            sx={{
                                width: '100%',
                                backgroundColor: 'rgba(255, 255, 255, 0.98)',
                                backdropFilter: 'blur(20px)',
                                borderRadius: { xs: '1.5rem', md: '2rem' },
                                p: { xs: 3, sm: 4.5 },
                                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                textAlign: 'left',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Logo */}
                            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Link href="/" style={{ display: 'inline-flex' }}>
                                    <Image
                                        src="/images/Logo_wise_factura.png"
                                        alt="Logo Wise Facturación"
                                        width={210}
                                        height={46}
                                        style={{ height: 'auto', maxWidth: '100%' }}
                                        priority
                                    />
                                </Link>
                                <Chip
                                    label="5 Folios Gratis"
                                    size="small"
                                    icon={<CardGiftcardRoundedIcon sx={{ fontSize: '15px !important', color: '#063F53 !important' }} />}
                                    sx={{
                                        backgroundColor: '#5eead4',
                                        color: '#063F53',
                                        fontWeight: 700,
                                        fontSize: '0.75rem',
                                    }}
                                />
                            </Box>

                            {/* Títulos del formulario */}
                            <Typography
                                component="h1"
                                sx={{
                                    fontSize: { xs: '1.6rem', sm: '1.85rem' },
                                    fontWeight: 900,
                                    color: '#063F53',
                                    letterSpacing: '-0.02em',
                                    lineHeight: 1.2,
                                    mb: 0.5,
                                }}
                            >
                                Crea tu cuenta gratuita
                            </Typography>
                            <Typography
                                sx={{
                                    color: '#64748b',
                                    fontSize: '0.9rem',
                                    mb: 2.5,
                                }}
                            >
                                Sin contratos forzosos ni tarjeta de crédito.
                            </Typography>

                            {/* Alertas */}
                            <Collapse in={alert.open}>
                                <Alert
                                    severity={alert.severity}
                                    onClose={() => setAlert({ ...alert, open: false })}
                                    sx={{ mb: 2, borderRadius: '12px' }}
                                >
                                    {alert.message}
                                </Alert>
                            </Collapse>

                            {/* Formulario */}
                            <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <TextField
                                        label="Nombre o Razón Social"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        placeholder="Ej. Juan Pérez o Mi Empresa SA"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#f8fafc',
                                            },
                                        }}
                                    />
                                    <TextField
                                        label="Correo Electrónico"
                                        name="correo"
                                        type="email"
                                        value={formData.correo}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        placeholder="tu-correo@empresa.com"
                                        variant="outlined"
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#f8fafc',
                                            },
                                        }}
                                    />
                                    <TextField
                                        label="Contraseña"
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={handleChange}
                                        fullWidth
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        variant="outlined"
                                        InputProps={{
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton
                                                        aria-label="mostrar u ocultar contraseña"
                                                        onClick={handleClickShowPassword}
                                                        edge="end"
                                                    >
                                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '12px',
                                                backgroundColor: '#f8fafc',
                                            },
                                        }}
                                    />

                                    {/* Botón de Enviar */}
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        type="submit"
                                        disabled={loading}
                                        endIcon={!loading && <ArrowForwardRoundedIcon />}
                                        sx={{
                                            mt: 1,
                                            py: 1.6,
                                            borderRadius: '12px',
                                            backgroundColor: '#10968A',
                                            color: '#ffffff',
                                            fontSize: '1rem',
                                            fontWeight: 800,
                                            textTransform: 'none',
                                            boxShadow: '0 10px 25px -5px rgba(16, 150, 138, 0.45)',
                                            transition: 'all 0.25s ease',
                                            '&:hover': {
                                                backgroundColor: '#0c7682',
                                                boxShadow: '0 12px 30px -5px rgba(16, 150, 138, 0.6)',
                                                transform: 'translateY(-1px)',
                                            },
                                        }}
                                    >
                                        {loading ? (
                                            <CircularProgress size={24} sx={{ color: '#ffffff' }} />
                                        ) : (
                                            'Registrarme y obtener 5 folios'
                                        )}
                                    </Button>
                                </Box>
                            </form>

                            {/* Enlace para iniciar sesión */}
                            <Box sx={{ mt: 3, pt: 2, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
                                <Typography sx={{ fontSize: '0.88rem', color: '#64748b' }}>
                                    ¿Ya tienes una cuenta registrada?{' '}
                                    <Link
                                        href="/IniciaSesion"
                                        style={{ color: '#10968A', fontWeight: 700, textDecoration: 'none' }}
                                    >
                                        Iniciar sesión
                                    </Link>
                                </Typography>
                            </Box>

                            {/* Garantías de confianza al pie */}
                            <Box
                                sx={{
                                    mt: 2,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: 2,
                                    color: '#94a3b8',
                                    fontSize: '0.78rem',
                                }}
                            >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <ShieldOutlinedIcon sx={{ fontSize: 14, color: '#10968A' }} />
                                    <span>Datos encriptados</span>
                                </Box>
                                <span>•</span>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <CheckCircleRoundedIcon sx={{ fontSize: 14, color: '#10968A' }} />
                                    <span>SAT CFDI 4.0</span>
                                </Box>
                            </Box>
                        </Box>
                    </Grid>

                    {/* COLUMNA DERECHA: Los 3 Pasos del Proceso */}
                    <Grid item xs={12} md={7}>
                        <Box sx={{ color: '#ffffff', pl: { md: 2 } }}>
                            {/* Cabecera del bloque de pasos */}
                            <Box sx={{ mb: 4 }}>
                                <Box
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        px: 2,
                                        py: 0.6,
                                        mb: 1.5,
                                        borderRadius: '999px',
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        border: '1px solid rgba(255, 255, 255, 0.18)',
                                    }}
                                >
                                    <BoltRoundedIcon sx={{ color: '#5eead4', fontSize: 18 }} />
                                    <Typography sx={{ color: '#5eead4', fontSize: '0.82rem', fontWeight: 700 }}>
                                        Rápido, Seguro y Transparente
                                    </Typography>
                                </Box>
                                <Typography
                                    component="h2"
                                    sx={{
                                        fontSize: { xs: '1.8rem', sm: '2.3rem', md: '2.6rem' },
                                        fontWeight: 900,
                                        letterSpacing: '-0.03em',
                                        lineHeight: 1.15,
                                        mb: 1,
                                    }}
                                >
                                    Comienza a facturar en{' '}
                                    <Box
                                        component="span"
                                        sx={{
                                            background: 'linear-gradient(92deg, #5eead4 10%, #fef08a 100%)',
                                            WebkitBackgroundClip: 'text',
                                            WebkitTextFillColor: 'transparent',
                                        }}
                                    >
                                        3 simples pasos
                                    </Box>
                                </Typography>
                                <Typography sx={{ color: 'rgba(255, 255, 255, 0.82)', fontSize: '1rem', maxWidth: '540px' }}>
                                    Automatizamos el flujo para que en menos de 3 minutos tengas tu primera factura timbrada con el SAT.
                                </Typography>
                            </Box>

                            {/* Tarjetas de los 3 Pasos */}
                            <Stack spacing={2.5}>
                                {pasosRegistro.map((paso, idx) => (
                                    <Box
                                        key={idx}
                                        sx={{
                                            display: 'flex',
                                            alignItems: { xs: 'flex-start', sm: 'center' },
                                            gap: 2.5,
                                            p: { xs: 2.5, sm: 3 },
                                            borderRadius: '1.25rem',
                                            background: paso.destacado
                                                ? 'linear-gradient(135deg, rgba(16, 150, 138, 0.35) 0%, rgba(6, 63, 83, 0.6) 100%)'
                                                : 'rgba(255, 255, 255, 0.07)',
                                            border: paso.destacado
                                                ? '1.5px solid rgba(94, 234, 212, 0.5)'
                                                : '1px solid rgba(255, 255, 255, 0.12)',
                                            backdropFilter: 'blur(12px)',
                                            boxShadow: paso.destacado
                                                ? '0 15px 35px -10px rgba(0, 0, 0, 0.4), 0 0 20px rgba(94, 234, 212, 0.2)'
                                                : '0 8px 20px rgba(0, 0, 0, 0.15)',
                                            transition: 'transform 0.2s ease, border-color 0.2s ease',
                                            '&:hover': {
                                                transform: 'translateY(-2px)',
                                                borderColor: 'rgba(94, 234, 212, 0.6)',
                                            },
                                        }}
                                    >
                                        {/* Icono e indicador de paso */}
                                        <Box
                                            sx={{
                                                minWidth: { xs: 54, sm: 64 },
                                                height: { xs: 54, sm: 64 },
                                                borderRadius: '16px',
                                                backgroundColor: paso.destacado ? 'rgba(250, 204, 21, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                                                border: '1px solid',
                                                borderColor: paso.destacado ? 'rgba(250, 204, 21, 0.4)' : 'rgba(255, 255, 255, 0.15)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                            }}
                                        >
                                            {paso.icono}
                                        </Box>

                                        {/* Contenido descriptivo */}
                                        <Box sx={{ flexGrow: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5, flexWrap: 'wrap' }}>
                                                <Typography
                                                    sx={{
                                                        fontSize: '0.8rem',
                                                        fontWeight: 800,
                                                        color: paso.destacado ? '#fde047' : '#5eead4',
                                                        letterSpacing: '0.05em',
                                                    }}
                                                >
                                                    PASO {paso.numero}
                                                </Typography>
                                                <Typography sx={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                                                    •
                                                </Typography>
                                                <Typography
                                                    component="h3"
                                                    sx={{
                                                        fontSize: { xs: '1.05rem', sm: '1.18rem' },
                                                        fontWeight: 800,
                                                        color: '#ffffff',
                                                    }}
                                                >
                                                    {paso.titulo}
                                                </Typography>
                                                {paso.badge && (
                                                    <Chip
                                                        label={paso.badge}
                                                        size="small"
                                                        sx={{
                                                            height: '22px',
                                                            fontSize: '0.72rem',
                                                            fontWeight: 700,
                                                            backgroundColor: paso.destacado ? '#facc15' : 'rgba(94, 234, 212, 0.2)',
                                                            color: paso.destacado ? '#063F53' : '#5eead4',
                                                            border: 'none',
                                                        }}
                                                    />
                                                )}
                                            </Box>
                                            <Typography
                                                sx={{
                                                    fontSize: '0.88rem',
                                                    color: 'rgba(255, 255, 255, 0.8)',
                                                    lineHeight: 1.5,
                                                }}
                                            >
                                                {paso.descripcion}
                                            </Typography>
                                        </Box>
                                    </Box>
                                ))}
                            </Stack>

                            {/* Resumen de incentivo inferior */}
                            <Box
                                sx={{
                                    mt: 3.5,
                                    p: 2,
                                    borderRadius: '14px',
                                    backgroundColor: 'rgba(6, 63, 83, 0.45)',
                                    border: '1px dashed rgba(94, 234, 212, 0.4)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1.5,
                                }}
                            >
                                <CheckCircleRoundedIcon sx={{ color: '#5eead4', fontSize: 22, flexShrink: 0 }} />
                                <Typography sx={{ fontSize: '0.85rem', color: 'rgba(255, 255, 255, 0.9)' }}>
                                    <strong>Beneficio automático:</strong> Al completar el Paso 2 (tu primera empresa), se habilitará la Serie F con 5 timbres de cortesía listos para emitir.
                                </Typography>
                            </Box>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
};

export default AltaUsuarios;