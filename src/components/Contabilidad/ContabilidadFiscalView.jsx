"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  TextField,
  MenuItem,
  Button,
  Tabs,
  Tab,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  Divider,
} from '@mui/material';
import CalculateIcon from '@mui/icons-material/Calculate';
import SyncIcon from '@mui/icons-material/Sync';
import DownloadIcon from '@mui/icons-material/Download';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import ReceiptIcon from '@mui/icons-material/Receipt';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import contabilidadService from '@/services/contabilidadService';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const getInitialDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const firstDay = `${year}-${month}-01`;
  const today = `${year}-${month}-${day}`;
  return { firstDay, today };
};

const ContabilidadFiscalView = ({ token }) => {
  const { firstDay, today } = getInitialDates();

  const [empresas, setEmpresas] = useState([]);
  const [selectedRfc, setSelectedRfc] = useState('');
  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);

  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const [resumenData, setResumenData] = useState(null);
  const [diotData, setDiotData] = useState([]);
  const [activeTab, setActiveTab] = useState(0); // 0: Balance IVA, 1: Facturas Recibidas, 2: Facturas Emitidas, 3: DIOT

  // Cargar lista de empresas
  useEffect(() => {
    cargarEmpresas();
  }, [token]);

  const cargarEmpresas = async () => {
    try {
      const mapEmpresas = new Map();

      // 1. Cargar las empresas/emisores asignados al usuario con su token
      if (token) {
        try {
          const res = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
          if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data)) {
              data.forEach((e) => {
                const rfc = (e.Rfc || e.rfc || '').toUpperCase().trim();
                if (rfc) {
                  mapEmpresas.set(rfc, {
                    id: e.Id || e.id || rfc,
                    rfc: rfc,
                    razon_social: e.RazonSocial || e.NombreComercial || e.Nombre || rfc,
                  });
                }
              });
            }
          }
        } catch (errEmisor) {
          console.warn('Error cargando catálogo de emisores:', errEmisor);
        }
      }

      // 2. Si no tiene empresas desde catálogo o para complementar con empresas con FIEL
      try {
        const resFiel = await fetch('/api/descarga-masiva/fiel/listar');
        if (resFiel.ok) {
          const dataFiel = await resFiel.json();
          const listaFiel = dataFiel.empresas || [];
          listaFiel.forEach((f) => {
            const rfc = (f.rfc || f.Rfc || '').toUpperCase().trim();
            if (rfc) {
              if (mapEmpresas.has(rfc)) {
                const existente = mapEmpresas.get(rfc);
                existente.tieneFiel = true;
              } else if (mapEmpresas.size === 0) {
                // Si el catálogo no arrojó nada (o token ausente), usar las de FIEL como fallback
                mapEmpresas.set(rfc, {
                  id: f.id || rfc,
                  rfc: rfc,
                  razon_social: f.razon_social || f.RazonSocial || rfc,
                  tieneFiel: true,
                });
              }
            }
          });
        }
      } catch (errFiel) {
        console.warn('Error cargando empresas con FIEL:', errFiel);
      }

      const lista = Array.from(mapEmpresas.values());
      setEmpresas(lista);

      if (lista.length > 0) {
        // Si no hay seleccionado o el seleccionado ya no pertenece a la lista del usuario
        if (!selectedRfc || !lista.some((item) => item.rfc === selectedRfc)) {
          setSelectedRfc(lista[0].rfc);
        }
      } else {
        setSelectedRfc('');
      }
    } catch (err) {
      console.warn('Error cargando empresas en contabilidad:', err);
    }
  };

  useEffect(() => {
    if (selectedRfc) {
      consultarContabilidad();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRfc]);

  const setPeriodo = (tipo) => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();

    if (tipo === 'mes_actual') {
      const start = new Date(year, month, 1).toISOString().split('T')[0];
      const end = new Date(year, month + 1, 0).toISOString().split('T')[0];
      setFechaInicio(start);
      setFechaFin(end);
    } else if (tipo === 'mes_anterior') {
      const start = new Date(year, month - 1, 1).toISOString().split('T')[0];
      const end = new Date(year, month, 0).toISOString().split('T')[0];
      setFechaInicio(start);
      setFechaFin(end);
    } else if (tipo === 'anio_actual') {
      setFechaInicio(`${year}-01-01`);
      setFechaFin(`${year}-12-31`);
    }
  };

  const consultarContabilidad = async () => {
    if (!selectedRfc) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await contabilidadService.obtenerResumen({
        rfc: selectedRfc,
        fechaInicio,
        fechaFin,
      }, token);
      setResumenData(data);

      // Cargar DIOT en segundo plano
      try {
        const diotRes = await contabilidadService.obtenerDIOT({
          rfc: selectedRfc,
          fechaInicio,
          fechaFin,
        }, token);
        setDiotData(diotRes.proveedores || []);
      } catch {}
    } catch (err) {
      setErrorMsg(err.message || 'Error al obtener datos contables.');
    } finally {
      setLoading(false);
    }
  };

  const handleSincronizarXMLs = async () => {
    if (!selectedRfc) return;
    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await contabilidadService.sincronizarXMLs({
        rfc: selectedRfc,
        fechaInicio,
        fechaFin,
      }, token);
      setSuccessMsg(res.mensaje || 'Comprobantes sincronizados exitosamente.');
      await consultarContabilidad();
    } catch (err) {
      setErrorMsg(err.message || 'Error al sincronizar XMLs de recibidas.');
    } finally {
      setSyncing(false);
    }
  };

  const handleDescargarDIOT = () => {
    contabilidadService.descargarTxtDIOT({
      rfc: selectedRfc,
      fechaInicio,
      fechaFin,
    });
  };

  const balance = resumenData?.balance_iva || {};
  const totales = resumenData?.totales || {};

  return (
    <Box sx={{ width: '100%', py: 1 }}>
      {/* Encabezado */}
      <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={3}>
        <Box>
          <Typography variant="h5" fontWeight="bold" color="primary">
            Contabilidad Fiscal e IVA
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Conciliación de Facturas Emitidas vs Recibidas, Cálculo de IVA Acreditable/Trasladado y Generación de la DIOT
          </Typography>
        </Box>

        <Box display="flex" gap={1.5} alignItems="center">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleDescargarDIOT}
            disabled={!diotData || diotData.length === 0}
            color="secondary"
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            Descargar DIOT (.txt SAT)
          </Button>

          <Button
            variant="contained"
            color="primary"
            startIcon={syncing ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
            onClick={handleSincronizarXMLs}
            disabled={loading || syncing}
            sx={{ textTransform: 'none', fontWeight: 'bold' }}
          >
            {syncing ? 'Sincronizando...' : 'Auto-Importar XMLs SAT'}
          </Button>
        </Box>
      </Box>

      {/* Barra de Filtros: Empresa y Periodo */}
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                select
                fullWidth
                size="small"
                label="Empresa Contable (RFC)"
                value={selectedRfc}
                onChange={(e) => setSelectedRfc(e.target.value)}
              >
                {empresas.map((emp) => (
                  <MenuItem key={emp.id || emp.rfc} value={emp.rfc}>
                    <strong>{emp.rfc}</strong> {emp.razon_social ? `— ${emp.razon_social}` : ''}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                label="Fecha Inicio"
                size="small"
                fullWidth
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <TextField
                type="date"
                label="Fecha Fin"
                size="small"
                fullWidth
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} md={2}>
              <Button
                variant="contained"
                fullWidth
                size="medium"
                startIcon={<CalculateIcon />}
                onClick={consultarContabilidad}
                disabled={loading}
                sx={{ height: 40 }}
              >
                Calcular
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  Periodos rápidos:
                </Typography>
                <Chip label="Mes Actual" size="small" clickable onClick={() => setPeriodo('mes_actual')} variant="outlined" />
                <Chip label="Mes Anterior" size="small" clickable onClick={() => setPeriodo('mes_anterior')} variant="outlined" />
                <Chip label="Año Completo" size="small" clickable onClick={() => setPeriodo('anio_actual')} variant="outlined" />
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {successMsg && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMsg(null)}>
          {successMsg}
        </Alert>
      )}

      {errorMsg && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg(null)}>
          {errorMsg}
        </Alert>
      )}

      {/* Tarjetas KPI de IVA y Balance */}
      <Grid container spacing={2.5} mb={3}>
        {/* IVA Trasladado (Cobrado) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', borderLeft: '5px solid #0284c7' }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  IVA TRASLADADO (COBRADO)
                </Typography>
                <TrendingUpIcon color="info" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="#0369a1" mt={0.5}>
                ${(balance.iva_trasladado || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totales.emitidas?.cantidad || 0} Facturas Emitidas (${(totales.emitidas?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })})
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* IVA Acreditable (Gastos/Compras) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', borderLeft: '5px solid #10b981' }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  IVA ACREDITABLE (PAGADO)
                </Typography>
                <TrendingDownIcon color="success" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="#047857" mt={0.5}>
                ${(balance.iva_acreditable || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totales.recibidas?.cantidad || 0} Facturas Recibidas (${(totales.recibidas?.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })})
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Resultado: IVA a Favor o a Pagar */}
        <Grid item xs={12} sm={6} md={3}>
          <Card
            variant="outlined"
            sx={{
              borderRadius: 2,
              bgcolor: balance.iva_a_pagar > 0 ? '#fef2f2' : '#f0fdf4',
              borderLeft: `5px solid ${balance.iva_a_pagar > 0 ? '#ef4444' : '#10b981'}`,
            }}
          >
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" fontWeight="bold" color={balance.iva_a_pagar > 0 ? 'error.main' : 'success.main'}>
                  {balance.iva_a_pagar > 0 ? 'IVA A PAGAR AL SAT' : 'IVA A FAVOR'}
                </Typography>
                <AccountBalanceIcon color={balance.iva_a_pagar > 0 ? 'error' : 'success'} fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color={balance.iva_a_pagar > 0 ? '#b91c1c' : '#15803d'} mt={0.5}>
                ${(balance.iva_a_pagar > 0 ? balance.iva_a_pagar : balance.iva_a_favor || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {balance.iva_a_pagar > 0 ? 'Diferencia a cargo del periodo' : 'Saldo a favor acreditable'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Retenciones (IVA e ISR) */}
        <Grid item xs={12} sm={6} md={3}>
          <Card variant="outlined" sx={{ borderRadius: 2, bgcolor: '#f8fafc', borderLeft: '5px solid #8b5cf6' }}>
            <CardContent sx={{ p: 2 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  RETENCIONES DE GASTOS
                </Typography>
                <ReceiptIcon color="secondary" fontSize="small" />
              </Box>
              <Typography variant="h5" fontWeight="bold" color="#6d28d9" mt={0.5}>
                ${((balance.iva_retenido || 0) + (balance.isr_retenido || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                IVA Ret: ${(balance.iva_retenido || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })} | ISR Ret: ${(balance.isr_retenido || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Pestañas de Detalle */}
      <Paper elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label={`Facturas Recibidas / Gastos (${resumenData?.recibidas?.length || 0})`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label={`Facturas Emitidas / Ingresos (${resumenData?.emitidas?.length || 0})`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
          <Tab label={`Cédula DIOT (${diotData?.length || 0} Proveedores)`} sx={{ textTransform: 'none', fontWeight: 'bold' }} />
        </Tabs>
      </Paper>

      {/* Contenido según pestaña */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TAB 0: Facturas Recibidas */}
          {activeTab === 0 && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell><strong>UUID</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Proveedor (RFC y Nombre)</strong></TableCell>
                    <TableCell align="right"><strong>Subtotal</strong></TableCell>
                    <TableCell align="right"><strong>Base 16%</strong></TableCell>
                    <TableCell align="right"><strong>IVA 16%</strong></TableCell>
                    <TableCell align="right"><strong>IVA Ret.</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>Deducible</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resumenData?.recibidas || []).map((row, idx) => (
                    <TableRow key={row.uuid || idx} hover>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {row.uuid}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {row.fecha ? String(row.fecha).split('T')[0] : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <strong>{row.rfc_emisor}</strong>
                        {row.nombre_emisor && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {row.nombre_emisor}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">${(row.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right">${(row.base_16 || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'success.dark' }}>
                        ${(row.iva_16 || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right">${(row.iva_retenido || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${(row.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" label="Sí" color="success" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!resumenData?.recibidas || resumenData.recibidas.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay facturas recibidas indexadas en este periodo. Haz clic en "Auto-Importar XMLs SAT" para extraer las facturas descargadas.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 1: Facturas Emitidas */}
          {activeTab === 1 && (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.100' }}>
                  <TableRow>
                    <TableCell><strong>Folio / Serie</strong></TableCell>
                    <TableCell><strong>UUID</strong></TableCell>
                    <TableCell><strong>Fecha</strong></TableCell>
                    <TableCell><strong>Cliente (Receptor)</strong></TableCell>
                    <TableCell align="right"><strong>Subtotal</strong></TableCell>
                    <TableCell align="right"><strong>IVA Trasladado (16%)</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                    <TableCell align="center"><strong>Método Pago</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(resumenData?.emitidas || []).map((row, idx) => (
                    <TableRow key={row.uuid || idx} hover>
                      <TableCell sx={{ fontWeight: 'bold' }}>
                        {row.serie}{row.folio || `#${idx + 1}`}
                      </TableCell>
                      <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {row.uuid || '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        {row.fecha ? String(row.fecha).split('T')[0] : '-'}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.75rem' }}>
                        <strong>{row.rfc_receptor}</strong>
                        {row.nombre_receptor && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {row.nombre_receptor}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">${(row.subtotal || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold', color: 'info.dark' }}>
                        ${(row.iva_16 || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                        ${(row.total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell align="center">
                        <Chip size="small" label={row.metodo_pago || 'PUE'} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                      </TableCell>
                    </TableRow>
                  ))}
                  {(!resumenData?.emitidas || resumenData.emitidas.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No se encontraron facturas emitidas por Wise en este periodo para este RFC.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* TAB 2: Cédula DIOT */}
          {activeTab === 2 && (
            <Box>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                <Typography variant="subtitle2" fontWeight="bold">
                  Resumen Agrupado por Proveedor para Declaración Informativa de Operaciones con Terceros (DIOT)
                </Typography>
                <Button
                  size="small"
                  variant="contained"
                  color="secondary"
                  startIcon={<DownloadIcon />}
                  onClick={handleDescargarDIOT}
                >
                  Descargar Archivo Oficial DIOT (.txt)
                </Button>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: 'grey.100' }}>
                    <TableRow>
                      <TableCell><strong>Tipo</strong></TableCell>
                      <TableCell><strong>RFC Proveedor</strong></TableCell>
                      <TableCell><strong>Razón Social</strong></TableCell>
                      <TableCell align="center"><strong>Facturas</strong></TableCell>
                      <TableCell align="right"><strong>Base 16%</strong></TableCell>
                      <TableCell align="right"><strong>Base 8%</strong></TableCell>
                      <TableCell align="right"><strong>Exento / 0%</strong></TableCell>
                      <TableCell align="right"><strong>IVA Retenido</strong></TableCell>
                      <TableCell align="right"><strong>Total Operaciones</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {diotData.map((prov, i) => (
                      <TableRow key={prov.rfc || i} hover>
                        <TableCell>
                          <Chip size="small" label={prov.tipo_tercero === '04' ? 'Nacional' : 'Extranjero'} variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                          {prov.rfc}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.8rem' }}>{prov.nombre}</TableCell>
                        <TableCell align="center">{prov.total_facturas}</TableCell>
                        <TableCell align="right">${(prov.base_16 || 0).toLocaleString('es-MX')}</TableCell>
                        <TableCell align="right">${(prov.base_8 || 0).toLocaleString('es-MX')}</TableCell>
                        <TableCell align="right">${((prov.base_0 || 0) + (prov.base_exento || 0)).toLocaleString('es-MX')}</TableCell>
                        <TableCell align="right">${(prov.iva_retenido || 0).toLocaleString('es-MX')}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                          ${(prov.total || 0).toLocaleString('es-MX')}
                        </TableCell>
                      </TableRow>
                    ))}
                    {diotData.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                          <Typography variant="body2" color="text.secondary">
                            No hay compras o gastos con proveedores registrados en este periodo.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
};

export default ContabilidadFiscalView;
