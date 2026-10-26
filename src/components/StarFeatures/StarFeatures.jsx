'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import PeopleAltRoundedIcon from '@mui/icons-material/PeopleAltRounded';
import AccountBalanceWalletRoundedIcon from '@mui/icons-material/AccountBalanceWalletRounded';
import SpeedRoundedIcon from '@mui/icons-material/SpeedRounded';

const starFeatures = [
  {
    icon: <BusinessRoundedIcon sx={{ fontSize: 40, color: '#10968A' }} />,
    title: '🏢 Multi RFC Centralizado',
    tag: 'Especial Contadores',
    description:
      'Emite y gestiona facturas de múltiples personas físicas y morales desde una misma cuenta. Asigna permisos por empresa y olvídate de cambiar de sesión constantemente.',
  },
  {
    icon: <CardGiftcardRoundedIcon sx={{ fontSize: 40, color: '#10968A' }} />,
    title: '🎁 Folios Sin Costo al Registrarte',
    tag: 'Prueba Gratis',
    description:
      'Comienza a timbrar tus CFDI 4.0 sin tarjeta de crédito forzosa ni ataduras. Comprueba la velocidad del timbrado y descarga tus primeros comprobantes inmediatamente.',
  },
  {
    icon: <CloudDownloadRoundedIcon sx={{ fontSize: 40, color: '#10968A' }} />,
    title: '📥 Descarga Masiva del SAT',
    tag: 'XML y PDF',
    description:
      'Conecta tu CIEC o e.firma para descargar paquetes masivos de comprobantes emitidos y recibidos directamente de los servidores del SAT en un solo clic.',
  },
  {
    icon: <PeopleAltRoundedIcon sx={{ fontSize: 40, color: '#10968A' }} />,
    title: '👥 Timbrado Masivo de Nómina',
    tag: 'Complemento 1.2',
    description:
      'Importa tu lista de colaboradores y conceptos en hojas de cálculo y timbra cientos de recibos de nómina CFDI 4.0 al instante con envío automático por correo.',
  },
  {
    icon: <AccountBalanceWalletRoundedIcon sx={{ fontSize: 40, color: '#10968A' }} />,
    title: '📊 Módulo de Contabilidad y Cobranza',
    tag: 'Control Financiero',
    description:
      'Genera pólizas automáticas, concilia pagos PPD y complementos de recepción de pagos (REP), monitorea cuentas por cobrar y mantén el control fiscal al día.',
  },
  {
    icon: <SpeedRoundedIcon sx={{ fontSize: 40, color: '#10968A' }} />,
    title: '⚡ Timbrado en Menos de 2 Segundos',
    tag: 'Alta Disponibilidad',
    description:
      'Infraestructura optimizada con PAC certificado que garantiza disponibilidad 99.9% y timbrados ultrarrápidos para ventas en mostrador y comercios.',
  },
];

export default function StarFeatures() {
  return (
    <Box sx={{ py: { xs: 8, sm: 12 }, backgroundColor: '#ffffff' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 7 }}>
          <Typography
            component="h2"
            variant="h4"
            sx={{ fontWeight: 800, color: '#063F53', mb: 2, fontSize: { xs: '1.8rem', md: '2.4rem' } }}
          >
            Las 5 Funciones Estrella que Hacen Único a Wise
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 700, mx: 'auto', fontSize: '1.1rem' }}>
            A diferencia de los facturadores convencionales, Wise integra en una sola plataforma todas las herramientas fiscales y operativas que tu empresa o despacho contable necesita.
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {starFeatures.map((feat, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '20px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 24px -4px rgba(16, 150, 138, 0.15)',
                    borderColor: '#10968A',
                  },
                }}
              >
                <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ p: 1, borderRadius: '12px', backgroundColor: 'rgba(16, 150, 138, 0.08)' }}>
                      {feat.icon}
                    </Box>
                    <Chip label={feat.tag} size="small" sx={{ backgroundColor: '#e6fffa', color: '#10968A', fontWeight: 600 }} />
                  </Box>
                  <Typography component="h3" variant="h6" sx={{ fontWeight: 700, color: '#063F53', mb: 1.5 }}>
                    {feat.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                    {feat.description}
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
