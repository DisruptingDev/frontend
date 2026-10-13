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
                    No cuentas con los permisos necesarios (<strong>PAGOS_VER</strong> o <strong>CONCILIACION_EJECUTAR</strong>) para acceder a Conciliación Bancaria.
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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    CircularProgress,
    Alert,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Tooltip,
    Checkbox,
    FormControlLabel,
    IconButton,
    TextField,
    Autocomplete,
    InputAdornment
} from '@mui/material';
import { useRouter } from 'next/navigation';
import {
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    AccountBalance as BankIcon,
    Business as BusinessIcon,
    PersonAdd as PersonAddIcon,
    FlashOn as FlashIcon,
    Receipt as ReceiptIcon,
    ArrowForward as ArrowIcon,
    Clear as ClearIcon,
    Search as SearchIcon,
    History as HistoryIcon,
    Block as BlockIcon,
    AddCircleOutline as AddIcon
} from '@mui/icons-material';
import { getDescripcionRegimen } from '@/utils/catalogoSAT';

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

export default function ConciliacionPage() {
    const router = useRouter();
    const [banco, setBanco] = useState('GENERICO');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [alumnos, setAlumnos] = useState([]);
    const [emisores, setEmisores] = useState([]);
    const [emisorSeleccionado, setEmisorSeleccionado] = useState('');
    const [seriesDisponibles, setSeriesDisponibles] = useState([]);
    const [serieSeleccionada, setSerieSeleccionada] = useState('');
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [procesandoMasivo, setProcesandoMasivo] = useState(false);
    const [cargosPendientesGlobales, setCargosPendientesGlobales] = useState([]);

    // Filtros de búsqueda en la tabla de transacciones
    const [busquedaTabla, setBusquedaTabla] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('TODOS'); // 'TODOS' | 'FALTANTES' | 'LISTOS' | 'SIN_FICHA' | 'YA_CONCILIADOS' | 'REVISION'

    // Estado para guardar la selección de alumno por cada fila en revisión
    const [alumnoSeleccionadoPorFila, setAlumnoSeleccionadoPorFila] = useState({});
    
    // Estado para la acción en pagos con coincidencia de alumno pero sin ficha: { [idx]: 'IGNORAR' | 'CREAR_FICHA' }
    const [accionSinFichaPorFila, setAccionSinFichaPorFila] = useState({});

    // Estado para la selección múltiple de cargos (Fichas) por fila
    // Formato: { [idxFila]: [id_cargo_1, id_cargo_2] }
    const [cargosSeleccionadosPorFila, setCargosSeleccionadosPorFila] = useState({});
    
    // Estado para saber si el usuario aprobó manualmente facturar un Saldo a Favor por fila
    const [aprobarSAFPorFila, setAprobarSAFPorFila] = useState({});

    const [asignandoFilaIdx, setAsignandoFilaIdx] = useState(null);

    // Cargar Emisores y Alumnos al ingresar
    useEffect(() => {
        const fetchDataInicial = async () => {
            try {
                let grupoId = '';
                let token = '';
                if (typeof window !== 'undefined') {
                    token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
                    const storedUser = localStorage.getItem('usuario');
                    if (storedUser) {
                        try {
                            const parsed = JSON.parse(storedUser);
                            grupoId = parsed.grupo_id || parsed.grupoId || '';
                        } catch (e) {}
                    }
                    if (!grupoId) grupoId = localStorage.getItem('grupo_id') || '';
                }

                const reqHeaders = {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-grupo-id': grupoId || ''
                };

                // 1. Cargar Emisores de forma rápida desde API local con grupo_id
                const urlFact = grupoId ? `/api/cobranza/facturacion?grupo_id=${grupoId}` : '/api/cobranza/facturacion';
                const resFact = await fetch(urlFact, { headers: reqHeaders });
                const dataFact = await resFact.json();
                let emisoresList = dataFact.emisores || [];

                // Fallback a API de catálogos si no hay emisores locales
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                if (emisoresList.length === 0 && token && apiUrl) {
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 2500);
                        const resEmp = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                            headers: { 'Authorization': `Bearer ${token}` },
                            signal: controller.signal
                        });
                        clearTimeout(timeoutId);
                        if (resEmp.ok) {
                            const dataEmp = await resEmp.json();
                            if (Array.isArray(dataEmp)) {
                                emisoresList = dataEmp.map(e => ({
                                    id: (e.ID || e.id).toString(),
                                    rfc: e.Rfc || e.rfc,
                                    nombre: e.Nombre || e.nombre,
                                    regimen_fiscal: e.RegimenFiscal || e.regimen_fiscal || '601'
                                }));
                            }
                        }
                    } catch (e) {}
                }

                setEmisores(emisoresList);

                // Validar de forma estricta que idPref de localStorage corresponda a la lista de emisores autorizados
                let idPref = null;
                if (typeof window !== 'undefined') {
                    idPref = localStorage.getItem('emisor_id_predeterminado');
                }

                const existeEnLista = idPref && emisoresList.some(e => e.id.toString() === idPref.toString());
                if (!existeEnLista) {
                    idPref = null;
                }

                if (!idPref && dataFact.emisor_predeterminado_id) {
                    const emisorPredValido = emisoresList.find(e => e.id.toString() === dataFact.emisor_predeterminado_id.toString());
                    if (emisorPredValido) {
                        idPref = emisorPredValido.id;
                    }
                }
                if (!idPref && emisoresList.length > 0) {
                    const dbPred = emisoresList.find(e => e.es_predeterminado === true);
                    idPref = dbPred ? dbPred.id : emisoresList[0].id;
                }

                if (idPref) {
                    const finalIdStr = idPref.toString();
                    setEmisorSeleccionado(finalIdStr);
                    const emisorValido = emisoresList.find(e => e.id.toString() === finalIdStr);
                    if (emisorValido && emisorValido.series) {
                        setSeriesDisponibles(emisorValido.series);
                        if (emisorValido.series.length > 0) setSerieSeleccionada(emisorValido.series[0].id.toString());
                    }
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('emisor_id_predeterminado', finalIdStr);
                    }
                } else {
                    setEmisorSeleccionado('');
                    setSeriesDisponibles([]);
                    setSerieSeleccionada('');
                }

                // 2. Cargar Alumnos
                const urlAlum = grupoId ? `/api/cobranza/alumnos?grupo_id=${grupoId}` : '/api/cobranza/alumnos';
                const resAlum = await fetch(urlAlum, { headers: reqHeaders });
                const dataAlum = await resAlum.json();
                if (Array.isArray(dataAlum)) setAlumnos(dataAlum);

                // 3. Cargar Cargos Pendientes del grupo
                const urlCargos = grupoId ? `/api/cobranza/cargos?grupo_id=${grupoId}` : '/api/cobranza/cargos';
                const resCargos = await fetch(urlCargos, { headers: reqHeaders });
                const dataCargos = await resCargos.json();
                if (Array.isArray(dataCargos)) {
                    setCargosPendientesGlobales(dataCargos.filter(c => c.estatus === 'PENDIENTE' || c.estatus === 'PARCIAL'));
                }

            } catch (e) {
                console.error('Error cargando datos iniciales para conciliación:', e);
            }
        };
        fetchDataInicial();
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setError('Por favor selecciona un archivo bancario para procesar.');
            return;
        }

        setLoading(true);
        setError('');
        setMensajeExito('');
        setResultado(null);

        try {
            let grupoId = '';
            if (typeof window !== 'undefined') {
                const storedUser = localStorage.getItem('usuario');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        grupoId = parsed.grupo_id || parsed.grupoId || '';
                    } catch (e) {}
                }
                if (!grupoId) grupoId = localStorage.getItem('grupo_id') || '';
            }
            const isSuplantando = typeof window !== 'undefined' && Boolean(localStorage.getItem('usuarioSuplantado'));
            const isSuper = !isSuplantando && typeof window !== 'undefined' && (localStorage.getItem('superUser') === 'true' || localStorage.getItem('BOD') === 'true');

            const formData = new FormData();
            formData.append('file', file);
            formData.append('banco', banco);
            if (emisorSeleccionado) formData.append('emisor_id', emisorSeleccionado);
            if (grupoId) formData.append('grupo_id', grupoId);
            if (isSuper) formData.append('is_superadmin', 'true');

            const token = typeof window !== 'undefined' ? (localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '') : '';
            const response = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
                headers: {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-grupo-id': grupoId || ''
                },
                body: formData
            });

            const textResponse = await response.text();
            let data;
            try {
                data = JSON.parse(textResponse);
            } catch (jsonErr) {
                if (!response.ok) {
                    throw new Error(`Error en el servidor (${response.status}): ${textResponse.slice(0, 300) || 'No se pudo procesar la respuesta. Verifique que el archivo sea válido.'}`);
                }
                throw new Error('La respuesta del servidor no tiene un formato JSON válido.');
            }

            if (!response.ok) {
                throw new Error(data.error || data.message || `Error en el servidor (${response.status})`);
            }

            // Inicializar las pre-selecciones de cargos para sugerencias
            const initCargosSelec = {};
            const initAlumnosSelec = {};
            const initAccionSinFicha = {};
            if (data.pagos) {
                data.pagos.forEach((p, idx) => {
                    if (p.estado_conciliacion === 'SUGERIDO') { 
                        if (p.cargos_sugeridos) initCargosSelec[idx] = p.cargos_sugeridos; 
                        if (p.alumno_id) initAlumnosSelec[idx] = p.alumno_id.toString();
                    } else if (p.estado_conciliacion === 'MATCH_SIN_FICHA') {
                        // Por defecto: IGNORAR monto en esta conciliación (pospuesto hasta que tenga ficha)
                        initAccionSinFicha[idx] = 'IGNORAR';
                        if (p.alumno_id) initAlumnosSelec[idx] = p.alumno_id.toString();
                    }
                });
            }
            setCargosSeleccionadosPorFila(initCargosSelec);
            setAlumnoSeleccionadoPorFila(initAlumnosSelec);
            setAccionSinFichaPorFila(initAccionSinFicha);

            setResultado(data);
            setMensajeExito(`Conciliación analizada: ${data.resumen?.conciliados || 0} con ficha listos, ${data.resumen?.sin_ficha || 0} identificados sin ficha (pospuestos), y ${data.resumen?.pendientes_revision || 0} en revisión.`);

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error en la conciliación bancaria.');
        } finally {
            setLoading(false);
        }
    };

    // MANEJAR SELECCIÓN DE MÚLTIPLES CARGOS EN UNA FILA
    const handleCargoSelectChange = (idx, event) => {
        const { target: { value } } = event;
        setCargosSeleccionadosPorFila({
            ...cargosSeleccionadosPorFila,
            [idx]: typeof value === 'string' ? value.split(',') : value,
        });
    };

    // QUITAR PRESELECCIÓN / ASIGNACIÓN DE ALUMNO EN UNA FILA
    const handleQuitarAsignacion = (idx) => {
        setAlumnoSeleccionadoPorFila((prev) => ({
            ...prev,
            [idx]: ''
        }));
        setCargosSeleccionadosPorFila((prev) => ({
            ...prev,
            [idx]: []
        }));
        setAprobarSAFPorFila((prev) => {
            const next = { ...prev };
            delete next[idx];
            return next;
        });
        setAccionSinFichaPorFila((prev) => ({
            ...prev,
            [idx]: 'IGNORAR'
        }));
    };

    // PROCESAR ASIGNACIÓN MASIVA Y NAVEGAR DIRECTO A EMISIÓN DE FACTURAS
    const handleConfirmarConciliacionMasiva = async () => {
        if (!resultado || !resultado.pagos) return;

        const asignacionesFinales = resultado.pagos
            .map((item, idx) => {
                // 1. Si ya está conciliado previamente, se descarta para no duplicar
                if (item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado) {
                    return null;
                }

                // 2. Si es coincidencia pero sin ficha
                if (item.estado_conciliacion === 'MATCH_SIN_FICHA') {
                    const accion = accionSinFichaPorFila[idx] || 'IGNORAR';
                    // Si el usuario eligió ignorar, no se procesa ahora
                    if (accion === 'IGNORAR') {
                        return null;
                    }
                    const alumnoId = alumnoSeleccionadoPorFila[idx] || item.alumno_id;
                    if (!alumnoId) return null;
                    return { item, idx, alumno_id: alumnoId, cargos_ids: [], aprobar_saf: true };
                }

                const alumnoId = alumnoSeleccionadoPorFila[idx] !== undefined 
                    ? alumnoSeleccionadoPorFila[idx] 
                    : item.alumno_id;
                const cargosSeleccionados = cargosSeleccionadosPorFila[idx] || [];
                
                if (!alumnoId) return null;

                return { 
                    item, 
                    idx, 
                    alumno_id: alumnoId, 
                    cargos_ids: cargosSeleccionados, 
                    aprobar_saf: !!aprobarSAFPorFila[idx] 
                };
            })
            .filter(Boolean);

        if (asignacionesFinales.length === 0) {
            setError('No hay movimientos pendientes para procesar. Los registros seleccionados ya fueron conciliados previamente o fueron ignorados.');
            return;
        }

        setProcesandoMasivo(true);
        setError('');
        setMensajeExito('');

        try {
            const res = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CONFIRMAR_MASIVO',
                    emisor_id: emisorSeleccionado,
                    asignaciones: asignacionesFinales.map(p => ({
                        alumno_id: p.alumno_id,
                        monto: Number(p.item.monto),
                        fecha_pago: p.item.fecha_pago,
                        referencia_bancaria: p.item.referencia_bancaria,
                        descripcion: p.item.descripcion,
                        cargos_ids: p.cargos_ids,
                        serie_id: serieSeleccionada,
                        aprobar_saf: p.aprobar_saf
                    }))
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error en conciliación masiva');

            setMensajeExito(data.mensaje);
            setTimeout(() => {
                router.push('/Cobranza/Facturacion');
            }, 1200);
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesandoMasivo(false);
        }
    };

    const handleCambiarEmisor = async (nuevoId) => {
        setEmisorSeleccionado(nuevoId);
        const emisor = emisores.find(e => e.id.toString() === nuevoId);
        if (emisor && emisor.series) {
            setSeriesDisponibles(emisor.series);
            if (emisor.series.length > 0) {
                setSerieSeleccionada(emisor.series[0].id.toString());
            } else {
                setSerieSeleccionada('');
            }
        } else {
            setSeriesDisponibles([]);
            setSerieSeleccionada('');
        }
        if (typeof window !== 'undefined') {
            localStorage.setItem('emisor_id_predeterminado', nuevoId);
        }
        try {
            await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'SET_EMISOR_PREDETERMINADO', emisor_id: nuevoId })
            });
        } catch (e) {}
    };

    return (
        <WithPermission permission="PAGOS_VER" fallback={<AccesoDenegado />}>
            <div>
            <Header title="Conciliación Bancaria Automatizada y Asignación de Pagos" />
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
                        <Typography variant="h5" sx={{ mb: 1, fontWeight: 'bold', color: '#1b384a' }}>
                            Conciliador de Pagos, Layouts Bancarios y Pre-facturación
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                            Carga tu extracto bancario para matchear pagos automáticamente. Si un movimiento no se empató, asígnalo manualmente a un alumno de la lista.
                        </Typography>

                        {/* SELECTOR DE RAZÓN SOCIAL EMISORA */}
                        <Card elevation={2} sx={{ mb: 3, backgroundColor: '#f8fafc' }}>
                            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <BusinessIcon color="primary" sx={{ fontSize: 36 }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="emisor-concil-label">Razón Social Emisora de Pre-facturas (Módulo de Empresas)</InputLabel>
                                        <Select
                                            labelId="emisor-concil-label"
                                            value={emisorSeleccionado}
                                            label="Razón Social Emisora de Pre-facturas (Módulo de Empresas)"
                                            onChange={(e) => handleCambiarEmisor(e.target.value)}
                                        >
                                            {emisores.length === 0 ? (
                                                <MenuItem value="">Cargando Emisores autorizados...</MenuItem>
                                            ) : (
                                                emisores.map(e => (
                                                    <MenuItem key={e.id} value={e.id}>
                                                        {e.rfc} - {e.nombre} ({getDescripcionRegimen(e.regimen_fiscal || '601')})
                                                    </MenuItem>
                                                ))
                                            )}
                                        </Select>
                                    </FormControl>
                                </Box>
                            </CardContent>
                        </Card>

                            {seriesDisponibles.length > 0 && (
                                <Card elevation={2} sx={{ mb: 3, backgroundColor: '#f8fafc' }}>
                                    <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <ReceiptIcon color="secondary" sx={{ fontSize: 36 }} />
                                        <Box sx={{ flexGrow: 1 }}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel id="serie-concil-label">Serie de Facturación</InputLabel>
                                                <Select
                                                    labelId="serie-concil-label"
                                                    value={serieSeleccionada}
                                                    label="Serie de Facturación"
                                                    onChange={(e) => setSerieSeleccionada(e.target.value)}
                                                >
                                                    {seriesDisponibles.map(s => (
                                                        <MenuItem key={s.id} value={s.id.toString()}>
                                                            {s.clave} - {s.descripcion || 'Serie'}
                                                        </MenuItem>
                                                    ))}
                                                </Select>
                                            </FormControl>
                                        </Box>
                                    </CardContent>
                                </Card>
                            )}

                        {mensajeExito && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeExito('')}>{mensajeExito}</Alert>}
                        {error && <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold' }} onClose={() => setError('')}>{error}</Alert>}

                        <Grid container spacing={3}>
                            {/* Panel de Carga */}
                            <Grid item xs={12} md={4}>
                                <Card elevation={3}>
                                    <CardContent sx={{ p: 3 }}>
                                        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <BankIcon color="primary" /> Cargar Estado de Cuenta / Layout
                                        </Typography>

                                        <FormControl fullWidth sx={{ mb: 3 }} size="small">
                                            <InputLabel id="banco-select-label">Formato de Banco</InputLabel>
                                            <Select
                                                labelId="banco-select-label"
                                                value={banco}
                                                label="Formato de Banco"
                                                onChange={(e) => setBanco(e.target.value)}
                                            >
                                                <MenuItem value="GENERICO">Excel / CSV Genérico (4 Columnas)</MenuItem>
                                                <MenuItem value="BBVA">BBVA CIE / Estado de Cuenta</MenuItem>
                                                <MenuItem value="BANAMEX">Banamex Sucursal / Banca</MenuItem>
                                                <MenuItem value="SANTANDER">Santander Depósitos</MenuItem>
                                                <MenuItem value="BANORTE">Banorte Concentración</MenuItem>
                                            </Select>
                                        </FormControl>

                                        <Box
                                            sx={{
                                                border: '2px dashed #90caf9',
                                                borderRadius: 2,
                                                p: 3,
                                                textAlign: 'center',
                                                backgroundColor: '#f4f8fb',
                                                cursor: 'pointer',
                                                mb: 3
                                            }}
                                            component="label"
                                        >
                                            <input
                                                type="file"
                                                hidden
                                                accept=".xlsx,.xls,.csv,.txt,.pdf"
                                                onChange={handleFileChange}
                                            />
                                            <CloudUploadIcon sx={{ fontSize: 44, color: '#1976d2', mb: 1 }} />
                                            <Typography variant="body1" fontWeight="bold">
                                                {file ? file.name : 'Seleccionar extracto bancario'}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Formatos permitidos: .pdf, .xlsx, .csv, .txt
                                            </Typography>
                                        </Box>

                                        <Button
                                            variant="contained"
                                            color="primary"
                                            fullWidth
                                            size="large"
                                            onClick={handleUpload}
                                            disabled={loading || !file}
                                            startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <FlashIcon />}
                                            sx={{ fontWeight: 'bold', py: 1.2 }}
                                        >
                                            {loading ? 'Procesando Conciliación...' : '⚡ Ejecutar Conciliación'}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </Grid>

                            {/* Resumen y Tabla de Resultados con Asignación Manual */}
                            <Grid item xs={12} md={8}>
                                {resultado ? (
                                    <Card elevation={3}>
                                        <CardContent sx={{ p: 3 }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                                <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#1b384a' }}>
                                                    Detalle Completo de Registros del Extracto Bancario
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 1 }}>
                                                    {(() => {
                                                        const listosParaFacturar = resultado.pagos.filter((item, idx) => {
                                                            if (item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado) return false;
                                                            if (item.estado_conciliacion === 'MATCH_SIN_FICHA') {
                                                                return accionSinFichaPorFila[idx] === 'CREAR_FICHA';
                                                            }
                                                            const aid = alumnoSeleccionadoPorFila[idx] !== undefined ? alumnoSeleccionadoPorFila[idx] : item.alumno_id;
                                                            return Boolean(aid);
                                                        }).length;

                                                        return (
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={procesandoMasivo ? <CircularProgress size={18} color="inherit" /> : <FlashIcon />}
                                                                onClick={handleConfirmarConciliacionMasiva}
                                                                disabled={procesandoMasivo || listosParaFacturar === 0}
                                                                sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                                            >
                                                                {procesandoMasivo 
                                                                    ? 'Generando Pre-Facturas...' 
                                                                    : `⚡ Confirmar Conciliación (${listosParaFacturar} a Facturar)`}
                                                            </Button>
                                                        );
                                                    })()}
                                                    <Button
                                                        variant="outlined"
                                                        color="primary"
                                                        startIcon={<ReceiptIcon />}
                                                        endIcon={<ArrowIcon />}
                                                        onClick={() => router.push('/Cobranza/Facturacion')}
                                                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                                    >
                                                        Ver Pre-Facturas
                                                    </Button>
                                                </Box>
                                            </Box>

                                            {(() => {
                                                const totalListosConFicha = resultado.pagos.filter(it => it.estado_conciliacion === 'SUGERIDO').length;
                                                const totalSinFicha = resultado.pagos.filter(it => it.estado_conciliacion === 'MATCH_SIN_FICHA').length;
                                                const totalYaConciliados = resultado.pagos.filter(it => it.estado_conciliacion === 'YA_CONCILIADO' || it.ya_conciliado).length;
                                                const totalRevision = resultado.pagos.filter(it => it.estado_conciliacion === 'REVISION').length;
                                                const totalFaltantes = resultado.pagos.filter(it => it.estado_conciliacion !== 'YA_CONCILIADO' && !it.ya_conciliado).length;

                                                return (
                                                    <Grid container spacing={2} sx={{ mb: 3 }}>
                                                        <Grid item xs={12} sm={6} md={2.4}>
                                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                                                                <Typography variant="h4" color="success.main" fontWeight="bold">
                                                                    {totalListosConFicha}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight="bold" display="block">Listos con Ficha</Typography>
                                                                <Typography variant="caption" color="textSecondary">Se facturan directo</Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={2.4}>
                                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#fffde7', border: '1px solid #ffe082' }}>
                                                                <Typography variant="h4" sx={{ color: '#f57f17' }} fontWeight="bold">
                                                                    {totalSinFicha}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight="bold" display="block">Sin Ficha (Pospuestos)</Typography>
                                                                <Typography variant="caption" color="textSecondary">Ignorados por defecto</Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={2.4}>
                                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#f5f5f5', border: '1px solid #e0e0e0' }}>
                                                                <Typography variant="h4" sx={{ color: '#757575' }} fontWeight="bold">
                                                                    {totalYaConciliados}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight="bold" display="block">Ya Conciliados</Typography>
                                                                <Typography variant="caption" color="textSecondary">No se duplicarán</Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={2.4}>
                                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                                                                <Typography variant="h4" color="warning.main" fontWeight="bold">
                                                                    {totalRevision}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight="bold" display="block">Sin Alumno (Revisión)</Typography>
                                                                <Typography variant="caption" color="textSecondary">Requiere asignar</Typography>
                                                            </Paper>
                                                        </Grid>
                                                        <Grid item xs={12} sm={6} md={2.4}>
                                                            <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                                                                <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mt: 0.5 }}>
                                                                    ${parseMonto(resultado.resumen?.monto_total || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                </Typography>
                                                                <Typography variant="caption" fontWeight="bold" display="block">Monto Total Extracto</Typography>
                                                                <Typography variant="caption" color="textSecondary">{resultado.pagos.length} registros</Typography>
                                                            </Paper>
                                                        </Grid>
                                                    </Grid>
                                                );
                                            })()}

                                            <Box sx={{ mb: 2, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', justifyContent: 'space-between' }}>
                                                <Box sx={{ display: 'flex', gap: 0.8, alignItems: 'center', flexWrap: 'wrap' }}>
                                                    <Chip 
                                                        label={`Todos (${resultado.pagos.length})`}
                                                        size="small"
                                                        color={filtroEstatus === 'TODOS' ? 'primary' : 'default'}
                                                        variant={filtroEstatus === 'TODOS' ? 'filled' : 'outlined'}
                                                        onClick={() => setFiltroEstatus('TODOS')}
                                                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    />
                                                    <Chip 
                                                        label={`Faltantes (${resultado.pagos.filter(it => it.estado_conciliacion !== 'YA_CONCILIADO' && !it.ya_conciliado).length})`}
                                                        size="small"
                                                        color={filtroEstatus === 'FALTANTES' ? 'info' : 'default'}
                                                        variant={filtroEstatus === 'FALTANTES' ? 'filled' : 'outlined'}
                                                        onClick={() => setFiltroEstatus('FALTANTES')}
                                                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    />
                                                    <Chip 
                                                        label={`Listos con Ficha (${resultado.pagos.filter(it => it.estado_conciliacion === 'SUGERIDO').length})`}
                                                        size="small"
                                                        color={filtroEstatus === 'LISTOS' ? 'success' : 'default'}
                                                        variant={filtroEstatus === 'LISTOS' ? 'filled' : 'outlined'}
                                                        onClick={() => setFiltroEstatus('LISTOS')}
                                                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    />
                                                    <Chip 
                                                        label={`Sin Ficha (${resultado.pagos.filter(it => it.estado_conciliacion === 'MATCH_SIN_FICHA').length})`}
                                                        size="small"
                                                        color={filtroEstatus === 'SIN_FICHA' ? 'warning' : 'default'}
                                                        variant={filtroEstatus === 'SIN_FICHA' ? 'filled' : 'outlined'}
                                                        onClick={() => setFiltroEstatus('SIN_FICHA')}
                                                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    />
                                                    <Chip 
                                                        label={`Ya Conciliados (${resultado.pagos.filter(it => it.estado_conciliacion === 'YA_CONCILIADO' || it.ya_conciliado).length})`}
                                                        size="small"
                                                        color={filtroEstatus === 'YA_CONCILIADOS' ? 'secondary' : 'default'}
                                                        variant={filtroEstatus === 'YA_CONCILIADOS' ? 'filled' : 'outlined'}
                                                        onClick={() => setFiltroEstatus('YA_CONCILIADOS')}
                                                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    />
                                                    <Chip 
                                                        label={`Revisión (${resultado.pagos.filter(it => it.estado_conciliacion === 'REVISION').length})`}
                                                        size="small"
                                                        color={filtroEstatus === 'REVISION' ? 'error' : 'default'}
                                                        variant={filtroEstatus === 'REVISION' ? 'filled' : 'outlined'}
                                                        onClick={() => setFiltroEstatus('REVISION')}
                                                        sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                                    />
                                                </Box>

                                                <TextField
                                                    size="small"
                                                    placeholder="Buscar por nombre, matrícula o referencia..."
                                                    value={busquedaTabla}
                                                    onChange={(e) => setBusquedaTabla(e.target.value)}
                                                    sx={{ minWidth: 280 }}
                                                    InputProps={{
                                                        startAdornment: (
                                                            <InputAdornment position="start">
                                                                <SearchIcon fontSize="small" color="action" />
                                                            </InputAdornment>
                                                        ),
                                                        endAdornment: busquedaTabla ? (
                                                            <InputAdornment position="end">
                                                                <IconButton size="small" onClick={() => setBusquedaTabla('')}>
                                                                    <ClearIcon fontSize="small" />
                                                                </IconButton>
                                                            </InputAdornment>
                                                        ) : null
                                                    }}
                                                />
                                            </Box>

                                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 480 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#1b384a' }}>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Referencia / Extracto</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Estatus Matcheo</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Alumno Asignado / Acción</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                    <TableBody>
                                                        {resultado.pagos
                                                            .map((item, idx) => ({ item, idx }))
                                                            .filter(({ item, idx }) => {
                                                                const isYaConciliado = item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado;
                                                                const isMatchSinFicha = item.estado_conciliacion === 'MATCH_SIN_FICHA';
                                                                const isSugerido = item.estado_conciliacion === 'SUGERIDO';
                                                                const alumnoIdActual = alumnoSeleccionadoPorFila[idx] !== undefined 
                                                                    ? alumnoSeleccionadoPorFila[idx] 
                                                                    : (item.alumno_id ? item.alumno_id.toString() : '');
                                                                const tieneAlumno = Boolean(alumnoIdActual);

                                                                if (filtroEstatus === 'FALTANTES' && isYaConciliado) return false;
                                                                if (filtroEstatus === 'LISTOS' && !isSugerido) return false;
                                                                if (filtroEstatus === 'SIN_FICHA' && !isMatchSinFicha) return false;
                                                                if (filtroEstatus === 'YA_CONCILIADOS' && !isYaConciliado) return false;
                                                                if (filtroEstatus === 'REVISION' && (isYaConciliado || isMatchSinFicha || isSugerido)) return false;

                                                                if (busquedaTabla.trim()) {
                                                                    const q = busquedaTabla.toLowerCase().trim();
                                                                    const aluObj = alumnos.find(a => a.id.toString() === alumnoIdActual);
                                                                    const nomAlu = aluObj 
                                                                        ? `${aluObj.nombre} ${aluObj.apellido_paterno} ${aluObj.apellido_materno || ''} ${aluObj.matricula || ''}`.toLowerCase()
                                                                        : (item.alumno_nombre ? item.alumno_nombre.toLowerCase() : '');
                                                                    const ref = (item.referencia_bancaria || '').toLowerCase();
                                                                    const desc = (item.descripcion || '').toLowerCase();
                                                                    const monto = (item.monto || '').toString();

                                                                    if (!nomAlu.includes(q) && !ref.includes(q) && !desc.includes(q) && !monto.includes(q)) {
                                                                        return false;
                                                                    }
                                                                }
                                                                return true;
                                                            })
                                                            .map(({ item, idx }) => {
                                                            const isYaConciliado = item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado;
                                                            const isMatchSinFicha = item.estado_conciliacion === 'MATCH_SIN_FICHA';
                                                            const isOrigSugerido = item.estado_conciliacion === 'SUGERIDO';
                                                            const alumnoIdActual = alumnoSeleccionadoPorFila[idx] !== undefined 
                                                                ? alumnoSeleccionadoPorFila[idx] 
                                                                : (item.alumno_id ? item.alumno_id.toString() : '');
                                                            const tieneAlumno = Boolean(alumnoIdActual);
                                                            const esSugeridoActivo = isOrigSugerido && tieneAlumno && (!alumnoSeleccionadoPorFila[idx] || alumnoSeleccionadoPorFila[idx] === item.alumno_id?.toString());
                                                            const alumnoSeleccionadoObj = alumnos.find(a => a.id.toString() === alumnoIdActual?.toString()) || null;
                                                            
                                                            let cargosDisponibles = [];
                                                            if (esSugeridoActivo) {
                                                                cargosDisponibles = item.cargos_pendientes || [];
                                                            } else if (tieneAlumno) {
                                                                cargosDisponibles = cargosPendientesGlobales.filter(c => c.alumno_id.toString() === alumnoIdActual.toString());
                                                            }

                                                            const seleccionadosIds = cargosSeleccionadosPorFila[idx] || [];
                                                            
                                                            let sumaMontoCargos = 0;
                                                            seleccionadosIds.forEach(id => {
                                                                const cargo = cargosDisponibles.find(c => c.id.toString() === id.toString());
                                                                if (cargo) sumaMontoCargos += parseMonto(cargo.monto_pendiente);
                                                            });

                                                            const deposito = parseMonto(item.monto);
                                                            const saldoAFavor = Math.max(0, deposito - sumaMontoCargos);

                                                            const filaBgColor = isYaConciliado
                                                                ? '#f5f5f5'
                                                                : isMatchSinFicha
                                                                    ? '#fffde7'
                                                                    : !tieneAlumno
                                                                        ? '#fff8e1'
                                                                        : (esSugeridoActivo ? '#e8f5e9' : '#f0f7ff');

                                                            return (
                                                                <TableRow 
                                                                    key={idx} 
                                                                    sx={{ 
                                                                        backgroundColor: filaBgColor,
                                                                        opacity: isYaConciliado ? 0.85 : 1
                                                                    }}
                                                                >
                                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                                        <Typography variant="body2" fontWeight="bold">{item.referencia_bancaria}</Typography>
                                                                        {item.descripcion && (
                                                                            <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                                                                                {item.descripcion}
                                                                            </Typography>
                                                                        )}
                                                                        {item.linea && (
                                                                            <Typography variant="caption" sx={{ color: '#9e9e9e', fontSize: '0.65rem' }}>
                                                                                Fila Excel #{item.linea}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold' }}>
                                                                        {isYaConciliado ? (
                                                                            <Box>
                                                                                <Typography variant="body2" sx={{ color: '#757575', textDecoration: 'line-through' }}>
                                                                                    ${deposito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                                </Typography>
                                                                                <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold', display: 'block' }}>
                                                                                    Ya conciliado
                                                                                </Typography>
                                                                            </Box>
                                                                        ) : (
                                                                            <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                                                                                ${deposito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {isYaConciliado ? (
                                                                            <Chip
                                                                                label={item.comprobante_folio ? `YA CONCILIADO (${item.comprobante_folio})` : 'YA CONCILIADO'}
                                                                                color="default"
                                                                                size="small"
                                                                                icon={<HistoryIcon />}
                                                                                sx={{ backgroundColor: '#e0e0e0', color: '#616161', fontWeight: 'bold' }}
                                                                            />
                                                                        ) : isMatchSinFicha ? (
                                                                            <Chip
                                                                                label={accionSinFichaPorFila[idx] === 'CREAR_FICHA' ? 'MATCH SIN FICHA (A Facturar)' : 'MATCH SIN FICHA (Pospuesto)'}
                                                                                color={accionSinFichaPorFila[idx] === 'CREAR_FICHA' ? 'primary' : 'warning'}
                                                                                size="small"
                                                                                icon={<WarningIcon />}
                                                                                sx={{ fontWeight: 'bold' }}
                                                                            />
                                                                        ) : esSugeridoActivo ? (
                                                                            <Chip
                                                                                label={item.metodo_matcheo ? `SUGERIDO (${item.metodo_matcheo})` : 'SUGERIDO'}
                                                                                color="success"
                                                                                size="small"
                                                                                icon={<CheckIcon />}
                                                                            />
                                                                        ) : tieneAlumno ? (
                                                                            <Chip
                                                                                label={item.metodo_matcheo ? `IDENTIFICADO (${item.metodo_matcheo})` : 'ASIGNADO MANUAL'}
                                                                                color="info"
                                                                                size="small"
                                                                                icon={<CheckIcon />}
                                                                            />
                                                                        ) : (
                                                                            <Chip label="⚠️ REVISIÓN MANUAL" color="warning" size="small" icon={<WarningIcon />} />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ minWidth: 400 }}>
                                                                        {isYaConciliado ? (
                                                                            <Box sx={{ p: 1.2, borderRadius: 1.5, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                                                                                <Typography variant="body2" fontWeight="bold" color="#424242">
                                                                                    {item.alumno_nombre ? `${item.alumno_nombre} ${item.alumno_matricula ? `[${item.alumno_matricula}]` : ''}` : 'Registro bancario previo'}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="textSecondary" display="block">
                                                                                    {item.comprobante_folio 
                                                                                        ? `✅ Registrado previamente con Pre-Factura ${item.comprobante_folio}. Se omite para no duplicar.` 
                                                                                        : '✅ Movimiento ya registrado y conciliado previamente en el sistema.'}
                                                                                </Typography>
                                                                            </Box>
                                                                        ) : isMatchSinFicha ? (
                                                                            <Box sx={{ p: 1.5, borderRadius: 1.5, backgroundColor: '#fffde7', border: '1px solid #ffe082' }}>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1, flexWrap: 'wrap', gap: 1 }}>
                                                                                    <Box>
                                                                                        <Typography variant="caption" sx={{ color: '#b78103', fontWeight: 'bold', display: 'block' }}>
                                                                                            ALUMNO COINCIDENTE POR CLABE:
                                                                                        </Typography>
                                                                                        <Typography variant="body2" fontWeight="bold" color="#1b384a">
                                                                                            {item.alumno_nombre} {item.alumno_matricula ? `[${item.alumno_matricula}]` : ''}
                                                                                        </Typography>
                                                                                    </Box>
                                                                                    <Chip 
                                                                                        label={accionSinFichaPorFila[idx] === 'CREAR_FICHA' ? 'Opción: Crear Ficha y Facturar' : 'Opción: Pospuesto (Ignorar monto)'} 
                                                                                        color={accionSinFichaPorFila[idx] === 'CREAR_FICHA' ? 'primary' : 'default'}
                                                                                        size="small"
                                                                                        variant="filled"
                                                                                        sx={{ fontWeight: 'bold' }}
                                                                                    />
                                                                                </Box>
                                                                                <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 1.2 }}>
                                                                                    ℹ️ No tiene fichas o cargos pendientes en el sistema. Es probable que más adelante se le genere su ficha.
                                                                                </Typography>
                                                                                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                                                                    <Button
                                                                                        size="small"
                                                                                        variant={accionSinFichaPorFila[idx] !== 'CREAR_FICHA' ? 'contained' : 'outlined'}
                                                                                        color="inherit"
                                                                                        startIcon={<BlockIcon />}
                                                                                        onClick={() => setAccionSinFichaPorFila(prev => ({ ...prev, [idx]: 'IGNORAR' }))}
                                                                                        sx={{ 
                                                                                            textTransform: 'none', 
                                                                                            fontSize: '0.75rem',
                                                                                            backgroundColor: accionSinFichaPorFila[idx] !== 'CREAR_FICHA' ? '#616161' : 'transparent',
                                                                                            color: accionSinFichaPorFila[idx] !== 'CREAR_FICHA' ? '#fff' : '#616161',
                                                                                            '&:hover': {
                                                                                                backgroundColor: accionSinFichaPorFila[idx] !== 'CREAR_FICHA' ? '#424242' : '#eeeeee'
                                                                                            }
                                                                                        }}
                                                                                    >
                                                                                        🚫 Ignorar monto en esta conciliación (Pospuesto)
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="small"
                                                                                        variant={accionSinFichaPorFila[idx] === 'CREAR_FICHA' ? 'contained' : 'outlined'}
                                                                                        color="primary"
                                                                                        startIcon={<AddIcon />}
                                                                                        onClick={() => setAccionSinFichaPorFila(prev => ({ ...prev, [idx]: 'CREAR_FICHA' }))}
                                                                                        sx={{ textTransform: 'none', fontSize: '0.75rem' }}
                                                                                    >
                                                                                        ➕ Crear Ficha y Facturar ahora
                                                                                    </Button>
                                                                                </Box>
                                                                            </Box>
                                                                        ) : (
                                                                            <>
                                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                                                    <Autocomplete
                                                                                        size="small"
                                                                                        fullWidth
                                                                                        options={alumnos}
                                                                                        value={alumnoSeleccionadoObj}
                                                                                        getOptionLabel={(option) => {
                                                                                            if (!option) return '';
                                                                                            const apMat = option.apellido_materno ? ` ${option.apellido_materno}` : '';
                                                                                            const mat = option.matricula ? ` [${option.matricula}]` : '';
                                                                                            return `${option.nombre || ''} ${option.apellido_paterno || ''}${apMat}${mat}`.trim();
                                                                                        }}
                                                                                        isOptionEqualToValue={(option, val) => option?.id?.toString() === val?.id?.toString()}
                                                                                        filterOptions={(options, state) => {
                                                                                            const query = (state.inputValue || '').toLowerCase().trim();
                                                                                            if (!query) return options;
                                                                                            return options.filter(a => {
                                                                                                const fullStr = `${a.nombre || ''} ${a.apellido_paterno || ''} ${a.apellido_materno || ''} ${a.matricula || ''}`.toLowerCase();
                                                                                                return fullStr.includes(query);
                                                                                            });
                                                                                        }}
                                                                                        onChange={(event, newValue) => {
                                                                                            if (!newValue) {
                                                                                                handleQuitarAsignacion(idx);
                                                                                            } else {
                                                                                                setAlumnoSeleccionadoPorFila((prev) => ({
                                                                                                    ...prev,
                                                                                                    [idx]: newValue.id.toString()
                                                                                                }));
                                                                                                setCargosSeleccionadosPorFila((prev) => ({
                                                                                                    ...prev,
                                                                                                    [idx]: []
                                                                                                }));
                                                                                            }
                                                                                        }}
                                                                                        renderInput={(params) => (
                                                                                            <TextField
                                                                                                {...params}
                                                                                                label="Buscar y Asignar Alumno..."
                                                                                                placeholder="Escribe el nombre o matrícula..."
                                                                                                size="small"
                                                                                            />
                                                                                        )}
                                                                                        noOptionsText="Sin alumnos coincidentes"
                                                                                    />
                                                                                    {tieneAlumno && (
                                                                                        <Tooltip title="Quitar asignación / Desmarcar alumno">
                                                                                            <IconButton
                                                                                                size="small"
                                                                                                color="error"
                                                                                                onClick={() => handleQuitarAsignacion(idx)}
                                                                                                sx={{ border: '1px solid #e57373', borderRadius: 1, p: 0.8 }}
                                                                                            >
                                                                                                <ClearIcon fontSize="small" />
                                                                                            </IconButton>
                                                                                        </Tooltip>
                                                                                    )}
                                                                                </Box>

                                                                                {tieneAlumno && (
                                                                                    <Box sx={{ mt: 1, backgroundColor: '#f9f9f9', p: 1, borderRadius: 1 }}>
                                                                                        <FormControl size="small" sx={{ width: '100%', mb: 1 }}>
                                                                                            <InputLabel>Fichas / Cargos a Pagar</InputLabel>
                                                                                            <Select
                                                                                                multiple
                                                                                                value={seleccionadosIds}
                                                                                                label="Fichas / Cargos a Pagar"
                                                                                                onChange={(e) => handleCargoSelectChange(idx, e)}
                                                                                                renderValue={(selected) => (
                                                                                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                                        {selected.map((value) => {
                                                                                                            const c = cargosDisponibles.find(cd => cd.id.toString() === value.toString());
                                                                                                            return <Chip key={value} label={c ? `${c.concepto?.nombre || 'Cargo'} ($${parseMonto(c.monto_pendiente).toFixed(2)})` : value} size="small" />;
                                                                                                        })}
                                                                                                    </Box>
                                                                                                )}
                                                                                            >
                                                                                                {cargosDisponibles.map(c => (
                                                                                                    <MenuItem key={c.id} value={c.id.toString()}>
                                                                                                        {c.concepto?.nombre || 'Colegiatura'} - $${parseMonto(c.monto_pendiente).toFixed(2)} {c.codigo_ficha ? `(${c.codigo_ficha})` : ''}
                                                                                                    </MenuItem>
                                                                                                ))}
                                                                                                {cargosDisponibles.length === 0 && (
                                                                                                    <MenuItem disabled value="">El alumno no tiene cargos pendientes</MenuItem>
                                                                                                )}
                                                                                            </Select>
                                                                                        </FormControl>
                                                                                        
                                                                                        {saldoAFavor > 0 && (
                                                                                            <Box sx={{ mt: 1, p: 1, border: '1px dashed #2196f3', borderRadius: 1, backgroundColor: '#e3f2fd' }}>
                                                                                                <Alert severity="info" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                                    <Typography variant="caption" fontWeight="bold">
                                                                                                        {cargosDisponibles.length === 0 
                                                                                                            ? `No hay fichas pendientes. Se generará automáticamente una ficha por $${saldoAFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}` 
                                                                                                            : `Se detectó un excedente/Saldo a Favor de $${saldoAFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}. Se facturará y asignará automáticamente al alumno.`}
                                                                                                    </Typography>
                                                                                                </Alert>
                                                                                            </Box>
                                                                                        )}
                                                                                        {sumaMontoCargos > deposito && seleccionadosIds.length > 0 && (
                                                                                            <Alert severity="warning" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                                <Typography variant="caption">
                                                                                                    Faltarán $${(sumaMontoCargos - deposito).toLocaleString('es-MX', { minimumFractionDigits: 2 })} para liquidar fichas
                                                                                                </Typography>
                                                                                            </Alert>
                                                                                        )}
                                                                                    </Box>
                                                                                )}
                                                                            </>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>
                                                </Table>
                                            </TableContainer>
                                        </CardContent>
                                    </Card>
                                ) : (
                                    <Paper elevation={1} sx={{ p: 5, textAlign: 'center', backgroundColor: '#fafafa' }}>
                                        <BankIcon sx={{ fontSize: 64, color: '#ccc', mb: 2 }} />
                                        <Typography variant="h6" color="textSecondary">
                                            Ningún extracto bancario cargado aún.
                                        </Typography>
                                        <Typography variant="body2" color="textSecondary">
                                            Selecciona la Razón Social Emisora, el formato de tu banco y carga el archivo Excel o CSV para visualizar todas las coincidencias y asignar alumnos manualmente a las transacciones sin matcheo.
                                        </Typography>
                                    </Paper>
                                )}
                            </Grid>
                        </Grid>
                    </Box>
                </Grid>
            </Grid>
        </div>
        </WithPermission>
    );
}
