'use client';
import { useState, useEffect } from 'react';
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

    // Estado para guardar la selección de alumno por cada fila en revisión
    const [alumnoSeleccionadoPorFila, setAlumnoSeleccionadoPorFila] = useState({});
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
                            grupoId = parsed.grupo_id || '';
                        } catch (e) {}
                    }
                    if (!grupoId) grupoId = localStorage.getItem('grupo_id') || '';
                }

                // 1. Cargar Emisores desde el Módulo de Empresas
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
                let emisoresList = [];

                if (token && apiUrl) {
                    try {
                        const resEmp = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                            headers: { 'Authorization': `Bearer ${token}` }
                        });
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
                    } catch (e) {
                        console.log('Error cargando empresas:', e.message);
                    }
                }

                if (emisoresList.length === 0) {
                    const resFact = await fetch('/api/cobranza/facturacion');
                    const dataFact = await resFact.json();
                    if (dataFact.emisores && Array.isArray(dataFact.emisores)) {
                        emisoresList = dataFact.emisores;
                    }
                }

                setEmisores(emisoresList);
                if (emisoresList.length > 0 && !emisorSeleccionado) {
                    setEmisorSeleccionado(emisoresList[0].id);
                }

                // 2. Cargar Alumnos
                const urlAlum = grupoId ? `/api/cobranza/alumnos?grupo_id=${grupoId}` : '/api/cobranza/alumnos';
                const resAlum = await fetch(urlAlum);
                const dataAlum = await resAlum.json();
                if (Array.isArray(dataAlum)) setAlumnos(dataAlum);

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
            const formData = new FormData();
            formData.append('file', file);
            formData.append('banco', banco);
            if (emisorSeleccionado) formData.append('emisor_id', emisorSeleccionado);

            const response = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al procesar el archivo');
            }

            setResultado(data);
            setMensajeExito(`Conciliación completada: ${data.resumen.conciliados} movimientos matcheados automáticamente y ${data.resumen.pendientes_revision} pendientes de asignar.`);

        } catch (err) {
            console.error(err);
            setError(err.message || 'Error en la conciliación bancaria.');
        } finally {
            setLoading(false);
        }
    };

    // ASIGNACIÓN MANUAL DE UN MOVIMIENTO SIN MATCH A UN ALUMNO
    const handleAsignarAlumnoManual = async (item, idx) => {
        const alumnoId = alumnoSeleccionadoPorFila[idx];
        if (!alumnoId) {
            setError(`Por favor selecciona un alumno de la lista para el movimiento de $${Number(item.monto).toFixed(2)}.`);
            return;
        }

        setAsignandoFilaIdx(idx);
        setError('');
        setMensajeExito('');

        try {
            const res = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ASIGNAR_MANUAL',
                    alumno_id: alumnoId,
                    emisor_id: emisorSeleccionado,
                    monto: Number(item.monto),
                    fecha_pago: item.fecha_pago,
                    referencia_bancaria: item.referencia_bancaria,
                    descripcion: item.descripcion
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al asignar alumno');

            setMensajeExito(data.mensaje);

            // Actualizar la lista local del resultado para reflejar el matcheo inmediatamente
            if (resultado && resultado.pagos) {
                const nuevosPagos = [...resultado.pagos];
                nuevosPagos[idx] = {
                    ...nuevosPagos[idx],
                    estado_conciliacion: 'CONCILIADO',
                    alumno_nombre: data.alumno_nombre,
                    metodo_matcheo: 'Asignación Manual',
                    comprobante_folio: data.comprobante_folio
                };

                const nuevosConciliados = (resultado.resumen?.conciliados || 0) + 1;
                const nuevosPendientes = Math.max(0, (resultado.resumen?.pendientes_revision || 0) - 1);

                setResultado({
                    ...resultado,
                    resumen: {
                        ...resultado.resumen,
                        conciliados: nuevosConciliados,
                        pendientes_revision: nuevosPendientes
                    },
                    pagos: nuevosPagos
                });
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setAsignandoFilaIdx(null);
        }
    };

    // PROCESAR ASIGNACIÓN MASIVA Y NAVEGAR DIRECTO A EMISIÓN DE FACTURAS
    const handleConfirmarConciliacionMasiva = async () => {
        if (!resultado || !resultado.pagos) return;

        const pendientesAsignados = resultado.pagos
            .map((item, idx) => ({ item, idx, alumno_id: alumnoSeleccionadoPorFila[idx] }))
            .filter(obj => obj.item.estado_conciliacion !== 'CONCILIADO' && obj.alumno_id);

        if (pendientesAsignados.length === 0) {
            // Si ya no hay pendientes asignados, ir directo al módulo de pre-facturación
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
                    asignaciones: pendientesAsignados.map(p => ({
                        alumno_id: p.alumno_id,
                        monto: Number(p.item.monto),
                        fecha_pago: p.item.fecha_pago,
                        referencia_bancaria: p.item.referencia_bancaria,
                        descripcion: p.item.descripcion
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

    return (
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
                                            onChange={(e) => setEmisorSeleccionado(e.target.value)}
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
                                                        {resultado.pagos.map((item, idx) => (
                                                            <TableRow key={idx} hover selected={item.estado_conciliacion === 'REVISION'}>
                                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                                    <Typography variant="body2" fontWeight="bold">{item.referencia_bancaria}</Typography>
                                                                    {item.descripcion && (
                                                                        <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                                                                            {item.descripcion}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                                    ${parseMonto(item.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.estado_conciliacion === 'CONCILIADO' ? (
                                                                        <Chip
                                                                            label={item.metodo_matcheo ? `CONCILIADO (${item.metodo_matcheo})` : 'CONCILIADO'}
                                                                            color="success"
                                                                            size="small"
                                                                            icon={<CheckIcon />}
                                                                        />
                                                                    ) : (
                                                                        <Chip label="⚠️ SIN MATCHEAR" color="warning" size="small" icon={<WarningIcon />} />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell sx={{ minWidth: 260 }}>
                                                                    {item.estado_conciliacion === 'CONCILIADO' ? (
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                                                {item.alumno_nombre}
                                                                            </Typography>
                                                                            {item.comprobante_folio && (
                                                                                <Typography variant="caption" color="textSecondary">
                                                                                    Pre-factura {item.comprobante_folio}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    ) : (
                                                                        /* ASIGNACIÓN INTERACTIVA DE ALUMNO PARA FILAS SIN MATCH */
                                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                            <FormControl size="small" sx={{ flexGrow: 1, minWidth: 180 }}>
                                                                                <InputLabel>Asignar Alumno...</InputLabel>
                                                                                <Select
                                                                                    value={alumnoSeleccionadoPorFila[idx] || ''}
                                                                                    label="Asignar Alumno..."
                                                                                    onChange={(e) => setAlumnoSeleccionadoPorFila({
                                                                                        ...alumnoSeleccionadoPorFila,
                                                                                        [idx]: e.target.value
                                                                                    })}
                                                                                >
                                                                                    {alumnos.map(al => (
                                                                                        <MenuItem key={al.id} value={al.id}>
                                                                                            {al.nombre} {al.apellido_paterno} ({al.matricula})
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                </Select>
                                                                            </FormControl>
                                                                            <Tooltip title="Asignar este pago al alumno seleccionado y generar su Pre-factura">
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="warning"
                                                                                    size="small"
                                                                                    disabled={asignandoFilaIdx === idx || !alumnoSeleccionadoPorFila[idx]}
                                                                                    onClick={() => handleAsignarAlumnoManual(item, idx)}
                                                                                    startIcon={asignandoFilaIdx === idx ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}
                                                                                    sx={{ textTransform: 'none', px: 1.5, whiteSpace: 'nowrap' }}
                                                                                >
                                                                                    {asignandoFilaIdx === idx ? 'Guardando...' : 'Asignar'}
                                                                                </Button>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
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
    );
}
