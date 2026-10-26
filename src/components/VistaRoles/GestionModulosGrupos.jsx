"use client";
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Switch,
  Chip,
  CircularProgress,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  IconButton
} from '@mui/material';
import {
  Search,
  Refresh,
  Business,
  Person,
  Receipt,
  CloudDownload,
  AccountBalance,
  PointOfSale,
  CheckCircle,
  Cancel
} from '@mui/icons-material';

export default function GestionModulosGrupos({ showToast }) {
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState({});
  const [grupos, setGrupos] = useState([]);
  const [modulosDef, setModulosDef] = useState({});
  const [busqueda, setBusqueda] = useState('');

  const cargarModulosGrupos = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/superadmin/modulos');
      const data = await res.json();
      if (data.success) {
        setGrupos(data.grupos || []);
        setModulosDef(data.modulosDefinicion || {});
      } else {
        if (showToast) showToast(data.error || 'Error al cargar grupos', 'error');
      }
    } catch (e) {
      console.error('Error cargando módulos de grupos:', e);
      if (showToast) showToast('Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarModulosGrupos();
  }, []);

  const handleToggleModulo = async (grupoId, moduloClave, valorActual) => {
    const key = `${grupoId}-${moduloClave}`;
    const nuevoValor = !valorActual;

    setUpdating(prev => ({ ...prev, [key]: true }));

    // Optimistic UI update
    setGrupos(prev => prev.map(g => {
      if (g.grupoId === grupoId) {
        return {
          ...g,
          modulos: {
            ...g.modulos,
            [moduloClave]: nuevoValor
          }
        };
      }
      return g;
    }));

    try {
      const res = await fetch('/api/superadmin/modulos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grupoId,
          moduloClave,
          habilitar: nuevoValor
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        // Revertir cambio
        setGrupos(prev => prev.map(g => {
          if (g.grupoId === grupoId) {
            return {
              ...g,
              modulos: {
                ...g.modulos,
                [moduloClave]: valorActual
              }
            };
          }
          return g;
        }));
        if (showToast) showToast(data.error || 'Error al cambiar estado del módulo', 'error');
      } else {
        if (showToast) showToast(data.mensaje || 'Módulo actualizado', 'success');
      }
    } catch (error) {
      // Revertir
      setGrupos(prev => prev.map(g => {
        if (g.grupoId === grupoId) {
          return {
            ...g,
            modulos: {
              ...g.modulos,
              [moduloClave]: valorActual
            }
          };
        }
        return g;
      }));
      if (showToast) showToast('Error de red al actualizar módulo', 'error');
    } finally {
      setUpdating(prev => ({ ...prev, [key]: false }));
    }
  };

  const getModuloIcon = (clave) => {
    switch (clave) {
      case 'FACTURACION':
        return <Receipt fontSize="small" sx={{ color: '#0288d1', mr: 0.5 }} />;
      case 'DESCARGA_MASIVA':
        return <CloudDownload fontSize="small" sx={{ color: '#7b1fa2', mr: 0.5 }} />;
      case 'CONTABILIDAD_FISCAL':
        return <AccountBalance fontSize="small" sx={{ color: '#2e7d32', mr: 0.5 }} />;
      case 'COBRANZA':
        return <PointOfSale fontSize="small" sx={{ color: '#e65100', mr: 0.5 }} />;
      default:
        return null;
    }
  };

  const gruposFiltrados = grupos.filter(g => {
    const term = busqueda.toLowerCase();
    const matchId = g.grupoId.toString().includes(term);
    const matchNombre = (g.grupoNombre || '').toLowerCase().includes(term);
    const matchUsuario = g.usuarios.some(u => 
      (u.nombre || '').toLowerCase().includes(term) || 
      (u.email || '').toLowerCase().includes(term)
    );
    return matchId || matchNombre || matchUsuario;
  });

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 3 }}>
        <strong>Control Global de Módulos (Super Admin):</strong> Habilita o deshabilita módulos completos para cada cuenta o grupo (ej. por pago vía transferencia o contratación de paquetes). Al deshabilitar un módulo, se revoca el acceso a todos los roles de esa cuenta. Al habilitarlo, el rol <code>Admin</code> de la cuenta recibe el módulo completo y puede distribuirlo de forma granular internamente.
      </Alert>

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <TextField
          size="small"
          placeholder="Buscar por grupo, nombre o email..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          sx={{ width: 340 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <Tooltip title="Recargar lista">
          <IconButton onClick={cargarModulosGrupos} disabled={loading}>
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      ) : gruposFiltrados.length === 0 ? (
        <Box textAlign="center" py={5} bgcolor="#fafafa" borderRadius={2}>
          <Typography color="text.secondary">No se encontraron grupos o usuarios registrados.</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 2 }}>
          <Table size="medium">
            <TableHead sx={{ backgroundColor: '#1d394d' }}>
              <TableRow>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold', width: '80px' }}>ID</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Cuenta / Grupo</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold' }}>Propietario</TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <Receipt fontSize="small" /> Facturación
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <CloudDownload fontSize="small" /> Descarga Masiva
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <AccountBalance fontSize="small" /> Contabilidad
                  </Box>
                </TableCell>
                <TableCell sx={{ color: '#fff', fontWeight: 'bold', textAlign: 'center' }}>
                  <Box display="flex" alignItems="center" justifyContent="center" gap={0.5}>
                    <PointOfSale fontSize="small" /> Cobranza
                  </Box>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gruposFiltrados.map((g) => {
                const usuarioPrincipal = g.usuarios[0] || null;

                return (
                  <TableRow key={g.grupoId} hover>
                    <TableCell sx={{ fontWeight: 'bold' }}>
                      #{g.grupoId}
                    </TableCell>

                    <TableCell>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Business color="action" fontSize="small" />
                        <Typography fontWeight="medium">{g.grupoNombre}</Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      {usuarioPrincipal ? (
                        <Box>
                          <Typography variant="body2" fontWeight="500">
                            {usuarioPrincipal.nombre}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {usuarioPrincipal.email}
                          </Typography>
                        </Box>
                      ) : (
                        <Typography variant="caption" color="text.secondary">
                          Sin usuario asignado
                        </Typography>
                      )}
                    </TableCell>

                    {/* Módulo Facturación */}
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Switch
                          size="small"
                          checked={Boolean(g.modulos?.FACTURACION)}
                          disabled={Boolean(updating[`${g.grupoId}-FACTURACION`])}
                          onChange={() => handleToggleModulo(g.grupoId, 'FACTURACION', g.modulos?.FACTURACION)}
                          color="primary"
                        />
                        <Chip
                          label={g.modulos?.FACTURACION ? 'Activo' : 'Bloqueado'}
                          size="small"
                          color={g.modulos?.FACTURACION ? 'success' : 'default'}
                          variant={g.modulos?.FACTURACION ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Módulo Descarga Masiva */}
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Switch
                          size="small"
                          checked={Boolean(g.modulos?.DESCARGA_MASIVA)}
                          disabled={Boolean(updating[`${g.grupoId}-DESCARGA_MASIVA`])}
                          onChange={() => handleToggleModulo(g.grupoId, 'DESCARGA_MASIVA', g.modulos?.DESCARGA_MASIVA)}
                          color="secondary"
                        />
                        <Chip
                          label={g.modulos?.DESCARGA_MASIVA ? 'Activo' : 'Bloqueado'}
                          size="small"
                          color={g.modulos?.DESCARGA_MASIVA ? 'secondary' : 'default'}
                          variant={g.modulos?.DESCARGA_MASIVA ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Módulo Contabilidad Fiscal */}
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Switch
                          size="small"
                          checked={Boolean(g.modulos?.CONTABILIDAD_FISCAL)}
                          disabled={Boolean(updating[`${g.grupoId}-CONTABILIDAD_FISCAL`])}
                          onChange={() => handleToggleModulo(g.grupoId, 'CONTABILIDAD_FISCAL', g.modulos?.CONTABILIDAD_FISCAL)}
                          color="success"
                        />
                        <Chip
                          label={g.modulos?.CONTABILIDAD_FISCAL ? 'Activo' : 'Bloqueado'}
                          size="small"
                          color={g.modulos?.CONTABILIDAD_FISCAL ? 'success' : 'default'}
                          variant={g.modulos?.CONTABILIDAD_FISCAL ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                    </TableCell>

                    {/* Módulo Cobranza */}
                    <TableCell align="center">
                      <Box display="flex" flexDirection="column" alignItems="center">
                        <Switch
                          size="small"
                          checked={Boolean(g.modulos?.COBRANZA)}
                          disabled={Boolean(updating[`${g.grupoId}-COBRANZA`])}
                          onChange={() => handleToggleModulo(g.grupoId, 'COBRANZA', g.modulos?.COBRANZA)}
                          color="warning"
                        />
                        <Chip
                          label={g.modulos?.COBRANZA ? 'Activo' : 'Bloqueado'}
                          size="small"
                          color={g.modulos?.COBRANZA ? 'warning' : 'default'}
                          variant={g.modulos?.COBRANZA ? 'filled' : 'outlined'}
                          sx={{ fontSize: '0.65rem', height: 18 }}
                        />
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
