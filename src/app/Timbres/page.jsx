"use client";

import AdministrarTimbres from "@/components/AdministraTimbres/AdministrarTimbres";
import Header from "@/components/Header/Header";
import { Button, Snackbar, Alert, Modal, Box } from "@mui/material";



export default function Timbres() {
    return(
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                <AdministrarTimbres />
            </Box>
        </div>
    )
}