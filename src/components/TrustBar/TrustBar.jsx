'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';

const metrics = [
  { value: '+1,500,000', label: 'CFDI Timbrados con Éxito' },
  { value: '< 2 seg', label: 'Tiempo Promedio de Timbrado' },
  { value: '100% SAT', label: 'Cumplimiento Normativo CFDI 4.0' },
  { value: '99.9%', label: 'Disponibilidad de Servicio PAC' },
];

export default function TrustBar({ className = '', sx = {} }) {
  return (
    <Box
      className={className}
      sx={{
        backgroundColor: '#063F53',
        py: 4,
        color: '#ffffff',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        position: 'relative',
        zIndex: 1,
        ...sx,
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={3} sx={{ textAlign: 'center' }}>
          {metrics.map((metric, idx) => (
            <Grid item xs={6} md={3} key={idx}>
              <Typography component="p" variant="h3" sx={{ fontWeight: 800, color: '#10968A', fontSize: { xs: '1.8rem', md: '2.5rem' }, mb: 0.5 }}>
                {metric.value}
              </Typography>
              <Typography component="p" variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', fontWeight: 500, fontSize: { xs: '0.85rem', md: '1rem' } }}>
                {metric.label}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
