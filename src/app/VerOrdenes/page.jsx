"use client";

import Header from '@/components/Header/Header';
import { Box, Typography } from '@mui/material';
import VistaOrdenes from '@/components/VistaOrdenes/VistaOrdenes';

export default function VerOrdenes (){
    return (
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={4} boxShadow={3} borderRadius={2}>
              
                <VistaOrdenes />
            </Box>
        </div>
    );
}