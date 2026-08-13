'use client';
import { useState, useEffect } from 'react';
import { WithPermission } from '@/components/WithPermission';

function AccesoDenegado() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" p={4}>
            <Paper elevation={4} sx={{ p: 5, textAlign: 'center', maxWidth: 500, borderRadius: 3 }}>
                <Typography variant="h1" color="error" sx={{ fontSize: '4rem', mb: 1 }}>
                    🚫
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1b384a' }}>
                    Acceso Restringido
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                    No cuentas con los permisos necesarios (<strong>PAGOS_VER</strong>) para acceder al Módulo de Cobranza.
                </Typography>
                <Button variant="contained" color="primary" href="/Home">
                    Volver al Inicio
                </Button>
            </Paper>
        </Box>
    );
}
import Header from '@/components/Header/Header.jsx';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress,
    MenuItem,
    IconButton,
    Tooltip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    Autocomplete
} from '@mui/material';
import {
    Add as AddIcon,
    AutoFixHigh as AutoFixIcon,
    Visibility as EyeIcon,
    Receipt as ReceiptIcon,
    Print as PrintIcon,
    Delete as DeleteIcon,
    Email as EmailIcon,
    PictureAsPdf as PdfIcon
} from '@mui/icons-material';

function parseMonto(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    }
    if (typeof val === 'object') {
        const str = String(val);
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

export default function CargosPage() {
    const [cargos, setCargos] = useState([]);
    const [alumnos, setAlumnos] = useState([]);
    const [emisores, setEmisores] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Modales
    const [openModal, setOpenModal] = useState(false);
    const [openAutoModal, setOpenAutoModal] = useState(false);
    const [openFichaModal, setOpenFichaModal] = useState(false);

    // Selección
    const [cargoSeleccionado, setCargoSeleccionado] = useState(null);
    const [emisorSeleccionado, setEmisorSeleccionado] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cobranza_emisor_id') || '';
        }
        return '';
    });
    const [serieSeleccionada, setSerieSeleccionada] = useState('F');

    const handleCambiarEmisorGlobal = async (newEmisorId) => {
        setEmisorSeleccionado(newEmisorId);
        if (typeof window !== 'undefined') {
            localStorage.setItem('cobranza_emisor_id', newEmisorId.toString());
        }
        setSerieSeleccionada('F');

        try {
            await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'SET_EMISOR_PREDETERMINADO',
                    emisor_id: newEmisorId
                })
            });
        } catch (e) {
            console.warn('Error guardando emisor predeterminado en DB:', e.message);
        }
    };

    const [saving, setSaving] = useState(false);
    const [enviandoCorreoId, setEnviandoCorreoId] = useState(null);
    const [error, setError] = useState('');
    const [exito, setExito] = useState('');

    const handleReenviarCorreo = async (cargoId) => {
        if (!cargoId) return;
        setEnviandoCorreoId(cargoId);
        try {
            const res = await fetch(`/api/cobranza/cargos/${cargoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar correo');
            alert(data.mensaje || 'Ficha de cargo enviada en PDF por correo exitosamente.');
        } catch (err) {
            alert('Error al enviar correo: ' + err.message);
        } finally {
            setEnviandoCorreoId(null);
        }
    };

    const [busquedaAlumnoModal, setBusquedaAlumnoModal] = useState('');
    const [form, setForm] = useState({
        alumnos_ids: '',
        producto_id: '',
        items: [
            { concepto: 'MATERIA', monto: '' }
        ],
        fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const handleAddItem = () => {
        setForm(prev => ({
            ...prev,
            items: [...prev.items, { concepto: 'Mensualidad', monto: '' }]
        }));
    };

    const handleRemoveItem = (index) => {
        setForm(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    const handleItemChange = (index, field, value) => {
        setForm(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const [autoForm, setAutoForm] = useState({
        mes_periodo: new Date().toISOString().slice(0, 7),
        carrera_filtro: 'TODAS'
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            let grupoId = '';
            let token = '';
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
                const storedUser = localStorage.getItem('usuario');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        grupoId = parsed.grupo_id || '';
                    } catch (e) {}
                }
                if (!grupoId) grupoId = localStorage.getItem('grupo_id') || '';
            }

            const queryGrupo = grupoId ? `grupo_id=${grupoId}` : '';
            const urlCargos = queryGrupo ? `/api/cobranza/cargos?${queryGrupo}` : '/api/cobranza/cargos';
            const urlAlum = queryGrupo ? `/api/cobranza/alumnos?${queryGrupo}` : '/api/cobranza/alumnos';
            const urlFact = queryGrupo ? `/api/cobranza/facturacion?${queryGrupo}` : '/api/cobranza/facturacion';
            const urlProd = queryGrupo ? `/api/cobranza/productos?${queryGrupo}` : '/api/cobranza/productos';

            const [resCargos, resAlumnos, resFact, resProd] = await Promise.all([
                fetch(urlCargos).then(r => r.json()).catch(() => []),
                fetch(urlAlum).then(r => r.json()).catch(() => []),
                fetch(urlFact).then(r => r.json()).catch(() => ({})),
                fetch(urlProd).then(r => r.json()).catch(() => [])
            ]);

            if (Array.isArray(resCargos)) setCargos(resCargos);
            if (Array.isArray(resAlumnos)) setAlumnos(resAlumnos);
            if (Array.isArray(resProd)) setProductos(resProd);
            
            const listaEmisoresFinal = resFact.emisores || [];
            setEmisores(listaEmisoresFinal);

            let idPref = null;
            if (typeof window !== 'undefined') {
                idPref = localStorage.getItem('emisor_id_predeterminado');
            }
            if (!idPref && resFact.emisor_predeterminado_id) {
                idPref = resFact.emisor_predeterminado_id;
            }
            if (!idPref && listaEmisoresFinal.length > 0) {
                const dbPred = listaEmisoresFinal.find(e => e.es_predeterminado === true);
                idPref = dbPred ? dbPred.id : listaEmisoresFinal[0].id;
            }

            if (idPref) {
                setEmisorSeleccionado(idPref.toString());
            }
        } catch (err) {
            console.error('Error cargando cargos:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleAutoChange = (e) => {
        const { name, value } = e.target;
        setAutoForm(prev => ({ ...prev, [name]: value }));
    };

    const handleVerFicha = (cargo) => {
        setCargoSeleccionado(cargo);
        setOpenFichaModal(true);
    };

    const handleDeleteFicha = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta ficha de cobro? Esto no se puede deshacer.')) {
            return;
        }
        
        try {
            const res = await fetch(`/api/cobranza/cargos/${id}`, {
                method: 'DELETE'
            });
            const data = await res.json();
            
            if (res.ok) {
                alert(data.mensaje || 'Ficha eliminada correctamente.');
                fetchData();
            } else {
                alert(data.error || 'Error al eliminar la ficha.');
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión al intentar eliminar la ficha.');
        }
    };

    const handleGenerarAutomatica = async () => {
        setSaving(true);
        setError('');
        setExito('');

        try {
            const res = await fetch('/api/cobranza/cargos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    generacion_automatica: true,
                    mes_periodo: autoForm.mes_periodo,
                    carrera_filtro: autoForm.carrera_filtro
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al ejecutar generación automática');

            setExito(data.mensaje || `Se crearon ${data.total_generados} fichas de cobro.`);
            setOpenAutoModal(false);
            fetchData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleGenerarManual = async () => {
        if (!form.alumnos_ids) {
            setError('Por favor selecciona un alumno destinatario específico para emitir la ficha.');
            return;
        }

        const itemsValidos = (form.items || []).map(it => ({
            concepto: (it.concepto || 'Mensualidad').trim(),
            monto: parseFloat(it.monto || 0)
        })).filter(it => it.monto > 0);

        if (itemsValidos.length === 0) {
            setError('Agregue al menos un concepto de cobro con un monto válido mayor a $0.');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const payload = {
                items: itemsValidos,
                fecha_vencimiento: form.fecha_vencimiento
            };

            if (form.alumnos_ids !== 'TODOS') {
                payload.alumno_id = form.alumnos_ids;
            }

            const res = await fetch('/api/cobranza/cargos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al generar fichas');

            setExito(data.mensaje || 'Ficha(s) de cobro complementario generada(s) exitosamente.');
            setOpenModal(false);
            fetchData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <WithPermission permission="PAGOS_VER" fallback={<AccesoDenegado />}>
            <div>
            <Header title="Fichas de Pago y Cuentas por Cobrar" />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item xs>
                    <Box
                        bgcolor="white"
                        ml={{ xs: 10, md: 10 }}
                        mr={2}
                        mt={2}
                        p={3}
                        boxShadow={3}
                        borderRadius={2}
                        width={{ xs: "80%", md: "93%" }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b384a' }}>
                                    Fichas de Pago Emitidas y Referencias Módulo 10
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Control de Emisión Institucional y Facturación CFDI 4.0
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                                <TextField
                                    select
                                    size="small"
                                    label="🏢 Razón Social Emisora Activa *"
                                    value={emisorSeleccionado}
                                    onChange={(e) => handleCambiarEmisorGlobal(e.target.value)}
                                    sx={{ minWidth: 260, bgcolor: 'white' }}
                                    helperText="Selección única persistente"
                                >
                                    {emisores.length === 0 ? (
                                        <MenuItem value="">Cargando emisores...</MenuItem>
                                    ) : (
                                        emisores.map(e => (
                                            <MenuItem key={e.id} value={e.id.toString()}>
                                                🏢 {e.nombre} ({e.rfc})
                                            </MenuItem>
                                        ))
                                    )}
                                </TextField>

                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<AutoFixIcon />}
                                    onClick={() => setOpenAutoModal(true)}
                                >
                                    ⚡ Generación Automática 1-Click (Periodo)
                                </Button>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={() => setOpenModal(true)}
                                >
                                    Emitir Ficha Específica
                                </Button>
                            </Box>
                        </Box>

                        {exito && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setExito('')}>{exito}</Alert>}

                        <Card elevation={3}>
                            <CardContent sx={{ p: 0 }}>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" p={5}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <TableContainer component={Paper}>
                                        <Table>
                                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                                <TableRow>
                                                    <TableCell>Código Único</TableCell>
                                                    <TableCell>Referencia Bancaria (Múl. 10)</TableCell>
                                                    <TableCell>Alumno / Carrera</TableCell>
                                                    <TableCell>Concepto / Tarifa</TableCell>
                                                    <TableCell>Vencimiento</TableCell>
                                                    <TableCell>Monto Total</TableCell>
                                                    <TableCell>Estatus</TableCell>
                                                    <TableCell align="center">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {cargos.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#888' }}>
                                                            No hay fichas de cobro emitidas. Haz clic en &quot;⚡ Generación Automática 1-Click&quot; para crear los cobros del mes.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    cargos.map((cargo) => (
                                                        <TableRow key={cargo.id} hover>
                                                            <TableCell>
                                                                <Chip
                                                                    label={cargo.codigo_ficha || `F-${cargo.id}`}
                                                                    color="secondary"
                                                                    size="small"
                                                                    sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}
                                                                />
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace', color: '#1976d2' }}>
                                                                {cargo.alumno?.clabe_interbancaria || cargo.referencia_bancaria}
                                                            </TableCell>
                                                            <TableCell>
                                                                {cargo.alumno ? (
                                                                    <>
                                                                        {cargo.alumno.nombre} {cargo.alumno.apellido_paterno} ({cargo.alumno.matricula})
                                                                        <br />
                                                                        <Typography variant="caption" color="textSecondary">{cargo.alumno.carrera || 'General'}</Typography>
                                                                    </>
                                                                ) : 'N/A'}
                                                            </TableCell>
                                                            <TableCell>{cargo.concepto?.nombre || 'Colegiatura Mensual'}</TableCell>
                                                            <TableCell>
                                                                {new Date(cargo.fecha_vencimiento).toLocaleDateString('es-MX')}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>
                                                                ${parseMonto(cargo.monto_total).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {cargo.estatus === 'PAGADO' ? (
                                                                    <Chip label="PAGADO" color="success" size="small" sx={{ fontWeight: 'bold' }} />
                                                                ) : cargo.estatus === 'PARCIAL' ? (
                                                                    <Chip label={`PARCIAL ($${parseMonto(cargo.monto_pendiente).toFixed(2)})`} color="warning" size="small" sx={{ fontWeight: 'bold' }} />
                                                                ) : cargo.estatus === 'VENCIDO' ? (
                                                                    <Chip label="VENCIDO" color="error" size="small" sx={{ fontWeight: 'bold' }} />
                                                                ) : (
                                                                    <Chip label="PENDIENTE" color="error" variant="outlined" size="small" sx={{ fontWeight: 'bold' }} />
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title="Ver Ficha Imprimible">
                                                                    <IconButton
                                                                        color="primary"
                                                                        size="small"
                                                                        onClick={() => handleVerFicha(cargo)}
                                                                    >
                                                                        <EyeIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Enviar / Reenviar PDF por Correo">
                                                                    <IconButton
                                                                        color="info"
                                                                        size="small"
                                                                        disabled={enviandoCorreoId === cargo.id}
                                                                        onClick={() => handleReenviarCorreo(cargo.id)}
                                                                    >
                                                                        {enviandoCorreoId === cargo.id ? <CircularProgress size={18} color="inherit" /> : <EmailIcon />}
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {(cargo.estatus === 'PENDIENTE' || cargo.estatus === 'VENCIDO') && (
                                                                    <Tooltip title="Eliminar Ficha">
                                                                        <IconButton
                                                                            color="error"
                                                                            size="small"
                                                                            onClick={() => handleDeleteFicha(cargo.id)}
                                                                        >
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>
            </Grid>

            {/* MODAL 1: VER FICHA IMPRIMIBLE DE PAGO */}
            <Dialog open={openFichaModal} onClose={() => setOpenFichaModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#1b384a', color: 'white' }}>
                    🏛️ Ficha Oficial de Pago Bancario
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {cargoSeleccionado && (
                        <Box>
                            <Typography variant="h6" fontWeight="bold" textAlign="center" color="primary">
                                {emisores.find(e => e.id.toString() === cargoSeleccionado.alumno?.emisor_id?.toString())?.nombre || 'UNIVERSIDAD HISPANOAMERICANA S.C.'}
                            </Typography>
                            <Typography variant="body2" textAlign="center" color="textSecondary" sx={{ mb: 2 }}>
                                Comprobante de Depósito y Ficha de Pago en Ventanilla / Practicaja
                            </Typography>
                            <Divider sx={{ mb: 2 }} />

                            <Grid container spacing={2} sx={{ mb: 2 }}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Código Único de Ficha:</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="secondary" sx={{ fontFamily: 'monospace' }}>
                                        {cargoSeleccionado.codigo_ficha || `F-${cargoSeleccionado.id}`}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Alumno / Cliente:</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {cargoSeleccionado.alumno?.nombre} {cargoSeleccionado.alumno?.apellido_paterno}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Matrícula ID:</Typography>
                                    <Typography variant="body1" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                        {cargoSeleccionado.alumno?.matricula}
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Programa / Carrera:</Typography>
                                    <Typography variant="body2">
                                        {cargoSeleccionado.alumno?.carrera || 'General'}
                                    </Typography>
                                </Grid>
                            </Grid>

                            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #ddd', mb: 2 }}>
                                <Table size="small">
                                    <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                        <TableRow>
                                            <TableCell><b>Concepto</b></TableCell>
                                            <TableCell align="right"><b>Monto</b></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {cargoSeleccionado.detalles_items ? (
                                            (typeof cargoSeleccionado.detalles_items === 'string' 
                                                ? JSON.parse(cargoSeleccionado.detalles_items) 
                                                : cargoSeleccionado.detalles_items
                                            ).map((item, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{item.concepto}</TableCell>
                                                    <TableCell align="right">${parseMonto(item.monto).toFixed(2)}</TableCell>
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell>{cargoSeleccionado.concepto?.nombre || 'Colegiatura Mensual'}</TableCell>
                                                <TableCell align="right">${parseMonto(cargoSeleccionado.monto_total).toFixed(2)}</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            <Paper elevation={2} sx={{ p: 2, backgroundColor: '#f0f7ff', textAlign: 'center', mb: 2 }}>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    REFERENCIA BANCARIA ÚNICA (CLABE / MÓDULO 10):
                                </Typography>
                                <Typography variant="h4" fontWeight="bold" color="primary" sx={{ fontFamily: 'monospace', letterSpacing: 2, mb: 1 }}>
                                    {cargoSeleccionado.alumno?.clabe_interbancaria || cargoSeleccionado.referencia_bancaria}
                                </Typography>
                                <Divider sx={{ my: 1 }} />
                                <Typography variant="caption" color="textSecondary" display="block">
                                    CONCEPTO / DESCRIPCIÓN DE PAGO (DOBLE CONTROL):
                                </Typography>
                                <Typography variant="h5" fontWeight="bold" color="secondary.main" sx={{ fontFamily: 'monospace', letterSpacing: 1 }}>
                                    {cargoSeleccionado.codigo_ficha || 'N/A'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                                    Escribe este código exactamente en el campo de Concepto de tu transferencia SPEI
                                </Typography>
                            </Paper>

                            <Grid container spacing={2}>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Monto Total a Pagar:</Typography>
                                    <Typography variant="h5" fontWeight="bold" color="success.main">
                                        ${parseMonto(cargoSeleccionado.monto_total).toFixed(2)} MXN
                                    </Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="caption" color="textSecondary">Fecha Límite de Vencimiento:</Typography>
                                    <Typography variant="body1" fontWeight="bold" color="error.main">
                                        {new Date(cargoSeleccionado.fecha_vencimiento).toLocaleDateString('es-MX')}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Button 
                        startIcon={<PdfIcon />} 
                        variant="outlined" 
                        color="secondary"
                        onClick={() => window.open(`/api/cobranza/cargos/${cargoSeleccionado?.id}`, '_blank')}
                    >
                        Descargar PDF
                    </Button>
                    <Button 
                        startIcon={<EmailIcon />} 
                        variant="outlined" 
                        color="info"
                        disabled={enviandoCorreoId === cargoSeleccionado?.id}
                        onClick={() => handleReenviarCorreo(cargoSeleccionado?.id)}
                    >
                        {enviandoCorreoId === cargoSeleccionado?.id ? 'Enviando PDF...' : 'Enviar por Correo'}
                    </Button>
                    <Button startIcon={<PrintIcon />} variant="outlined" onClick={() => window.print()}>
                        Imprimir Ficha
                    </Button>
                    <Button onClick={() => setOpenFichaModal(false)} variant="contained" color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 3: 1-CLICK GENERACIÓN AUTOMÁTICA */}
            <Dialog open={openAutoModal} onClose={() => setOpenAutoModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', color: '#2e7d32' }}>
                    ⚡ Generación Automática 1-Click del Periodo
                </DialogTitle>
                <DialogContent dividers>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Este proceso escanea automáticamente a todos los alumnos activos, lee su **Carrera**, **Cuota/Beca asignada** y **Día de Pago**, generando sus fichas con referencias bancarias Módulo 10 sin trabajo manual.
                    </Typography>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Mes / Periodo de Cobro *"
                                type="month"
                                name="mes_periodo"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={autoForm.mes_periodo}
                                onChange={handleAutoChange}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Filtrar por Carrera"
                                name="carrera_filtro"
                                fullWidth
                                value={autoForm.carrera_filtro}
                                onChange={handleAutoChange}
                            >
                                <MenuItem value="TODAS">Todas las carreras</MenuItem>
                                <MenuItem value="Ingeniería en Sistemas">Ingeniería en Sistemas</MenuItem>
                                <MenuItem value="Administración de Empresas">Administración de Empresas</MenuItem>
                                <MenuItem value="Medicina">Medicina</MenuItem>
                                <MenuItem value="Derecho">Derecho</MenuItem>
                                <MenuItem value="Arquitectura">Arquitectura</MenuItem>
                                <MenuItem value="Contaduría Pública">Contaduría Pública</MenuItem>
                            </TextField>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAutoModal(false)} color="secondary">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerarAutomatica}
                        variant="contained"
                        color="success"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <AutoFixIcon />}
                    >
                        {saving ? 'Generando Cuentas...' : 'Ejecutar Generación Automática'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 4: GENERACIÓN MANUAL DE FICHA COMPLEMENTARIA */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#1b384a', color: 'white' }}>
                    Emitir Ficha de Pago Complementaria / Servicio Adicional
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <Autocomplete
                                options={alumnos.filter(alum => (alum.estatus || 'ACTIVO').toUpperCase() === 'ACTIVO')}
                                getOptionLabel={(option) => typeof option === 'string' ? option : `🎓 ${option.matricula} - ${option.nombre} ${option.apellido_paterno} ${option.apellido_materno || ''} (${option.carrera || 'General'})`}
                                value={alumnos.find(a => a.id.toString() === form.alumnos_ids) || null}
                                onChange={(event, newValue) => {
                                    setForm(prev => ({
                                        ...prev,
                                        alumnos_ids: newValue ? newValue.id.toString() : ''
                                    }));
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Seleccionar Alumno Destinatario (Solo Activos) *"
                                        placeholder="Escribe la matrícula o nombre del alumno para buscar..."
                                        helperText="Empieza a escribir matrícula o nombre para encontrar al alumno rápidamente"
                                        size="small"
                                    />
                                )}
                                noOptionsText="No se encontraron alumnos activos coincidentes"
                            />
                        </Grid>

                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Seleccionar Producto Principal del Catálogo"
                                name="producto_id"
                                fullWidth
                                size="small"
                                value={form.producto_id || ''}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    const selProd = productos.find(p => p.id.toString() === val.toString());
                                    setForm(prev => {
                                        const updatedItems = [...prev.items];
                                        if (selProd && updatedItems.length > 0) {
                                            updatedItems[0] = {
                                                ...updatedItems[0],
                                                concepto: selProd.nombre
                                            };
                                        }
                                        return {
                                            ...prev,
                                            producto_id: val,
                                            items: updatedItems
                                        };
                                    });
                                }}
                                helperText="Selecciona un producto del catálogo para autocompletar el concepto"
                            >
                                <MenuItem value="">-- Ninguno (Personalizado) --</MenuItem>
                                {productos.map(prod => (
                                    <MenuItem key={prod.id} value={prod.id.toString()}>
                                        {prod.nombre} (Ref. SAT: {prod.concepto_utilizado})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* PANEL INFORMATIVO DEL ALUMNO SELECCIONADO */}
                        {form.alumnos_ids && form.alumnos_ids !== 'TODOS' && (() => {
                            const alumObj = alumnos.find(a => a.id.toString() === form.alumnos_ids);
                            if (!alumObj) return null;
                            return (
                                <Grid item xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                        <Typography variant="subtitle2" fontWeight="bold" color="#166534" sx={{ mb: 1 }}>
                                            👤 Datos para Pago y Conciliación de {alumObj.nombre} {alumObj.apellido_paterno}:
                                        </Typography>
                                        <Grid container spacing={1}>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" color="textSecondary" display="block">CLABE Única:</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                    {alumObj.clabe_interbancaria || 'Sin CLABE asignada'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" color="textSecondary" display="block">Referencia Personal SPEI:</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                    {alumObj.referencia_pago || 'Sin referencia'}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <Typography variant="caption" color="textSecondary" display="block">IDs / Planes de Estudio:</Typography>
                                                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                    {alumObj.ids_alumno || 'General'}
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                </Grid>
                            );
                        })()}

                        {/* SECCIÓN MULTI-CONCEPTO DE COBRO PARA LA FICHA */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1b384a', mb: 1 }}>
                                📑 Conceptos de Cobro y Facturación incluidos en esta Ficha:
                            </Typography>
                            {(form.items || []).map((item, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                                    <TextField
                                        select
                                        label={`Concepto ${idx + 1} *`}
                                        fullWidth
                                        size="small"
                                        value={item.concepto || (productos[0]?.nombre || 'Mensualidad')}
                                        onChange={(e) => handleItemChange(idx, 'concepto', e.target.value)}
                                    >
                                        {productos.length > 0 ? (
                                            productos.map(prod => (
                                                <MenuItem key={prod.id} value={prod.nombre}>
                                                    {prod.nombre} (SAT: {prod.concepto_utilizado})
                                                </MenuItem>
                                            ))
                                        ) : (
                                            [
                                                'Mensualidad',
                                                'Materia Ordinaria',
                                                'Materia de Revalidación',
                                                'Materia de Adelanto',
                                                'Materia Recursada',
                                                'Constancia',
                                                'Kardex',
                                                'Credencial',
                                                'Abono a Titulación',
                                                'Graduación',
                                                'Inscripción',
                                                'Reinscripción'
                                            ].map((prodNombre, pIdx) => (
                                                <MenuItem key={pIdx} value={prodNombre}>
                                                    {prodNombre}
                                                </MenuItem>
                                            ))
                                        )}
                                    </TextField>
                                    <TextField
                                        label="Monto ($) *"
                                        type="number"
                                        size="small"
                                        sx={{ width: 180 }}
                                        value={item.monto}
                                        onChange={(e) => handleItemChange(idx, 'monto', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {(form.items || []).length > 1 && (
                                        <IconButton color="error" size="small" onClick={() => handleRemoveItem(idx)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                size="small"
                                variant="outlined"
                                onClick={handleAddItem}
                                sx={{ textTransform: 'none', mt: 1, fontWeight: 'bold' }}
                            >
                                + Agregar otro cobro / concepto a esta ficha
                            </Button>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc', textAlign: 'center' }}>
                                <Typography variant="caption" color="textSecondary" display="block">MONTO TOTAL FICHA:</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                    ${(form.items || []).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0).toFixed(2)} MXN
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha de Vencimiento *"
                                name="fecha_vencimiento"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={form.fecha_vencimiento}
                                onChange={handleChange}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenModal(false)} color="secondary">
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleGenerarManual}
                        variant="contained"
                        color="primary"
                        disabled={saving}
                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                    >
                        {saving ? 'Generando Ficha...' : '⚡ Emitir Ficha Complementaria'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
        </WithPermission>
    );
}
