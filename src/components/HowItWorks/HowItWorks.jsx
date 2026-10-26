'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import AppRegistrationRoundedIcon from '@mui/icons-material/AppRegistrationRounded';
import VpnKeyRoundedIcon from '@mui/icons-material/VpnKeyRounded';
import SendRoundedIcon from '@mui/icons-material/SendRounded';

const steps = [
  {
    step: '1',
    icon: <AppRegistrationRoundedIcon sx={{ fontSize: 32, color: '#10968A' }} />,
    title: 'Crea tu cuenta gratis',
    desc: 'Regístrate en menos de 1 minuto con tu correo. Recibes tus primeros folios sin costo para empezar a probar.',
  },
  {
    step: '2',
    icon: <VpnKeyRoundedIcon sx={{ fontSize: 32, color: '#10968A' }} />,
    title: 'Sube tu CSD del SAT',
    desc: 'Carga tus archivos .cer y .key de Certificado de Sello Digital. Si tienes dudas, nuestro equipo de soporte te asiste paso a paso.',
  },
  {
    step: '3',
    icon: <SendRoundedIcon sx={{ fontSize: 32, color: '#10968A' }} />,
    title: 'Factura y administra tus RFCs',
    desc: 'Genera facturas, complementos de pago, nómina y descarga tus XML del SAT al instante desde cualquier dispositivo.',
  },
];

export default function HowItWorks() {
  return (
    <Box sx={{ py: { xs: 6, sm: 8 }, backgroundColor: '#ffffff' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
            ¿Cómo funciona Wise en 3 sencillos pasos?
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto' }}>
            Empieza a emitir tus comprobantes fiscales CFDI 4.0 en cuestión de minutos.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {steps.map((s, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  backgroundColor: '#f8fafc',
                  textAlign: 'center',
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(16, 150, 138, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    {s.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: '#10968A', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Paso {s.step}
                  </Typography>
                  <Typography component="h3" variant="h6" sx={{ fontWeight: 800, color: '#063F53', mt: 0.5, mb: 1 }}>
                    {s.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.5 }}>
                    {s.desc}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
