'use client';
import { useState, useEffect, useMemo } from 'react';
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
    TablePagination,
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
import {
    CloudUpload as CloudUploadIcon,
    CheckCircle as CheckIcon,
    Warning as WarningIcon,
    AccountBalance as BankIcon,
    Business as BusinessIcon,
    FlashOn as FlashIcon,
    Receipt as ReceiptIcon,
    ArrowForward as ArrowIcon,
    Clear as ClearIcon,
    Search as SearchIcon,
    FilterList as FilterIcon
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

export default function ConciliacionTab({
    emisorSeleccionado: emisorProp = '',
    emisores: emisoresProp = [],
    alumnos: alumnosProp = [],
    cargos: cargosProp = [],
    onNavigateToTab = null,
    onRefreshDashboard = null
}) {
    const [banco, setBanco] = useState('GENERICO');
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [procesandoMasivo, setProcesandoMasivo] = useState(false);

    // Listas auxiliares (con fallback si no vienen por props)
    const [emisores, setEmisores] = useState(emisoresProp);
    const [emisorSeleccionado, setEmisorSeleccionado] = useState(emisorProp);
    const [seriesDisponibles, setSeriesDisponibles] = useState([]);
    const [serieSeleccionada, setSerieSeleccionada] = useState('');
    const [alumnos, setAlumnos] = useState(alumnosProp);
    const [cargosPendientesGlobales, setCargosPendientesGlobales] = useState(cargosProp);

    // Resultado de la conciliación bancaria
    const [resultado, setResultado] = useState(null);

    // Filtros y Búsqueda en la tabla
    const [filtroEstatus, setFiltroEstatus] = useState('TODOS'); // 'TODOS' | 'LISTOS' | 'YA_CONCILIADOS' | 'REVISION'
    const [busquedaTabla, setBusquedaTabla] = useState('');

    // Paginación
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Estado de asignación indexado por CLAVE ÚNICA del movimiento (NUNCA por índice de página)
    // Clave: item.id_tmp || `${item.linea}_${item.referencia_bancaria}_${item.monto}`
    const [alumnoSeleccionadoPorClave, setAlumnoSeleccionadoPorClave] = useState({});
    const [cargosSeleccionadosPorClave, setCargosSeleccionadosPorClave] = useState({});
    const [aprobarSAFPorClave, setAprobarSAFPorClave] = useState({});

    // Sincronizar props cuando cambien
    useEffect(() => {
        if (emisoresProp && emisoresProp.length > 0) setEmisores(emisoresProp);
    }, [emisoresProp]);

    useEffect(() => {
        if (emisorProp) {
            setEmisorSeleccionado(emisorProp);
            actualizarSeries(emisorProp, emisores);
        }
    }, [emisorProp, emisores]);

    useEffect(() => {
        if (alumnosProp && alumnosProp.length > 0) setAlumnos(alumnosProp);
    }, [alumnosProp]);

    useEffect(() => {
        if (cargosProp && cargosProp.length > 0) {
            setCargosPendientesGlobales(cargosProp.filter(c => c.estatus === 'PENDIENTE' || c.estatus === 'PARCIAL'));
        }
    }, [cargosProp]);

    const actualizarSeries = (emisorId, listaEmisores) => {
        const em = (listaEmisores || []).find(e => e.id.toString() === emisorId.toString());
        if (em && em.series && em.series.length > 0) {
            setSeriesDisponibles(em.series);
            setSerieSeleccionada(em.series[0].id.toString());
        } else {
            setSeriesDisponibles([]);
            setSerieSeleccionada('');
        }
    };

    // Cargar datos complementarios si no vienen por props
    useEffect(() => {
        const cargarDatosFaltantes = async () => {
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

            // 1. Alumnos si faltan
            if (alumnos.length === 0) {
                try {
                    const urlAlum = grupoId ? `/api/cobranza/alumnos?grupo_id=${grupoId}` : '/api/cobranza/alumnos';
                    const resAlum = await fetch(urlAlum, { headers: reqHeaders });
                    const dataAlum = await resAlum.json();
                    if (Array.isArray(dataAlum)) setAlumnos(dataAlum);
                } catch (e) {
                    console.error('Error cargando alumnos en ConciliacionTab:', e);
                }
            }

            // 2. Cargos si faltan
            if (cargosPendientesGlobales.length === 0) {
                try {
                    const urlCargos = grupoId ? `/api/cobranza/cargos?estatus=TODOS&grupo_id=${grupoId}` : '/api/cobranza/cargos?estatus=TODOS';
                    const resCargos = await fetch(urlCargos, { headers: reqHeaders });
                    const dataCargos = await resCargos.json();
                    if (Array.isArray(dataCargos)) {
                        setCargosPendientesGlobales(dataCargos.filter(c => c.estatus === 'PENDIENTE' || c.estatus === 'PARCIAL'));
                    }
                } catch (e) {
                    console.error('Error cargando cargos en ConciliacionTab:', e);
                }
            }
        };

        cargarDatosFaltantes();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setError('');
        }
    };

    // Función auxiliar para obtener la clave única e inmutable de un movimiento bancario
    const getPagoKey = (item, indexFallback) => {
        if (item.id_tmp) return String(item.id_tmp);
        if (item.linea !== undefined && item.referencia_bancaria) {
            return `lin_${item.linea}_ref_${item.referencia_bancaria}_m_${item.monto}`;
        }
        return `mov_idx_${indexFallback}_ref_${item.referencia_bancaria || 'sinref'}_m_${item.monto}`;
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
        setPage(0);

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

            const response = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
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

            // Inicializar las pre-selecciones por CLAVE ÚNICA del movimiento
            const initCargosSelec = {};
            const initAlumnosSelec = {};
            if (data.pagos) {
                data.pagos.forEach((p, idx) => {
                    const key = getPagoKey(p, idx);
                    if (p.estado_conciliacion === 'SUGERIDO') {
                        if (p.cargos_sugeridos) initCargosSelec[key] = p.cargos_sugeridos;
                        if (p.alumno_id) initAlumnosSelec[key] = p.alumno_id.toString();
                    }
                });
            }
            setCargosSeleccionadosPorClave(initCargosSelec);
            setAlumnoSeleccionadoPorClave(initAlumnosSelec);
            setAprobarSAFPorClave({});

            setResultado(data);
            setMensajeExito(data.mensaje || `Conciliación completada con éxito.`);

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error en la conciliación bancaria.');
        } finally {
            setLoading(false);
        }
    };

    // Cambiar los cargos seleccionados para un movimiento específico
    const handleCargoSelectChange = (key, event) => {
        const { target: { value } } = event;
        setCargosSeleccionadosPorClave(prev => ({
            ...prev,
            [key]: typeof value === 'string' ? value.split(',') : value,
        }));
    };

    // Quitar asignación manual de un movimiento
    const handleQuitarAsignacion = (key) => {
        setAlumnoSeleccionadoPorClave(prev => ({
            ...prev,
            [key]: ''
        }));
        setCargosSeleccionadosPorClave(prev => ({
            ...prev,
            [key]: []
        }));
        setAprobarSAFPorClave(prev => {
            const next = { ...prev };
            delete next[key];
            return next;
        });
    };

    // Confirmación masiva de movimientos listos
    const handleConfirmarConciliacionMasiva = async () => {
        if (!resultado || !resultado.pagos) return;

        const asignacionesFinales = resultado.pagos
            .map((item, idx) => {
                const isYaConciliado = item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado;
                if (isYaConciliado) return null;

                const key = getPagoKey(item, idx);
                const asignacionManual = alumnoSeleccionadoPorClave[key];
                const alumnoId = asignacionManual !== undefined
                    ? asignacionManual
                    : (item.estado_conciliacion === 'SUGERIDO' ? (item.alumno_id ? item.alumno_id.toString() : null) : null);

                if (!alumnoId) return null;

                const cargosSeleccionados = cargosSeleccionadosPorClave[key] || item.cargos_sugeridos || [];

                return {
                    item,
                    idx,
                    key,
                    alumno_id: alumnoId,
                    cargos_ids: cargosSeleccionados,
                    serie_id: serieSeleccionada,
                    aprobar_saf: !!aprobarSAFPorClave[key]
                };
            })
            .filter(Boolean);

        if (asignacionesFinales.length === 0) {
            setError('No hay movimientos pendientes para procesar. Asigne un alumno a los movimientos en revisión o seleccione fichas pendientes.');
            return;
        }

        setProcesandoMasivo(true);
        setError('');
        setMensajeExito('');

        try {
            let grupoId = '';
            let token = '';
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
                const storedUser = localStorage.getItem('usuario') || localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const parsed = JSON.parse(storedUser);
                        grupoId = parsed.grupo_id || parsed.grupoId || parsed.GrupoID || '';
                    } catch (e) {}
                }
                if (!grupoId) grupoId = localStorage.getItem('grupo_id') || '';
            }

            let finalEmisorId = emisorSeleccionado || emisorProp;
            if (!finalEmisorId && typeof window !== 'undefined') {
                finalEmisorId = localStorage.getItem('emisor_id_predeterminado') || '';
            }
            if (!finalEmisorId && emisores && emisores.length > 0) {
                finalEmisorId = emisores[0].id ? emisores[0].id.toString() : '';
            }

            const response = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-grupo-id': grupoId || ''
                },
                body: JSON.stringify({
                    action: 'CONFIRMAR_MASIVO',
                    emisor_id: finalEmisorId,
                    grupo_id: grupoId || undefined,
                    asignaciones: asignacionesFinales.map(p => ({
                        alumno_id: p.alumno_id,
                        monto: Number(p.item.monto),
                        fecha_pago: p.item.fecha_pago,
                        referencia_bancaria: p.item.referencia_bancaria,
                        descripcion: p.item.descripcion,
                        cargos_ids: p.cargos_ids,
                        serie_id: p.serie_id || serieSeleccionada,
                        aprobar_saf: p.aprobar_saf
                    }))
                })
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error en conciliación masiva');

            if (!data.total_procesados || data.total_procesados === 0) {
                const detalleErrores = data.errores && data.errores.length > 0
                    ? data.errores.join(' | ')
                    : 'No se generaron facturas ni pre-facturas para los movimientos seleccionados.';
                throw new Error(detalleErrores);
            }

            setMensajeExito(data.mensaje || `Se procesaron ${data.total_procesados} movimientos exitosamente y se generaron sus pre-facturas.`);
            if (onRefreshDashboard) onRefreshDashboard();

            // Navegar a pestaña Facturación si está disponible el handler
            setTimeout(() => {
                if (onNavigateToTab) {
                    onNavigateToTab(4); // Tab Facturación CFDI
                }
            }, 1200);

        } catch (err) {
            setError(err.message || 'Error en conciliación masiva.');
        } finally {
            setProcesandoMasivo(false);
        }
    };

    // LISTADO FILTRADO Y PAGINADO
    const pagosFiltrados = useMemo(() => {
        if (!resultado || !resultado.pagos) return [];

        return resultado.pagos
            .map((item, originalIndex) => ({
                item,
                originalIndex,
                key: getPagoKey(item, originalIndex)
            }))
            .filter(({ item, key }) => {
                const isYaConciliado = item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado;
                const isSugerido = item.estado_conciliacion === 'SUGERIDO';
                const asignacionManual = alumnoSeleccionadoPorClave[key];
                const alumnoIdActual = asignacionManual !== undefined
                    ? asignacionManual
                    : (isSugerido ? (item.alumno_id ? item.alumno_id.toString() : '') : '');

                // Filtro de Estatus
                if (filtroEstatus === 'LISTOS' && !isSugerido && !asignacionManual) return false;
                if (filtroEstatus === 'YA_CONCILIADOS' && !isYaConciliado) return false;
                if (filtroEstatus === 'REVISION' && (isYaConciliado || isSugerido || asignacionManual)) return false;

                // Filtro de Búsqueda en Vivo
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
            });
    }, [resultado, filtroEstatus, busquedaTabla, alumnoSeleccionadoPorClave, alumnos]);

    // Resumen de conteos
    const conteos = useMemo(() => {
        if (!resultado || !resultado.pagos) return { total: 0, sugeridos: 0, yaConciliados: 0, revision: 0, listosParaFacturar: 0 };
        const total = resultado.pagos.length;
        const yaConciliados = resultado.pagos.filter(it => it.estado_conciliacion === 'YA_CONCILIADO' || it.ya_conciliado).length;
        const sugeridos = resultado.pagos.filter(it => it.estado_conciliacion === 'SUGERIDO').length;
        const revision = resultado.pagos.filter(it => it.estado_conciliacion === 'REVISION').length;

        // Listos para facturar = no conciliados previamente y que tengan alumno asignado (sugerido o manual)
        let listos = 0;
        resultado.pagos.forEach((item, idx) => {
            if (item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado) return;
            const key = getPagoKey(item, idx);
            const manual = alumnoSeleccionadoPorClave[key];
            const aid = manual !== undefined ? manual : (item.estado_conciliacion === 'SUGERIDO' ? item.alumno_id : null);
            if (aid) listos++;
        });

        return { total, sugeridos, yaConciliados, revision, listosParaFacturar: listos };
    }, [resultado, alumnoSeleccionadoPorClave]);

    return (
        <Box>
            {/* ALERTAS GLOBALES */}
            {error && (
                <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
                    {error}
                </Alert>
            )}
            {mensajeExito && (
                <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeExito('')}>
                    {mensajeExito}
                </Alert>
            )}

            {/* CARD DE SUBIDA Y PARÁMETROS */}
            <Card elevation={2} sx={{ mb: 3, p: 2.5, backgroundColor: '#ffffff', borderRadius: 2 }}>
                <Typography variant="h6" fontWeight="bold" sx={{ mb: 1, color: '#1b384a', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BankIcon color="primary" /> Carga de Extracto Bancario y Parámetros
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2.5 }}>
                    Sube el archivo Excel, CSV, TXT o PDF de tu cuenta bancaria para emparejar automáticamente los depósitos con fichas creadas de alumnos por Referencia Bancaria, Código de Ficha o CLABE de 18 dígitos.
                </Typography>

                <Grid container spacing={2} alignItems="center">
                    {/* Selector de Banco */}
                    <Grid item xs={12} sm={4}>
                        <FormControl fullWidth size="small">
                            <InputLabel id="banco-select-label">Banco Origen / Formato</InputLabel>
                            <Select
                                labelId="banco-select-label"
                                value={banco}
                                label="Banco Origen / Formato"
                                onChange={(e) => setBanco(e.target.value)}
                            >
                                <MenuItem value="GENERICO">Excel / CSV Genérico</MenuItem>
                                <MenuItem value="BBVA">BBVA CIE / Estado de Cuenta</MenuItem>
                                <MenuItem value="BANAMEX">Banamex Sucursal / Banca</MenuItem>
                                <MenuItem value="BANORTE">Banorte Concentración</MenuItem>
                                <MenuItem value="SANTANDER">Santander Depósitos</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>

                    {/* Botón Selección de Archivo */}
                    <Grid item xs={12} sm={5}>
                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            startIcon={<CloudUploadIcon />}
                            sx={{
                                textTransform: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                py: 0.9
                            }}
                        >
                            {file ? file.name : 'Seleccionar archivo (.xlsx, .csv, .pdf)'}
                            <input
                                type="file"
                                hidden
                                accept=".xlsx,.xls,.csv,.txt,.pdf"
                                onChange={handleFileChange}
                            />
                        </Button>
                    </Grid>

                    {/* Botón Ejecutar */}
                    <Grid item xs={12} sm={3}>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            disabled={loading || !file}
                            onClick={handleUpload}
                            startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <FlashIcon />}
                            sx={{ fontWeight: 'bold', py: 0.9 }}
                        >
                            {loading ? 'Procesando...' : '⚡ Ejecutar Conciliación'}
                        </Button>
                    </Grid>
                </Grid>
            </Card>

            {/* RESULTADOS DE LA CONCILIACIÓN */}
            {resultado && resultado.pagos && (
                <Card elevation={3} sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2.5 }}>
                        {/* ENCABEZADO Y ACCIONES PRINCIPALES */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" sx={{ color: '#1b384a' }}>
                                    Resultado de Conciliación Bancaria
                                </Typography>
                                <Typography variant="caption" color="textSecondary">
                                    Total de movimientos analizados: {conteos.total} | Monto acumulado: ${parseMonto(resultado.resumen?.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={procesandoMasivo ? <CircularProgress size={18} color="inherit" /> : <FlashIcon />}
                                    onClick={handleConfirmarConciliacionMasiva}
                                    disabled={procesandoMasivo || conteos.listosParaFacturar === 0}
                                    sx={{ fontWeight: 'bold', textTransform: 'none', px: 2 }}
                                >
                                    {procesandoMasivo
                                        ? 'Generando Pre-Facturas...'
                                        : `⚡ Confirmar Conciliación (${conteos.listosParaFacturar} a Facturar)`}
                                </Button>

                                {onNavigateToTab && (
                                    <Button
                                        variant="outlined"
                                        color="primary"
                                        startIcon={<ReceiptIcon />}
                                        endIcon={<ArrowIcon />}
                                        onClick={() => onNavigateToTab(4)}
                                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                    >
                                        Ver Facturación CFDI
                                    </Button>
                                )}
                            </Box>
                        </Box>

                        {/* BARRA DE FILTROS Y BÚSQUEDA */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1.5 }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                <Chip
                                    label={`Todos (${conteos.total})`}
                                    size="small"
                                    color={filtroEstatus === 'TODOS' ? 'primary' : 'default'}
                                    variant={filtroEstatus === 'TODOS' ? 'filled' : 'outlined'}
                                    onClick={() => { setFiltroEstatus('TODOS'); setPage(0); }}
                                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                />
                                <Chip
                                    label={`Listos con Ficha (${conteos.sugeridos})`}
                                    size="small"
                                    color={filtroEstatus === 'LISTOS' ? 'success' : 'default'}
                                    variant={filtroEstatus === 'LISTOS' ? 'filled' : 'outlined'}
                                    onClick={() => { setFiltroEstatus('LISTOS'); setPage(0); }}
                                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                />
                                <Chip
                                    label={`Ya Conciliados (${conteos.yaConciliados})`}
                                    size="small"
                                    color={filtroEstatus === 'YA_CONCILIADOS' ? 'secondary' : 'default'}
                                    variant={filtroEstatus === 'YA_CONCILIADOS' ? 'filled' : 'outlined'}
                                    onClick={() => { setFiltroEstatus('YA_CONCILIADOS'); setPage(0); }}
                                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                />
                                <Chip
                                    label={`En Revisión / Sin Matchear (${conteos.revision})`}
                                    size="small"
                                    color={filtroEstatus === 'REVISION' ? 'warning' : 'default'}
                                    variant={filtroEstatus === 'REVISION' ? 'filled' : 'outlined'}
                                    onClick={() => { setFiltroEstatus('REVISION'); setPage(0); }}
                                    sx={{ cursor: 'pointer', fontWeight: 'bold' }}
                                />
                            </Box>

                            <TextField
                                size="small"
                                placeholder="Buscar por alumno, matrícula o referencia..."
                                value={busquedaTabla}
                                onChange={(e) => { setBusquedaTabla(e.target.value); setPage(0); }}
                                sx={{ minWidth: 280 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon fontSize="small" color="action" />
                                        </InputAdornment>
                                    ),
                                    endAdornment: busquedaTabla ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => { setBusquedaTabla(''); setPage(0); }}>
                                                <ClearIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                        </Box>

                        {/* TABLA DE MOVIMIENTOS BANCARIOS */}
                        <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 520, borderRadius: 1.5 }}>
                            <Table size="small" stickyHeader>
                                <TableHead>
                                    <TableRow sx={{ '& th': { backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' } }}>
                                        <TableCell sx={{ minWidth: 200 }}>Referencia / Extracto</TableCell>
                                        <TableCell sx={{ minWidth: 120 }}>Monto</TableCell>
                                        <TableCell sx={{ minWidth: 150 }}>Estatus Matcheo</TableCell>
                                        <TableCell sx={{ minWidth: 380 }}>Alumno Asignado / Fichas a Pagar</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {pagosFiltrados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                                No se encontraron movimientos con los filtros aplicados.
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        pagosFiltrados
                                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                            .map(({ item, originalIndex, key }) => {
                                                const isYaConciliado = item.estado_conciliacion === 'YA_CONCILIADO' || item.ya_conciliado;
                                                const isSugerido = item.estado_conciliacion === 'SUGERIDO';

                                                // Resolver alumno id actual por clave única
                                                const asignacionManual = alumnoSeleccionadoPorClave[key];
                                                const alumnoIdActual = asignacionManual !== undefined
                                                    ? asignacionManual
                                                    : (isSugerido ? (item.alumno_id ? item.alumno_id.toString() : '') : '');

                                                const alumnoSeleccionadoObj = alumnos.find(a => a.id.toString() === alumnoIdActual) || null;

                                                // Resolver cargos disponibles para este alumno
                                                const cargosDelAlumno = alumnoSeleccionadoObj
                                                    ? cargosPendientesGlobales.filter(c => String(c.alumno_id) === String(alumnoSeleccionadoObj.id))
                                                    : [];
                                                const cargosDisponibles = (item.cargos_pendientes && item.cargos_pendientes.length > 0)
                                                    ? item.cargos_pendientes
                                                    : cargosDelAlumno;

                                                const seleccionadosIds = cargosSeleccionadosPorClave[key] !== undefined
                                                    ? cargosSeleccionadosPorClave[key]
                                                    : (item.cargos_sugeridos || (cargosDisponibles.length > 0 ? [cargosDisponibles[0].id.toString()] : []));

                                                const deposito = parseMonto(item.monto);
                                                const sumaMontoCargos = seleccionadosIds.reduce((sum, cid) => {
                                                    const cg = cargosDisponibles.find(cd => cd.id.toString() === cid.toString());
                                                    return sum + (cg ? parseMonto(cg.monto_pendiente) : 0);
                                                }, 0);

                                                const saldoAFavor = Math.max(0, deposito - sumaMontoCargos);

                                                // Color de fondo de fila
                                                const rowBg = isYaConciliado
                                                    ? '#f5f5f5'
                                                    : (alumnoIdActual ? '#f0fdf4' : '#fffbeb');

                                                return (
                                                    <TableRow key={key} sx={{ backgroundColor: rowBg, '&:hover': { opacity: 0.95 } }}>
                                                        {/* Columna 1: Referencia y Fecha */}
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                                {item.referencia_bancaria}
                                                            </Typography>
                                                            {item.fecha_pago && (
                                                                <Typography variant="caption" color="textSecondary" display="block">
                                                                    📅 {new Date(item.fecha_pago).toLocaleDateString('es-MX')}
                                                                </Typography>
                                                            )}
                                                            {item.descripcion && (
                                                                <Typography variant="caption" color="textSecondary" display="block" sx={{ maxWidth: 220, wordBreak: 'break-word' }}>
                                                                    {item.descripcion}
                                                                </Typography>
                                                            )}
                                                        </TableCell>

                                                        {/* Columna 2: Monto */}
                                                        <TableCell sx={{ fontWeight: 'bold', color: 'primary.main', fontSize: '0.95rem' }}>
                                                            ${deposito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </TableCell>

                                                        {/* Columna 3: Estatus Matcheo */}
                                                        <TableCell>
                                                            {isYaConciliado ? (
                                                                <Chip
                                                                    label={item.comprobante_folio ? `CONCILIADO (${item.comprobante_folio})` : 'YA CONCILIADO'}
                                                                    color="secondary"
                                                                    size="small"
                                                                    icon={<CheckIcon />}
                                                                />
                                                            ) : isSugerido ? (
                                                                <Chip
                                                                    label={item.metodo_matcheo ? `SUGERIDO (${item.metodo_matcheo})` : 'SUGERIDO'}
                                                                    color="success"
                                                                    size="small"
                                                                    icon={<CheckIcon />}
                                                                />
                                                            ) : alumnoIdActual ? (
                                                                <Chip
                                                                    label="ASIGNADO MANUAL"
                                                                    color="info"
                                                                    size="small"
                                                                    icon={<CheckIcon />}
                                                                />
                                                            ) : (
                                                                <Chip
                                                                    label="⚠️ SIN MATCHEAR"
                                                                    color="warning"
                                                                    size="small"
                                                                    icon={<WarningIcon />}
                                                                />
                                                            )}
                                                        </TableCell>

                                                        {/* Columna 4: Alumno Asignado y Selección de Fichas */}
                                                        <TableCell>
                                                            {isYaConciliado ? (
                                                                <Box sx={{ p: 1, borderRadius: 1, backgroundColor: '#ffffff', border: '1px solid #e0e0e0' }}>
                                                                    <Typography variant="body2" fontWeight="bold" color="#424242">
                                                                        {item.alumno_nombre ? `${item.alumno_nombre} ${item.alumno_matricula ? `[${item.alumno_matricula}]` : ''}` : 'Registro bancario previo'}
                                                                    </Typography>
                                                                    <Typography variant="caption" color="textSecondary" display="block">
                                                                        {item.comprobante_folio
                                                                            ? `✅ Registrado previamente con Pre-Factura ${item.comprobante_folio}. Se omite para no duplicar.`
                                                                            : '✅ Depósito registrado previamente en el sistema.'}
                                                                    </Typography>
                                                                </Box>
                                                            ) : (
                                                                <Box>
                                                                    {/* Selector Autocomplete de Alumno */}
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
                                                                                    handleQuitarAsignacion(key);
                                                                                } else {
                                                                                    setAlumnoSeleccionadoPorClave(prev => ({
                                                                                        ...prev,
                                                                                        [key]: newValue.id.toString()
                                                                                    }));
                                                                                    setCargosSeleccionadosPorClave(prev => ({
                                                                                        ...prev,
                                                                                        [key]: []
                                                                                    }));
                                                                                }
                                                                            }}
                                                                            renderInput={(params) => (
                                                                                <TextField
                                                                                    {...params}
                                                                                    placeholder="Buscar y asignar alumno..."
                                                                                    error={!alumnoIdActual}
                                                                                />
                                                                            )}
                                                                            noOptionsText="No se encontraron alumnos"
                                                                        />

                                                                        {alumnoIdActual && (
                                                                            <Tooltip title="Desasignar alumno">
                                                                                <IconButton size="small" color="error" onClick={() => handleQuitarAsignacion(key)}>
                                                                                    <ClearIcon fontSize="small" />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        )}
                                                                    </Box>

                                                                    {/* Desglose de Fichas/Cargos si hay un alumno asignado */}
                                                                    {alumnoIdActual && (
                                                                        <Box sx={{ p: 1, backgroundColor: '#ffffff', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                                                            <FormControl fullWidth size="small">
                                                                                <InputLabel id={`cargos-label-${key}`}>Fichas / Cargos a Liquidar</InputLabel>
                                                                                <Select
                                                                                    labelId={`cargos-label-${key}`}
                                                                                    multiple
                                                                                    value={seleccionadosIds}
                                                                                    label="Fichas / Cargos a Liquidar"
                                                                                    onChange={(e) => handleCargoSelectChange(key, e)}
                                                                                    renderValue={(selected) => (
                                                                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                            {selected.map((cid) => {
                                                                                                const cg = cargosDisponibles.find(c => c.id.toString() === cid.toString());
                                                                                                return (
                                                                                                    <Chip
                                                                                                        key={cid}
                                                                                                        label={cg ? `${cg.concepto?.nombre || cg.descripcion || 'Ficha'} ($${parseMonto(cg.monto_pendiente).toFixed(2)})` : cid}
                                                                                                        size="small"
                                                                                                    />
                                                                                                );
                                                                                            })}
                                                                                        </Box>
                                                                                    )}
                                                                                >
                                                                                    {cargosDisponibles.map(c => (
                                                                                        <MenuItem key={c.id} value={c.id.toString()}>
                                                                                            {c.concepto?.nombre || c.descripcion || 'Colegiatura'} - ${parseMonto(c.monto_pendiente).toFixed(2)} {c.codigo_ficha ? `(${c.codigo_ficha})` : ''}
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                    {cargosDisponibles.length === 0 && (
                                                                                        <MenuItem disabled value="">El alumno no tiene cargos pendientes creados</MenuItem>
                                                                                    )}
                                                                                </Select>
                                                                            </FormControl>

                                                                            {/* Notificación de Saldo a Favor si el depósito excede los cargos */}
                                                                            {saldoAFavor > 0 && (
                                                                                <Alert severity="info" sx={{ mt: 1, py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                    <Typography variant="caption" fontWeight="bold">
                                                                                        {cargosDisponibles.length === 0
                                                                                            ? `No hay fichas pendientes. Se creará automáticamente ficha y prefactura por $${saldoAFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`
                                                                                            : `Excedente detectado: Saldo a Favor de $${saldoAFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}.`}
                                                                                    </Typography>
                                                                                </Alert>
                                                                            )}

                                                                            {sumaMontoCargos > deposito && seleccionadosIds.length > 0 && (
                                                                                <Alert severity="warning" sx={{ mt: 1, py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                    <Typography variant="caption">
                                                                                        Faltarán ${(sumaMontoCargos - deposito).toLocaleString('es-MX', { minimumFractionDigits: 2 })} para liquidar todas las fichas seleccionadas.
                                                                                    </Typography>
                                                                                </Alert>
                                                                            )}
                                                                        </Box>
                                                                    )}
                                                                </Box>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* PAGINACIÓN CONTROLADA SIN DESFASES */}
                        <TablePagination
                            rowsPerPageOptions={[10, 25, 50, 100]}
                            component="div"
                            count={pagosFiltrados.length}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            onPageChange={(e, newPage) => setPage(newPage)}
                            onRowsPerPageChange={(e) => {
                                setRowsPerPage(parseInt(e.target.value, 10));
                                setPage(0);
                            }}
                            labelRowsPerPage="Filas por página:"
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
                        />
                    </CardContent>
                </Card>
            )}
        </Box>
    );
}
