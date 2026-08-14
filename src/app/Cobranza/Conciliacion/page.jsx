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
    Tooltip
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
    ArrowForward as ArrowIcon
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
    const [resultado, setResultado] = useState(null);
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [procesandoMasivo, setProcesandoMasivo] = useState(false);
    const [cargosPendientesGlobales, setCargosPendientesGlobales] = useState([]);

    // Estado para guardar la selección de alumno por cada fila en revisión
    const [alumnoSeleccionadoPorFila, setAlumnoSeleccionadoPorFila] = useState({});
    
    // Estado para la selección múltiple de cargos (Fichas) por fila
    // Formato: { [idxFila]: [id_cargo_1, id_cargo_2] }
    const [cargosSeleccionadosPorFila, setCargosSeleccionadosPorFila] = useState({});
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
                    if (typeof window !== 'undefined') {
                        localStorage.setItem('emisor_id_predeterminado', finalIdStr);
                    }
                } else {
                    setEmisorSeleccionado('');
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
            const isSuper = typeof window !== 'undefined' && (localStorage.getItem('superUser') === 'true' || localStorage.getItem('BOD') === 'true');

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

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar el archivo');
            }

            // Inicializar las pre-selecciones de cargos para sugerencias
            const initCargosSelec = {};
            const initAlumnosSelec = {};
            if (data.pagos) {
                data.pagos.forEach((p, idx) => {
                    if (p.estado_conciliacion === 'SUGERIDO') { 
                        if (p.cargos_sugeridos) initCargosSelec[idx] = p.cargos_sugeridos; 
                        if (p.alumno_id) initAlumnosSelec[idx] = p.alumno_id.toString();
                    }
                });
            }
            setCargosSeleccionadosPorFila(initCargosSelec);
            setAlumnoSeleccionadoPorFila(initAlumnosSelec);

            setResultado(data);
            setMensajeExito(`Conciliación analizada: ${data.resumen.conciliados} sugerencias encontradas y ${data.resumen.pendientes_revision} pendientes. REVISA Y CONFIRMA para guardarlas.`);

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

    // PROCESAR ASIGNACIÓN MASIVA Y NAVEGAR DIRECTO A EMISIÓN DE FACTURAS
    const handleConfirmarConciliacionMasiva = async () => {
        if (!resultado || !resultado.pagos) return;

        const asignacionesFinales = resultado.pagos
            .map((item, idx) => {
                const alumnoId = alumnoSeleccionadoPorFila[idx] || item.alumno_id;
                const cargosSeleccionados = cargosSeleccionadosPorFila[idx] || [];
                return { item, idx, alumno_id: alumnoId, cargos_ids: cargosSeleccionados };
            })
            .filter(obj => obj.alumno_id);

        if (asignacionesFinales.length === 0) {
            router.push('/Cobranza/Facturacion');
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
                        cargos_ids: p.cargos_ids
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
                                                accept=".xlsx,.xls,.csv,.txt"
                                                onChange={handleFileChange}
                                            />
                                            <CloudUploadIcon sx={{ fontSize: 44, color: '#1976d2', mb: 1 }} />
                                            <Typography variant="body1" fontWeight="bold">
                                                {file ? file.name : 'Seleccionar extracto bancario'}
                                            </Typography>
                                            <Typography variant="caption" color="textSecondary">
                                                Formatos permitidos: .xlsx, .csv, .txt
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
                                                    <Button
                                                        variant="contained"
                                                        color="success"
                                                        startIcon={procesandoMasivo ? <CircularProgress size={18} color="inherit" /> : <FlashIcon />}
                                                        onClick={handleConfirmarConciliacionMasiva}
                                                        disabled={procesandoMasivo}
                                                        sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                                    >
                                                        {procesandoMasivo ? 'Generando Pre-Facturas...' : '⚡ Confirmar Conciliación y Generar Pre-Facturas'}
                                                    </Button>
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

                                            <Grid container spacing={2} sx={{ mb: 3 }}>
                                                <Grid item xs={4}>
                                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#e8f5e9' }}>
                                                        <Typography variant="h4" color="success.main" fontWeight="bold">
                                                            {resultado.resumen.conciliados}
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight="bold">Empatados Auto / Manual</Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#fff3e0' }}>
                                                        <Typography variant="h4" color="warning.main" fontWeight="bold">
                                                            {resultado.resumen.pendientes_revision}
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight="bold">Sin Coincidencia (Revisión)</Typography>
                                                    </Paper>
                                                </Grid>
                                                <Grid item xs={4}>
                                                    <Paper elevation={1} sx={{ p: 2, textAlign: 'center', backgroundColor: '#e3f2fd' }}>
                                                        <Typography variant="h5" color="primary.main" fontWeight="bold" sx={{ mt: 0.5 }}>
                                                            ${parseMonto(resultado.resumen.monto_total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                        </Typography>
                                                        <Typography variant="caption" fontWeight="bold">Monto Total Extracto</Typography>
                                                    </Paper>
                                                </Grid>
                                            </Grid>

                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                                Transacciones Empatadas y Pendientes de Asignación:
                                            </Typography>

                                            <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 450 }}>
                                                <Table size="small" stickyHeader>
                                                    <TableHead>
                                                        <TableRow sx={{ backgroundColor: '#1b384a' }}>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Referencia / Extracto</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Estatus Matcheo</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>Alumno Asignado / Acción Manual</TableCell>
                                                        </TableRow>
                                                    </TableHead>
                                                                                                        <TableBody>
                                                        {resultado.pagos.map((item, idx) => {
                                                            const isSugerido = item.estado_conciliacion === 'SUGERIDO';
                                                            const alumnoIdActual = alumnoSeleccionadoPorFila[idx] || item.alumno_id;
                                                            
                                                            let cargosDisponibles = [];
                                                            if (isSugerido && (!alumnoSeleccionadoPorFila[idx] || alumnoSeleccionadoPorFila[idx] === item.alumno_id.toString())) {
                                                                cargosDisponibles = item.cargos_pendientes || [];
                                                            } else if (alumnoIdActual) {
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

                                                            return (
                                                                <TableRow key={idx} sx={{ backgroundColor: isSugerido ? '#e8f5e9' : '#fff3e0' }}>
                                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                                        <Typography variant="body2" fontWeight="bold">{item.referencia_bancaria}</Typography>
                                                                        {item.descripcion && (
                                                                            <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                                                                                {item.descripcion}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                                        $${deposito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {isSugerido ? (
                                                                            <Chip
                                                                                label={item.metodo_matcheo ? `SUGERIDO (${item.metodo_matcheo})` : 'SUGERIDO'}
                                                                                color="success"
                                                                                size="small"
                                                                                icon={<CheckIcon />}
                                                                            />
                                                                        ) : (
                                                                            <Chip label="⚠️ REVISIÓN MANUAL" color="warning" size="small" icon={<WarningIcon />} />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ minWidth: 400 }}>
                                                                        <FormControl size="small" sx={{ width: '100%', mb: 1 }}>
                                                                            <InputLabel>Asignar Alumno...</InputLabel>
                                                                            <Select
                                                                                value={alumnoSeleccionadoPorFila[idx] || ''}
                                                                                label="Asignar Alumno..."
                                                                                onChange={(e) => {
                                                                                    setAlumnoSeleccionadoPorFila({
                                                                                        ...alumnoSeleccionadoPorFila,
                                                                                        [idx]: e.target.value
                                                                                    });
                                                                                    // Al cambiar de alumno, limpiamos sus cargos seleccionados
                                                                                    setCargosSeleccionadosPorFila({
                                                                                        ...cargosSeleccionadosPorFila,
                                                                                        [idx]: []
                                                                                    });
                                                                                }}
                                                                            >
                                                                                {alumnos.map(al => (
                                                                                    <MenuItem key={al.id} value={al.id.toString()}>
                                                                                        {al.nombre} {al.apellido_paterno} ({al.matricula})
                                                                                    </MenuItem>
                                                                                ))}
                                                                            </Select>
                                                                        </FormControl>

                                                                        {alumnoIdActual && (
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
                                                                                
                                                                                {saldoAFavor > 0 && seleccionadosIds.length > 0 && (
                                                                                    <Alert severity="info" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                        <Typography variant="caption" fontWeight="bold">
                                                                                            Se generará Saldo a Favor de $${saldoAFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                                        </Typography>
                                                                                    </Alert>
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
