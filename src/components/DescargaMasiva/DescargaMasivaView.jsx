"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  Paper,
  Chip,
} from '@mui/material';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import ListAltIcon from '@mui/icons-material/ListAlt';
import BusinessIcon from '@mui/icons-material/Business';
import SolicitarDescargaTab from './SolicitarDescargaTab';
import BandejaPeticionesTab from './BandejaPeticionesTab';
import GestionEmpresasTab from './GestionEmpresasTab';

const mainApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.sandbox.wisefacturacion.com';

const DescargaMasivaView = ({ token }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [errorEmpresas, setErrorEmpresas] = useState(null);

  useEffect(() => {
    fetchEmpresasUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchEmpresasUsuario = async () => {
    if (!token) return;
    setLoadingEmpresas(true);
    setErrorEmpresas(null);
    try {
      const response = await fetch(`${mainApiUrl}/api/catalogos/Catalogos/Emisor`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) {
        throw new Error(`Error al obtener empresas: ${response.statusText}`);
      }
      const data = await response.json();
      if (Array.isArray(data)) {
        setEmpresas(data.sort((a, b) => (b.ID || 0) - (a.ID || 0)));
      } else {
        setEmpresas([]);
      }
    } catch (err) {
      console.error('Error al cargar emisores del usuario:', err);
      setErrorEmpresas('No se pudieron cargar las empresas asignadas a su cuenta.');
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSolicitudCreada = () => {
    // Al generar solicitud, redirigir automáticamente a la bandeja de peticiones
    setActiveTab(1);
  };

  if (loadingEmpresas) {
    return (
      <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" py={10}>
        <CircularProgress />
        <Typography variant="body2" color="text.secondary" mt={2}>
          Cargando configuración de empresas autorizadas...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      {/* Encabezado Principal */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" mb={2.5}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            Descarga Masiva de Facturas SAT
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Módulo conectado al SAT vía Prodigia PAC para descarga masiva de comprobantes XML y sincronización contable
          </Typography>
        </Box>

        <Box display="flex" gap={1} alignItems="center">
          <Chip
            icon={<BusinessIcon />}
            label={`${empresas.length} ${empresas.length === 1 ? 'Empresa Registrada' : 'Empresas Registradas'}`}
            color="primary"
            variant="outlined"
          />
        </Box>
      </Box>

      {errorEmpresas && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {errorEmpresas}
        </Alert>
      )}

      {/* Barra de Navegación por Pestañas */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          textColor="primary"
          indicatorColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab
            icon={<CloudDownloadIcon />}
            iconPosition="start"
            label="Nueva Solicitud SAT"
            sx={{ fontWeight: 'bold', textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<ListAltIcon />}
            iconPosition="start"
            label="Bandeja de Peticiones y Descargas"
            sx={{ fontWeight: 'bold', textTransform: 'none', minHeight: 48 }}
          />
          <Tab
            icon={<BusinessIcon />}
            iconPosition="start"
            label="Gestión de Empresas SAT"
            sx={{ fontWeight: 'bold', textTransform: 'none', minHeight: 48 }}
          />
        </Tabs>
      </Paper>

      {/* Contenido según pestaña activa */}
      {activeTab === 0 && (
        <SolicitarDescargaTab
          empresas={empresas}
          token={token}
          onSolicitudCreada={handleSolicitudCreada}
        />
      )}

      {activeTab === 1 && (
        <BandejaPeticionesTab
          empresas={empresas}
          token={token}
        />
      )}

      {activeTab === 2 && (
        <GestionEmpresasTab
          empresasUsuario={empresas}
          token={token}
          onEmpresasActualizadas={fetchEmpresasUsuario}
        />
      )}
    </Box>
  );
};

export default DescargaMasivaView;
