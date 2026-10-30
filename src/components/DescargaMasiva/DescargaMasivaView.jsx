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
import { useAuth } from '@/hooks/useAuth';
import SolicitarDescargaTab from './SolicitarDescargaTab';
import BandejaPeticionesTab from './BandejaPeticionesTab';
import GestionEmpresasTab from './GestionEmpresasTab';

const mainApiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.sandbox.wisefacturacion.com';

const DescargaMasivaView = ({ token }) => {
  const { hasPermission, isSuperUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [empresas, setEmpresas] = useState([]);
  const [loadingEmpresas, setLoadingEmpresas] = useState(true);
  const [errorEmpresas, setErrorEmpresas] = useState(null);

  // Permisos granulares (con bypass para SuperUser)
  const puedeSolicitar = isSuperUser || hasPermission('DESCARGA_MASIVA_SOLICITAR') || hasPermission('DESCARGA_MASIVA_ACCESO');
  const puedeAdministrarFiel = isSuperUser || hasPermission('DESCARGA_MASIVA_FIEL');

  useEffect(() => {
    fetchEmpresasUsuario();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fetchEmpresasUsuario = async () => {
    setLoadingEmpresas(true);
    setErrorEmpresas(null);
    try {
      const activeToken =
        token ||
        (typeof window !== 'undefined'
          ? sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || ''
          : '');

      const mapEmpresas = new Map();

      // 1. Obtener empresas desde catálogo de emisores
      if (activeToken) {
        try {
          const response = await fetch(`${mainApiUrl}/api/catalogos/Catalogos/Emisor`, {
            headers: {
              Authorization: `Bearer ${activeToken}`,
            },
          });
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data)) {
              data.forEach((e) => {
                const rfc = (e.Rfc || e.rfc || '').toUpperCase().trim();
                if (rfc) {
                  mapEmpresas.set(rfc, {
                    ...e,
                    Rfc: rfc,
                    rfc: rfc,
                    RazonSocial: e.RazonSocial || e.NombreComercial || e.Nombre || rfc,
                  });
                }
              });
            }
          }
        } catch (errEmisor) {
          console.warn('Aviso cargando catalogo emisor:', errEmisor);
        }
      }

      // 2. Obtener empresas que tienen FIEL registrada en base de datos local
      try {
        const headersFiel = {};
        if (activeToken) headersFiel['Authorization'] = `Bearer ${activeToken}`;
        const resFiel = await fetch('/api/descarga-masiva/fiel/listar', {
          headers: headersFiel,
        });
        if (resFiel.ok) {
          const dataFiel = await resFiel.json();
          const listaFiel = dataFiel.empresas || dataFiel.razonesSociales || [];
          listaFiel.forEach((f) => {
            const rfc = (f.rfc || f.Rfc || '').toUpperCase().trim();
            if (rfc) {
              if (mapEmpresas.has(rfc)) {
                const actual = mapEmpresas.get(rfc);
                actual.tieneFiel = true;
              } else if (isSuperUser) {
                // Solo si es Super Admin puede ver empresas con FIEL fuera del catálogo del grupo
                mapEmpresas.set(rfc, {
                  ID: f.id || rfc,
                  Rfc: rfc,
                  rfc: rfc,
                  RazonSocial: f.razon_social || f.RazonSocial || rfc,
                  tieneFiel: true,
                });
              }
            }
          });
        }
      } catch (errFiel) {
        console.warn('Aviso cargando empresas fiel:', errFiel);
      }

      const resultadoEmpresas = Array.from(mapEmpresas.values());
      console.log('[DescargaMasivaView] Empresas cargadas para el usuario:', resultadoEmpresas);
      setEmpresas(resultadoEmpresas);
    } catch (err) {
      console.error('Error al cargar emisores del usuario:', err);
      setErrorEmpresas('No se pudieron cargar las empresas asignadas a su cuenta.');
    } finally {
      setLoadingEmpresas(false);
    }
  };

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedRfcBandeja, setSelectedRfcBandeja] = useState('');

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleSolicitudCreada = (solicitudData) => {
    if (solicitudData?.rfc) {
      const rfc = Array.isArray(solicitudData.rfc) ? solicitudData.rfc[0] : solicitudData.rfc;
      setSelectedRfcBandeja((rfc || '').toUpperCase().trim());
    }
    // Al generar solicitud, incrementar trigger y redirigir automáticamente a la bandeja de peticiones
    setRefreshTrigger((prev) => prev + 1);
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
          {puedeAdministrarFiel && (
            <Tab
              icon={<BusinessIcon />}
              iconPosition="start"
              label="Gestión de Empresas SAT"
              sx={{ fontWeight: 'bold', textTransform: 'none', minHeight: 48 }}
            />
          )}
        </Tabs>
      </Paper>

      {/* Contenido según pestaña activa */}
      {activeTab === 0 && (
        <SolicitarDescargaTab
          empresas={empresas}
          token={token}
          isSuperUser={isSuperUser}
          onSolicitudCreada={handleSolicitudCreada}
        />
      )}

      {activeTab === 1 && (
        <BandejaPeticionesTab
          empresas={empresas}
          token={token}
          isSuperUser={isSuperUser}
          refreshTrigger={refreshTrigger}
          rfcInicial={selectedRfcBandeja}
        />
      )}

      {activeTab === 2 && puedeAdministrarFiel && (
        <GestionEmpresasTab
          empresasUsuario={empresas}
          token={token}
          isSuperUser={isSuperUser}
          onEmpresasActualizadas={fetchEmpresasUsuario}
        />
      )}
    </Box>
  );
};

export default DescargaMasivaView;
