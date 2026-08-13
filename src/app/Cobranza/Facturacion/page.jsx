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
    FormControl,
    InputLabel,
    Select,
    MenuItem,
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
    Tabs,
    Tab,
    IconButton,
    Tooltip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Checkbox,
    InputAdornment
} from '@mui/material';
import {
    Receipt as ReceiptIcon,
    Business as BusinessIcon,
    CheckCircle as CheckIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    PictureAsPdf as PdfIcon,
    Code as XmlIcon,
    Email as EmailIcon,
    FlashOn as FlashIcon,
    Send as SendIcon,
    Search as SearchIcon,
    ListAlt as ListAltIcon,
    HourglassEmpty as PendingIcon,
    Add as AddIcon
} from '@mui/icons-material';
import { getDescripcionRegimen, getDescripcionUsoCFDI } from '@/utils/catalogoSAT';
import { useRouter } from 'next/navigation';

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

export default function FacturacionCobranzaPage() {
    const router = useRouter();
    const [tab, setTab] = useState(0); // 0: Todas, 1: Pre-facturas Pendientes, 2: Facturas Timbradas
    const [loading, setLoading] = useState(true);
    const [emisores, setEmisores] = useState([]);
    const [emisorSeleccionado, setEmisorSeleccionado] = useState('');
    
    const [preFacturas, setPreFacturas] = useState([]);
    const [facturasEmitidas, setFacturasEmitidas] = useState([]);
    const [selectedIds, setSelectedIds] = useState([]);
    const [busqueda, setBusqueda] = useState('');

    const [procesando, setProcesando] = useState(false);
    const [mensaje, setMensaje] = useState('');
    const [error, setError] = useState('');

    // MODAL EDITAR PRE-FACTURA Y CONCEPTOS
    const [openEditModal, setOpenEditModal] = useState(false);
    const [editForm, setEditForm] = useState({
        comprobante_id: '',
        folio: '',
        descripcion_concepto: '',
        monto: 0,
        clave_prod_serv: '86121500',
        uso_cfdi: 'S01',
        receptor_rfc: '',
        receptor_nombre: '',
        items: [{ concepto: 'Mensualidad', monto: '' }]
    });

    const handleAddItemEdit = () => {
        setEditForm(prev => ({
            ...prev,
            items: [...(prev.items || []), { concepto: 'Mensualidad', monto: '' }]
        }));
    };

    const handleRemoveItemEdit = (index) => {
        setEditForm(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    const handleItemChangeEdit = (index, field, value) => {
        setEditForm(prev => {
            const newItems = [...(prev.items || [])];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);

    // MODAL ELIMINAR PRE-FACTURA
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);

    // MODAL ENVIAR CORREO
    const [openCorreoModal, setOpenCorreoModal] = useState(false);
    const [facturaSeleccionadaCorreo, setFacturaSeleccionadaCorreo] = useState(null);
    const [emailDestino, setEmailDestino] = useState('');
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);

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

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            let emisoresEmpresas = null;

            if (token && apiUrl) {
                try {
                    const resEmp = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (resEmp.ok) {
                        const dataEmp = await resEmp.json();
                        if (Array.isArray(dataEmp)) {
                            emisoresEmpresas = dataEmp.map(e => ({
                                id: (e.ID || e.id).toString(),
                                rfc: e.Rfc || e.rfc,
                                nombre: e.Nombre || e.nombre,
                                regimen_fiscal: e.RegimenFiscal || e.regimen_fiscal || '601'
                            }));
                        }
                    }
                } catch (e) {
                    console.log('Cargando emisores por fallback de cobranza:', e.message);
                }
            }

            const url = grupoId ? `/api/cobranza/facturacion?grupo_id=${grupoId}` : '/api/cobranza/facturacion';
            const res = await fetch(url);
            const data = await res.json();

            const listaEmisoresFinal = emisoresEmpresas && emisoresEmpresas.length > 0 
                ? emisoresEmpresas 
                : (data.emisores && Array.isArray(data.emisores) ? data.emisores : []);

            setEmisores(listaEmisoresFinal);
            if (listaEmisoresFinal.length > 0 && !emisorSeleccionado) {
                setEmisorSeleccionado(listaEmisoresFinal[0].id);
            }

            if (Array.isArray(data.pre_facturas)) setPreFacturas(data.pre_facturas);
            if (Array.isArray(data.facturas_emitidas)) setFacturasEmitidas(data.facturas_emitidas);

        } catch (err) {
            console.error('Error cargando facturación:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // SELECCIÓN MÚLTIPLE DE PRE-FACTURAS
    const handleSelectAll = (event) => {
        if (event.target.checked) {
            setSelectedIds(preFacturas.map(p => p.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    // EDITAR PRE-FACTURA Y CONCEPTOS (MODAL DIRECTO)
    const handleAbrirEditar = (preFactura) => {
        if (!preFactura || !preFactura.id) return;
        
        let initialItems = [{ concepto: preFactura.descripcion_concepto || 'Mensualidad', monto: preFactura.monto || 0 }];
        if (preFactura.items && Array.isArray(preFactura.items) && preFactura.items.length > 0) {
            initialItems = preFactura.items.map(it => ({ concepto: it.concepto || it.descripcion, monto: it.monto || it.valor_unitario }));
        }

        setEditForm({
            comprobante_id: preFactura.id,
            folio: `${preFactura.serie}-${preFactura.folio}`,
            descripcion_concepto: preFactura.descripcion_concepto || 'Mensualidad',
            monto: preFactura.monto || 0,
            clave_prod_serv: preFactura.clave_prod_serv || '86121500',
            uso_cfdi: preFactura.uso_cfdi || 'S01',
            receptor_rfc: preFactura.receptor_rfc || 'XAXX010101000',
            receptor_nombre: preFactura.receptor_nombre || 'PUBLICO EN GENERAL',
            items: initialItems
        });
        setOpenEditModal(true);
    };

    const handleGuardarEdicion = async () => {
        const itemsValidos = (editForm.items || []).map(it => ({
            concepto: (it.concepto || 'Mensualidad').trim(),
            monto: parseFloat(it.monto || 0)
        })).filter(it => it.monto > 0);

        const montoTotalCalculado = itemsValidos.length > 0
            ? itemsValidos.reduce((acc, curr) => acc + curr.monto, 0)
            : Number(editForm.monto);

        setGuardandoEdicion(true);
        setError('');
        setMensaje('');

        try {
            const res = await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'EDITAR_PREFACTURA',
                    comprobante_id: editForm.comprobante_id,
                    emisor_id: emisorSeleccionado,
                    descripcion_concepto: itemsValidos.length > 0 ? itemsValidos[0].concepto : editForm.descripcion_concepto,
                    monto: montoTotalCalculado,
                    clave_prod_serv: editForm.clave_prod_serv,
                    uso_cfdi: editForm.uso_cfdi,
                    receptor_rfc: editForm.receptor_rfc,
                    receptor_nombre: editForm.receptor_nombre,
                    items: itemsValidos
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al guardar cambios de la pre-factura');

            setMensaje(data.mensaje);
            setOpenEditModal(false);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setGuardandoEdicion(false);
        }
    };

    // MODAL ELIMINAR PRE-FACTURA
    const handleAbrirEliminar = (preFactura) => {
        setItemAEliminar(preFactura);
        setOpenDeleteModal(true);
    };

    const handleConfirmarEliminar = async () => {
        if (!itemAEliminar) return;
        setEliminando(true);
        setError('');
        setMensaje('');

        try {
            const res = await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ELIMINAR_PREFACTURA',
                    comprobante_id: itemAEliminar.id
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al eliminar pre-factura');

            setMensaje(data.mensaje);
            setOpenDeleteModal(false);
            setItemAEliminar(null);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setEliminando(false);
        }
    };

    // ACCIONES DE TIMBRADO GO
    const handleTimbrarMasivo = async () => {
        if (!emisorSeleccionado) {
            setError('Debe seleccionar la Razón Social Emisora perteneciente a su cuenta.');
            return;
        }

        setProcesando(true);
        setError('');
        setMensaje('');

        try {
            let token = '';
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'TIMBRAR_MASIVO',
                    comprobante_ids: selectedIds.length > 0 ? selectedIds : undefined,
                    emisor_id: emisorSeleccionado,
                    token
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error en el servicio de timbrado Go');

            setMensaje(data.mensaje);
            setSelectedIds([]);
            fetchData();
            setTab(2); // Cambiar a la pestaña de Facturas Emitidas
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    };

    const handleTimbrarIndividual = async (comprobanteId) => {
        if (!emisorSeleccionado) {
            setError('Debe seleccionar la Razón Social Emisora perteneciente a su cuenta.');
            return;
        }

        setProcesando(true);
        setError('');
        setMensaje('');

        try {
            let token = '';
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
            }

            const headers = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                    action: 'TIMBRAR_PENDIENTE',
                    comprobante_id: comprobanteId,
                    emisor_id: emisorSeleccionado,
                    token
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al timbrar la factura');

            setMensaje(data.mensaje);
            fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setProcesando(false);
        }
    };

    // ACCIONES DE DOCUMENTOS
    const handleDescargarPDF = (facturaId) => {
        window.open(`/api/cobranza/facturas/${facturaId}/documentos?tipo=pdf`, '_blank');
    };

    const handleDescargarXML = (facturaId) => {
        window.location.href = `/api/cobranza/facturas/${facturaId}/documentos?tipo=xml`;
    };

    const handleAbrirEnviarCorreo = (factura) => {
        setFacturaSeleccionadaCorreo(factura);
        const emailDef = factura.alumnos && factura.alumnos.length > 0 ? factura.alumnos[0].email : factura.alumno_email;
        setEmailDestino(emailDef || 'estudiante@universidad.edu.mx');
        setOpenCorreoModal(true);
    };

    const handleEnviarCorreo = async () => {
        if (!facturaSeleccionadaCorreo) return;
        setEnviandoCorreo(true);
        setError('');

        try {
            const res = await fetch(`/api/cobranza/facturas/${facturaSeleccionadaCorreo.id}/documentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_destino: emailDestino })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar correo');

            setMensaje(data.mensaje);
            setOpenCorreoModal(false);
        } catch (err) {
            setError(err.message);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    // FILTRADO DE ITEMS SEGÚN BÚSQUEDA Y PESTAÑA
    const filterItem = (item) => {
        if (!busqueda) return true;
        const q = busqueda.toLowerCase().trim();
        const folioStr = `${item.serie}-${item.folio}`.toLowerCase();
        const rfcStr = (item.receptor_rfc || '').toLowerCase();
        const nomStr = (item.receptor_nombre || item.alumno_nombre || '').toLowerCase();
        const matStr = (item.alumno_matricula || '').toLowerCase();
        const conStr = (item.descripcion_concepto || '').toLowerCase();

        return folioStr.includes(q) || rfcStr.includes(q) || nomStr.includes(q) || matStr.includes(q) || conStr.includes(q);
    };

    const preFacturasFiltradas = preFacturas.filter(filterItem);
    const facturasEmitidasFiltradas = facturasEmitidas.filter(filterItem);
    
    // Lista unificada para la pestaña 0 (Todas)
    const todasFacturas = [
        ...preFacturasFiltradas.map(p => ({ ...p, es_borrador: true })),
        ...facturasEmitidasFiltradas.map(f => ({ ...f, es_borrador: false }))
    ];

    return (
        <WithPermission permission="PAGOS_VER" fallback={<AccesoDenegado />}>
            <div>
            <Header title="Visor Unificado de Facturación y CFDI 4.0 - Módulo Cobranza" />
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
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b384a' }}>
                                    Visor Principal de Facturas y Pre-facturas de Cobranza
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Consolidado de facturación automática por conciliación: Edita conceptos, timbra con 1-Clic o elimina borradores.
                                </Typography>
                            </Box>
                        </Box>

                        <Card elevation={2} sx={{ mb: 3, backgroundColor: '#f8fafc' }}>
                            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <BusinessIcon color="primary" sx={{ fontSize: 36 }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <FormControl fullWidth size="small">
                                        <InputLabel id="emisor-select-label">Razón Social Emisora (Módulo de Empresas)</InputLabel>
                                        <Select
                                            labelId="emisor-select-label"
                                            value={emisorSeleccionado}
                                            label="Razón Social Emisora (Módulo de Empresas)"
                                            onChange={(e) => setEmisorSeleccionado(e.target.value)}
                                        >
                                            {emisores.length === 0 ? (
                                                <MenuItem value="">Sin Emisores configurados en su cuenta</MenuItem>
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

                        {mensaje && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensaje('')}>{mensaje}</Alert>}
                        {error && <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold' }} onClose={() => setError('')}>{error}</Alert>}

                        {/* BARRA DE BÚSQUEDA Y NAVEGACIÓN */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, gap: 2 }}>
                            <Tabs value={tab} onChange={(e, val) => setTab(val)}>
                                <Tab label={`Todas las Facturas (${todasFacturas.length})`} icon={<ListAltIcon />} iconPosition="start" />
                                <Tab label={`Pre-facturas Pendientes (${preFacturasFiltradas.length})`} icon={<PendingIcon color="warning" />} iconPosition="start" />
                                <Tab label={`Facturas Timbradas SAT (${facturasEmitidasFiltradas.length})`} icon={<CheckIcon color="success" />} iconPosition="start" />
                            </Tabs>

                            <TextField
                                size="small"
                                placeholder="Buscar por Folio, Alumno, RFC o Matrícula..."
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                sx={{ minWidth: 320 }}
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <SearchIcon />
                                        </InputAdornment>
                                    ),
                                }}
                            />
                        </Box>

                        {loading ? (
                            <Box display="flex" justifyContent="center" p={5}>
                                <CircularProgress />
                            </Box>
                        ) : tab === 0 ? (
                            /* PESTAÑA 0: TODAS LAS FACTURAS */
                            <Card elevation={3}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Visor General de Comprobantes (Borradores y Timbradas SAT)
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="medium"
                                            disabled={procesando || preFacturas.length === 0}
                                            onClick={handleTimbrarMasivo}
                                            startIcon={procesando ? <CircularProgress size={20} color="inherit" /> : <FlashIcon />}
                                            sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                        >
                                            {procesando ? 'Procesando...' : `⚡ Timbrar Masivo (${selectedIds.length > 0 ? selectedIds.length : preFacturas.length})`}
                                        </Button>
                                    </Box>

                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Serie-Folio</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estudiante / Matrícula</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Receptor Fiscal (RFC - Nombre)</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Concepto</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus SAT</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {todasFacturas.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#888' }}>
                                                            No se encontraron facturas o pre-facturas registradas.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    todasFacturas.map(item => (
                                                        <TableRow key={item.id} hover>
                                                            <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                                {item.serie}-{item.folio}
                                                            </TableCell>
                                                            <TableCell>{new Date(item.fecha).toLocaleDateString('es-MX')}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="bold">
                                                                    {item.alumno_nombre || (item.alumnos?.[0]?.nombre_completo) || 'Estudiante'}
                                                                </Typography>
                                                                <Typography variant="caption" color="textSecondary">
                                                                    {item.alumno_matricula || (item.alumnos?.[0]?.matricula) || 'N/A'} - {item.carrera || 'General'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                                    {item.receptor_rfc}
                                                                </Typography>
                                                                <Typography variant="caption" display="block">
                                                                    {item.receptor_nombre}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ maxWidth: 200 }}>
                                                                <Typography variant="body2" noWrap title={item.descripcion_concepto}>
                                                                    {item.descripcion_concepto || 'Colegiatura y Servicios Educativos'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: item.es_borrador ? 'warning.main' : 'success.main' }}>
                                                                ${parseMonto(item.monto || item.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell>
                                                                {item.es_borrador ? (
                                                                    <Chip label="PRE-FACTURA (BORRADOR)" color="warning" size="small" variant="outlined" />
                                                                ) : (
                                                                    <Chip label="TIMBRADO SAT" color="success" size="small" icon={<CheckIcon />} />
                                                                )}
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                {item.es_borrador ? (
                                                                    <>
                                                                        <Tooltip title="Editar Pre-factura (Concepto, Monto, RFC)">
                                                                            <IconButton color="secondary" size="small" onClick={() => handleAbrirEditar(item)}>
                                                                                <EditIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Timbrar esta Pre-factura">
                                                                            <IconButton color="primary" size="small" disabled={procesando} onClick={() => handleTimbrarIndividual(item.id)}>
                                                                                <SendIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Eliminar Pre-factura Borrador">
                                                                            <IconButton color="error" size="small" onClick={() => handleAbrirEliminar(item)}>
                                                                                <DeleteIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <Tooltip title="Ver PDF Oficial SAT">
                                                                            <IconButton color="error" size="small" onClick={() => handleDescargarPDF(item.id)}>
                                                                                <PdfIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Descargar XML CFDI 4.0">
                                                                            <IconButton color="primary" size="small" onClick={() => handleDescargarXML(item.id)}>
                                                                                <XmlIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                        <Tooltip title="Reenviar por Correo">
                                                                            <IconButton color="info" size="small" onClick={() => handleAbrirEnviarCorreo(item)}>
                                                                                <EmailIcon />
                                                                            </IconButton>
                                                                        </Tooltip>
                                                                    </>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        ) : tab === 1 ? (
                            /* PESTAÑA 1: PRE-FACTURAS EN BORRADOR */
                            <Card elevation={3}>
                                <CardContent sx={{ p: 2 }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="h6" fontWeight="bold">
                                            Pre-facturas Pendientes de Timbrado (Borradores)
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="success"
                                            size="large"
                                            disabled={procesando || preFacturasFiltradas.length === 0}
                                            onClick={handleTimbrarMasivo}
                                            startIcon={procesando ? <CircularProgress size={22} color="inherit" /> : <FlashIcon />}
                                            sx={{ fontWeight: 'bold', textTransform: 'none', px: 3, py: 1 }}
                                        >
                                            {procesando ? 'Procesando Timbrado...' : `⚡ Timbrar Masivamente (${selectedIds.length > 0 ? selectedIds.length : preFacturasFiltradas.length})`}
                                        </Button>
                                    </Box>

                                    <TableContainer component={Paper} variant="outlined">
                                        <Table size="small">
                                            <TableHead sx={{ backgroundColor: '#f1f5f9' }}>
                                                <TableRow>
                                                    <TableCell padding="checkbox">
                                                        <Checkbox
                                                            indeterminate={selectedIds.length > 0 && selectedIds.length < preFacturasFiltradas.length}
                                                            checked={preFacturasFiltradas.length > 0 && selectedIds.length === preFacturasFiltradas.length}
                                                            onChange={handleSelectAll}
                                                        />
                                                    </TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Serie-Folio</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Estudiante / Matrícula</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Receptor Fiscal (RFC - Nombre)</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Concepto Colegiatura</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Monto</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }}>Estatus Borrador</TableCell>
                                                    <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {preFacturasFiltradas.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#888' }}>
                                                            No hay pre-facturas pendientes en este momento.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    preFacturasFiltradas.map(pf => {
                                                        const isSelected = selectedIds.includes(pf.id);
                                                        return (
                                                            <TableRow key={pf.id} hover selected={isSelected}>
                                                                <TableCell padding="checkbox">
                                                                    <Checkbox
                                                                        checked={isSelected}
                                                                        onChange={() => handleSelectOne(pf.id)}
                                                                    />
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                                    {pf.serie}-{pf.folio}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight="bold">{pf.alumno_nombre}</Typography>
                                                                    <Typography variant="caption" color="textSecondary">{pf.alumno_matricula} - {pf.carrera}</Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                                        {pf.receptor_rfc}
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block">
                                                                        {pf.receptor_nombre} {pf.es_generico ? '(RFC Genérico)' : ''}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell sx={{ maxWidth: 220 }}>
                                                                    <Typography variant="body2" noWrap title={pf.descripcion_concepto}>
                                                                        {pf.descripcion_concepto}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                                    ${parseMonto(pf.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip label="PRE-FACTURA PENDIENTE" color="warning" size="small" variant="outlined" />
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Tooltip title="Editar Pre-factura (Concepto, Monto, RFC)">
                                                                        <IconButton color="secondary" size="small" onClick={() => handleAbrirEditar(pf)}>
                                                                            <EditIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Timbrar esta Pre-factura">
                                                                        <IconButton color="primary" size="small" disabled={procesando} onClick={() => handleTimbrarIndividual(pf.id)}>
                                                                            <SendIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="Eliminar Pre-factura Borrador">
                                                                        <IconButton color="error" size="small" onClick={() => handleAbrirEliminar(pf)}>
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        ) : (
                            /* PESTAÑA 2: FACTURAS EMITIDAS Y TIMBRADAS */
                            <Card elevation={3}>
                                <CardContent sx={{ p: 0 }}>
                                    <TableContainer component={Paper}>
                                        <Table size="small">
                                            <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Serie - Folio</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo CFDI</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Emisión</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estudiante(s) Vinculado(s)</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Receptor (RFC - Razón Social)</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Monto Total</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus SAT</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {facturasEmitidasFiltradas.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={8} align="center" sx={{ py: 5, color: '#888' }}>
                                                            No hay facturas timbradas registradas.
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    facturasEmitidasFiltradas.map(fac => (
                                                        <TableRow key={fac.id} hover>
                                                            <TableCell sx={{ fontWeight: 'bold', fontFamily: 'monospace' }}>
                                                                {fac.serie}-{fac.folio}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={fac.tipo_cfdi}
                                                                    color={fac.tipo_cfdi.includes('Genérico') ? 'secondary' : 'primary'}
                                                                    size="small"
                                                                />
                                                            </TableCell>
                                                            <TableCell>{new Date(fac.fecha).toLocaleDateString('es-MX')}</TableCell>
                                                            <TableCell>
                                                                {fac.alumnos && fac.alumnos.length > 0 ? (
                                                                    fac.alumnos.map((alum, idx) => (
                                                                        <Typography key={idx} variant="body2">
                                                                            <strong>{alum.nombre_completo}</strong> ({alum.matricula})
                                                                        </Typography>
                                                                    ))
                                                                ) : (
                                                                    <Typography variant="caption" color="textSecondary">Público en General</Typography>
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Typography fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                                    {fac.receptor_rfc} - {fac.receptor_nombre}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                                ${parseMonto(fac.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip label="TIMBRADO SAT" color="success" size="small" icon={<CheckIcon />} />
                                                            </TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title="Ver PDF Oficial">
                                                                    <IconButton color="error" size="small" onClick={() => handleDescargarPDF(fac.id)}>
                                                                        <PdfIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Descargar XML CFDI 4.0">
                                                                    <IconButton color="primary" size="small" onClick={() => handleDescargarXML(fac.id)}>
                                                                        <XmlIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Reenviar por Correo">
                                                                    <IconButton color="info" size="small" onClick={() => handleAbrirEnviarCorreo(fac)}>
                                                                        <EmailIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </CardContent>
                            </Card>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* MODAL EDITAR PRE-FACTURA Y CONCEPTOS */}
            <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                    ✏️ Editar Pre-factura {editForm.folio}
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        {/* SECCIÓN 1: DATOS FISCALES DEL RECEPTOR */}
                        <Grid item xs={12}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1b384a', mb: 1 }}>
                                👤 Datos Fiscales del Receptor / Estudiante:
                            </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="RFC Receptor *"
                                fullWidth
                                value={editForm.receptor_rfc}
                                onChange={(e) => setEditForm({ ...editForm, receptor_rfc: e.target.value })}
                                helperText="RFC fiscal del estudiante/tutor o XAXX010101000 para Público en General"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Nombre / Razón Social Receptor *"
                                fullWidth
                                value={editForm.receptor_nombre}
                                onChange={(e) => setEditForm({ ...editForm, receptor_nombre: e.target.value })}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Clave Producto/Servicio SAT *"
                                fullWidth
                                value={editForm.clave_prod_serv}
                                onChange={(e) => setEditForm({ ...editForm, clave_prod_serv: e.target.value })}
                                helperText="Default 86121500 (Servicios Educativos)"
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <FormControl fullWidth>
                                <InputLabel>Uso de CFDI *</InputLabel>
                                <Select
                                    value={editForm.uso_cfdi}
                                    label="Uso de CFDI *"
                                    onChange={(e) => setEditForm({ ...editForm, uso_cfdi: e.target.value })}
                                >
                                    <MenuItem value="D10">D10 - Pagos por servicios educativos (Colegiaturas)</MenuItem>
                                    <MenuItem value="S01">S01 - Sin efectos fiscales</MenuItem>
                                    <MenuItem value="G03">G03 - Gastos en general</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* SECCIÓN 2: DESGLOSE DE CONCEPTOS DE COBRO Y FACTURACIÓN */}
                        <Grid item xs={12} sx={{ mt: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1b384a', mb: 1 }}>
                                📑 Desglose de Conceptos y Partidas de Facturación:
                            </Typography>
                            {(editForm.items || []).map((item, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                                    <TextField
                                        label={`Concepto / Descripción Partida ${idx + 1} *`}
                                        fullWidth
                                        size="small"
                                        value={item.concepto || ''}
                                        onChange={(e) => handleItemChangeEdit(idx, 'concepto', e.target.value)}
                                        placeholder="Ej. Mensualidad Julio 2026 - Licenciatura en Derecho"
                                    />
                                    <TextField
                                        label="Monto ($) *"
                                        type="number"
                                        size="small"
                                        sx={{ width: 180 }}
                                        value={item.monto}
                                        onChange={(e) => handleItemChangeEdit(idx, 'monto', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {(editForm.items || []).length > 1 && (
                                        <IconButton color="error" size="small" onClick={() => handleRemoveItemEdit(idx)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                size="small"
                                variant="outlined"
                                onClick={handleAddItemEdit}
                                sx={{ textTransform: 'none', mt: 1, fontWeight: 'bold' }}
                            >
                                + Agregar otro concepto / partida a esta pre-factura
                            </Button>
                        </Grid>

                        <Grid item xs={12}>
                            {(() => {
                                const totalSum = (editForm.items || []).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0);
                                return (
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderColor: '#cbd5e1' }}>
                                        <Grid container spacing={2} textAlign="center">
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">SUBTOTAL (EXENTO DE IVA):</Typography>
                                                <Typography variant="h6" fontWeight="bold" color="textPrimary">
                                                    ${totalSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={6}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">TOTAL PRE-FACTURA (FICHA):</Typography>
                                                <Typography variant="h6" fontWeight="bold" color="success.main">
                                                    ${totalSum.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} MXN
                                                </Typography>
                                            </Grid>
                                        </Grid>
                                    </Paper>
                                );
                            })()}
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenEditModal(false)} color="secondary">Cancelar</Button>
                    <Button
                        onClick={handleGuardarEdicion}
                        variant="contained"
                        color="primary"
                        disabled={guardandoEdicion}
                    >
                        {guardandoEdicion ? 'Guardando...' : 'Guardar Cambios de Pre-factura'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL ELIMINAR PRE-FACTURA */}
            <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white', fontWeight: 'bold' }}>
                    🗑️ Eliminar Pre-factura Borrador
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {itemAEliminar && (
                        <Typography variant="body1">
                            ¿Está seguro de que desea eliminar la pre-factura borrador <strong>{itemAEliminar.serie}-{itemAEliminar.folio}</strong> por <strong>${parseMonto(itemAEliminar.monto).toFixed(2)}</strong>?
                            <br /><br />
                            Esta acción eliminará el borrador sin timbrar y desvinculará el registro de pago.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDeleteModal(false)} color="secondary">Cancelar</Button>
                    <Button
                        onClick={handleConfirmarEliminar}
                        variant="contained"
                        color="error"
                        disabled={eliminando}
                    >
                        {eliminando ? 'Eliminando...' : 'Sí, Eliminar Pre-factura'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL ENVIAR CORREO */}
            <Dialog open={openCorreoModal} onClose={() => setOpenCorreoModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                    ✉️ Enviar Factura por Correo Electrónico
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {facturaSeleccionadaCorreo && (
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                Factura {facturaSeleccionadaCorreo.serie}-{facturaSeleccionadaCorreo.folio}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                Ingrese el correo electrónico al que desea enviar los archivos PDF y XML timbrados.
                            </Typography>
                            <TextField
                                label="Correo Electrónico Destino *"
                                fullWidth
                                value={emailDestino}
                                onChange={(e) => setEmailDestino(e.target.value)}
                                placeholder="estudiante@universidad.edu.mx"
                            />
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenCorreoModal(false)} color="secondary">Cancelar</Button>
                    <Button
                        onClick={handleEnviarCorreo}
                        variant="contained"
                        color="primary"
                        disabled={enviandoCorreo || !emailDestino}
                    >
                        {enviandoCorreo ? 'Enviando...' : 'Enviar Factura por Correo'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
        </WithPermission>
    );
}
