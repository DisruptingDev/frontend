"use client"
import {useState} from "react"
import { useForm } from 'react-hook-form';

import Header from "@/components/Header/Header.jsx"
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa.jsx"
import AltaCliente from "@/components/AltaCliente/AltaCliente.jsx"


export default function CrearFactura() {
    const { register, watch, handleSubmit, setValue, getValues } = useForm();
    const [lugarExpedicion, setLugarExpedicion] = useState("")
    const [conceptos, setConceptos] = useState([])
    
    const onSubmit = (data) => {
        console.log(data)
        console.log(conceptos)
    }
    
    return (
        <div>
            <Header /> 
            <AltaEmpresa />
            {/* <AltaCliente /> */}
           
        </div>
    );
}

