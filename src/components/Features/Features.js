import * as React from 'react';
import PropTypes from 'prop-types';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import MuiChip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { styled } from '@mui/material/styles';

import DevicesRoundedIcon from '@mui/icons-material/DevicesRounded';
import EdgesensorHighRoundedIcon from '@mui/icons-material/EdgesensorHighRounded';
import ViewQuiltRoundedIcon from '@mui/icons-material/ViewQuiltRounded';

const items = [
  {
    icon: <ViewQuiltRoundedIcon />,
    title: 'Control total de empresas y usuarios',
    description:
      'Gestiona múltiples empresas y usuarios desde una sola plataforma. Define roles y permisos para tu equipo, asegurando un flujo de trabajo organizado y seguro.',
    imageLight: `url("/images/features/1.png")`,

  },
  {
    icon: <EdgesensorHighRoundedIcon />,
    title: 'Timbrado masivo',
    description:
      'Ahorra tiempo y esfuerzo timbrando múltiples facturas simultáneamente. Nuestra tecnología te permite procesar grandes volúmenes de facturas de forma rápida y eficiente.',
    imageLight: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/mobile-light.png")`,
    imageDark: `url("${process.env.TEMPLATE_IMAGE_URL || 'https://mui.com'}/static/images/templates/templates-images/mobile-dark.png")`,
  },
  {
    icon: <DevicesRoundedIcon />,
    title: 'Úsalo en cualquier dispositivo',
    description:
      'Accede a tu cuenta y genera facturas desde cualquier lugar y en cualquier momento. Nuestra plataforma es compatible con computadoras, tablets y smartphones, permitiéndote gestionar tu facturación sobre la marcha ',
    imageLight: `url("/images/features/2.png")`,
  },

];

const Chip = styled(MuiChip)(({ theme }) => ({
  variants: [
    {
      props: ({ selected }) => selected,
      style: {
        background:
          'linear-gradient(to bottom right, hsl(210, 98%, 48%), hsl(210, 98%, 35%))',
        color: 'hsl(0, 0%, 100%)',
        borderColor: (theme.vars || theme).palette.primary.light,
        '& .MuiChip-label': {
          color: 'hsl(0, 0%, 100%)',
        },
        ...theme.applyStyles('dark', {
          borderColor: (theme.vars || theme).palette.primary.dark,
        }),
      },
    },
  ],
}));

function MobileLayout({ selectedItemIndex, handleItemClick, selectedFeature }) {
  return (
    <Box
      sx={{
        display: { xs: 'flex', sm: 'none' },
        gap: 2,
        overflow: 'auto',
        snapType: 'x mandatory',
        scrollBehavior: 'smooth',
        '-webkit-overflow-scrolling': 'touch',
        pb: 2,
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {items.map((item, index) => (
        <Card
          key={index}
          variant="outlined"
          sx={{
            minWidth: '280px',
            width: '85vw',
            snapAlign: 'center',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Box
            sx={(theme) => ({
              mb: 2,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              minHeight: 200, // Reduced height for mobile
              backgroundImage: 'var(--items-imageLight)',
              ...theme.applyStyles('dark', {
                backgroundImage: 'var(--items-imageDark)',
              }),
            })}
            style={{
              '--items-imageLight': item.imageLight,
              '--items-imageDark': item.imageDark || item.imageLight,
            }}
          />
          <Box sx={{ px: 2, pb: 2, flexGrow: 1 }}>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              {item.icon}
              <Typography
                gutterBottom
                sx={{ color: 'text.primary', fontWeight: 'bold', m: 0 }}
              >
                {item.title}
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1.5 }}>
              {item.description}
            </Typography>
          </Box>
        </Card>
      ))}
    </Box>
  );
}



export { MobileLayout };

export default function Features() {
  const [selectedItemIndex, setSelectedItemIndex] = React.useState(0);

  const handleItemClick = (index) => {
    setSelectedItemIndex(index);
  };

  const selectedFeature = items[selectedItemIndex];

  return (
    <Container id="features" className='mt-10 md:mt-20' sx={{ py: { xs: 8, sm: 16 } }}>
      <Box sx={{ width: 100 % { sm: '100%', md: '60%' } }}>
        <Typography
          component="h1"
          variant="h4"
          fontSize="clamp(4rem, 5vw, 4rem)"
          fontWeight="bold"
          sx={{ color: '#063F53', marginBottom: '1rem' }}
        >
          Ventajas de facturar con Wise
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: 'text.secondary', mb: { xs: 2, sm: 4 } }}
        >
          En Wise, sabemos que la facturación no debería ser un dolor de cabeza. Por eso, hemos creado una experiencia de usuario intuitiva y robusta que se adapta a las necesidades de tu negocio, sin importar su tamaño o complejidad. Descubre las ventajas que te ofrecemos:
        </Typography>
      </Box>
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row-reverse' },
          gap: 2,
        }}
      >
        <div>
          <Box
            sx={{
              display: { xs: 'none', sm: 'flex' },
              flexDirection: 'column',
              gap: 2,
              height: '100%',
            }}
          >
            {items.map(({ icon, title, description }, index) => (
              <Box
                key={index}
                component={Button}
                onClick={() => handleItemClick(index)}
                sx={[
                  (theme) => ({
                    p: 2,
                    height: '100%',
                    width: '100%',
                    '&:hover': {
                      backgroundColor: (theme.vars || theme).palette.action.hover,
                    },
                  }),
                  selectedItemIndex === index && {
                    backgroundColor: 'action.selected',
                  },
                ]}
              >
                <Box
                  sx={[
                    {
                      width: '100%',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'left',
                      gap: 1,
                      textAlign: 'left',
                      textTransform: 'none',
                      color: 'text.secondary',
                    },
                    selectedItemIndex === index && {
                      color: 'text.primary',
                    },
                  ]}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, color: '#063F53' }}>
                    {icon}
                    <Typography variant="h5" color="inherit" fontWeight={600}>{title}</Typography>
                  </Box>
                  <Typography variant="body1">{description}</Typography>
                </Box>
              </Box>
            ))}
          </Box>
          <MobileLayout />
        </div>
        <Box
          sx={{
            display: { xs: 'none', sm: 'flex' },
            width: { xs: '100%', md: '70%' },
            height: 'var(--items-image-height)',
          }}
        >
          <Card
            variant="outlined"
            sx={{
              height: '100%',
              width: '100%',
              display: { xs: 'none', sm: 'flex' },
              pointerEvents: 'none',
              backgroundColor: 'transparent',
              border: 'none',
            }}
          >
            <Box
              sx={(theme) => ({
                m: 'auto',
                width: 420,
                height: 420,
                backgroundSize: 'contain',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
                borderRadius: '3rem',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                backgroundImage: 'var(--items-imageLight)',
                ...theme.applyStyles('dark', {
                  backgroundImage: 'var(--items-imageDark)',
                }),
              })}
              style={
                items[selectedItemIndex]
                  ? {
                    '--items-imageLight': items[selectedItemIndex].imageLight,
                    '--items-imageDark': items[selectedItemIndex].imageDark,
                  }
                  : {}
              }
            />
          </Card>
        </Box>
      </Box>
    </Container>
  );
}