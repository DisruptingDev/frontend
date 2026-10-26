'use client';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import BusinessRoundedIcon from '@mui/icons-material/BusinessRounded';
import CardGiftcardRoundedIcon from '@mui/icons-material/CardGiftcardRounded';
import CloudDownloadRoundedIcon from '@mui/icons-material/CloudDownloadRounded';
import BadgeRoundedIcon from '@mui/icons-material/BadgeRounded';
import CalculateRoundedIcon from '@mui/icons-material/CalculateRounded';
import PointOfSaleRoundedIcon from '@mui/icons-material/PointOfSaleRounded';
import TouchAppRoundedIcon from '@mui/icons-material/TouchAppRounded';
import HeadsetMicRoundedIcon from '@mui/icons-material/HeadsetMicRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import StarRoundedIcon from '@mui/icons-material/StarRounded';

// Las 5 funciones estrella solicitadas expresamente
const starFeatures = [
  {
    id: 'multi-rfc',
    href: '/multi-rfc',
    icon: <BusinessRoundedIcon sx={{ fontSize: 36, color: '#10968A' }} />,
    title: 'Multi RFC Centralizado',
    badge: 'Para Contadores y Empresas',
    summary: 'Administra todas tus empresas o clientes desde una misma cuenta sin cerrar sesión.',
    details: [
      'Emite facturas de personas físicas y morales desde una misma plataforma.',
      'Control independiente de series, folios y catálogos de clientes por RFC.',
      'Asigna roles y permisos específicos para tus colaboradores por empresa.',
    ],
    highlight: 'Ahorra horas de trabajo diario evitando abrir y cerrar múltiples sesiones.',
  },
  {
    id: 'folios-sin-costo',
    href: '/folios-sin-costo',
    icon: <CardGiftcardRoundedIcon sx={{ fontSize: 36, color: '#10968A' }} />,
    title: 'Folios Sin Costo al Registrarte',
    badge: 'Prueba Gratis',
    summary: 'Comienza a timbrar de inmediato sin necesidad de tarjeta de crédito ni contratos forzosos.',
    details: [
      'Recibe folios de bienvenida al crear tu cuenta para probar la emisión real.',
      'Configura tu CSD (Certificado de Sello Digital) con asistencia guiada.',
      'Comprueba la velocidad de timbrado y descarga tus primeros CFDI 4.0.',
    ],
    highlight: 'Prueba la plataforma con tus propios datos fiscales sin riesgo ni compromiso.',
  },
  {
    id: 'descarga-masiva',
    href: '/descarga-masiva-sat',
    icon: <CloudDownloadRoundedIcon sx={{ fontSize: 36, color: '#10968A' }} />,
    title: 'Descarga Masiva del SAT',
    badge: 'XML y PDF en 1 Clic',
    summary: 'Conexión directa con el webservice del SAT para comprobantes emitidos y recibidos.',
    details: [
      'Descarga paquetes masivos de XML y representaciones en PDF organizados.',
      'Conexión 100% segura mediante CIEC o e.firma (FIEL).',
      'Sin las limitaciones de velocidad ni los bloqueos del portal web del SAT.',
    ],
    highlight: 'Audita y concilia los comprobantes fiscales de tu negocio en cuestión de minutos.',
  },
  {
    id: 'timbrado-nomina',
    href: '/timbrado-nomina',
    icon: <BadgeRoundedIcon sx={{ fontSize: 36, color: '#10968A' }} />,
    title: 'Timbrado de Nómina CFDI 4.0',
    badge: 'Complemento 1.2',
    summary: 'Emisión masiva de recibos de nómina por lote a partir de plantillas Excel o CSV.',
    details: [
      'Validación automática de RFC, CURP y NSS conforme a la regla del SAT.',
      'Timbrado simultáneo de cientos de empleados en segundos.',
      'Dispersión y envío automático de los recibos firmados por correo a tus colaboradores.',
    ],
    highlight: 'Cumplimiento laboral y fiscal sin necesidad de sistemas de nómina costosos.',
  },
  {
    id: 'modulo-contabilidad',
    href: '/modulo-contabilidad',
    icon: <CalculateRoundedIcon sx={{ fontSize: 36, color: '#10968A' }} />,
    title: 'Módulo de Contabilidad Electrónica',
    badge: 'Pólizas y Balanzas',
    summary: 'Generación automática de pólizas contables y reportes a partir de tus facturas.',
    details: [
      'Generación inteligente de pólizas de ingresos, egresos y diario.',
      'Catálogo de cuentas agrupador alineado a los códigos normativos del SAT.',
      'Exportación en XML para presentación ante el Buzón Tributario.',
    ],
    highlight: 'Transforma tus CFDI en contabilidad electrónica sin re-capturas manuales.',
  },
];

