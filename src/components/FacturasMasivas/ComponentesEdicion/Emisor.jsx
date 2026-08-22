"use client";
import React, { useState, useEffect } from 'react';
import { Box, Typography, FormControl, InputLabel, MenuItem, Select as MuiSelect, FormHelperText } from '@mui/material';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Emisor({
  datosEmisor,
  register,
  getValues,
  setValue,
  trigger,
  errors,
  emisorId
}) {
  const [emisor, setEmisor] = useState(null);
  const [emisores, setEmisores] = useState([]);
  const [series, setSeries] = useState([]);
  const [loading, setLoading] = useState({
    emisores: false,
    series: false
  });

  // Cargar emisores y series relacionadas al montar el componente
  useEffect(() => {
    const cargarDatosIniciales = async () => {
      setLoading(prev => ({ ...prev, emisores: true }));
      
      try {
        // 1. Cargar lista de emisores
        const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
        const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        const dataEmisores = await response.json();
        setEmisores(Array.isArray(dataEmisores) ? dataEmisores : []);

        // 2. Determinar el emisor inicial (prioridad: datosEmisor > emisorId)
        let emisorInicial = null;
        if (datosEmisor) {
          emisorInicial = dataEmisores.find(e => String(e.ID) === String(datosEmisor.ID));
        } else if (emisorId) {
          emisorInicial = dataEmisores.find(e => String(e.ID) === String(emisorId));
        }

        if (emisorInicial) {
          // 3. Establecer el emisor inicial
          setEmisor(emisorInicial);
          setValue("Emisor", String(emisorInicial.ID));
          setValue("EmisorID", String(emisorInicial.ID));
          setValue("EmisorNombre", emisorInicial.Nombre);
          setValue("EmisorRFC", emisorInicial.Rfc);
          setValue("EmisorLugarExpedicion", emisorInicial.LugarExpedicion);
          trigger(["Emisor", "EmisorID", "EmisorNombre", "EmisorRFC", "EmisorLugarExpedicion"]);

          // 4. Cargar series del emisor inicial
          await cargarSeries(emisorInicial.ID);
          
          // Si hay datosEmisor, establecer también la serie
          if (datosEmisor?.Serie) {
            setValue("Serie", datosEmisor.Serie);
            trigger("Serie");
          }
        }
      } catch (error) {
        console.error("Error cargando datos iniciales:", error);
      } finally {
        setLoading(prev => ({ ...prev, emisores: false }));
      }
    };

    cargarDatosIniciales();
  }, [datosEmisor, emisorId]); // Dependencias del efecto

  // Función para cargar series de un emisor
  const cargarSeries = async (emisorID) => {
    if (!emisorID) return;
    
    setLoading(prev => ({ ...prev, series: true }));
    try {
      const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisorID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });
      const data = await response.json();
      setSeries(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando series:", error);
    } finally {
      setLoading(prev => ({ ...prev, series: false }));
    }
  };

  const handleEmisorChange = async (e) => {
    const selectedId = e.target.value;
    const selectedEmisor = emisores.find(e => e.ID === selectedId);
    
    if (selectedEmisor) {
      setEmisor(selectedEmisor);
      setValue("Emisor", String(selectedEmisor.ID));
      setValue("EmisorID", String(selectedEmisor.ID));
      setValue("EmisorNombre", selectedEmisor.Nombre);
      setValue("EmisorRFC", selectedEmisor.Rfc);
      setValue("EmisorLugarExpedicion", selectedEmisor.LugarExpedicion);
      trigger(["Emisor", "EmisorID", "EmisorNombre", "EmisorRFC", "EmisorLugarExpedicion"]);

      // Cargar las nuevas series cuando cambia el emisor
      await cargarSeries(selectedEmisor.ID);
      
      // Resetear serie cuando cambia el emisor
      setValue("Serie", "");
      setValue("TipoComprobante", "");
      trigger(["Serie", "TipoComprobante"]);
    }
  };

  const handleSerieChange = (e) => {
    const selectedSerie = series.find(s => s.Clave === e.target.value);
    
    if (selectedSerie) {
      setValue("Serie", selectedSerie.Clave);
      setValue("TipoComprobante", selectedSerie.TipoComprobante);
      trigger(["Serie", "TipoComprobante"]);
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>Emisor</Typography>
      <Box
        display="grid"
        gap={3}
        sx={{
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: '1fr 1fr'
          }
        }}
      >
        {/* Selector de Emisor - Campo Requerido */}
        <FormControl fullWidth error={!!errors.Emisor} required>
          <InputLabel required>Emisor *</InputLabel>
          <MuiSelect
            {...register("Emisor", { 
              required: "Este campo es obligatorio",
              onChange: handleEmisorChange
            })}
            value={getValues("Emisor") || ''}
            label="Emisor *"
            disabled={loading.emisores}
          >
            <MenuItem value="" disabled>
              {loading.emisores ? "Cargando..." : "Seleccione un emisor"}
            </MenuItem>
            {emisores.map((item) => (
              <MenuItem key={item.ID} value={String(item.ID)}>
                {item.Nombre}
              </MenuItem>
            ))}
          </MuiSelect>
          <FormHelperText>
            {errors.Emisor ? errors.Emisor.message : " "}
          </FormHelperText>
        </FormControl>

        {/* Selector de Serie - Campo Requerido */}
        <FormControl fullWidth error={!!errors.Serie} required>
          <InputLabel required>Serie *</InputLabel>
          <MuiSelect
            {...register("Serie", { 
              required: "Este campo es obligatorio",
              onChange: handleSerieChange,
              validate: (value) => {
                if (!value) return "Debe seleccionar una serie";
                if (!series.some(s => s.Clave === value)) return "Serie no válida";
                return true;
              }
            })}
            value={getValues("Serie") || ''}
            label="Serie *"
            disabled={loading.series || !emisor}
          >
            <MenuItem value="" disabled>
              {loading.series ? "Cargando..." : emisor ? "Seleccione una serie" : "Seleccione un emisor primero"}
            </MenuItem>
            {series.map((item) => (
              <MenuItem key={item.Clave} value={item.Clave}>
                {item.Clave} - {item.TimbresDisponibles} disponibles
              </MenuItem>
            ))}
          </MuiSelect>
          <FormHelperText>
            {errors.Serie ? errors.Serie.message : " "}
          </FormHelperText>
        </FormControl>
      </Box>
    </Box>
  );
}