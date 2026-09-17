"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import descargaMasivaService from '@/services/descargaMasivaService';
import ModalImportarContabilidad from './ModalImportarContabilidad';

const renderStatusChip = (status = '') => {
  const s = String(status).toLowerCase();
  if (s.includes('terminad') || s.includes('completad') || s.includes('listo') || s === '3') {
    return <Chip size="small" icon={<CheckCircleIcon />} label="Terminada" color="success" />;
  }
  if (s.includes('aceptad') || s === '1') {
    return <Chip size="small" label="Aceptada" color="info" />;
  }
  if (s.includes('proceso') || s === '2') {
    return <Chip size="small" icon={<HourglassEmptyIcon />} label="En Proceso" color="warning" />;
  }
  if (s.includes('rechazad') || s.includes('error') || s === '4') {
    return <Chip size="small" icon={<ErrorOutlineIcon />} label="Rechazada" color="error" />;
  }
  return <Chip size="small" label={status || 'Pendiente'} variant="outlined" />;
};

const BandejaPeticionesTab = ({ empresas = [], token }) => {
  const [rfcFiltro, setRfcFiltro] = useState('todos');
  const [peticiones, setPeticiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal de importación contable
  const [modalImportarOpen, setModalImportarOpen] = useState(false);
  const [selectedZipData, setSelectedZipData] = useState(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);

  // Modal de visualización de comprobantes / metadata
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [detalleContenido, setDetalleContenido] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  useEffect(() => {
    cargarPeticiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfcFiltro, token]);

  const cargarPeticiones = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = {};
      if (rfcFiltro !== 'todos') {
        params.rfc = rfcFiltro;
      }
      const data = await descargaMasivaService.listarPeticionesSAT(params, token);
      let lista = [];
      if (Array.isArray(data)) {
        lista = data;
      } else if (data && Array.isArray(data.peticiones)) {
        lista = data.peticiones;
      } else if (data && Array.isArray(data.data)) {
        lista = data.data;
      }
      setPeticiones(lista);
    } catch (err) {
      console.warn('Aviso al cargar peticiones SAT:', err);
      // No bloquear la interfaz si aún no hay peticiones
      setPeticiones([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSincronizarSAT = async () => {
    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const payload = {};
      if (rfcFiltro !== 'todos') {
        payload.rfc = rfcFiltro;
      }
      await descargaMasivaService.sincronizarSAT(payload, token);
      setSuccessMsg('Sincronización con el SAT completada. Actualizando estados...');
      await cargarPeticiones();
    } catch (err) {
      setErrorMsg(err.message || 'Error al ejecutar sincronización con SAT.');
    } finally {
      setSyncing(false);
    }
  };

  const handleVerificar = async (peticion) => {
    const id = peticion.id_solicitud || peticion.id || peticion.folio;
    setErrorMsg(null);
    try {
      let res;
      const esMeta = (peticion.tipo || peticion.tipo_descarga || '').toLowerCase().includes('meta');
      if (esMeta) {
        res = await descargaMasivaService.verificarMetadata({ id_solicitud: id, rfc: peticion.rfc }, token);
      } else {
        res = await descargaMasivaService.verificarMulticomprobantes({ id_solicitud: id, rfc: peticion.rfc }, token);
      }

      setSuccessMsg(`Estado de solicitud ${id} verificado con el SAT.`);
      await cargarPeticiones();
      return res;
    } catch (err) {
      setErrorMsg(`Error al verificar solicitud: ${err.message}`);
    }
  };

  const handleDescargarZIP = (peticion) => {
    if (peticion.paquete_url || peticion.url_descarga) {
      window.open(peticion.paquete_url || peticion.url_descarga, '_blank');
      return;
    }
    if (peticion.zip_base64 || peticion.archivo_zip) {
      const base64Data = peticion.zip_base64 || peticion.archivo_zip;
      const link = document.createElement('a');
      link.href = `data:application/zip;base64,${base64Data}`;
      link.download = `comprobantes_${peticion.rfc || 'sat'}_${peticion.id_solicitud || 'paquete'}.zip`;
      link.click();
      return;
    }
    setErrorMsg('El paquete aún no cuenta con un archivo ZIP disponible para descarga directa.');
  };

  const handleAbrirImportacionContable = async (peticion) => {
    setSelectedSolicitud(peticion);
    // Verificar si ya tiene data o consultarla
    if (peticion.zip_base64 || peticion.paquete_url || peticion.comprobantes) {
      setSelectedZipData(peticion.zip_base64 || peticion.paquete_url || peticion.comprobantes);
    } else {
      const verified = await handleVerificar(peticion);
      const dataZip = verified?.zip_base64 || verified?.paquete_url || verified?.comprobantes;
      setSelectedZipData(dataZip || null);
    }
    setModalImportarOpen(true);
  };

  const handleVerDetalle = async (peticion) => {
    setSelectedSolicitud(peticion);
    setModalDetalleOpen(true);
    setLoadingDetalle(true);
    try {
      const id = peticion.id_solicitud || peticion.id;
      const esMeta = (peticion.tipo || peticion.tipo_descarga || '').toLowerCase().includes('meta');
      let data;
      if (esMeta) {
        data = await descargaMasivaService.verificarMetadata({ id_solicitud: id, rfc: peticion.rfc }, token);
      } else {
        data = await descargaMasivaService.verificarMulticomprobantes({ id_solicitud: id, rfc: peticion.rfc }, token);
      }
      setDetalleContenido(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const handleDescargarComprobanteIndividual = async (uuid, rfc) => {
    try {
      const res = await descargaMasivaService.obtenerComprobante({ uuid, rfc }, token);
      const xmlStr = res?.xml || res?.xml_content || (typeof res === 'string' ? res : JSON.stringify(res));
      const blob = new Blob([xmlStr], { type: 'application/xml' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${uuid}.xml`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      alert(`No se pudo descargar el CFDI: ${err.message}`);
    }
  };

  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Bandeja de Peticiones y Sincronización SAT
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Monitoreo de solicitudes en tiempo real, descarga de paquetes ZIP y traspaso a contabilidad
              </Typography>
            </Box>

            <Box display="flex" gap={1.5} alignItems="center">
              {/* Filtro por RFC de las empresas del usuario */}
              <TextField
                select
                size="small"
                label="Filtrar por Empresa"
                value={rfcFiltro}
                onChange={(e) => setRfcFiltro(e.target.value)}
                sx={{ minWidth: 200 }}
              >
                <MenuItem value="todos">Todas mis empresas</MenuItem>
                {empresas.map((emp) => (
                  <MenuItem key={emp.ID || emp.Rfc} value={emp.Rfc}>
                    {emp.Rfc}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={cargarPeticiones}
                disabled={loading || syncing}
              >
                Actualizar
              </Button>

              <Button
                variant="contained"
                color="primary"
                startIcon={syncing ? <CircularProgress size={18} color="inherit" /> : <SyncIcon />}
                onClick={handleSincronizarSAT}
                disabled={loading || syncing}
              >
                {syncing ? 'Sincronizando...' : 'Sincronizar con SAT'}
              </Button>
            </Box>
          </Box>

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

          {loading ? (
            <Box display="flex" justifyContent="center" py={5}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 1.5 }}>
              <Table size="small">
                <TableHead sx={{ bgcolor: 'grey.50' }}>
                  <TableRow>
                    <TableCell><strong>ID / Folio SAT</strong></TableCell>
                    <TableCell><strong>Empresa (RFC)</strong></TableCell>
                    <TableCell><strong>Tipo</strong></TableCell>
                    <TableCell><strong>Flujo</strong></TableCell>
                    <TableCell><strong>Periodo Solicitado</strong></TableCell>
                    <TableCell><strong>Fecha Solicitud</strong></TableCell>
                    <TableCell><strong>Estatus SAT</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {peticiones.map((pet, idx) => {
                    const id = pet.id_solicitud || pet.id || pet.folio || `PET-${idx + 1}`;
                    const estatusStr = pet.estatus || pet.estado || 'Pendiente';
                    const esTerminada =
                      String(estatusStr).toLowerCase().includes('terminad') ||
                      String(estatusStr).toLowerCase().includes('complet') ||
                      estatusStr === '3';

                    return (
                      <TableRow key={id} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold" fontFamily="monospace">
                            {id}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" fontWeight="medium">
                            {pet.rfc || 'N/A'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={(pet.tipo || pet.tipo_descarga || 'XMLs').toUpperCase()}
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          {pet.tipo_flujo || pet.direccion || 'Emitidas'}
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {pet.fecha_inicio || '-'} al {pet.fecha_fin || '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">
                            {pet.fecha_solicitud
                              ? new Date(pet.fecha_solicitud).toLocaleDateString('es-MX')
                              : '-'}
                          </Typography>
                        </TableCell>
                        <TableCell>{renderStatusChip(estatusStr)}</TableCell>
                        <TableCell align="center">
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            <Tooltip title="Verificar estatus actual ante el SAT">
                              <IconButton size="small" onClick={() => handleVerificar(pet)}>
                                <SyncIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {esTerminada && (
                              <>
                                <Tooltip title="Descargar paquete ZIP">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    onClick={() => handleDescargarZIP(pet)}
                                  >
                                    <DownloadIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>

                                <Tooltip title="Guardar comprobantes en el sistema para cálculos contables">
                                  <Button
                                    size="small"
                                    variant="outlined"
                                    color="success"
                                    startIcon={<AccountBalanceIcon fontSize="small" />}
                                    onClick={() => handleAbrirImportacionContable(pet)}
                                    sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.75rem' }}
                                  >
                                    A Contabilidad
                                  </Button>
                                </Tooltip>
                              </>
                            )}

                            <Tooltip title="Ver detalle de comprobantes">
                              <IconButton size="small" onClick={() => handleVerDetalle(pet)}>
                                <VisibilityIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}

                  {peticiones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No hay solicitudes de descarga registradas. Envíe una nueva solicitud en la pestaña superior.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Modal para traspaso/guardado contable */}
      <ModalImportarContabilidad
        open={modalImportarOpen}
        onClose={() => setModalImportarOpen(false)}
        token={token}
        zipData={selectedZipData}
        solicitudInfo={selectedSolicitud}
        onFinished={cargarPeticiones}
      />

      {/* Modal de Detalle de Solicitud */}
      <Dialog
        open={modalDetalleOpen}
        onClose={() => setModalDetalleOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ pb: 1 }}>
          Detalle de Solicitud SAT: {selectedSolicitud?.id_solicitud || selectedSolicitud?.id}
        </DialogTitle>
        <Divider />
        <DialogContent>
          {loadingDetalle ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" mb={1.5}>
                <strong>RFC Solicitante:</strong> {selectedSolicitud?.rfc} |{' '}
                <strong>Estatus:</strong> {selectedSolicitud?.estatus || 'Procesado'}
              </Typography>

              {detalleContenido?.comprobantes && Array.isArray(detalleContenido.comprobantes) && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.50' }}>
                      <TableRow>
                        <TableCell>UUID</TableCell>
                        <TableCell>RFC Emisor</TableCell>
                        <TableCell>RFC Receptor</TableCell>
                        <TableCell align="right">Total</TableCell>
                        <TableCell align="center">Descarga</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detalleContenido.comprobantes.map((cfdi, i) => (
                        <TableRow key={i}>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {cfdi.uuid || cfdi.UUID}
                          </TableCell>
                          <TableCell>{cfdi.rfc_emisor || cfdi.RfcEmisor}</TableCell>
                          <TableCell>{cfdi.rfc_receptor || cfdi.RfcReceptor}</TableCell>
                          <TableCell align="right">
                            ${parseFloat(cfdi.total || cfdi.Total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              startIcon={<DownloadIcon />}
                              onClick={() => handleDescargarComprobanteIndividual(cfdi.uuid || cfdi.UUID, selectedSolicitud?.rfc)}
                            >
                              XML
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {(!detalleContenido?.comprobantes || !Array.isArray(detalleContenido.comprobantes)) && (
                <Box p={2} bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="caption" fontFamily="monospace" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                    {JSON.stringify(detalleContenido || selectedSolicitud, null, 2)}
                  </Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalDetalleOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BandejaPeticionesTab;
