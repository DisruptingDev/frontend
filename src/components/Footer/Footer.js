'use client';
import { Box, Container, Grid, Typography, Link, IconButton, useTheme, useMediaQuery } from '@mui/material';
import Image from 'next/image';
import { Facebook, Twitter, Instagram, LinkedIn, Email, Phone, LocationOn, WhatsApp } from '@mui/icons-material';

const Footer = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: '#063F53',
        color: theme.palette.primary.contrastText,
        py: 4,
        mt: 'auto',
        borderTop: `1px solid ${theme.palette.divider}`
      }}
    >
      <Container maxWidth="lg">
        <Grid container spacing={4}>
          {/* Sección de Información */}
          <Grid item xs={12} md={4}>
             <Image
                      src="/images/Log_blanco_wise_factura.png"
                      alt="Descripción del logo"
                      width={203}
                      height={64}
                    />
            <Typography variant="body2" sx={{ mb: 2 }}>
              Sistema integral de facturación electrónica y gestión empresarial.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <IconButton aria-label="Facebook" color="inherit">
                <Facebook />
              </IconButton>
              <IconButton aria-label="Twitter" color="inherit">
                <Twitter />
              </IconButton>
              <IconButton aria-label="Instagram" color="inherit">
                <Instagram />
              </IconButton>
              <IconButton aria-label="LinkedIn" color="inherit">
                <LinkedIn />
              </IconButton>
            </Box>
          </Grid>

          {/* Enlaces rápidos */}
          <Grid item xs={6} md={2}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Enlaces
            </Typography>
            <Link href="/Home" color="inherit" underline="hover" display="block" mb={1}>
              Inicio
            </Link>
            <Link href="/CrearFactura" color="inherit" underline="hover" display="block" mb={1}>
              Facturación
            </Link>
            <Link href="/AltaCliente" color="inherit" underline="hover" display="block" mb={1}>
              Clientes
            </Link>
            <Link href="/Empresas" color="inherit" underline="hover" display="block" mb={1}>
              Empresas
            </Link>
          </Grid>

          {/* Soporte */}
          <Grid item xs={6} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Soporte
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <WhatsApp fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">+52 55 1234 5678</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Email fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">soporte@wisefacturacion.com</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <LocationOn fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">Puebla, Puebla, MX</Typography>
            </Box>
          </Grid>

          {/* Legal */}
          <Grid item xs={12} md={3}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
              Legal
            </Typography>
            <Link href="/terminos" color="inherit" underline="hover" display="block" mb={1}>
              Términos y condiciones
            </Link>
            <Link href="/privacidad" color="inherit" underline="hover" display="block" mb={1}>
              Política de privacidad
            </Link>
            <Link href="/cookies" color="inherit" underline="hover" display="block" mb={1}>
              Política de cookies
            </Link>
          </Grid>
        </Grid>

        {/* Derechos de autor */}
        <Box sx={{ 
          mt: 4, 
          pt: 2, 
          borderTop: `1px solid ${theme.palette.primary.light}`,
          textAlign: 'center'
        }}>
          <Typography variant="body2">
            © {new Date().getFullYear()} Sistema de Facturación Electrónica. Todos los derechos reservados.
          </Typography>
          <Typography variant="caption" display="block" sx={{ mt: 1 }}>
            Versión 1.0.0
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Footer;