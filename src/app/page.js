import { AppBar, Toolbar, Typography, Button, Box, Grid, Container } from '@mui/material';
import Image from 'next/image';
export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-between h-screen bg-primary-dark-total">
      {/* Barra de navegación */}
      <AppBar position="static" sx={{ backgroundColor: '#0b2135', paddingRight:15,paddingLeft:15}}>
        <Toolbar>
          <Box sx={{ flexGrow: 1, padding:"0.4em"}}>
          <Image src="/images/logo.png" alt="Descripción de la imagen" width={200} height={50} />
          </Box>
          {/* <Button color="inherit">Características</Button>
          <Button color="inherit">Precios</Button>
          <Button color="inherit">Contacto</Button> */}
          <Button variant="outlined" color="inherit" sx={{ ml: 2 }}>
            Iniciar Sesión
          </Button>
          <Button variant="contained" sx={{  backgroundColor: '#04b2ca', ml: 2 }}>
            Registrarse
          </Button>
        </Toolbar>
      </AppBar>

      {/* Contenido principal */}
      <Container maxWidth="xl" sx={{ mt: 5 }} backgroundColor="#1d394d">
        <Grid container spacing={8} alignItems="center"  backgroundColor="#1d394d">
          {/* Texto */}
          <Grid item xs={12} md={6}>
            <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
              La evolución de la facturación electrónica
            </Typography>
            <Typography variant="h6" sx={{ color: '#d0d0d0', mb: 4 }}>
            Simplifica tu proceso de facturación CFDI con nuestra plataforma intuitiva y eficiente. Olvídate de los procedimientos complicados y disfruta de una solución rápida y segura.
            </Typography>
            <Button variant="contained" size="large" sx={{ backgroundColor: '#05b2cc' }}>
              Comenzar ahora
            </Button>
          </Grid>

          {/* Imagen (ficticia para diseño) */}
          <Grid item xs={12} md={6}>
            <Box
              sx={{
                width: '100%',
                height: 500,
                // backgroundColor: '#f0f0f0',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                borderRadius: 2,
              }}
            >
              <Box>
                <Image src="/images/image-facturacion.png" alt="Descripción de la imagen"width={900} height={600}/>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Footer */}
      <Box  sx={{ backgroundColor: '#0b2135', py: 2, mt: 5, width:"100%"}}>
        <Typography variant="body2" color="white" align="center">
          © 2024 CFDITotal. Todos los derechos reservados.
        </Typography>
      </Box>
    </div>
  );
}
