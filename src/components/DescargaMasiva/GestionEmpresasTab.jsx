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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Divider,
} from '@mui/material';
import AddBusinessIcon from '@mui/icons-material/AddBusiness';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import descargaMasivaService from '@/services/descargaMasivaService';

const GestionEmpresasTab = ({ empresasUsuario = [], token, onEmpresasActualizadas }) => {
  const [razonesSocialesSAT, setRazonesSocialesSAT] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Modal Alta / Edición
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedEmpresaRfc, setSelectedEmpresaRfc] = useState('');
  const [razonSocialNombre, setRazonSocialNombre] = useState('');

  useEffect(() => {
    cargarRazonesSocialesSAT();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const cargarRazonesSocialesSAT = async () => {
    if (!token) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await descargaMasivaService.listarRazonesSociales({}, token);
      let lista = [];
      if (Array.isArray(data)) {
        lista = data;
      } else if (data && Array.isArray(data.razones_sociales)) {
        lista = data.razones_sociales;
      } else if (data && Array.isArray(data.data)) {
        lista = data.data;
      }
      setRazonesSocialesSAT(lista);
    } catch (err) {
      console.warn('Aviso cargando razones sociales SAT:', err);
      setRazonesSocialesSAT([]);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCrear = (empresa = null) => {
    setIsEditing(false);
    const target = empresa || empresasUsuario[0];
    if (target) {
      setSelectedEmpresaRfc(target.Rfc);
      setRazonSocialNombre(target.RazonSocial || target.NombreComercial || target.Nombre || target.Rfc);
    }
    setModalOpen(true);
  };

  const handleOpenEditar = (empresaSAT) => {
    setIsEditing(true);
    setSelectedEmpresaRfc(empresaSAT.rfc || empresaSAT.Rfc);
    setRazonSocialNombre(empresaSAT.razon_social || empresaSAT.RazonSocial || '');
    setModalOpen(true);
  };

  const handleGuardar = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validación de seguridad estricta: verificar que el RFC pertenezca a la cuenta del usuario
    const empresaEncontrada = empresasUsuario.find(
      (emp) => emp.Rfc?.toUpperCase() === selectedEmpresaRfc?.toUpperCase()
    );

    if (!empresaEncontrada) {
      setErrorMsg('No tiene autorización para dar de alta una empresa no asignada a su cuenta de Wise.');
      setSubmitting(false);
      return;
    }

    const nombreFinal =
      razonSocialNombre ||
      empresaEncontrada.RazonSocial ||
      empresaEncontrada.NombreComercial ||
      empresaEncontrada.Nombre ||
      selectedEmpresaRfc;

    const payload = {
      rfc: selectedEmpresaRfc,
      RFC: selectedEmpresaRfc,
      Rfc: selectedEmpresaRfc,
      razon_social: nombreFinal,
      RazonSocial: nombreFinal,
      nombre: nombreFinal,
    };

    try {
      if (isEditing) {
        await descargaMasivaService.actualizarRazonSocial(payload, token);
        setSuccessMsg(`Razón social ${selectedEmpresaRfc} actualizada ante el SAT exitosamente.`);
      } else {
        await descargaMasivaService.crearRazonSocial(payload, token);
        setSuccessMsg(`Empresa ${selectedEmpresaRfc} dada de alta para descarga masiva SAT exitosamente.`);
      }
      setModalOpen(false);
      await cargarRazonesSocialesSAT();
      if (onEmpresasActualizadas) onEmpresasActualizadas();
    } catch (err) {
      setErrorMsg(err.message || 'Error al registrar empresa ante el servicio de descarga SAT.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEliminar = async (rfc) => {
    if (!confirm(`¿Confirma que desea desvincular la empresa ${rfc} de la descarga masiva SAT?`)) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      await descargaMasivaService.eliminarRazonSocial({ rfc }, token);
      setSuccessMsg(`Empresa ${rfc} desvinculada del servicio SAT.`);
      await cargarRazonesSocialesSAT();
    } catch (err) {
      setErrorMsg(err.message || 'Error al desvincular empresa.');
    } finally {
      setLoading(false);
    }
  };

  // Cruce de información: Solo las empresas que el usuario tiene registradas
  const empresasConEstatus = empresasUsuario.map((empUser) => {
    const regSAT = razonesSocialesSAT.find(
      (s) => (s.rfc || s.Rfc || '').toUpperCase() === (empUser.Rfc || '').toUpperCase()
    );
    return {
      ...empUser,
      registradaEnSAT: !!regSAT,
      datosSAT: regSAT || null,
    };
  });

  return (
    <Box>
      <Card variant="outlined" sx={{ borderRadius: 2 }}>
        <CardContent sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2} mb={2}>
            <Box>
              <Typography variant="h6" fontWeight="bold">
                Gestión de Empresas para Descarga SAT
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Solo se muestran las razones sociales registradas en su cuenta de Wise
              </Typography>
            </Box>

            <Box display="flex" gap={1.5}>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={cargarRazonesSocialesSAT}
                disabled={loading}
              >
                Actualizar
              </Button>
              <Button
                variant="contained"
                startIcon={<AddBusinessIcon />}
                onClick={() => handleOpenCrear()}
                disabled={empresasUsuario.length === 0 || loading}
              >
                Vincular Empresa al SAT
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
                    <TableCell><strong>RFC</strong></TableCell>
                    <TableCell><strong>Razón Social</strong></TableCell>
                    <TableCell><strong>Régimen Fiscal</strong></TableCell>
                    <TableCell><strong>Estatus Sincronización SAT</strong></TableCell>
                    <TableCell align="center"><strong>Acciones</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {empresasConEstatus.map((emp) => (
                    <TableRow key={emp.ID || emp.Rfc} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {emp.Rfc}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {emp.RazonSocial || emp.NombreComercial || emp.Nombre || '-'}
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {emp.RegimenFiscal || 'General'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {emp.registradaEnSAT ? (
                          <Chip
                            size="small"
                            icon={<CheckCircleIcon />}
                            label="Activa en SAT/Prodigia"
                            color="success"
                          />
                        ) : (
                          <Chip
                            size="small"
                            icon={<WarningAmberIcon />}
                            label="Pendiente de Enlace"
                            color="default"
                            variant="outlined"
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        {emp.registradaEnSAT ? (
                          <Box display="flex" justifyContent="center" gap={0.5}>
                            <Tooltip title="Actualizar configuración">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenEditar(emp.datosSAT || { rfc: emp.Rfc })}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Desvincular del SAT">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleEliminar(emp.Rfc)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        ) : (
                          <Button
                            size="small"
                            variant="contained"
                            color="primary"
                            startIcon={<AddBusinessIcon />}
                            onClick={() => handleOpenCrear(emp)}
                            sx={{ textTransform: 'none', py: 0.2, fontSize: '0.75rem' }}
                          >
                            Activar en SAT
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}

                  {empresasConEstatus.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No tiene empresas registradas en su cuenta de Wise. Agregue una empresa primero en el módulo de Emisores.
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

      {/* Modal de Alta / Edición de Empresa ante el SAT */}
      <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleGuardar}>
          <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddBusinessIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">
              {isEditing ? 'Actualizar Razón Social SAT' : 'Vincular Empresa a Descarga Masiva SAT'}
            </Typography>
          </DialogTitle>
          <Divider />

          <DialogContent sx={{ mt: 1 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              La empresa se registrará en el PAC Prodigia para autorizar peticiones de descarga masiva ante el SAT.
            </Alert>

            <Box display="flex" flexDirection="column" gap={2}>
              {!isEditing && (
                <TextField
                  select
                  fullWidth
                  label="Empresa a Vincular"
                  value={selectedEmpresaRfc}
                  onChange={(e) => {
                    const rfc = e.target.value;
                    setSelectedEmpresaRfc(rfc);
                    const found = empresasUsuario.find((em) => em.Rfc === rfc);
                    if (found) {
                      setRazonSocialNombre(found.RazonSocial || found.NombreComercial || found.Nombre || found.Rfc);
                    }
                  }}
                  helperText="Empresa registrada en su cuenta de Wise"
                >
                  {empresasUsuario.map((emp) => (
                    <MenuItem key={emp.ID || emp.Rfc} value={emp.Rfc}>
                      <strong>{emp.Rfc}</strong> — {emp.RazonSocial || emp.NombreComercial || emp.Nombre}
                    </MenuItem>
                  ))}
                </TextField>
              )}

              <Box bgcolor="grey.50" p={2} borderRadius={1.5} border="1px solid #e0e0e0">
                <Typography variant="caption" color="text.secondary" fontWeight="bold">
                  RFC:
                </Typography>
                <Typography variant="subtitle1" fontWeight="bold" color="primary">
                  {selectedEmpresaRfc || '-'}
                </Typography>

                <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ mt: 1, display: 'block' }}>
                  Razón Social Registrada:
                </Typography>
                <Typography variant="body2" fontWeight="medium">
                  {razonSocialNombre || 'Razón Social predeterminada'}
                </Typography>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={submitting || !selectedEmpresaRfc}
            >
              {submitting ? 'Guardando...' : isEditing ? 'Guardar Cambios' : 'Activar Empresa'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default GestionEmpresasTab;
