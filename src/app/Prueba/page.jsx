"use client";
import { useState } from "react";
import Header from "@/components/Header/Header.jsx";
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa.jsx";
import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD.jsx";
import { Box } from "@mui/material";

export default function CrearFactura() {
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');

    const handleUpdateEmpresa = (name, rfc) => {
        setIssuerName(name);
        setIssuerRfc(rfc);
    };

    return (
        <div>
            <Header />
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
                <CertificadoCSD onUpdateEmpresa={handleUpdateEmpresa} />
                <AltaEmpresa issuerName={issuerName} issuerRfc={issuerRfc} />
            </Box>
        </div>
    );
}