// Fila compacta de ventajas operativas (Cobranza, Facilidad de uso, Soporte humano)
const compactPillars = [
  {
    icon: <PointOfSaleRoundedIcon sx={{ fontSize: 24, color: '#063F53' }} />,
    title: 'Módulo de Cobranza',
    desc: 'Monitoreo de facturas cobradas/vencidas, conciliación y complementos de pago (REP 2.0) en 1 clic.',
    href: '/modulo-cobranza',
  },
  {
    icon: <TouchAppRoundedIcon sx={{ fontSize: 24, color: '#063F53' }} />,
    title: 'Extremadamente Fácil de Usar',
    desc: 'Interfaz intuitiva en cualquier pantalla. Factura en menos de 1 minuto sin capacitaciones técnicas.',
  },
  {
    icon: <HeadsetMicRoundedIcon sx={{ fontSize: 24, color: '#063F53' }} />,
    title: 'Soporte Humano en México',
    desc: 'Atención cercana vía WhatsApp (+52 222 725 4392) y teléfono con asesores en Puebla.',
  },
];

export default function FeaturesShowcase() {
  return (
    <Box id="funcionalidades" sx={{ py: { xs: 6, sm: 10 }, backgroundColor: '#f8fafc', scrollMarginTop: '90px' }}>
      <Container maxWidth="lg">
        {/* Encabezado */}
        <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 6 } }}>
          <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1, px: 2, py: 0.5, borderRadius: '20px', backgroundColor: 'rgba(16, 150, 138, 0.1)', color: '#10968A', mb: 1.5 }}>
            <StarRoundedIcon fontSize="small" />
            <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1 }}>
              Funcionalidades Clave
            </Typography>
          </Box>
          <Typography
            component="h2"
            variant="h3"
            sx={{
              fontWeight: 800,
              color: '#063F53',
              fontSize: { xs: '1.8rem', md: '2.5rem' },
              mb: 1.5,
              lineHeight: 1.2,
            }}
          >
            Las 5 funciones que hacen único a Wise Facturación
          </Typography>
          <Typography
            variant="body1"
            sx={{ color: '#475569', maxWidth: 750, mx: 'auto', fontSize: { xs: '0.95rem', md: '1.05rem' }, lineHeight: 1.6 }}
          >
            Todo lo que tu empresa o despacho contable necesita para operar con rapidez, total cumplimiento SAT y sin duplicar esfuerzos.
          </Typography>
        </Box>

        {/* Las 5 Funciones Estrella en Grid Equilibrado */}
        <Grid container spacing={3} justifyContent="center">
          {starFeatures.map((feat, idx) => {
            // Hacemos que las 2 primeras ocupen md:6 y las siguientes 3 ocupen md:4 para una composición simétrica y compacta
            const mdCol = idx < 2 ? 6 : 4;
            return (
              <Grid item xs={12} md={mdCol} key={feat.id}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.25s ease',
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 28px -6px rgba(16, 150, 138, 0.12)',
                      borderColor: '#10968A',
                    },
                  }}
                >
                  <CardContent sx={{ p: { xs: 2.5, sm: 3 }, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Box
                        sx={{
                          p: 1.2,
                          borderRadius: '14px',
                          backgroundColor: 'rgba(16, 150, 138, 0.1)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {feat.icon}
                      </Box>
                      <Chip
                        label={feat.badge}
                        size="small"
                        sx={{
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          backgroundColor: '#e6fffa',
                          color: '#0d9488',
                          border: '1px solid rgba(13, 148, 136, 0.3)',
                        }}
                      />
                    </Box>

                    <Typography
                      component="h3"
                      variant="h6"
                      sx={{ fontWeight: 800, color: '#063F53', mb: 1, fontSize: '1.2rem' }}
                    >
                      {feat.title}
                    </Typography>

                    <Typography variant="body2" sx={{ color: '#475569', mb: 2, lineHeight: 1.5, fontSize: '0.9rem' }}>
                      {feat.summary}
                    </Typography>

                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.8, mb: 2 }}>
                      {feat.details.map((item, dIdx) => (
                        <Box key={dIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                          <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#10968A', mt: 0.3, flexShrink: 0 }} />
                          <Typography variant="body2" sx={{ color: '#334155', fontSize: '0.85rem' }}>
                            {item}
                          </Typography>
                        </Box>
                      ))}
                    </Box>

                    <Box
                      sx={{
                        mt: 'auto',
                        p: 1.5,
                        borderRadius: '10px',
                        backgroundColor: '#f1f5f9',
                        borderLeft: '4px solid #10968A',
                        mb: 2,
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 600, color: '#0f172a', display: 'block', fontSize: '0.8rem' }}>
                        {feat.highlight}
                      </Typography>
                    </Box>

                    {feat.href && (
                      <Button
                        variant="text"
                        size="small"
                        href={feat.href}
                        endIcon={<ArrowForwardRoundedIcon sx={{ fontSize: 16 }} />}
                        sx={{
                          color: '#10968A',
                          fontWeight: 700,
                          fontSize: '0.88rem',
                          textTransform: 'none',
                          p: 0,
                          justifyContent: 'flex-start',
                          '&:hover': {
                            backgroundColor: 'transparent',
                            color: '#063F53',
                          },
                        }}
                      >
                        Conocer más sobre {feat.title}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>

        {/* Fila Compacta: Cobranza, Facilidad de Uso y Soporte Humano */}
        <Box
          sx={{
            mt: 4,
            p: { xs: 2.5, sm: 3 },
            borderRadius: '16px',
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
          }}
        >
          <Grid container spacing={2}>
            {compactPillars.map((pillar, pIdx) => (
              <Grid item xs={12} md={4} key={pIdx}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box sx={{ p: 1, borderRadius: '10px', backgroundColor: 'rgba(6, 63, 83, 0.08)', flexShrink: 0 }}>
                    {pillar.icon}
                  </Box>
                  <Box>
                    <Typography component="h3" sx={{ fontWeight: 700, color: '#063F53', fontSize: '0.95rem', mb: 0.2 }}>
                      {pillar.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.4 }}>
                      {pillar.desc}
                    </Typography>
                    {pillar.href && (
                      <Button
                        variant="text"
                        size="small"
                        href={pillar.href}
                        sx={{ color: '#10968A', fontWeight: 700, fontSize: '0.8rem', p: 0, textTransform: 'none', mt: 0.5 }}
                      >
                        Conocer más →
                      </Button>
                    )}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Banner de Evolución y Funcionalidades a Medida */}
        <Box
          sx={{
            mt: 4,
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #063F53 0%, #10968A 100%)',
            color: '#ffffff',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2.5,
          }}
        >
          <Box sx={{ maxWidth: { md: '70%' } }}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 0.5, fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
              ¿Requieres una integración especial o función a tu medida?
            </Typography>
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9rem', lineHeight: 1.5 }}>
              Wise incorpora nuevas herramientas de forma constante (API REST, reglas de timbrado, automatizaciones). Desarrollamos soluciones a la medida de tu flujo contable y administrativo.
            </Typography>
          </Box>
          <Button
            variant="contained"
            size="medium"
            href="https://wa.me/522227254392?text=Hola,%20me%20gustar%C3%ADa%20conocer%20m%C3%A1s%20sobre%20las%20funcionalidades%20de%20Wise%20Facturaci%C3%B3n"
            target="_blank"
            rel="noopener noreferrer"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{
              backgroundColor: '#ffffff',
              color: '#063F53',
              fontWeight: 700,
              px: 3,
              minHeight: '44px',
              borderRadius: '10px',
              textTransform: 'none',
              fontSize: '0.95rem',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              '&:hover': {
                backgroundColor: '#f0fdfa',
                color: '#042834',
              },
            }}
          >
            Hablar con un asesor
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
