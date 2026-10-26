'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import StorefrontRoundedIcon from '@mui/icons-material/StorefrontRounded';
import AccountBalanceRoundedIcon from '@mui/icons-material/AccountBalanceRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import { useRouter } from 'next/navigation';

const audiences = [
  {
    icon: <PersonRoundedIcon sx={{ fontSize: 32, color: '#10968A' }} />,
    title: 'Profesionistas y Emprendedores',
    badge: 'Sin contratos forzosos',
    desc: 'Factura tus servicios o productos con CFDI 4.0 en segundos. Adquiere tus folios cuando los necesites, sin mensualidades obligatorias ni caducidades.',
    cta: 'Comenzar gratis',
  },
  {
    icon: <StorefrontRoundedIcon sx={{ fontSize: 32, color: '#10968A' }} />,
    title: 'PyMEs y Negocios en Crecimiento',
    badge: 'Control integral',
    desc: 'Emite facturas, timbra la nómina de tu equipo, descarga tus XML del SAT y concilia tus cobranzas y complementos de pago desde un solo sistema web.',
    cta: 'Ver soluciones PyME',
  },
  {
    icon: <AccountBalanceRoundedIcon sx={{ fontSize: 32, color: '#10968A' }} />,
    title: 'Despachos Contables y Contadores',
    badge: 'Multi RFC Ilimitado',
    desc: 'El facturador ideal para administrar a todos tus clientes y razones sociales sin salir de tu cuenta. Ahorra tiempo con descarga masiva y pólizas automáticas.',
    cta: 'Solución para Contadores',
  },
];

export default function TargetAudience() {
  const router = useRouter();

  return (
    <Box sx={{ py: { xs: 6, sm: 8 }, backgroundColor: '#f8fafc' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
            Diseñado a la medida de tu modelo de negocio
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 650, mx: 'auto' }}>
            Ya sea que emitas 10 facturas al mes o administres 50 empresas simultáneamente, Wise se ajusta a tus necesidades.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {audiences.map((aud, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    borderColor: '#10968A',
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box
                    sx={{
                      width: 50,
                      height: 50,
                      borderRadius: '12px',
                      backgroundColor: 'rgba(16, 150, 138, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mb: 2,
                    }}
                  >
                    {aud.icon}
                  </Box>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#10968A', textTransform: 'uppercase', mb: 0.5 }}>
                    {aud.badge}
                  </Typography>
                  <Typography component="h3" variant="h6" sx={{ fontWeight: 800, color: '#063F53', mb: 1.5 }}>
                    {aud.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6, mb: 3 }}>
                    {aud.desc}
                  </Typography>
                  <Button
                    variant="outlined"
                    endIcon={<ArrowForwardRoundedIcon />}
                    onClick={() => router.push('/AltaUsuarios')}
                    sx={{
                      mt: 'auto',
                      minHeight: '44px',
                      textTransform: 'none',
                      fontWeight: 700,
                      borderRadius: '8px',
                      color: '#063F53',
                      borderColor: '#cbd5e1',
                      '&:hover': {
                        borderColor: '#10968A',
                        backgroundColor: 'rgba(16, 150, 138, 0.05)',
                        color: '#10968A',
                      },
                    }}
                  >
                    {aud.cta}
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
