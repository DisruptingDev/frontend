"use client";
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  MenuItem,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  FormLabel,
  Alert,
  CircularProgress,
  Divider,
  Chip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import descargaMasivaService from '@/services/descargaMasivaService';

const getInitialDates = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');

  const firstDay = `${year}-${month}-01`;
  const today = `${year}-${month}-${day}`;
  return { firstDay, today };
};

const SolicitarDescargaTab = ({ empresas = [], token, onSolicitudCreada }) => {
  const { firstDay, today } = getInitialDates();

  const [selectedRfc, setSelectedRfc] = useState(empresas[0]?.Rfc || '');
  const [tipoDescarga, setTipoDescarga] = useState('multicomprobantes'); // 'multicomprobantes' | 'metadata'
  const [tipoFlujo, setTipoFlujo] = useState('emitidas'); // 'emitidas' | 'recibidas'
  const [fechaInicio, setFechaInicio] = useState(firstDay);
  const [fechaFin, setFechaFin] = useState(today);

  // Filtros avanzados
  const [rfcContraparte, setRfcContraparte] = useState('');
  const [tipoComprobante, setTipoComprobante] = useState('todos'); // 'todos', 'I', 'E', 'T', 'N', 'P'
  const [estadoComprobante, setEstadoComprobante] = useState('todos'); // 'todos', 'vigentes', 'cancelados'

  const [loading, setLoading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState(null);
  const [mensajeError, setMensajeError] = useState(null);

  // Atajos de fecha
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensajeExito(null);
    setMensajeError(null);

    if (!selectedRfc) {
      setMensajeError('Debe seleccionar un RFC de emisor autorizado.');
      return;
    }

    if (!fechaInicio || !fechaFin) {
      setMensajeError('Seleccione la fecha de inicio y fin.');
      return;
    }

    if (new Date(fechaInicio) > new Date(fechaFin)) {
      setMensajeError('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }

    setLoading(true);

    const fInicio = fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T00:00:00`;
    const fFin = fechaFin.includes('T') ? fechaFin : `${fechaFin}T23:59:59`;

    const payload = {
      rfc: selectedRfc,
      rfc_solicitante: selectedRfc,
      RfcSolicitante: selectedRfc,
      tipo: tipoFlujo, // 'emitidas' o 'recibidas'
      tipo_solicitud: tipoDescarga === 'multicomprobantes' ? 'CFDI' : 'Metadata',
      TipoSolicitud: tipoDescarga === 'multicomprobantes' ? 'CFDI' : 'Metadata',
      fecha_inicio: fInicio,
      fecha_fin: fFin,
      fecha_inicial: fInicio,
      fecha_final: fFin,
      FechaInicial: fInicio,
      FechaFinal: fFin,
    };

    if (tipoFlujo === 'emitidas') {
      payload.rfc_emisor = selectedRfc;
      payload.RfcEmisor = selectedRfc;
      if (rfcContraparte.trim()) {
        const contra = rfcContraparte.trim().toUpperCase();
        payload.rfc_receptor = contra;
        payload.RfcReceptor = contra;
        payload.rfc_receptores = [contra];
      }
    } else {
      payload.rfc_receptor = selectedRfc;
      payload.RfcReceptor = selectedRfc;
      payload.rfc_receptores = [selectedRfc];
      if (rfcContraparte.trim()) {
        const contra = rfcContraparte.trim().toUpperCase();
        payload.rfc_emisor = contra;
        payload.RfcEmisor = contra;
      }
    }

    if (tipoComprobante !== 'todos') {
      payload.tipo_comprobante = tipoComprobante;
      payload.TipoComprobante = tipoComprobante;
    }

    if (estadoComprobante !== 'todos') {
      payload.estado_comprobante = estadoComprobante;
      payload.EstadoComprobante = estadoComprobante === 'vigentes' ? '1' : '0';
    }

    try {
      let resultado;
      if (tipoDescarga === 'multicomprobantes') {
        resultado = await descargaMasivaService.solicitarMulticomprobantes(payload, token);
      } else {
        resultado = await descargaMasivaService.solicitarMetadata(payload, token);
      }

      const idSolicitud =
        resultado?.id_solicitud ||
        resultado?.id ||
        resultado?.folio ||
        resultado?.peticion_id ||
        'SAT-PENDING';

      setMensajeExito(
        `Solicitud enviada correctamente ante el SAT con ID / Folio: ${idSolicitud}. El SAT procesará los comprobantes en breve.`
      );

      if (onSolicitudCreada) {
        onSolicitudCreada({
          ...payload,
          id_solicitud: idSolicitud,
          tipo_descarga: tipoDescarga,
          fecha_solicitud: new Date().toISOString(),
          estatus: 'En Proceso',
        });
      }
    } catch (err) {
      console.error('Error al solicitar descarga al SAT:', err);
      setMensajeError(err.message || 'Error al conectar con el servicio del SAT/Prodigia.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" alignItems="center" gap={1.5} mb={2}>
            <CloudDownloadIcon color="primary" fontSize="large" />
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Nueva Solicitud de Descarga Masiva SAT
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Conectado directamente con el SAT a través de Prodigia para consultar y descargar facturas
              </Typography>
            </Box>
          </Box>

          {mensajeExito && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeExito(null)}>
              {mensajeExito}
            </Alert>
          )}

          {mensajeError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setMensajeError(null)}>
              {mensajeError}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Grid container spacing={3}>
              {/* Selector de Razón Social / RFC */}
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Razón Social (RFC Registrado)"
                  value={selectedRfc}
                  onChange={(e) => setSelectedRfc(e.target.value)}
                  helperText="Solo se muestran empresas registradas en su cuenta de Wise"
                  required
                >
                  {empresas.map((emp) => (
                    <MenuItem key={emp.ID || emp.Rfc} value={emp.Rfc}>
                      <strong>{emp.Rfc}</strong> &nbsp;—&nbsp; {emp.RazonSocial || emp.NombreComercial || emp.Nombre}
                    </MenuItem>
                  ))}
                  {empresas.length === 0 && (
                    <MenuItem value="" disabled>
                      No tiene empresas registradas en su cuenta
                    </MenuItem>
                  )}
                </TextField>
              </Grid>

              {/* Tipo de Descarga: XMLs vs Metadata */}
              <Grid item xs={12} md={6}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Tipo de Descarga
                  </FormLabel>
                  <RadioGroup
                    row
                    value={tipoDescarga}
                    onChange={(e) => setTipoDescarga(e.target.value)}
                  >
                    <FormControlLabel
                      value="multicomprobantes"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Comprobantes XML (Paquete completo)
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Para descargas ZIP e importación contable
                          </Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="metadata"
                      control={<Radio size="small" />}
                      label={
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            Solo Metadata
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Para cruces y auditoría rápida
                          </Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Divider />
              </Grid>

              {/* Tipo de comprobante respecto al RFC (Emitidas / Recibidas) */}
              <Grid item xs={12} md={4}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Dirección de Facturas
                  </FormLabel>
                  <RadioGroup
                    row
                    value={tipoFlujo}
                    onChange={(e) => setTipoFlujo(e.target.value)}
                  >
                    <FormControlLabel
                      value="emitidas"
                      control={<Radio size="small" />}
                      label="Emitidas (Ingresos)"
                    />
                    <FormControlLabel
                      value="recibidas"
                      control={<Radio size="small" />}
                      label="Recibidas (Gastos / Proveedores)"
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {/* Rango de fechas */}
              <Grid item xs={12} md={4}>
                <TextField
                  label="Fecha Inicio"
                  type="date"
                  fullWidth
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              <Grid item xs={12} md={4}>
                <TextField
                  label="Fecha Fin"
                  type="date"
                  fullWidth
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>

              {/* Accesos rápidos de periodos */}
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" gap={1} flexWrap="wrap">
                  <Typography variant="caption" color="text.secondary" fontWeight="bold">
                    Periodos rápidos:
                  </Typography>
                  <Chip
                    label="Mes Actual"
                    size="small"
                    clickable
                    onClick={() => setPeriodo('mes_actual')}
                    variant="outlined"
                  />
                  <Chip
                    label="Mes Anterior"
                    size="small"
                    clickable
                    onClick={() => setPeriodo('mes_anterior')}
                    variant="outlined"
                  />
                  <Chip
                    label="Año Actual"
                    size="small"
                    clickable
                    onClick={() => setPeriodo('anio_actual')}
                    variant="outlined"
                  />
                </Box>
              </Grid>

              {/* Filtros avanzados colapsables */}
              <Grid item xs={12}>
                <Accordion variant="outlined" sx={{ borderRadius: 1.5 }}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <FilterAltIcon color="action" fontSize="small" />
                      <Typography variant="body2" fontWeight="medium">
                        Filtros Opcionales de Búsqueda (Contraparte, Tipo de CFDI, Estatus)
                      </Typography>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={4}>
                        <TextField
                          label={tipoFlujo === 'emitidas' ? 'RFC Receptor (Cliente)' : 'RFC Emisor (Proveedor)'}
                          placeholder="XAXX010101000"
                          fullWidth
                          size="small"
                          value={rfcContraparte}
                          onChange={(e) => setRfcContraparte(e.target.value)}
                        />
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Tipo de Comprobante"
                          value={tipoComprobante}
                          onChange={(e) => setTipoComprobante(e.target.value)}
                        >
                          <MenuItem value="todos">Todos los Tipos</MenuItem>
                          <MenuItem value="I">I - Ingreso</MenuItem>
                          <MenuItem value="E">E - Egreso</MenuItem>
                          <MenuItem value="T">T - Traslado</MenuItem>
                          <MenuItem value="N">N - Nómina</MenuItem>
                          <MenuItem value="P">P - Pago</MenuItem>
                        </TextField>
                      </Grid>

                      <Grid item xs={12} md={4}>
                        <TextField
                          select
                          fullWidth
                          size="small"
                          label="Estado del Comprobante"
                          value={estadoComprobante}
                          onChange={(e) => setEstadoComprobante(e.target.value)}
                        >
                          <MenuItem value="todos">Vigentes y Cancelados</MenuItem>
                          <MenuItem value="vigentes">Solo Vigentes</MenuItem>
                          <MenuItem value="cancelados">Solo Cancelados</MenuItem>
                        </TextField>
                      </Grid>
                    </Grid>
                  </AccordionDetails>
                </Accordion>
              </Grid>

              {/* Botón de envío */}
              <Grid item xs={12}>
                <Box display="flex" justifyContent="flex-end" mt={1}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    color="primary"
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
                    disabled={loading || empresas.length === 0}
                    sx={{ px: 4, py: 1.2, fontWeight: 'bold' }}
                  >
                    {loading ? 'Enviando al SAT...' : 'Enviar Solicitud al SAT'}
                  </Button>
                </Box>
              </Grid>
            </Grid>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
};

export default SolicitarDescargaTab;
