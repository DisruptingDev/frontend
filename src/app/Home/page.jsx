"use client"
import {useState} from "react"
import { useForm } from 'react-hook-form';

import Header from "@/components/Header/Header.jsx"
import SearchFilter from "@/components/Home/Busqueda/Busqueda.jsx"

import Tabla from "@/components/Home/Tabla/Tabla.jsx"
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa.jsx"
import AltaCliente from "@/components/AltaCliente/AltaCliente.jsx"


export default function Home() {
    const { register, watch, handleSubmit, setValue, getValues } = useForm();
    // const [lugarExpedicion, setLugarExpedicion] = useState("")
    // const [conceptos, setConceptos] = useState([])
    
    // const onSubmit = (data) => {
    //     console.log(data)
    //     console.log(conceptos)
    // }
    
    return (
        <div>
            <Header />  
            <SearchFilter register = {register}/>
            <Tabla />
        </div>
    );
}

