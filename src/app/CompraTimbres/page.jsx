"use client";

import { useState } from 'react';
import { Box, Tabs, Tab, Typography} from '@mui/material';
import Planes from '@/components/CompraTimbres/Planes';
import Paquetes from '@/components/CompraTimbres/Paquetes';
import Header from '@/components/Header/Header';

export default function CompraTimbres() {
    // Estado para controlar el componente que se mostrará
    const [valorTab, setValorTab] = useState(0);

    const manejarCambioTab = (event, newValue) => {
        setValorTab(newValue);
    };

    return (
      <div>
        <Header />
        <Box bgcolor="white" my={4} mx={4} p={4} boxShadow={3} borderRadius={2}>
            {/* Tabs para seleccionar Planes o Paquetes */}
            {/* <Typography variant="h4" textAlign="center" gutterBottom sx={{ fontWeight: '600' }}>
                Compra de Timbres
            </Typography> */}
            <Tabs 
                value={valorTab} 
                onChange={manejarCambioTab} 

                textColor="#1b384a"
                centered
                sx={{
                  
                    '& .MuiTabs-indicator': {
                        backgroundColor: '#1b384a', // Cambiar el color del indicador aquí
                    },
                }}
            >
                <Tab label="Paquetes" />
                <Tab label="Planes" />
            </Tabs>

            {/* Mostrar el componente correspondiente */}
            {valorTab === 0 ? <Paquetes /> : <Planes />}
        </Box>
      </div>
    );
}
