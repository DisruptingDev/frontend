"use client";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaEmpresas from "@/components/VistaEmpresas/VistaEmpresas";
import { Box, Button, Dialog, DialogTitle, DialogContent} from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";


export default function AdministraEmpresas() {
   



    return (
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                

                <VistaEmpresas />

            </Box>
           
        </div>
    );
}
