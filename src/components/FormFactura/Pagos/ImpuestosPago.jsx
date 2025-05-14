"use client";
import { useEffect, useState } from 'react';
import { Box, TextField, Typography } from '@mui/material';
import Select from "@/components/Select/Select.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImpuestoPago({
  impuesto,
  index,
  register,
  setValue,
  getValues,
  watch,
  readOnly = true
}) {
  const { 
    ImpuestoClave, 
    TipoFactor, 
    TasaOCuota, 
    Base, 
    Importe 
  } = impuesto;

  console.log("Impuesto:", impuesto);

  // Formateador de moneda
  const formatCurrency = (value) => {
    if (value === undefined || value === null) return '$0.00';
    
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.]/g, '')) || 0 : value;
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(num);
  };

  // Efecto para sincronizar valores iniciales
  useEffect(() => {
    if (impuesto) {
      setValue(`impuestos[${index}].ImpuestoClave`, ImpuestoClave);
      setValue(`impuestos[${index}].TipoFactor`, TipoFactor);
      setValue(`impuestos[${index}].TasaOCuota`, TasaOCuota);
      setValue(`impuestos[${index}].Base`, Base);
      setValue(`impuestos[${index}].Importe`, Importe);
    }
  }, [impuesto, index, setValue]);

  return (
    <Box 
      sx={{ 
        border: '1px solid #e0e0e0', 
        borderRadius: 1, 
        p: 2, 
        mb: 2,
        backgroundColor: '#f9f9f9'
      }}
    >
      <Typography variant="subtitle1" gutterBottom>
        Impuestos
      </Typography>
      
      <Box display="grid" gridTemplateColumns="repeat(5, 1fr)" gap={2}>
        {/* Impuesto */}
        <TextField
          {...register(`impuestos[${index}].ImpuestoClave`)}
          label="Clave Impuesto"
          value={ImpuestoClave || ''}
          fullWidth
          InputProps={{ readOnly }}
          variant={readOnly ? "filled" : "outlined"}
        />
        
        {/* Tipo Factor */}
        <TextField
          {...register(`impuestos[${index}].TipoFactor`)}
          label="Tipo Factor"
          value={TipoFactor || ''}
          fullWidth
          InputProps={{ readOnly }}
          variant={readOnly ? "filled" : "outlined"}
        />
        
        {/* Tasa o Cuota */}
        <TextField
          {...register(`impuestos[${index}].TasaOCuota`)}
          label="Tasa o Cuota"
          value={TasaOCuota || ''}
          fullWidth
          InputProps={{ readOnly }}
          variant={readOnly ? "filled" : "outlined"}
        />
        
        {/* Base */}
        <TextField
          {...register(`impuestos[${index}].Base`)}
          label="Base"
          value={formatCurrency(Base)}
          fullWidth
          InputProps={{ readOnly }}
          variant={readOnly ? "filled" : "outlined"}
        />
        
        {/* Importe */}
        <TextField
          {...register(`impuestos[${index}].Importe`)}
          label="Importe"
          value={formatCurrency(Importe)}
          fullWidth
          InputProps={{ readOnly }}
          variant={readOnly ? "filled" : "outlined"}
        />
      </Box>
    </Box>
  );
}