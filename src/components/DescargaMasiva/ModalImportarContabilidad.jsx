"use client";
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Alert,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import JSZip from 'jszip';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.sandbox.wisefacturacion.com';

const ModalImportarContabilidad = ({ open, onClose, token, zipData, solicitudInfo, onFinished }) => {
  const [procesando, setProcesando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [totalArchivos, setTotalArchivos] = useState(0);
  const [archivoActual, setArchivoActual] = useState(0);
  const [resumen, setResumen] = useState({
    exitosos: 0,
    advertencias: 0,
    errores: 0,
  });
  const [detalles, setDetalles] = useState([]);
  const [completado, setCompletado] = useState(false);

  useEffect(() => {
    if (open) {
      setProcesando(false);
      setProgreso(0);
      setTotalArchivos(0);
      setArchivoActual(0);
      setResumen({ exitosos: 0, advertencias: 0, errores: 0 });
      setDetalles([]);
      setCompletado(false);
    }
  }, [open]);

  const extraerXMLsDeZip = async (zipInput) => {
    const zip = new JSZip();
    let zipContent;

    if (typeof zipInput === 'string') {
      // Base64 string o URL
      if (zipInput.startsWith('data:') || !zipInput.startsWith('http')) {
        const base64Data = zipInput.includes(',') ? zipInput.split(',')[1] : zipInput;
        zipContent = await zip.loadAsync(base64Data, { base64: true });
      } else {
        const resp = await fetch(zipInput);
        const blob = await resp.blob();
        zipContent = await zip.loadAsync(blob);
      }
    } else if (zipInput instanceof Blob || zipInput instanceof ArrayBuffer) {
      zipContent = await zip.loadAsync(zipInput);
    } else {
      throw new Error('Formato de paquete ZIP no válido');
    }

    const xmlFiles = [];
    for (const [filename, fileObj] of Object.entries(zipContent.files)) {
      if (!fileObj.dir && filename.toLowerCase().endsWith('.xml')) {
        const content = await fileObj.async('text');
        xmlFiles.push({ filename, content });
      }
    }
    return xmlFiles;
  };

  const iniciarImportacion = async () => {
    if (!zipData) {
      alert('No hay paquete de comprobantes para procesar.');
      return;
    }

    setProcesando(true);
    setDetalles([]);
    let exitosos = 0;
    let advertencias = 0;
    let errores = 0;

    try {
      let listaXMLs = [];

      if (Array.isArray(zipData)) {
        // Lista de comprobantes directa
        listaXMLs = zipData.map((item, idx) => ({
          filename: item.filename || item.uuid || `cfdi_${idx + 1}.xml`,
          content: typeof item === 'string' ? item : item.xml || item.content || '',
        }));
      } else {
        // Extraer de ZIP
        listaXMLs = await extraerXMLsDeZip(zipData);
      }

      setTotalArchivos(listaXMLs.length);

      if (listaXMLs.length === 0) {
        setDetalles([
          {
            nombre: 'Paquete ZIP',
            estado: 'advertencia',
            mensaje: 'No se encontraron archivos XML dentro del paquete.',
          },
        ]);
        setProcesando(false);
        setCompletado(true);
        return;
      }

      // Procesar en lotes de 15 comprobantes a la tabla de contabilidad de facturas recibidas
      const BATCH_SIZE = 15;
      for (let i = 0; i < listaXMLs.length; i += BATCH_SIZE) {
        const batch = listaXMLs.slice(i, i + BATCH_SIZE);
        const procesadosHastaAhora = Math.min(i + batch.length, listaXMLs.length);
        setArchivoActual(procesadosHastaAhora);
        setProgreso(Math.round((procesadosHastaAhora / listaXMLs.length) * 100));

        try {
          const resp = await fetch('/api/contabilidad/importar-recibidas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              rfc: solicitudInfo?.rfc,
              id_solicitud: solicitudInfo?.id_solicitud || solicitudInfo?.solicitud || solicitudInfo?.id,
              xmls: batch,
            }),
          });

          const resData = await resp.json();
          if (resp.ok && resData.ok) {
            exitosos += (resData.importadas || 0);
            errores += (resData.omitidas || 0);
            if (Array.isArray(resData.detalles)) {
              setDetalles((prev) => [...resData.detalles, ...prev]);
            }
          } else {
            errores += batch.length;
            setDetalles((prev) => [
              {
                nombre: `Lote de ${batch.length} archivo(s)`,
                estado: 'error',
                mensaje: resData.error || 'Error al guardar en contabilidad',
              },
              ...prev,
            ]);
          }
        } catch (batchErr) {
          errores += batch.length;
          setDetalles((prev) => [
            {
              nombre: `Lote de ${batch.length} archivo(s)`,
              estado: 'error',
              mensaje: batchErr.message || 'Fallo de conexión al importar',
            },
            ...prev,
          ]);
        }

        setResumen({ exitosos, advertencias: 0, errores });
      }

      setCompletado(true);
      if (onFinished) {
        onFinished();
      }
    } catch (err) {
      console.error('Error procesando importación:', err);
      setDetalles((prev) => [
        {
          nombre: 'Procesamiento General',
          estado: 'error',
          mensaje: err.message || 'Error general descomprimiendo el paquete.',
        },
        ...prev,
      ]);
    } finally {
      setProcesando(false);
      setCompletado(true);
      if (onFinished) {
        onFinished();
      }
    }
  };

  return (
    <Dialog open={open} onClose={procesando ? undefined : onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <AccountBalanceIcon color="primary" />
        <Box>
          <Typography variant="h6" fontWeight="bold">
            Importar Comprobantes al Sistema Wise
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Guarda las facturas descargadas en la base de datos para habilitar reportes, egresos y cálculos contables
          </Typography>
        </Box>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ mt: 1 }}>
        {solicitudInfo && (
          <Box mb={2} p={1.5} bgcolor="grey.50" borderRadius={1.5} border="1px solid #e0e0e0">
            <Typography variant="body2" color="text.secondary">
              <strong>Solicitud SAT:</strong> {solicitudInfo.id_solicitud || solicitudInfo.folio || 'N/A'} |{' '}
              <strong>RFC:</strong> {solicitudInfo.rfc || 'N/A'} |{' '}
              <strong>Tipo:</strong> {solicitudInfo.tipo || 'Comprobantes XML'}
            </Typography>
          </Box>
        )}

        {!procesando && !completado && (
          <Alert severity="info" sx={{ mb: 2 }}>
            Esta acción extraerá los comprobantes XML del paquete recibido del SAT, validará sus sellos digitales y los
            almacenará directamente en el sistema de facturación y contabilidad de Wise.
          </Alert>
        )}

        {procesando && (
          <Box my={2}>
            <Box display="flex" justifyContent="space-between" mb={1}>
              <Typography variant="body2" fontWeight="medium">
                Procesando archivo {archivoActual} de {totalArchivos}...
              </Typography>
              <Typography variant="body2" color="primary" fontWeight="bold">
                {progreso}%
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progreso} sx={{ height: 8, borderRadius: 4 }} />
          </Box>
        )}

        {(procesando || completado) && (
          <Box display="flex" gap={1.5} mb={2}>
            <Chip
              icon={<CheckCircleIcon />}
              label={`Guardadas: ${resumen.exitosos}`}
              color="success"
              variant="outlined"
            />
            <Chip
              icon={<WarningIcon />}
              label={`Omitidas / Ya existían: ${resumen.advertencias}`}
              color="warning"
              variant="outlined"
            />
            <Chip
              icon={<ErrorIcon />}
              label={`Errores: ${resumen.errores}`}
              color="error"
              variant="outlined"
            />
          </Box>
        )}

        {detalles.length > 0 && (
          <Box sx={{ maxHeight: 280, overflowY: 'auto', border: '1px solid #eee', borderRadius: 1 }}>
            <List dense>
              {detalles.map((det, idx) => (
                <ListItem key={idx} divider={idx < detalles.length - 1}>
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    {det.estado === 'exito' && <CheckCircleIcon color="success" fontSize="small" />}
                    {det.estado === 'advertencia' && <WarningIcon color="warning" fontSize="small" />}
                    {det.estado === 'error' && <ErrorIcon color="error" fontSize="small" />}
                  </ListItemIcon>
                  <ListItemText
                    primary={<Typography variant="body2" fontWeight="medium">{det.nombre}</Typography>}
                    secondary={det.mensaje}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={procesando} color="inherit">
          {completado ? 'Cerrar' : 'Cancelar'}
        </Button>
        {!completado && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<CloudUploadIcon />}
            onClick={iniciarImportacion}
            disabled={procesando}
          >
            {procesando ? 'Importando...' : 'Iniciar Importación a Contabilidad'}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ModalImportarContabilidad;
