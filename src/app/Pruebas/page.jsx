"use client";

import { Button,Snackbar, Alert,Modal, Box } from '@mui/material';

import { useState } from "react";
import AltaSerie from '@/components/AltaSerie/AltaSerie';
import Select from '@/components/Select/Select';


export default function Pruebas() {

const Prueba = {
    "Version": "4.0", //Esta se manda pero por default es 4.0 siempre    
  "Fecha": "2024-08-09T15:27:20",  //Cuidado con el formato de la fecha, solo se ocupa este formato, ninguno otro es valido. Se está mandando otro 
  "FormaPago": "99",
  "SubTotal": 200,
  "Descripcion": "Gigante",
  "Moneda": "MXN",
  "TipoCambio": "1",
  "Total": 180,  
  "Exportacion": "01",
  "MetodoPago": "PUE",
  "LugarExpedicion": "20000",  
  "InformacionGlobal": {
    "Periodicidad": "01",
    "Meses": "01",
    "Año": "2024"
  },
  "EmisorID": 60,
  "ReceptorID": 22,
  "Conceptos": {
    "ListaConceptos": [
      {
        "ClaveProdServ": "10101502",      
        "NoIdentificacion": "UT421511",
        "Cantidad": 1,
        "ClaveUnidad": "H87",
        "Unidad": "Pieza", //No se está enviando este dato, este se obtiene de ClaveProdServ, es la descripcion
        "Descripcion": "Gigante",
        "ValorUnitario": 200,
        "Importe": 200,
        "Descuento": 0,
        "ObjetoImp": "02",
        "Impuestos": {
          "Retenciones": [
            {
              "Base": 200,
              "ImpuestoClave": "001", //Este es el formato solicitado (001), si manda solo 1 da error al mandar al SAT
              "TipoFactor": "Tasa",
              "TasaOCuota": 0.1,
              "Importe": 20
            }
          ]
        }
      }
    ],
    "TotalImpuestosTrasladados": 0,
    "TotalImpuestosRetenidos": 20 
  }
}
}
    return (
        <form action="">
            <Select>
                
            </Select>
        </form>
        
    );
}
