"use client";

import Header from '@/components/Header/Header';
import { Box, Typography } from '@mui/material';
import Pagos from '@/components/Pagos/Pagos';
export default function AsignarTimbres (){
    return (
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={4} boxShadow={3} borderRadius={2}>
              
                <Pagos />
            </Box>
        </div>
    );
}