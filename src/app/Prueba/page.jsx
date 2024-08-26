"use client"
import {useState} from "react"
// import { useForm } from 'react-hook-form';

import Header from "@/components/Header/Header.jsx"
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa.jsx"
import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD.jsx"
import AltaCliente from "@/components/AltaCliente/AltaCliente.jsx"
import { Box } from "@mui/material"


export default function CrearFactura() {
    // const { register, watch, handleSubmit, setValue, getValues } = useForm();
    // const [lugarExpedicion, setLugarExpedicion] = useState("")
    // const [conceptos, setConceptos] = useState([])
    
    // const onSubmit = (data) => {
    //     console.log(data)
    //     console.log(conceptos)
    // }
    
    return (
        <div><Header /> 
            <Box bgcolor="white" my={4} mx={4} p={2} boxShadow={3} borderRadius={2}>
            
            <CertificadoCSD />
            <AltaEmpresa />
            {/* <AltaCliente /> */}
            </Box>
           
        </div>
    );
}

