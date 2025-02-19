"use client";
import AppAppBar from '@/components/AppAppBar/AppAppBar';
import Hero from '@/components/Hero/Hero';
import { AppBar, Toolbar, Typography, Button, Box, Grid, Container,  } from '@mui/material';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function HomePage() {
    const router = useRouter();
    return (
        <div>
        <AppAppBar/>
        <Hero />
        </div>
        // <div className="flex flex-col items-center justify-between h-screen bg-primary-dark-total">
        //     {/* Barra de navegación */}
        //     <AppBar position="static" sx={{ backgroundColor: '#063F53', paddingRight: 15, paddingLeft: 15 }}>
        //         <Toolbar>
        //             <Box sx={{ flexGrow: 1, padding: "0.4em" }}>
        //                 <Image src="/images/Log_blanco_wise_factura.png" alt="Descripción de la imagen" width={200} height={50} />
        //             </Box>
        //             {/* <Button color="inherit">Características</Button>
        //   <Button color="inherit">Precios</Button>
        //   <Button color="inherit">Contacto</Button> */}
        //             <Button
        //                 variant="outlined"
        //                 color="inherit"
        //                 sx={{
        //                     ml: 2, // Margen izquierdo
        //                     borderColor: '#ffffff', // Color del borde
        //                     color: '#ffffff', // Color del texto
        //                     '&:hover': {
        //                         backgroundColor: 'rgba(16, 150, 138, 1)', // Fondo semi-transparente en hover
        //                         borderColor: '#ffffff', // Mantener el borde blanco en hover
        //                     },
        //                 }}
        //                 onClick={() => router.push('/IniciaSesion')}
        //             >
        //                 Iniciar Sesión
        //             </Button>
        //             <Button variant="contained" sx={{
        //                 backgroundColor: '#10968A', ml: 2, '&:hover': {
        //                     backgroundColor: '#0398a6', // Color al hacer hover
        //                 },
        //             }}
        //             onClick={() => router.push('/AltaUsuarios')}>
        //                 Registrarse
        //             </Button>
        //         </Toolbar>
        //     </AppBar>

      
          
            //     <Grid spacing={12} >
            //         {/* Texto */}
            //         <Grid size={6} item xs={12} md={6} ml={0} >
            //             <Typography variant="h2" component="h1" gutterBottom sx={{ color: 'white', fontWeight: 'bold' }}>
            //                 La evolución de la facturación electrónica
            //             </Typography>
            //             <Typography variant="h6" sx={{ color: '#d0d0d0', mb: 4 }}>
            //                 Simplifica tu proceso de facturación CFDI con nuestra plataforma intuitiva y eficiente. Olvídate de los procedimientos complicados y disfruta de una solución rápida y segura.
            //             </Typography>
            //             <Button variant="contained" size="large" sx={{
            //                 backgroundColor: '#10968A', '&:hover': {
            //                     backgroundColor: '#0398a6', // Color al hacer hover
            //                 },
            //             }}
            //             onClick={() => router.push('/AltaUsuarios')}>
            //                 Comenzar ahora
            //             </Button>
            //         </Grid>

            //         {/* Imagen (ficticia para diseño) */}
            //         <Grid  size={6} item xs={12} md={6} ml={0} >
            //             <Box
            //                 sx={{
            //                     width: '100%',
            //                     height: 'auto',
            //                     // backgroundColor: '#f0f0f0',
            //                     display: 'flex',
            //                     justifyContent: 'center',
            //                     alignItems: 'center',
            //                     borderRadius: 2,
            //                 }}
            //             >
            //                 <Box sx="lg-4">
            //                     <Image src="/images/image-facturacion.png" alt="Descripción de la imagen" width={900} height={600} />
            //                 </Box>
            //             </Box>
            //         </Grid>
            //     </Grid>
           

            // {/* Footer */}
            // <Box sx={{ backgroundColor: '#0b2135', py: 2, mt: 5, width: "100%" }}>
            //     <Typography variant="body2" color="white" align="center">
            //         © 2025 Wise Factura Todos los derechos reservados.
            //     </Typography>
            // </Box>
        //</div>
    );
}
