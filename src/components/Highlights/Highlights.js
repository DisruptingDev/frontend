import * as React from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AutoFixHighRoundedIcon from '@mui/icons-material/AutoFixHighRounded';
import ConstructionRoundedIcon from '@mui/icons-material/ConstructionRounded';
import QueryStatsRoundedIcon from '@mui/icons-material/QueryStatsRounded';
import SettingsSuggestRoundedIcon from '@mui/icons-material/SettingsSuggestRounded';
import SupportAgentRoundedIcon from '@mui/icons-material/SupportAgentRounded';
import ThumbUpAltRoundedIcon from '@mui/icons-material/ThumbUpAltRounded';

const items = [
  {
    //icon: <SettingsSuggestRoundedIcon />,
    title: 'Rendimiento en timbrado',
    description:
      'Olvídate de retrasos y complicaciones. Nuestro sistema optimizado garantiza un timbrado rápido y eficaz, permitiéndote generar tus facturas en cuestión de segundos.',
  },
  {
    //icon: <ConstructionRoundedIcon />,
    title: 'Desarrollado a la medida',
    description:
      'Sabemos que cada negocio es único. Nuestro servicio se adapta a tus requerimientos específicos, ofreciéndote soluciones personalizadas que se integran perfectamente a tu flujo de trabajo.',
  },
  {
    //icon: <ThumbUpAltRoundedIcon />,
    title: 'Una expericia unica',
    description:
      ' Navega por una interfaz intuitiva y amigable, diseñada para que la facturación sea un proceso sencillo y placentero.',
  },
  {
    //icon: <AutoFixHighRoundedIcon />,
    title: 'Funcionalidades innovadoras',
    description:
      ' Mantente a la vanguardia con herramientas y características que simplificarán tu día a día, desde la automatización de tareas hasta la gestión avanzada de tus facturas.',
  },
  {
    //icon: <SupportAgentRoundedIcon />,
    title: 'Soporte técnico especializado',
    description:
      ' Nuestro equipo de expertos está siempre a tu disposición para resolver cualquier duda o inconveniente, garantizando que tu experiencia sea siempre fluida y sin contratiempos.',
  },
  {
    //icon: <QueryStatsRoundedIcon />,
    title: 'Reportes detallados',
    description:
      'Obtén una visión clara y detallada de tu actividad de facturación con nuestros reportes personalizables. Analiza tus datos, toma decisiones informadas y optimiza tu gestión financiera.',
  },
];

export default function Highlights() {
  return (
    <Box
      id="highlights"
      sx={{
        pt: { xs: 4, sm: 12 },
        pb: { xs: 8, sm: 16 },
        color: 'white',
        bgcolor: 'grey.900',
      }}
    >
      <Container
        sx={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: { xs: 3, sm: 6 },
        }}
      >
        <Box
          sx={{
            width: { sm: '100%', md: '60%' },
            textAlign: { sm: 'left', md: 'center' },
          }}
        >
          <Typography component="h2" variant="h4" gutterBottom>
            Beneficios de nuestro servicio
          </Typography>
          <Typography variant="body1" sx={{ color: 'grey.400' }}>
          En Wise facturación, entendemos que la facturación es una parte crucial de tu negocio. Por eso, hemos diseñado un servicio que no solo cumple con tus necesidades, sino que las supera, brindándote una experiencia única y eficiente.
          </Typography>
        </Box>
        <Grid container spacing={1} >
          {items.map((item, index) => (
            <Grid item  sm={6} md={4}  key={index}>
              <Stack
                direction="column"
                component={Card}
                spacing={1}
                useFlexGap
                sx={{
                  color: 'inherit',
                  p: 3,
                  height: '100%',
                  borderColor: 'hsla(220, 25%, 25%, 0.3)',
                  backgroundColor: 'grey.800',
                }}
              >
                <Box sx={{ opacity: '50%' }}>{item.icon}</Box>
                <div>
                  <Typography gutterBottom sx={{ fontWeight: 'medium' }}>
                    {item.title}
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'grey.400' }}>
                    {item.description}
                  </Typography>
                </div>
              </Stack>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}