'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Rating from '@mui/material/Rating';
import FormatQuoteRoundedIcon from '@mui/icons-material/FormatQuoteRounded';

const testimonials = [
  {
    name: 'C.P. Mariana Rivas',
    role: 'Titular de Despacho Contable',
    city: 'Puebla, Pue.',
    comment:
      'Poder facturar y gestionar a más de 18 clientes desde una misma cuenta sin tener que salir y entrar fue un cambio radical. La descarga masiva nos ahorra semanas completas en los cierres mensuales.',
    rating: 5,
  },
  {
    name: 'Ing. Carlos Mendoza',
    role: 'Director en Servicios Industriales',
    city: 'Querétaro, Qro.',
    comment:
      'El timbrado es verdaderamente inmediato y nunca nos hemos quedado tirados. Cuando tuvimos dudas con la configuración de los sellos CSD, el equipo de soporte por WhatsApp nos resolvió en menos de 10 minutos.',
    rating: 5,
  },
  {
    name: 'Lic. Laura Elizondo',
    role: 'Administradora General',
    city: 'CDMX',
    comment:
      'El módulo de timbrado de nómina es sumamente fácil: subimos la plantilla de nuestros 45 empleados y timbramos todo de jalón. Además, que los folios no caduquen da muchísima tranquilidad.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <Box sx={{ py: { xs: 6, sm: 8 }, backgroundColor: '#ffffff' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1, fontSize: { xs: '1.6rem', md: '2.2rem' } }}>
            La confianza de despachos y empresas en México
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto' }}>
            Descubre por qué contadores y administradores eligen Wise Facturación en su día a día.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {testimonials.map((t, idx) => (
            <Grid item xs={12} md={4} key={idx}>
              <Card
                sx={{
                  height: '100%',
                  borderRadius: '16px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                  backgroundColor: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                    <Rating value={t.rating} readOnly size="small" sx={{ color: '#f59e0b' }} />
                    <FormatQuoteRoundedIcon sx={{ color: 'rgba(16, 150, 138, 0.3)', fontSize: 32 }} />
                  </Box>
                  <Typography variant="body2" sx={{ color: '#334155', fontStyle: 'italic', lineHeight: 1.6, mb: 3, flexGrow: 1 }}>
                    "{t.comment}"
                  </Typography>
                  <Box sx={{ pt: 2, borderTop: '1px solid #e2e8f0' }}>
                    <Typography component="h3" variant="subtitle2" sx={{ fontWeight: 800, color: '#063F53' }}>
                      {t.name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                      {t.role} · {t.city}
                    </Typography>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
