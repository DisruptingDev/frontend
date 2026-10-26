'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AppAppBar from '@/components/AppAppBar/AppAppBar';
import Footer from '@/components/Footer/Footer';
import WhatsAppButton from '@/components/WhatsAppButton/WhatsAppButton';
import { useRouter } from 'next/navigation';

export default function ServiceLandingLayout({
  badge,
  title,
  subtitle,
  heroDescription,
  heroStats,
  keyBenefits,
  howItWorksSteps,
  targetAudience,
  faqItems,
  ctaTitle,
  ctaSubtitle,
}) {
  const router = useRouter();

  return (
    <main className="w-full bg-[#f8fafc]">
      <AppAppBar />

      {/* Hero Section */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #063F53 0%, #10968A 100%)',
          color: '#ffffff',
          pt: { xs: 16, md: 20 },
          pb: { xs: 10, md: 14 },
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Container maxWidth="lg">
          <Box sx={{ maxWidth: 860, mx: 'auto', textAlign: 'center' }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                px: 2.5,
                py: 0.8,
                borderRadius: '30px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                mb: 3,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.2, color: '#e6fffa' }}>
                {badge}
              </Typography>
            </Box>

            <Typography
              component="h1"
              variant="h2"
              sx={{
                fontWeight: 900,
                fontSize: { xs: '2.2rem', sm: '3rem', md: '3.8rem' },
                lineHeight: 1.15,
                mb: 2.5,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h5"
              sx={{
                fontWeight: 600,
                color: '#6ee7b7',
                fontSize: { xs: '1.1rem', md: '1.4rem' },
                mb: 3,
              }}
            >
              {subtitle}
            </Typography>

            <Typography
              variant="body1"
              sx={{
                color: 'rgba(255, 255, 255, 0.9)',
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                lineHeight: 1.6,
                mb: 4,
                maxWidth: 760,
                mx: 'auto',
              }}
            >
              {heroDescription}
            </Typography>

            {/* CTAs */}
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center', alignItems: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/AltaUsuarios')}
                sx={{
                  backgroundColor: '#ffffff',
                  color: '#063F53',
                  fontWeight: 800,
                  fontSize: '1.05rem',
                  px: 4,
                  minHeight: '48px',
                  borderRadius: '12px',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.2)',
                  '&:hover': {
                    backgroundColor: '#f0fdfa',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                Comenzar con folios sin costo
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="https://wa.me/522227254392?text=Hola,%20me%20gustar%C3%ADa%20solicitar%20una%20demostraci%C3%B3n"
                target="_blank"
                rel="noopener noreferrer"
                startIcon={<WhatsAppIcon />}
                sx={{
                  borderColor: 'rgba(255, 255, 255, 0.7)',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '1.05rem',
                  px: 3,
                  minHeight: '48px',
                  borderRadius: '12px',
                  '&:hover': {
                    borderColor: '#ffffff',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                  },
                }}
              >
                Agendar Demo en Vivo
              </Button>
            </Box>

            {/* Micro métricas */}
            {heroStats && heroStats.length > 0 && (
              <Grid container spacing={2} sx={{ mt: 5, pt: 4, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                {heroStats.map((st, i) => (
                  <Grid item xs={6} md={3} key={i}>
                    <Typography component="p" variant="h4" sx={{ fontWeight: 900, color: '#ffffff', mb: 0.5 }}>
                      {st.value}
                    </Typography>
                    <Typography component="p" variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 500, fontSize: '0.85rem' }}>
                      {st.label}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Container>
      </Box>

      {/* Beneficios Clave */}
      <Box sx={{ py: { xs: 8, md: 12 } }}>
        <Container maxWidth="lg">
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
              Beneficios diseñados para tu operación diaria
            </Typography>
            <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 650, mx: 'auto', fontSize: '1.05rem' }}>
              Elimina cuellos de botella y errores manuales con tecnología automatizada 100% conforme al SAT.
            </Typography>
          </Box>

          <Grid container spacing={3}>
            {keyBenefits.map((b, i) => (
              <Grid item xs={12} md={4} key={i}>
                <Card
                  sx={{
                    height: '100%',
                    borderRadius: '20px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04)',
                    backgroundColor: '#ffffff',
                    transition: 'all 0.25s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 16px 24px -4px rgba(16, 150, 138, 0.12)',
                      borderColor: '#10968A',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3.5, display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <Box sx={{ p: 1.5, borderRadius: '14px', backgroundColor: 'rgba(16, 150, 138, 0.1)', color: '#10968A', width: 'fit-content', mb: 2 }}>
                      {b.icon}
                    </Box>
                    <Typography component="h3" variant="h6" sx={{ fontWeight: 800, color: '#063F53', mb: 1.5 }}>
                      {b.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 1.6, fontSize: '0.95rem' }}>
                      {b.desc}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Cómo Funciona */}
      {howItWorksSteps && (
        <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0', borderBottom: '1px solid #e2e8f0' }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                ¿Cómo funciona el servicio?
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto' }}>
                Un proceso transparente y ágil pensado para que empieces a ver resultados desde el día uno.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {howItWorksSteps.map((step, idx) => (
                <Grid item xs={12} md={4} key={idx}>
                  <Box
                    sx={{
                      p: 3.5,
                      borderRadius: '18px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      height: '100%',
                    }}
                  >
                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#10968A', opacity: 0.8, mb: 1 }}>
                      0{idx + 1}
                    </Typography>
                    <Typography component="h3" variant="h6" sx={{ fontWeight: 800, color: '#063F53', mb: 1 }}>
                      {step.title}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6, fontSize: '0.95rem' }}>
                      {step.desc}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Para Quién Es */}
      {targetAudience && (
        <Box sx={{ py: { xs: 8, md: 10 } }}>
          <Container maxWidth="lg">
            <Box sx={{ textAlign: 'center', mb: 6 }}>
              <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.4rem' } }}>
                ¿Para quién es ideal esta solución?
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 600, mx: 'auto' }}>
                Perfiles que multiplican su productividad con esta herramienta.
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {targetAudience.map((aud, i) => (
                <Grid item xs={12} md={4} key={i}>
                  <Card sx={{ height: '100%', borderRadius: '18px', border: '1px solid #e2e8f0', p: 1, backgroundColor: '#ffffff' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Chip label={aud.badge} size="small" sx={{ mb: 2, fontWeight: 700, backgroundColor: 'rgba(16,150,138,0.1)', color: '#10968A' }} />
                      <Typography component="h3" variant="h6" sx={{ fontWeight: 800, color: '#063F53', mb: 1 }}>
                        {aud.title}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', lineHeight: 1.6 }}>
                        {aud.desc}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* FAQ Específico */}
      {faqItems && (
        <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: '#ffffff', borderTop: '1px solid #e2e8f0' }}>
          <Container maxWidth="md">
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography component="h2" variant="h4" sx={{ fontWeight: 800, color: '#063F53', mb: 1, fontSize: { xs: '1.8rem', md: '2.2rem' } }}>
                Preguntas Frecuentes
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b' }}>
                Respuestas directas sobre la operación y compatibilidad del servicio.
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {faqItems.map((faq, index) => (
                <Accordion
                  key={index}
                  sx={{
                    borderRadius: '14px !important',
                    border: '1px solid #e2e8f0',
                    boxShadow: 'none',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                  }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon sx={{ color: '#10968A' }} />} sx={{ px: 3, py: 1 }}>
                    <Typography component="h3" sx={{ fontWeight: 700, color: '#063F53', fontSize: '1rem', m: 0 }}>
                      {faq.q}
                    </Typography>
                  </AccordionSummary>
                  <AccordionDetails sx={{ px: 3, pb: 2.5, color: '#475569', lineHeight: 1.6 }}>
                    <Typography variant="body2">{faq.a}</Typography>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Box>
          </Container>
        </Box>
      )}

      {/* CTA Final */}
      <Box sx={{ py: { xs: 8, md: 10 }, backgroundColor: '#063F53', color: '#ffffff' }}>
        <Container maxWidth="md">
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="h3" sx={{ fontWeight: 900, mb: 2, fontSize: { xs: '1.9rem', md: '2.7rem' } }}>
              {ctaTitle || 'Comienza a optimizar tu facturación hoy mismo'}
            </Typography>
            <Typography variant="body1" sx={{ color: 'rgba(255, 255, 255, 0.85)', maxWidth: 620, mx: 'auto', mb: 4, fontSize: '1.1rem' }}>
              {ctaSubtitle || 'Prueba gratis con folios sin costo. Sin plazos forzosos y con soporte en México.'}
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={() => router.push('/AltaUsuarios')}
                sx={{
                  backgroundColor: '#10968A',
                  color: '#ffffff',
                  fontWeight: 800,
                  px: 4,
                  minHeight: '48px',
                  borderRadius: '10px',
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#0d8076' },
                }}
              >
                Crear Cuenta Gratis
              </Button>
              <Button
                variant="outlined"
                size="large"
                href="/"
                sx={{
                  borderColor: 'rgba(255,255,255,0.6)',
                  color: '#ffffff',
                  fontWeight: 700,
                  px: 3,
                  minHeight: '48px',
                  borderRadius: '10px',
                  '&:hover': { borderColor: '#ffffff', backgroundColor: 'rgba(255,255,255,0.08)' },
                }}
              >
                Ver Todas las Funciones
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>

      <Footer />
      <WhatsAppButton />
    </main>
  );
}
