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
  Grid,
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import RefreshIcon from '@mui/icons-material/Refresh';
import DownloadIcon from '@mui/icons-material/Download';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import BugReportIcon from '@mui/icons-material/BugReport';
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
  if (s.includes('sin comprob') || s.includes('no se encontr') || s === '5004') {
    return <Chip size="small" label="Sin Comprobantes" color="default" variant="outlined" />;
  }
  if (s.includes('duplicad') || s === '5005') {
    return <Chip size="small" icon={<HourglassEmptyIcon />} label="Duplicada" color="warning" variant="outlined" />;
  }
  if (s.includes('rechazad') || s.includes('error') || s === '4') {
    return <Chip size="small" icon={<ErrorOutlineIcon />} label="Rechazada" color="error" />;
  }
  return <Chip size="small" label={status || 'Pendiente'} variant="outlined" />;
};

const BandejaPeticionesTab = ({ empresas = [], token, refreshTrigger = 0, rfcInicial = '' }) => {
  // Inicializar con la empresa solicitada, la primera empresa si existe, o 'todos'
  const [rfcFiltro, setRfcFiltro] = useState(
    rfcInicial || (empresas.length > 0 ? (empresas[0]?.Rfc || empresas[0]?.rfc || '') : 'todos')
  );
  const [peticiones, setPeticiones] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Sincronizar si cambia el RFC inicial desde una nueva solicitud
  useEffect(() => {
    if (rfcInicial) {
      setRfcFiltro(rfcInicial);
    }
  }, [rfcInicial]);

  // Sincronizar rfcFiltro si cargan las empresas y aún no hay selección
  useEffect(() => {
    if (!rfcFiltro && empresas.length > 0) {
      setRfcFiltro(empresas[0].Rfc || empresas[0].rfc || 'todos');
    }
  }, [empresas, rfcFiltro]);

  // Modal de importación contable
  const [modalImportarOpen, setModalImportarOpen] = useState(false);
  const [selectedZipData, setSelectedZipData] = useState(null);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);

  // Modal de visualización de comprobantes / metadata
  const [modalDetalleOpen, setModalDetalleOpen] = useState(false);
  const [detalleContenido, setDetalleContenido] = useState(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);

  // Modal de Diagnóstico / Debug SAT
  const [modalDebugOpen, setModalDebugOpen] = useState(false);
  const [debugData, setDebugData] = useState(null);
  const [loadingDebug, setLoadingDebug] = useState(false);

  const handleAbrirDebug = async () => {
    setModalDebugOpen(true);
    setLoadingDebug(true);
    try {
      const data = await descargaMasivaService.obtenerDebugLogs(token);
      setDebugData(data);
    } catch (err) {
      setDebugData({ ok: false, error: err.message, logs: [] });
    } finally {
      setLoadingDebug(false);
    }
  };

  useEffect(() => {
    cargarPeticiones();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rfcFiltro, token, refreshTrigger]);

  const cargarPeticiones = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const params = { rfc: rfcFiltro || 'todos' };
      const data = await descargaMasivaService.listarPeticionesSAT(params, token);
      console.log('[BandejaPeticionesTab] Datos recibidos de listarPeticionesSAT:', data);

      if (data && data.ok === false) {
        setErrorMsg(data.mensaje || data.error || 'Aviso de base de datos al listar peticiones.');
      }

      let lista = [];
      if (Array.isArray(data)) {
        lista = data;
      } else if (data && Array.isArray(data.peticiones)) {
        lista = data.peticiones;
      } else if (data && Array.isArray(data.solicitudes)) {
        lista = data.solicitudes;
      } else if (data && Array.isArray(data.respuesta)) {
        lista = data.respuesta;
      } else if (data && data.respuesta && Array.isArray(data.respuesta.peticiones)) {
        lista = data.respuesta.peticiones;
      } else if (data && Array.isArray(data.data)) {
        lista = data.data;
      }
      setPeticiones(lista);
    } catch (err) {
      console.error('[BandejaPeticionesTab] Error al cargar peticiones SAT:', err);
      setErrorMsg(err.message || 'No se pudieron consultar las peticiones en la base de datos.');
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
      const payload = {
        rfc: rfcFiltro || 'todos',
        habilitado: 'true',
      };
      const res = await descargaMasivaService.sincronizarSAT(payload, token);
      setSuccessMsg(res?.mensaje || 'Sincronización con el SAT completada.');
      await cargarPeticiones();
    } catch (err) {
      setErrorMsg(err.message || 'Error al ejecutar sincronización con SAT.');
    } finally {
      setSyncing(false);
    }
  };

  const handleVerificar = async (peticion) => {
    const id = peticion.solicitud || peticion.id_solicitud || peticion.id || peticion.folio;
    setErrorMsg(null);
    try {
      let res;
      const esMeta = (peticion.tipo || peticion.tipo_descarga || '').toLowerCase().includes('meta');
      const payload = { solicitud: id };
      if (esMeta) {
        res = await descargaMasivaService.verificarMetadata(payload, token);
      } else {
        res = await descargaMasivaService.verificarMulticomprobantes(payload, token);
      }

      setSuccessMsg(res?.mensaje || `Estado de solicitud ${id} verificado con el SAT.`);
      await cargarPeticiones();
      return res;
    } catch (err) {
      setErrorMsg(`Error al verificar solicitud: ${err.message}`);
    }
  };

  const handleDescargarZIP = async (peticion) => {
    setErrorMsg(null);
    if (peticion.paquete_url || peticion.url_descarga) {
      window.open(peticion.paquete_url || peticion.url_descarga, '_blank');
      return;
    }
    let base64Data = peticion.zip_base64 || peticion.archivo_zip;

    // Si aún no tenemos el base64 directo, solicitarlo al backend que lo descargará del SAT o BD
    if (!base64Data) {
      try {
        const idSol = peticion.id_solicitud || peticion.solicitud || peticion.id;
        const resDesc = await descargaMasivaService.descargarPaquete({
          id_solicitud: idSol,
          rfc: peticion.rfc
        }, token);
        base64Data = resDesc?.paquete_b64 || resDesc?.zip_base64;
      } catch (e) {
        console.warn('Error al solicitar descarga de paquete:', e);
      }
    }

    // Si aún no se pudo, intentar verificar la solicitud que también auto-descarga el ZIP
    if (!base64Data) {
      try {
        const resVer = await handleVerificar(peticion);
        base64Data = resVer?.zip_base64 || resVer?.paquete_b64;
      } catch (e) {}
    }

    if (base64Data) {
      const link = document.createElement('a');
      link.href = `data:application/zip;base64,${base64Data}`;
      link.download = `comprobantes_${peticion.rfc || 'sat'}_${peticion.id_solicitud || 'paquete'}.zip`;
      link.click();
      return;
    }
    setErrorMsg('El paquete aún no cuenta con un archivo ZIP disponible para descarga directa. El SAT puede tardar unos minutos en prepararlo, verifique el estatus o sincronice.');
  };

  const handleAbrirImportacionContable = async (peticion) => {
    setSelectedSolicitud(peticion);
    setErrorMsg(null);
    let dataZip = peticion.zip_base64 || peticion.paquete_url || peticion.comprobantes;

    if (!dataZip) {
      try {
        const verified = await handleVerificar(peticion);
        dataZip = verified?.zip_base64 || verified?.paquete_url || verified?.comprobantes;
        if (!dataZip) {
          const resDesc = await descargaMasivaService.descargarPaquete({
            id_solicitud: peticion.id_solicitud || peticion.solicitud || peticion.id,
            rfc: peticion.rfc
          }, token);
          dataZip = resDesc?.paquete_b64 || resDesc?.zip_base64;
        }
      } catch (err) {
        console.warn('Aviso al preparar paquete para contabilidad:', err);
      }
    }

    setSelectedZipData(dataZip || null);
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

      // Si data tiene zip_base64 pero no comprobantes, o comprobantes vacío, extraer con JSZip en cliente si es necesario
      if ((!data?.comprobantes || data.comprobantes.length === 0) && (data?.zip_base64 || peticion.zip_base64)) {
        try {
          const JSZip = (await import('jszip')).default;
          const zip = new JSZip();
          const zipContent = await zip.loadAsync(data?.zip_base64 || peticion.zip_base64, { base64: true });
          const items = [];
          for (const [filename, fileObj] of Object.entries(zipContent.files)) {
            if (fileObj.dir) continue;
            if (filename.toLowerCase().endsWith('.txt')) {
              const text = await fileObj.async('text');
              const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
              if (lines.length >= 2) {
                const header = lines[0].split('~');
                for (let i = 1; i < lines.length; i++) {
                  const cols = lines[i].split('~');
                  const row = {};
                  header.forEach((h, idx) => { row[h] = cols[idx] || ''; });
                  items.push({
                    uuid: row.Uuid || '',
                    rfc_emisor: row.RfcEmisor || '',
                    nombre_emisor: row.NombreEmisor || '',
                    rfc_receptor: row.RfcReceptor || '',
                    nombre_receptor: row.NombreReceptor || '',
                    total: parseFloat(row.Monto || 0),
                    fecha_emision: row.FechaEmision || '',
                    estatus: row.Estatus === '1' ? 'Vigente' : 'Cancelado',
                    tipo_origen: 'metadata'
                  });
                }
              }
            }
          }
          if (items.length > 0) {
            data = { ...(data || {}), comprobantes: items };
          }
        } catch (e) {
          console.warn('Error extrayendo metadata cliente:', e);
        }
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
      const res = await descargaMasivaService.obtenerComprobante({ contratoTimbrado: '', uuid }, token);
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
              {/* Selector de RFC de la empresa obligatoria */}
              <TextField
                select
                size="small"
                label="Filtrar por Empresa"
                value={rfcFiltro}
                onChange={(e) => setRfcFiltro(e.target.value)}
                sx={{ minWidth: 260 }}
              >
                <MenuItem value="todos">
                  <em>Todas las Empresas</em>
                </MenuItem>
                {empresas.map((emp) => {
                  const rfcVal = (emp.Rfc || emp.rfc || '').toUpperCase();
                  return (
                    <MenuItem key={emp.ID || emp.id || rfcVal} value={rfcVal}>
                      <strong>{rfcVal}</strong> {emp.RazonSocial || emp.razon_social ? `— ${emp.RazonSocial || emp.razon_social}` : ''}
                    </MenuItem>
                  );
                })}
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

              <Button
                variant="outlined"
                color="secondary"
                startIcon={<BugReportIcon />}
                onClick={handleAbrirDebug}
                disabled={loading || syncing}
                sx={{ textTransform: 'none' }}
              >
                Diagnóstico / Logs
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
                          {rfcFiltro && rfcFiltro !== 'todos'
                            ? `No hay solicitudes de descarga registradas para la empresa ${rfcFiltro}. Envíe una nueva solicitud en la primera pestaña.`
                            : 'No hay solicitudes de descarga registradas. Envíe una nueva solicitud en la primera pestaña.'}
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
              <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={2}>
                <Box>
                  <Typography variant="body2">
                    <strong>RFC Solicitante:</strong> {selectedSolicitud?.rfc} &nbsp;|&nbsp;{' '}
                    <strong>Dirección:</strong>{' '}
                    <Chip
                      size="small"
                      label={selectedSolicitud?.tipo_flujo || selectedSolicitud?.direccion || 'Emitidas'}
                      color={(selectedSolicitud?.tipo_flujo || selectedSolicitud?.direccion || '').toLowerCase().includes('recib') ? 'secondary' : 'primary'}
                      sx={{ ml: 0.5 }}
                    />
                    &nbsp;|&nbsp; <strong>Estatus SAT:</strong> {selectedSolicitud?.estatus || 'Terminada'}
                  </Typography>
                </Box>
                {selectedSolicitud?.zip_base64 && (
                  <Button
                    size="small"
                    variant="contained"
                    color="primary"
                    startIcon={<DownloadIcon />}
                    onClick={() => handleDescargarZIP(selectedSolicitud)}
                  >
                    Descargar Paquete ZIP
                  </Button>
                )}
              </Box>

              {detalleContenido?.comprobantes && Array.isArray(detalleContenido.comprobantes) && (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell><strong>UUID</strong></TableCell>
                        <TableCell><strong>Fecha Emisión</strong></TableCell>
                        <TableCell><strong>Emisor (Proveedor)</strong></TableCell>
                        <TableCell><strong>Receptor (Cliente)</strong></TableCell>
                        <TableCell><strong>Estatus</strong></TableCell>
                        <TableCell align="right"><strong>Total</strong></TableCell>
                        <TableCell align="center"><strong>Acción</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {detalleContenido.comprobantes.map((cfdi, i) => (
                        <TableRow key={i} hover>
                          <TableCell sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                            {cfdi.uuid || cfdi.UUID}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            {cfdi.fecha_emision ? cfdi.fecha_emision.replace('T', ' ') : '-'}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <strong>{cfdi.rfc_emisor || cfdi.RfcEmisor}</strong>
                            {cfdi.nombre_emisor && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {cfdi.nombre_emisor}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ fontSize: '0.75rem' }}>
                            <strong>{cfdi.rfc_receptor || cfdi.RfcReceptor}</strong>
                            {cfdi.nombre_receptor && (
                              <Typography variant="caption" display="block" color="text.secondary">
                                {cfdi.nombre_receptor}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={cfdi.estatus || 'Vigente'}
                              color={(cfdi.estatus || '').toLowerCase().includes('cancel') ? 'error' : 'success'}
                              variant="outlined"
                              sx={{ fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                            ${parseFloat(cfdi.total || cfdi.Total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </TableCell>
                          <TableCell align="center">
                            <Button
                              size="small"
                              variant="outlined"
                              startIcon={<DownloadIcon fontSize="small" />}
                              onClick={() => handleDescargarComprobanteIndividual(cfdi.uuid || cfdi.UUID, selectedSolicitud?.rfc)}
                              sx={{ textTransform: 'none', py: 0.2, px: 1, fontSize: '0.75rem' }}
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

              {(!detalleContenido?.comprobantes || !Array.isArray(detalleContenido.comprobantes) || detalleContenido.comprobantes.length === 0) && (
                <Box p={3} textAlign="center" bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron comprobantes listados en esta solicitud o el paquete aún se encuentra en procesamiento por parte del SAT.
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

      {/* Modal de Diagnóstico y Logs del SAT / BD */}
      <Dialog
        open={modalDebugOpen}
        onClose={() => setModalDebugOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
          <Box display="flex" alignItems="center" gap={1}>
            <BugReportIcon color="secondary" />
            <Typography variant="h6" fontWeight="bold">
              Diagnóstico y Logs del SAT en Vivo
            </Typography>
          </Box>
          <Button
            size="small"
            variant="outlined"
            onClick={handleAbrirDebug}
            disabled={loadingDebug}
            startIcon={loadingDebug ? <CircularProgress size={16} /> : <RefreshIcon />}
          >
            Actualizar Logs
          </Button>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 2 }}>
          {loadingDebug && (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          )}

          {!loadingDebug && debugData && (
            <Box>
              {/* Información del Servidor y Base de Datos */}
              <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Base de Datos Conectada:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {debugData.database || 'No especificada'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Total de Solicitudes Registradas en BD:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" color="primary">
                      {debugData.total_solicitudes !== undefined ? `${debugData.total_solicitudes} solicitud(es)` : '0'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={4}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Archivo de Log Local:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                      frontend/sat_debug.log
                    </Typography>
                  </Grid>
                </Grid>
                {debugData.error_db && (
                  <Alert severity="error" sx={{ mt: 1.5 }}>
                    Error de conexión a la Base de Datos: {debugData.error_db}
                  </Alert>
                )}
              </Box>

              {/* Registro de Eventos Recientes */}
              <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                Eventos y Respuestas del SAT (Últimos {debugData.logs?.length || 0}):
              </Typography>

              {(!debugData.logs || debugData.logs.length === 0) ? (
                <Box p={3} textAlign="center" bgcolor="grey.50" borderRadius={1}>
                  <Typography variant="body2" color="text.secondary">
                    No hay eventos registrados recientemente. Realice una solicitud o sincronización para ver el registro en vivo.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, maxHeight: 450, overflowY: 'auto' }}>
                  {debugData.logs.map((log, index) => {
                    const colorChip =
                      log.nivel === 'ERROR' ? 'error' :
                      log.nivel === 'WARN' ? 'warning' :
                      log.nivel === 'SAT_RES' ? 'success' : 'info';

                    return (
                      <Paper
                        key={index}
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          borderRadius: 1.5,
                          bgcolor: log.nivel === 'ERROR' ? '#fef2f2' : log.nivel === 'WARN' ? '#fffbeb' : '#ffffff'
                        }}
                      >
                        <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1} mb={0.5}>
                          <Box display="flex" alignItems="center" gap={1}>
                            <Chip size="small" label={log.nivel} color={colorChip} />
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                              {log.accion}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.timestamp).toLocaleString('es-MX')}
                          </Typography>
                        </Box>

                        <Box
                          component="pre"
                          sx={{
                            m: 0,
                            p: 1,
                            fontSize: '0.75rem',
                            bgcolor: '#0f172a',
                            color: '#38bdf8',
                            borderRadius: 1,
                            overflowX: 'auto',
                            maxHeight: 180
                          }}
                        >
                          {typeof log.detalle === 'object'
                            ? JSON.stringify(log.detalle, null, 2)
                            : String(log.detalle)}
                        </Box>
                      </Paper>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalDebugOpen(false)}>Cerrar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BandejaPeticionesTab;
