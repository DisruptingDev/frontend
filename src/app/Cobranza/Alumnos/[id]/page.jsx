"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
    Box, Typography, Grid, Paper, Chip, Divider, Button, CircularProgress, 
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, TextField, MenuItem, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

import { use } from 'react';

export default function DetalleAlumnoPage({ params }) {
    const router = useRouter();
    const unwrappedParams = use(params);
    const id = unwrappedParams.id;
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [historialData, setHistorialData] = useState({ pagos: [], cargos: [] });
    const [loading, setLoading] = useState(true);
    const [tabIndex, setTabIndex] = useState(0);

    // Edit state
    const [isEditing, setIsEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [emisores, setEmisores] = useState([]);
    
    // Delete state
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const parseMonto = (val) => {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? 0 : parsed;
    };

    useEffect(() => {
        if (!id) return;
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/cobranza/reportes?alumno_id=${id}`);
                const data = await res.json();
                
                const resEmisores = await fetch('/api/catalogos/Catalogos/Emisor').then(r => r.json()).catch(() => []);
                setEmisores(resEmisores);

                if (res.ok) {
                    setAlumnoSeleccionado(data.alumno);
                    setForm({
                        ...data.alumno,
                        emisor_id: data.alumno.emisor_id ? data.alumno.emisor_id.toString() : '',
                        monto_personalizado: data.alumno.monto_personalizado ? data.alumno.monto_personalizado.toString() : '',
                        motivo_cambio: '',
                        rfc: data.alumno.receptor?.rfc || '',
                        razon_social: data.alumno.receptor?.nombre || '',
                        codigo_postal: data.alumno.receptor?.domicilio_fiscal_receptor || '',
                        regimen_fiscal: data.alumno.receptor?.regimen_fiscal_receptor || '605',
                        uso_cfdi: data.alumno.receptor?.uso_cfdi || 'D10',
                        requiere_factura: Boolean(data.alumno.requiere_factura)
                    });
                    setHistorialData({ pagos: data.pagos || [], cargos: data.cargos || [] });
                }
            } catch (err) {
                console.error("Error fetching alumno:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    const handleEditAlumnoToggle = () => {
        setIsEditing(!isEditing);
    };

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSaveAlumno = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/cobranza/alumnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CREAR_ACTUALIZAR',
                    alumno_id: id,
                    ...form
                })
            });
            if (!res.ok) throw new Error('Error al guardar');
            setIsEditing(false);
            window.location.reload();
        } catch (error) {
            alert(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAlumno = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/cobranza/alumnos?id=${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('No se pudo eliminar el alumno. Es probable que tenga cargos o pagos vinculados.');
            alert('Alumno eliminado exitosamente');
            window.location.href = '/Cobranza/Dashboard?tab=1';
        } catch (error) {
            alert(error.message);
        } finally {
            setDeleting(false);
            setOpenDeleteModal(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', flexDirection: 'column', gap: 2 }}>
                <CircularProgress />
                <Typography>Cargando información del alumno...</Typography>
            </Box>
        );
    }

    if (!alumnoSeleccionado) {
        return (
            <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h5" color="error">No se encontró la información del alumno.</Typography>
                <Button sx={{ mt: 2 }} variant="contained" onClick={() => router.push('/Cobranza/Dashboard?tab=1')}>Regresar</Button>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 4, maxWidth: '1200px', margin: '0 auto' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <IconButton onClick={() => router.push('/Cobranza/Dashboard?tab=1')} sx={{ mr: 2, bgcolor: '#f1f5f9' }}>
                    <ArrowBackIcon />
                </IconButton>
                <Typography variant="h4" fontWeight="bold" color="primary">
                    Perfil del Alumno
                </Typography>
            </Box>

            <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 3 }}>
                {/* Header Style */}
                <Box sx={{ backgroundColor: '#1b384a', color: 'white', p: 3 }}>
                    <Typography variant="h5" fontWeight="bold">
                        {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido_paterno} {alumnoSeleccionado.apellido_materno}
                    </Typography>
                    <Typography variant="subtitle1" sx={{ opacity: 0.8 }}>
                        Matrícula: {alumnoSeleccionado.matricula || 'N/A'} | Carrera: {alumnoSeleccionado.carrera}
                    </Typography>
                </Box>

                {/* Tabs */}
                <Box sx={{ bgcolor: '#f8fafc', px: 2, pt: 1, borderBottom: '1px solid #e2e8f0' }}>
                    <div role="tablist" className="tabs tabs-bordered w-full">
                        <a role="tab" className={`tab ${tabIndex === 0 ? 'tab-active' : ''}`} onClick={() => setTabIndex(0)} style={{ fontWeight: 'bold', fontSize: '1rem', height: '3rem', flex: 1 }}>
                            Información General
                        </a>
                        <a role="tab" className={`tab ${tabIndex === 1 ? 'tab-active' : ''}`} onClick={() => setTabIndex(1)} style={{ fontWeight: 'bold', fontSize: '1rem', height: '3rem', flex: 1 }}>
                            Estado de Cuenta e Historial
                        </a>
                    </div>
                </Box>

                {/* Tab Content */}
                <Box sx={{ p: 3 }}>
                    {/* TAB 0 - INFO GENERAL */}
                    {tabIndex === 0 && (
                    <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" color="primary.main" fontWeight="bold">
                                👤 Información Detallada
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 2 }}>
                                {isEditing ? (
                                    <>
                                        <Button variant="outlined" color="error" onClick={handleEditAlumnoToggle}>Cancelar</Button>
                                        <Button variant="contained" color="success" onClick={handleSaveAlumno} disabled={saving}>{saving ? 'Guardando...' : 'Guardar Cambios'}</Button>
                                    </>
                                ) : (
                                    <>
                                        <Button variant="outlined" color="error" onClick={() => setOpenDeleteModal(true)}>
                                            Eliminar Alumno
                                        </Button>
                                        <Button variant="outlined" startIcon={<EditIcon />} onClick={handleEditAlumnoToggle} sx={{ fontWeight: 'bold' }}>
                                            Editar Información
                                        </Button>
                                    </>
                                )}
                            </Box>
                        </Box>

                        <Grid container spacing={3} sx={{ p: 3, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
                            {isEditing ? (
                                <>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Matrícula" name="matricula" value={form.matricula || ''} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Nombre(s)" name="nombre" value={form.nombre} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Apellido Paterno" name="apellido_paterno" value={form.apellido_paterno} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Apellido Materno" name="apellido_materno" value={form.apellido_materno || ''} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Correo Electrónico" name="email" value={form.email} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Teléfono" name="telefono" value={form.telefono} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Carrera" name="carrera" value={form.carrera || ''} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth type="number" label="Semestre" name="semestre" value={form.semestre || 1} onChange={handleChange} size="small" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField select fullWidth label="Estatus" name="estatus" value={form.estatus} onChange={handleChange} size="small">
                                            <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                                            <MenuItem value="BAJA">BAJA</MenuItem>
                                            <MenuItem value="GRADUADO">GRADUADO</MenuItem>
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth type="number" label="Monto Mensual Fijo" name="monto_personalizado" value={form.monto_personalizado || ''} onChange={handleChange} size="small" InputProps={{ startAdornment: <Typography sx={{mr: 1, color: 'text.secondary'}}>$</Typography> }} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="Motivo de Cambio de Monto" name="motivo_cambio" value={form.motivo_cambio || ''} onChange={handleChange} size="small" placeholder="Opcional" />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField fullWidth label="CLABE Interbancaria" name="clabe_interbancaria" value={form.clabe_interbancaria || ''} onChange={handleChange} size="small" placeholder="18 dígitos" />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField select fullWidth label="Empresa Emisora" name="emisor_id" value={form.emisor_id || ''} onChange={handleChange} size="small">
                                            <MenuItem value=""><em>-- Sin Asignar (Predeterminado) --</em></MenuItem>
                                            {emisores.map((em) => (
                                                <MenuItem key={em.id} value={em.id.toString()}>{em.rfc} - {em.nombre}</MenuItem>
                                            ))}
                                        </TextField>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField select fullWidth label="¿Requiere Factura?" name="requiere_factura" value={form.requiere_factura ? 'true' : 'false'} onChange={(e) => setForm({ ...form, requiere_factura: e.target.value === 'true' })} size="small">
                                            <MenuItem value="true">SÍ - Requiere Factura</MenuItem>
                                            <MenuItem value="false">NO - Público General</MenuItem>
                                        </TextField>
                                    </Grid>
                                    {form.requiere_factura && (
                                        <>
                                            <Grid item xs={12} sm={4}>
                                                <TextField fullWidth label="RFC" name="rfc" value={form.rfc || ''} onChange={handleChange} size="small" />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField fullWidth label="Razón Social" name="razon_social" value={form.razon_social || ''} onChange={handleChange} size="small" />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField fullWidth label="Código Postal Fiscal" name="codigo_postal" value={form.codigo_postal || ''} onChange={handleChange} size="small" />
                                            </Grid>
                                        </>
                                    )}
                                </>
                            ) : (
                                <>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="textSecondary">Nombre Completo</Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {alumnoSeleccionado.nombre} {alumnoSeleccionado.apellido_paterno} {alumnoSeleccionado.apellido_materno}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="caption" color="textSecondary">Estatus</Typography>
                                        <Box>
                                            <Chip label={alumnoSeleccionado.estatus || 'ACTIVO'} color={alumnoSeleccionado.estatus === 'BAJA' ? 'error' : alumnoSeleccionado.estatus === 'GRADUADO' ? 'success' : 'primary'} size="small" />
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} sm={3}>
                                        <Typography variant="caption" color="textSecondary">Monto Mensual</Typography>
                                        <Typography variant="body1" fontWeight="bold">
                                            {alumnoSeleccionado.monto_personalizado ? `$${parseFloat(alumnoSeleccionado.monto_personalizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : 'No asignado'}
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="textSecondary">Email</Typography>
                                        <Typography variant="body1" fontWeight="bold">{alumnoSeleccionado.email || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="textSecondary">CLABE Interbancaria</Typography>
                                        <Typography variant="body1" fontWeight="bold">{alumnoSeleccionado.clabe_interbancaria || 'No asignada'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="textSecondary">Teléfono</Typography>
                                        <Typography variant="body1" fontWeight="bold">{alumnoSeleccionado.telefono || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6} md={4}>
                                        <Typography variant="caption" color="textSecondary">Tipo de Alumno</Typography>
                                        <Typography variant="body1" fontWeight="bold">{alumnoSeleccionado.tipo || 'N/A'}</Typography>
                                    </Grid>
                                </>
                            )}
                            <Grid item xs={12} sm={6} md={4}>
                                <Typography variant="caption" color="textSecondary">Semestre</Typography>
                                <Typography variant="body1" fontWeight="bold">{alumnoSeleccionado.semestre || 'N/A'}</Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="caption" color="textSecondary">Observaciones / Información de Pago</Typography>
                                <Typography variant="body1" sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 1, mt: 1 }}>
                                    {alumnoSeleccionado.informacion_pago || alumnoSeleccionado.observaciones || 'Sin observaciones'}
                                </Typography>
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Divider sx={{ my: 2 }} />
                                <Typography variant="subtitle2" color="primary" display="block" fontWeight="bold" sx={{ mb: 1 }}>Datos de Facturación</Typography>
                                {alumnoSeleccionado.requiere_factura && alumnoSeleccionado.receptor ? (
                                    <Box sx={{ p: 2, bgcolor: '#f0fdf4', borderRadius: 1, border: '1px solid #bbf7d0' }}>
                                        <Typography variant="body1">
                                            <strong>RFC:</strong> {alumnoSeleccionado.receptor.rfc}
                                        </Typography>
                                        <Typography variant="body1">
                                            <strong>Razón Social:</strong> {alumnoSeleccionado.receptor.nombre}
                                        </Typography>
                                    </Box>
                                ) : (
                                    <Typography variant="body1">RFC Genérico (Público General)</Typography>
                                )}
                            </Grid>
                            
                            <Grid item xs={12}>
                                <Typography variant="subtitle2" color="primary" display="block" fontWeight="bold" sx={{ mb: 1 }}>Empresa Emisora Asignada</Typography>
                                <Typography variant="body1">
                                    {alumnoSeleccionado.emisor ? `${alumnoSeleccionado.emisor.rfc} - ${alumnoSeleccionado.emisor.nombre}` : '⚠️ Sin Asignar (Predeterminado)'}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Box>
                    )}

                    {/* TAB 1 - HISTORIAL Y ESTADO DE CUENTA */}
                    {tabIndex === 1 && (
                    <Box>
                        {/* RESUMEN DE ESTADO DE CUENTA */}
                        <Box sx={{ mb: 4, p: 3, bgcolor: '#e0f2fe', borderRadius: 2, border: '1px solid #bae6fd' }}>
                            <Typography variant="h6" color="primary.main" fontWeight="bold" gutterBottom>
                                📊 Resumen de Estado de Cuenta
                            </Typography>
                            <Grid container spacing={3}>
                                <Grid item xs={12} sm={4}>
                                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                                        <Typography variant="body2" color="textSecondary">Total Cargos (Fichas)</Typography>
                                        <Typography variant="h5" fontWeight="bold" color="error.main">
                                            ${(historialData.cargos.reduce((sum, cargo) => sum + parseMonto(cargo.monto_total), 0)).toFixed(2)}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                                        <Typography variant="body2" color="textSecondary">Total Pagado</Typography>
                                        <Typography variant="h5" fontWeight="bold" color="success.main">
                                            ${(historialData.pagos.reduce((sum, pago) => sum + parseMonto(pago.monto), 0)).toFixed(2)}
                                        </Typography>
                                    </Paper>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <Paper elevation={0} sx={{ p: 2, textAlign: 'center', bgcolor: 'white', borderRadius: 2 }}>
                                        <Typography variant="body2" color="textSecondary">Saldo Pendiente</Typography>
                                        <Typography variant="h5" fontWeight="bold" color="warning.main">
                                            ${Math.max(0, (historialData.cargos.reduce((sum, cargo) => sum + parseMonto(cargo.monto_total), 0) - historialData.pagos.reduce((sum, pago) => sum + parseMonto(pago.monto), 0))).toFixed(2)}
                                        </Typography>
                                    </Paper>
                                </Grid>
                            </Grid>
                        </Box>

                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1b384a' }}>
                            📑 Fichas y Cargos Emitidos al Alumno
                        </Typography>
                        <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                            <Table>
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell>Código Único</TableCell>
                                        <TableCell>Concepto</TableCell>
                                        <TableCell>Referencia Bancaria</TableCell>
                                        <TableCell>Vencimiento</TableCell>
                                        <TableCell>Monto Total</TableCell>
                                        <TableCell>Estatus</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historialData.cargos.length > 0 ? (
                                        historialData.cargos.map((cargo, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>
                                                    <Chip label={cargo.codigo_ficha || `F-${cargo.id}`} color="secondary" size="small" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }} />
                                                </TableCell>
                                                <TableCell>{cargo.concepto?.nombre || 'Colegiatura Mensual'}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>{alumnoSeleccionado.clabe_interbancaria || cargo.referencia_bancaria}</TableCell>
                                                <TableCell>{new Date(cargo.fecha_vencimiento).toLocaleDateString('es-MX')}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold' }}>${parseMonto(cargo.monto_total).toFixed(2)}</TableCell>
                                                <TableCell>
                                                    {cargo.estatus === 'PAGADO' ? (
                                                        <Chip label="PAGADO" color="success" size="small" />
                                                    ) : cargo.estatus === 'PARCIAL' ? (
                                                        <Chip label="PARCIAL" color="warning" size="small" />
                                                    ) : (
                                                        <Chip label="PENDIENTE" color="error" size="small" />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 3 }}>Sin cargos o fichas registradas para este alumno.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, color: '#1b384a' }}>
                            💳 Pagos y Depósitos Recibidos
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table>
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell>Fecha Pago</TableCell>
                                        <TableCell>Monto</TableCell>
                                        <TableCell>Referencia Bancaria</TableCell>
                                        <TableCell>Estado Conciliación</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {historialData.pagos.length > 0 ? (
                                        historialData.pagos.map((pago, idx) => (
                                            <TableRow key={idx} hover>
                                                <TableCell>{new Date(pago.fecha_pago).toLocaleDateString('es-MX')}</TableCell>
                                                <TableCell sx={{ fontWeight: 'bold', color: 'green' }}>${parseMonto(pago.monto).toFixed(2)}</TableCell>
                                                <TableCell sx={{ fontFamily: 'monospace' }}>{alumnoSeleccionado.clabe_interbancaria || pago.referencia_bancaria}</TableCell>
                                                <TableCell><Chip label={pago.estado_conciliacion} color="success" size="small" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 3 }}>Sin historial de pagos registrados.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                    )}
                </Box>
                
                {/* HISTORIAL DE MONTOS MENSUALES */}
                <Box sx={{ mt: 4, px: 3, pb: 3 }}>
                    <Typography variant="h6" color="primary" fontWeight="bold" sx={{ mb: 2 }}>Historial de Cambios de Monto Mensual</Typography>
                    {alumnoSeleccionado.historial_montos && alumnoSeleccionado.historial_montos.length > 0 ? (
                        <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                    <TableRow>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Fecha del Cambio</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Monto Anterior</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Monto Nuevo</TableCell>
                                        <TableCell sx={{ fontWeight: 'bold' }}>Motivo</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {alumnoSeleccionado.historial_montos.map((h, i) => (
                                        <TableRow key={h.id} sx={{ backgroundColor: i === 0 ? '#f0fdf4' : 'inherit' }}>
                                            <TableCell>{new Date(h.fecha_cambio).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} {i === 0 ? <Chip label="Actual" size="small" color="success" sx={{ml: 1, height: 20}} /> : ''}</TableCell>
                                            <TableCell>{h.monto_anterior != null ? `$${parseFloat(h.monto_anterior).toLocaleString('es-MX', { minimumFractionDigits: 2 })}` : '-'}</TableCell>
                                            <TableCell sx={{ fontWeight: 'bold' }}>${parseFloat(h.monto_nuevo).toLocaleString('es-MX', { minimumFractionDigits: 2 })}</TableCell>
                                            <TableCell>{h.motivo_cambio || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    ) : (
                        <Typography variant="body2" color="textSecondary">No hay historial de cambios registrado para este alumno.</Typography>
                    )}
                </Box>
            </Paper>
            <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)}>
                <DialogTitle>Confirmar Eliminación</DialogTitle>
                <DialogContent>
                    <Typography>¿Está seguro de que desea eliminar a este alumno? Esta acción es irreversible.</Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteModal(false)}>Cancelar</Button>
                    <Button color="error" variant="contained" onClick={handleDeleteAlumno} disabled={deleting}>
                        {deleting ? 'Eliminando...' : 'Sí, Eliminar'}
                    </Button>
                </DialogActions>
            </Dialog>

        </Box>
    );
}
