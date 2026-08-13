'use client';
import { useState, useEffect, useCallback } from 'react';

import { isAuthenticated } from "@/utils/authRedirect";

import Header from '@/components/Header/Header.jsx';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';
import AlumnosView from '@/components/Cobranza/AlumnosView';
import ResumenTab from './tabs/ResumenTab';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    Tabs,
    Tab,
    Paper,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    TextField,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControlLabel,
    Switch,
    MenuItem,
    Alert,
    IconButton,
    Tooltip,
    Divider,
    FormControl,
    InputLabel,
    Select,
    Autocomplete
} from '@mui/material';
import {
    Dashboard as DashboardIcon,
    School as SchoolIcon,
    AttachMoney as MoneyIcon,
    AccountBalance as BankIcon,
    Receipt as ReceiptIcon,
    Assessment as AssessmentIcon,
    Add as AddIcon,
    AutoFixHigh as AutoFixIcon,
    Visibility as EyeIcon,
    History as HistoryIcon,
    Download as DownloadIcon,
    CheckCircle as CheckIcon,
    Group as GroupIcon,
    PictureAsPdf as PdfIcon,
    Code as XmlIcon,
    Email as EmailIcon,
    CloudUpload as UploadIcon,
    Print as PrintIcon,
    TrendingUp as TrendingIcon,
    Warning as WarningIcon,
    People as PeopleIcon,
    Business as BusinessIcon,
    Send as SendIcon,
    NotificationsActive as TimbrarIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    FlashOn as FlashIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { REGIMENES_FISCALES, USOS_CFDI, getDescripcionRegimen, getDescripcionUsoCFDI } from '@/utils/catalogoSAT';
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

export default function MóduloCobranzaUnificadoPage() {
    const router = useRouter();
    const [currentTab, setCurrentTab] = useState(0);

    // Leer parámetro tab de la URL al cargar
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const tabParam = params.get('tab');
            if (tabParam !== null) {
                const tabIndex = parseInt(tabParam, 10);
                if (!isNaN(tabIndex)) {
                    setCurrentTab(tabIndex);
                }
            }
        }
    }, []);
    const [loading, setLoading] = useState(true);

    // DATOS DE LAS DIFERENTES PESTAÑAS
    const [alumnos, setAlumnos] = useState([]);
    const [cargos, setCargos] = useState([]);
    const [emisores, setEmisores] = useState([]);
    const [emisorSeleccionado, setEmisorSeleccionado] = useState('');
    const [pendientesRFC, setPendientesRFC] = useState([]);
    const [pendientesGlobal, setPendientesGlobal] = useState([]);
    const [facturasEmitidas, setFacturasEmitidas] = useState([]);
    const [montoGlobalTotal, setMontoGlobalTotal] = useState(0);

    // MÉTRICAS DASHBOARD
    const [stats, setStats] = useState({
        totalCobrado: 0,
        totalPendiente: 0,
        totalAlumnos: 0,
        totalPagos: 0,
        ultimosPagos: []
    });

    // CONCILIACIÓN BANCARIA
    const [bancoSeleccionado, setBancoSeleccionado] = useState('GENERICO');
    const [archivoBancario, setArchivoBancario] = useState(null);
    const [procesandoConciliacion, setProcesandoConciliacion] = useState(false);
    const [resultadoConciliacion, setResultadoConciliacion] = useState(null);
    const [alumnoSeleccionadoFilaDashboard, setAlumnoSeleccionadoFilaDashboard] = useState({});
    const [openEditModal, setOpenEditModal] = useState(false);
    const [guardandoEdicion, setGuardandoEdicion] = useState(false);
    const [openDeleteModal, setOpenDeleteModal] = useState(false);
    const [itemAEliminar, setItemAEliminar] = useState(null);
    const [eliminando, setEliminando] = useState(false);
    const [editForm, setEditForm] = useState({
        comprobante_id: '',
        folio: '',
        receptor_rfc: '',
        receptor_nombre: '',
        descripcion_concepto: '',
        monto: 0,
        clave_prod_serv: '86121500',
        uso_cfdi: 'D10',
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

    // EDITAR PRE-FACTURA Y CONCEPTOS (MODAL INLINE)
    const handleAbrirEditar = (fac) => {
        if (!fac || !fac.id) return;
        let initialItems = [{ concepto: fac.descripcion_concepto || 'Mensualidad', monto: fac.monto || 0 }];
        if (fac.items && Array.isArray(fac.items) && fac.items.length > 0) {
            initialItems = fac.items.map(it => ({ concepto: it.concepto || it.descripcion, monto: it.monto || it.valor_unitario }));
        }

        setEditForm({
            comprobante_id: fac.id,
            folio: `${fac.serie || 'F'}-${fac.folio || fac.id}`,
            descripcion_concepto: fac.descripcion_concepto || 'Mensualidad',
            monto: fac.monto || 0,
            clave_prod_serv: fac.clave_prod_serv || '86121500',
            uso_cfdi: fac.uso_cfdi || 'S01',
            receptor_rfc: fac.receptor_rfc || 'XAXX010101000',
            receptor_nombre: fac.receptor_nombre || 'PUBLICO EN GENERAL',
            items: initialItems
        });
        setOpenEditModal(true);
    };

    const handleGuardarEdicion = async (timbrarAlGuardar = false) => {
        const itemsValidos = (editForm.items || []).map(it => ({
            concepto: (it.concepto || 'Mensualidad').trim(),
            monto: parseFloat(it.monto || 0)
        })).filter(it => it.monto > 0);

        const montoTotalCalculado = itemsValidos.length > 0
            ? itemsValidos.reduce((acc, curr) => acc + curr.monto, 0)
            : Number(editForm.monto);

        setGuardandoEdicion(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'EDITAR_PREFACTURA',
                    comprobante_id: editForm.comprobante_id,
                    receptor_rfc: editForm.receptor_rfc,
                    receptor_nombre: editForm.receptor_nombre,
                    descripcion_concepto: itemsValidos.length > 0 ? itemsValidos[0].concepto : editForm.descripcion_concepto,
                    monto: montoTotalCalculado,
                    clave_prod_serv: editForm.clave_prod_serv,
                    uso_cfdi: editForm.uso_cfdi,
                    emisor_id: emisorSeleccionado,
                    items: itemsValidos
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al editar pre-factura');

            setMensajeExito(data.mensaje);
            setOpenEditModal(false);
            
            if (timbrarAlGuardar === true) {
                handleTimbrarPendiente(editForm.comprobante_id);
            } else {
                loadDataForTab();
            }
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setGuardandoEdicion(false);
        }
    };

    const handleAbrirEliminar = (fac) => {
        setItemAEliminar(fac);
        setErrorMsg('');
        setOpenDeleteModal(true);
    };

    const handleConfirmarEliminar = async () => {
        if (!itemAEliminar) return;
        setEliminando(true);
        setErrorMsg('');
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

            setMensajeExito(data.mensaje);
            setOpenDeleteModal(false);
            setItemAEliminar(null);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setEliminando(false);
        }
    };

    const handleAsignarAlumnoManualDashboard = async (item, idx) => {
        const alumnoId = alumnoSeleccionadoFilaDashboard[idx];
        if (!alumnoId) {
            setErrorMsg(`Seleccione un alumno para asignar el pago de $${parseMonto(item.monto).toFixed(2)}.`);
            return;
        }

        setProcesandoConciliacion(true);
        setErrorMsg('');
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

            if (resultadoConciliacion && resultadoConciliacion.pagos) {
                const nuevosPagos = [...resultadoConciliacion.pagos];
                nuevosPagos[idx] = {
                    ...nuevosPagos[idx],
                    estado_conciliacion: 'CONCILIADO',
                    alumno_nombre: data.alumno_nombre,
                    metodo_matcheo: 'Asignación Manual',
                    comprobante_folio: data.comprobante_folio
                };

                setResultadoConciliacion({
                    ...resultadoConciliacion,
                    resumen: {
                        ...resultadoConciliacion.resumen,
                        conciliados: (resultadoConciliacion.resumen?.conciliados || 0) + 1,
                        pendientes_revision: Math.max(0, (resultadoConciliacion.resumen?.pendientes_revision || 0) - 1)
                    },
                    pagos: nuevosPagos
                });
            }
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setProcesandoConciliacion(false);
        }
    };

    const handleConfirmarConciliacionMasivaDashboard = async () => {
        console.log('Confirmar masivo clicked. resultadoConciliacion:', resultadoConciliacion);
        console.log('alumnoSeleccionadoFilaDashboard:', alumnoSeleccionadoFilaDashboard);
        if (!resultadoConciliacion || !resultadoConciliacion.pagos) return;

        const pendientesAsignados = resultadoConciliacion.pagos
            .map((item, idx) => ({ item, idx, alumno_id: alumnoSeleccionadoFilaDashboard[idx] }))
            .filter(obj => obj.item.estado_conciliacion !== 'CONCILIADO' && obj.alumno_id);

        console.log('pendientesAsignados:', pendientesAsignados);

        if (pendientesAsignados.length === 0) {
            console.log('pendientesAsignados is empty, switching to tab 4');
            setCurrentTab(4); // Cambiar a pestaña Facturación
            return;
        }

        setProcesandoConciliacion(true);
        setErrorMsg('');
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
            loadDataForTab();
            setTimeout(() => {
                setCurrentTab(4);
            }, 1200);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setProcesandoConciliacion(false);
        }
    };

    // REPORTE MENSUAL
    const [mesPeriodo, setMesPeriodo] = useState(new Date().toISOString().slice(0, 7));
    const [reporteMensual, setReporteMensual] = useState({ resumen_mensual: {}, pagos: [] });

    // MODALES & FORMULARIOS
    const [openAlumnoModal, setOpenAlumnoModal] = useState(false);
    const [openHistorialModal, setOpenHistorialModal] = useState(false);
    const [openCargoManualModal, setOpenCargoManualModal] = useState(false);
    const [openAutoModal, setOpenAutoModal] = useState(false);
    const [openFichaModal, setOpenFichaModal] = useState(false);
    const [openFacturaManualModal, setOpenFacturaManualModal] = useState(false);

    // MODAL ENVIAR CORREO FACTURA
    const [openCorreoModal, setOpenCorreoModal] = useState(false);
    const [facturaCorreo, setFacturaCorreo] = useState(null);
    const [emailDestino, setEmailDestino] = useState('');
    const [enviandoCorreo, setEnviandoCorreo] = useState(false);
    const [timbrandoFacturaId, setTimbrandoFacturaId] = useState(null);

    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [cargoSeleccionado, setCargoSeleccionado] = useState(null);
    const [historialData, setHistorialData] = useState({ pagos: [], cargos: [], resumen: {} });

    const [saving, setSaving] = useState(false);
    const [enviandoCorreoFicha, setEnviandoCorreoFicha] = useState(false);
    const [mensajeExito, setMensajeExito] = useState('');
    const [errorMsg, setErrorMsg] = useState('');

    const handleReenviarCorreoFicha = async (cargoId) => {
        if (!cargoId) return;
        setEnviandoCorreoFicha(true);
        try {
            const res = await fetch(`/api/cobranza/cargos/${cargoId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar correo');
            setMensajeExito(data.mensaje || 'Ficha de cargo enviada en PDF por correo exitosamente.');
        } catch (err) {
            setErrorMsg('Error al enviar correo: ' + err.message);
        } finally {
            setEnviandoCorreoFicha(false);
        }
    };

    // FORMULARIO ALUMNO
    const [alumnoForm, setAlumnoForm] = useState({
        matricula: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        email: '',
        telefono: '',
        carrera: 'Ingeniería en Sistemas',
        semestre: 1,
        estatus: 'ACTIVO',
        clabe_interbancaria: '',
        referencia_pago: '',
        informacion_pago: '',
        ids_alumno: '',
        monto_personalizado: '',
        dia_pago: 5,
        requiere_factura: false,
        rfc: '',
        razon_social: '',
        codigo_postal: '',
        regimen_fiscal: '605',
        uso_cfdi: 'D10'
    });

    // FORMULARIO EMISIÓN FICHA MANUAL (MÚLTIPLES CONCEPTOS/COBROS)
    const [cargoForm, setCargoForm] = useState({
        alumnos_ids: 'TODOS',
        items: [
            { concepto: 'Mensualidad', monto: '' }
        ],
        fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const handleAddItemCargo = () => {
        setCargoForm(prev => ({
            ...prev,
            items: [...prev.items, { concepto: 'Mensualidad', monto: '' }]
        }));
    };

    const handleRemoveItemCargo = (index) => {
        setCargoForm(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    const handleItemChangeCargo = (index, field, value) => {
        setCargoForm(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    // FORMULARIO GENERACIÓN AUTOMÁTICA
    const [autoForm, setAutoForm] = useState({
        mes_periodo: new Date().toISOString().slice(0, 7),
        carrera_filtro: 'TODAS'
    });

    const [programas, setProgramas] = useState([]);

    // CARGA DE DATOS UNIFICADA
    const loadDataForTab = useCallback(async () => {
        setLoading(true);
        try {
            const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
            let token = typeof window !== 'undefined' ? (localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '') : '';
            let grupoId = '';
            if (token) {
                try {
                    const parsed = JSON.parse(atob(token.split('.')[1]));
                    grupoId = parsed.grupo_id || '';
                } catch (e) { }
            }
            if (!grupoId && typeof window !== 'undefined') {
                try {
                    const userStr = localStorage.getItem('user');
                    if (userStr) {
                        const parsed = JSON.parse(userStr);
                        grupoId = parsed.grupo_id || '';
                    }
                } catch (e) { }
            }
            if (!grupoId && typeof window !== 'undefined') grupoId = localStorage.getItem('grupo_id') || '';
            const qGrupo = grupoId ? `grupo_id=${grupoId}` : '';
            
            // Tab 2: Fichas & Cargos
            if (currentTab === 2) {
                const urlCargos = `${baseUrl}/api/cobranza/cargos?estatus=TODOS${qGrupo ? `&${qGrupo}` : ''}`;
                const res = await fetch(urlCargos).then(r => r.json()).catch(() => []);
                setCargos(Array.isArray(res) ? res : []);
            }
            // Tab 3: Conciliación (No requiere fetch inicial pesado, usa cargos existentes)
            else if (currentTab === 3) {
                const urlCargos = `${baseUrl}/api/cobranza/cargos?estatus=TODOS${qGrupo ? `&${qGrupo}` : ''}`;
                const res = await fetch(urlCargos).then(r => r.json()).catch(() => []);
                setCargos(Array.isArray(res) ? res : []);

                const urlAlumnos = `${baseUrl}/api/cobranza/alumnos${qGrupo ? `?${qGrupo}` : ''}`;
                const resAlumnos = await fetch(urlAlumnos).then(r => r.json()).catch(() => []);
                setAlumnos(Array.isArray(resAlumnos) ? resAlumnos : []);
            }
            // Tab 4: Facturación CFDI
            else if (currentTab === 4) {
                const baseQuery = qGrupo ? `?${qGrupo}` : '';
                const emisorQuery = emisorSeleccionado ? (qGrupo ? `&emisor_id=${emisorSeleccionado}` : `?emisor_id=${emisorSeleccionado}`) : '';
                const urlFact = `${baseUrl}/api/cobranza/facturacion${baseQuery}${emisorQuery}`;
                const resFact = await fetch(urlFact).then(r => r.json()).catch(() => ({}));
                
                if (Array.isArray(resFact.pre_facturas)) {
                    setPendientesRFC(resFact.pre_facturas.filter(p => !p.es_generico));
                    setPendientesGlobal(resFact.pre_facturas.filter(p => p.es_generico));
                } else {
                    if (Array.isArray(resFact.pendientes_rfc)) setPendientesRFC(resFact.pendientes_rfc);
                    if (Array.isArray(resFact.pendientes_global)) setPendientesGlobal(resFact.pendientes_global);
                }
                if (Array.isArray(resFact.facturas_emitidas)) setFacturasEmitidas(resFact.facturas_emitidas);
            }
            // Tab 5: Reporte Mensual
            else if (currentTab === 5) {
                const urlRep = `${baseUrl}/api/cobranza/reportes?periodo=${mesPeriodo}${emisorSeleccionado ? `&emisor_id=${emisorSeleccionado}` : ''}${qGrupo ? `&${qGrupo}` : ''}`;
                const resRep = await fetch(urlRep).then(r => r.json()).catch(() => ({}));
                if (resRep && resRep.pagos) {
                    setReporteMensual(resRep);
                }
            }

            // Always fetch emisores just in case
            if (emisores.length === 0) {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.sandbox.wisefacturacion.com';
                let fetchSuccess = false;
                
                if (apiUrl && token) {
                    try {
                        const resApi = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                            headers: { 
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        }).then(r => r.json()).catch(err => {
                            console.error("Error fetching from C# API:", err);
                            return [];
                        });
                        
                        console.log("C# API returned emisores:", resApi);
                        
                        if (Array.isArray(resApi) && resApi.length > 0) {
                            const mappedEmisores = resApi.map(e => ({
                                id: e.ID,
                                rfc: e.Rfc,
                                nombre: e.Nombre
                            }));
                            setEmisores(mappedEmisores);
                            if (!emisorSeleccionado) {
                                setEmisorSeleccionado(mappedEmisores[0].id);
                            }
                            fetchSuccess = true;
                        }
                    } catch (err) {}
                }
                
                // Fallback to Node backend if C# API failed or returned empty
                if (!fetchSuccess) {
                    console.warn("C# API FETCH FAILED OR EMPTY. Falling back to Node API.");
                    const urlFactEmisores = `${baseUrl}/api/cobranza/facturacion${qGrupo ? `?${qGrupo}` : ''}`;
                    const resFact = await fetch(urlFactEmisores).then(r => r.json()).catch(() => ({}));
                    if (resFact.emisores && Array.isArray(resFact.emisores)) {
                        setEmisores(resFact.emisores);
                        if (resFact.emisores.length > 0 && !emisorSeleccionado) {
                            setEmisorSeleccionado(resFact.emisores[0].id);
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error cargando datos de pestaña:', err);
        } finally {
            setLoading(false);
        }
    }, [currentTab, mesPeriodo, emisorSeleccionado, emisores.length]);

    useEffect(() => {
        // Tab 0 and 1 fetch their own data internally now.
        if (currentTab >= 2) {
            loadDataForTab();
        } else {
            setLoading(false); // Make sure we don't hang on loading
        }
        
        // Fetch programas independently once
        fetch('/api/cobranza/programas')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProgramas(data);
                } else if (data && Array.isArray(data.programas)) {
                    setProgramas(data.programas);
                }
            })
            .catch(console.error);
    }, [loadDataForTab, currentTab]);

    const handleEmisorChange = (e) => {
        const val = e.target.value;
        setEmisorSeleccionado(val);
        setMensajeExito(`Razón Social Emisora vinculada correctamente para todas las operaciones.`);
    };

    // ACCIÓN EXPLÍCITA DE TIMBRADO DE UNA FACTURA PENDIENTE
    const handleTimbrarPendiente = async (facturaId) => {
        setTimbrandoFacturaId(facturaId);
        setErrorMsg('');
        setMensajeExito('');

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
                    comprobante_id: facturaId,
                    emisor_id: emisorSeleccionado,
                    token
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al timbrar factura');

            setMensajeExito(data.mensaje);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setTimbrandoFacturaId(null);
        }
    };

    // ACCIONES DE DESCARGA PDF / XML / CORREO
    const handleDescargarPDF = (facturaId) => {
        window.open(`/api/cobranza/facturas/${facturaId}/documentos?tipo=pdf`, '_blank');
    };

    const handleDescargarXML = (facturaId) => {
        window.location.href = `/api/cobranza/facturas/${facturaId}/documentos?tipo=xml`;
    };

    const handleAbrirCorreoModal = (fac) => {
        setFacturaCorreo(fac);
        setEmailDestino(fac.alumnos && fac.alumnos.length > 0 ? 'estudiante@universidad.edu.mx' : '');
        setOpenCorreoModal(true);
    };

    const handleEnviarCorreoSubmit = async () => {
        if (!facturaCorreo) return;
        setEnviandoCorreo(true);
        setErrorMsg('');

        try {
            const res = await fetch(`/api/cobranza/facturas/${facturaCorreo.id}/documentos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email_destino: emailDestino })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al enviar correo');

            setMensajeExito(data.mensaje);
            setOpenCorreoModal(false);
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setEnviandoCorreo(false);
        }
    };

    // MANEJADORES DE ALUMNOS
    const handleSaveAlumno = async () => {
        if (!alumnoForm.matricula || !alumnoForm.nombre || !alumnoForm.apellido_paterno) {
            setErrorMsg('Matrícula, Nombre y Apellido Paterno son obligatorios.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/cobranza/alumnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alumnoForm)
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al registrar alumno');

            setMensajeExito('Alumno registrado exitosamente.');
            setOpenAlumnoModal(false);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleVerHistorial = async (alum) => {
        window.location.href = `/Cobranza/Alumnos/${alum.id}`;
    };

    // MANEJADORES DE FICHAS Y CARGOS

    const handleDeleteFicha = async (id) => {
        if (!window.confirm('¿Estás seguro de que deseas eliminar esta ficha de cobro? Esto no se puede deshacer.')) {
            return;
        }
        try {
            const res = await fetch(`/api/cobranza/cargos/${id}`, { method: 'DELETE' });
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
        setErrorMsg('');

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

            setMensajeExito(data.mensaje || `Se emitieron ${data.total_generados} fichas de cobro.`);
            setOpenAutoModal(false);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleGenerarManualCargo = async () => {
        const itemsValidos = (cargoForm.items || []).map(it => ({
            concepto: (it.concepto || 'Mensualidad').trim(),
            monto: parseFloat(it.monto || 0)
        })).filter(it => it.monto > 0);

        if (itemsValidos.length === 0) {
            setErrorMsg('Agregue al menos un concepto de cobro con un monto válido mayor a $0.');
            return;
        }

        setSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/cobranza/cargos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsValidos,
                    fecha_vencimiento: cargoForm.fecha_vencimiento,
                    alumnos_ids: cargoForm.alumnos_ids === 'TODOS' ? [] : [cargoForm.alumnos_ids]
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al generar fichas');

            setMensajeExito(data.mensaje || 'Ficha de cobro emitida exitosamente.');
            setOpenCargoManualModal(false);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleFacturarManualSubmit = async () => {
        if (!cargoSeleccionado) return;
        setSaving(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/cobranza/facturacion', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    tipo_facturacion: 'MANUAL_CARGO',
                    cargo_id: cargoSeleccionado.id,
                    emisor_id: emisorSeleccionado
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al emitir factura manual');

            setMensajeExito(data.mensaje);
            setOpenFacturaManualModal(false);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setSaving(false);
        }
    };

    // CONCILIACIÓN BANCARIA
    const handleProcesarConciliacion = async () => {
        if (!archivoBancario) {
            setErrorMsg('Debe seleccionar un archivo de extracto bancario.');
            return;
        }

        setProcesandoConciliacion(true);
        setErrorMsg('');

        const formData = new FormData();
        formData.append('file', archivoBancario);
        formData.append('banco', bancoSeleccionado);
        if (emisorSeleccionado) formData.append('emisor_id', emisorSeleccionado);

        try {
            const res = await fetch('/api/cobranza/conciliacion', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al procesar la conciliación');

            const initAlumnosSelec = {};
            if (data.pagos) {
                data.pagos.forEach((p, idx) => {
                    if (p.estado_conciliacion === 'SUGERIDO' || p.estado_conciliacion === 'CONCILIADO') { 
                        if (p.alumno_id) initAlumnosSelec[idx] = BigInt(p.alumno_id).toString();
                    }
                });
            }
            setAlumnoSeleccionadoFilaDashboard(initAlumnosSelec);

            setResultadoConciliacion(data);
            setMensajeExito(`Conciliación completada. Se generaron las facturas pendientes de timbrado exitosamente.`);
            loadDataForTab();
        } catch (err) {
            setErrorMsg(err.message);
        } finally {
            setProcesandoConciliacion(false);
        }
    };

    // EXPORTAR REPORTE A EXCEL
    const handleExportarReporteExcel = () => {
        if (!reporteMensual.pagos || reporteMensual.pagos.length === 0) return;

        const excelRows = reporteMensual.pagos.map(p => ({
            'Fecha de Pago': new Date(p.fecha_pago).toLocaleDateString('es-MX'),
            'Matrícula': p.matricula,
            'Alumno / Pagador': p.alumno_nombre,
            'Programa / Carrera': p.carrera,
            'Concepto': p.concepto,
            'Referencia Bancaria Módulo 10': p.referencia_bancaria,
            'Monto Recaudado ($)': parseMonto(p.monto),
            'Perfil Fiscal': p.requiere_factura ? `RFC (${p.rfc_receptor})` : 'Público en General (XAXX010101000)',
            'Factura CFDI 4.0': p.serie_folio_factura,
            'Estado Conciliación': p.estado_conciliacion
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Cobranza_${mesPeriodo}`);
        XLSX.writeFile(wb, `Reporte_Cobranza_${mesPeriodo}.xlsx`);
    };

    return (
        <div>
            <Header title="Módulo Unificado de Cobranza y Facturación" />
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
                        {/* CONFIGURACIÓN DE RAZÓN SOCIAL EMISORA INSTITUCIONAL */}
                        <Card elevation={2} sx={{ mb: 3, backgroundColor: '#f0f7ff', borderLeft: '5px solid #1976d2' }}>
                            <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                <BusinessIcon color="primary" sx={{ fontSize: 36 }} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Typography variant="subtitle2" fontWeight="bold" color="primary">
                                        ⚙️ Razón Social Emisora Vincular de la Institución (Emisor Predeterminado)
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block">
                                        Esta Razón Social se vincula automáticamente a todas las conciliaciones, fichas y facturas CFDI emitidas a estudiantes.
                                    </Typography>
                                </Box>
                                <FormControl size="small" sx={{ minWidth: 320 }}>
                                    <Select
                                        value={emisorSeleccionado}
                                        onChange={handleEmisorChange}
                                        displayEmpty
                                    >
                                        {emisores.length === 0 ? (
                                            <MenuItem value="">UHI950412XX1 - UNIVERSIDAD HISPANOAMERICANA S.C.</MenuItem>
                                        ) : (
                                            emisores.map(e => (
                                                <MenuItem key={e.id} value={e.id}>
                                                    {e.rfc} - {e.nombre}
                                                </MenuItem>
                                            ))
                                        )}
                                    </Select>
                                </FormControl>
                            </CardContent>
                        </Card>

                        {/* ENCABEZADO Y PESTAÑAS UNIFICADAS */}
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                            <Tabs
                                value={currentTab}
                                onChange={(e, val) => setCurrentTab(val)}
                                variant="scrollable"
                                scrollButtons="auto"
                            >
                                <Tab label="📊 Dashboard Ejecutivo" icon={<DashboardIcon />} iconPosition="start" />
                                <Tab label={`🎓 Alumnos (${alumnos.length})`} icon={<SchoolIcon />} iconPosition="start" />
                                <Tab label={`💸 Fichas & Cargos (${cargos.length})`} icon={<MoneyIcon />} iconPosition="start" />
                                <Tab label="🏛️ Conciliación Bancaria" icon={<BankIcon />} iconPosition="start" />
                                <Tab label={`🧾 Facturación CFDI (${facturasEmitidas.length})`} icon={<ReceiptIcon />} iconPosition="start" />
                                <Tab label="📈 Reporte Mensual" icon={<AssessmentIcon />} iconPosition="start" />
                            </Tabs>
                        </Box>

                        {mensajeExito && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeExito('')}>{mensajeExito}</Alert>}
                        {errorMsg && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setErrorMsg('')}>{errorMsg}</Alert>}

                        {loading ? (
                            <Box display="flex" justifyContent="center" p={5}>
                                <CircularProgress />
                            </Box>
                        ) : (
                            <>
                                {/* PESTAÑA 0: DASHBOARD */}
                                {currentTab === 0 && (
                                    <ResumenTab emisorSeleccionado={emisorSeleccionado} />
                                )}

                                {/* PESTAÑA 1: PADRÓN DE ALUMNOS */}
                                {currentTab === 1 && (
                                    <Box sx={{ mt: 2 }}>
                                        <AlumnosView />
                                    </Box>
                                )}

                                {/* PESTAÑA 2: FICHAS & CARGOS */}
                                {currentTab === 2 && (
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                            <Typography variant="h6" fontWeight="bold">Fichas de Cobro y Referencias Módulo 10</Typography>
                                            <Box sx={{ display: 'flex', gap: 2 }}>
                                                <Button variant="contained" color="success" startIcon={<AutoFixIcon />} onClick={() => setOpenAutoModal(true)}>⚡ Generación 1-Click</Button>
                                                <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenCargoManualModal(true)}>Emitir Ficha</Button>
                                            </Box>
                                        </Box>
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                                    <TableRow>
                                                        <TableCell>Referencia Múl. 10</TableCell>
                                                        <TableCell>Alumno / Carrera</TableCell>
                                                        <TableCell>Vencimiento</TableCell>
                                                        <TableCell>Monto Total</TableCell>
                                                        <TableCell>Estatus</TableCell>
                                                        <TableCell align="center">Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {cargos.map(cargo => (
                                                        <TableRow key={cargo.id} hover>
                                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#1976d2' }}>{cargo.alumno?.clabe_interbancaria || cargo.referencia_bancaria}</TableCell>
                                                            <TableCell>{cargo.alumno ? `${cargo.alumno.nombre} ${cargo.alumno.apellido_paterno}` : 'N/A'}</TableCell>
                                                            <TableCell>{new Date(cargo.fecha_vencimiento).toLocaleDateString('es-MX')}</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold' }}>${parseMonto(cargo.monto_total).toFixed(2)}</TableCell>
                                                            <TableCell><Chip label={cargo.estatus} color={cargo.estatus === 'PAGADO' ? 'success' : 'error'} size="small" /></TableCell>
                                                            <TableCell align="center">
                                                                <Tooltip title="Ver Ficha Imprimible">
                                                                    <IconButton color="primary" size="small" onClick={() => { setCargoSeleccionado(cargo); setOpenFichaModal(true); }}>
                                                                        <EyeIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Facturar Manualmente CFDI">
                                                                    <IconButton color="secondary" size="small" onClick={() => { setCargoSeleccionado(cargo); setOpenFacturaManualModal(true); }}>
                                                                        <ReceiptIcon />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                {cargo.estatus === 'PENDIENTE' && (
                                                                    <Tooltip title="Eliminar Ficha">
                                                                        <IconButton color="error" size="small" onClick={() => handleDeleteFicha(cargo.id)}>
                                                                            <DeleteIcon />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                )}
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {/* PESTAÑA 3: CONCILIACIÓN BANCARIA CON ASIGNACIÓN MANUAL */}
                                {currentTab === 3 && (
                                    <Box>
                                        <Card elevation={3} sx={{ mb: 3, p: 3 }}>
                                            <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>
                                                🏛️ Subir Extracto Bancario / Reporte de Movimientos
                                            </Typography>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={4}>
                                                    <TextField select label="Banco Origen" fullWidth size="small" value={bancoSeleccionado} onChange={(e) => setBancoSeleccionado(e.target.value)}>
                                                        <MenuItem value="GENERICO">Excel / CSV Genérico</MenuItem>
                                                        <MenuItem value="BBVA">BBVA Bancomer</MenuItem>
                                                        <MenuItem value="BANORTE">Banorte</MenuItem>
                                                        <MenuItem value="SANTANDER">Santander</MenuItem>
                                                    </TextField>
                                                </Grid>
                                                <Grid item xs={12} sm={5}>
                                                    <Button variant="outlined" component="label" fullWidth startIcon={<UploadIcon />}>
                                                        {archivoBancario ? archivoBancario.name : 'Seleccionar Archivo (.xlsx, .csv)'}
                                                        <input type="file" hidden accept=".xlsx, .xls, .csv, .txt" onChange={(e) => setArchivoBancario(e.target.files[0])} />
                                                    </Button>
                                                </Grid>
                                                <Grid item xs={12} sm={3}>
                                                    <Button variant="contained" color="primary" fullWidth disabled={procesandoConciliacion} onClick={handleProcesarConciliacion}>
                                                        {procesandoConciliacion ? 'Procesando...' : '⚡ Ejecutar Conciliación'}
                                                    </Button>
                                                </Grid>
                                            </Grid>
                                        </Card>

                                        {resultadoConciliacion && resultadoConciliacion.pagos && (
                                            <Card elevation={3} sx={{ mt: 3 }}>
                                                <CardContent sx={{ p: 3 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
                                                        <Typography variant="h6" fontWeight="bold" sx={{ color: '#1b384a' }}>
                                                            Resultado y Asignación de Movimientos Bancarios
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                                            <Button
                                                                variant="contained"
                                                                color="success"
                                                                startIcon={procesandoConciliacion ? <CircularProgress size={18} color="inherit" /> : <FlashIcon />}
                                                                onClick={handleConfirmarConciliacionMasivaDashboard}
                                                                disabled={procesandoConciliacion}
                                                                sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                                            >
                                                                {procesandoConciliacion ? 'Generando Pre-Facturas...' : '⚡ Confirmar Conciliación y Generar Pre-Facturas'}
                                                            </Button>
                                                            <Button
                                                                variant="outlined"
                                                                color="primary"
                                                                startIcon={<PrintIcon />}
                                                                onClick={() => setCurrentTab(2)}
                                                                sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                                            >
                                                                Ver Pre-Facturas
                                                            </Button>
                                                        </Box>
                                                    </Box>
                                                    <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 400 }}>
                                                        <Table size="small" stickyHeader>
                                                            <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                                                <TableRow>
                                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Referencia / Extracto</TableCell>
                                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Monto</TableCell>
                                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus Matcheo</TableCell>
                                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Alumno Asignado / Acción Manual</TableCell>
                                                                </TableRow>
                                                            </TableHead>
                                                            <TableBody>
                                                                {resultadoConciliacion.pagos.map((item, idx) => {
                                                                    const isSugerido = item.estado_conciliacion === 'SUGERIDO' || item.estado_conciliacion === 'CONCILIADO';
                                                                    const alumnoIdFila = alumnoSeleccionadoFilaDashboard[idx] || (isSugerido ? item.alumno_id : null);
                                                                    
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
                                                                            ${parseMonto(item.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                        </TableCell>
                                                                        <TableCell>
                                                                            {isSugerido ? (
                                                                                <Chip label={item.metodo_matcheo ? `SUGERIDO (${item.metodo_matcheo})` : 'SUGERIDO'} color="success" size="small" icon={<CheckIcon />} />
                                                                            ) : (
                                                                                <Chip label="⚠️ SIN MATCHEAR" color="warning" size="small" icon={<WarningIcon />} />
                                                                            )}
                                                                        </TableCell>
                                                                        <TableCell sx={{ minWidth: 260 }}>
                                                                                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                                    <Autocomplete
                                                                                        size="small"
                                                                                        options={alumnos}
                                                                                        getOptionLabel={(al) => `${al.nombre} ${al.apellido_paterno} (${al.matricula})`}
                                                                                        value={alumnos.find(a => a.id.toString() === (alumnoIdFila ? alumnoIdFila.toString() : '')) || null}
                                                                                        onChange={(e, newValue) => setAlumnoSeleccionadoFilaDashboard({
                                                                                            ...alumnoSeleccionadoFilaDashboard,
                                                                                            [idx]: newValue ? newValue.id.toString() : ''
                                                                                        })}
                                                                                        renderInput={(params) => <TextField {...params} label="Buscar y asignar alumno..." />}
                                                                                        sx={{ flexGrow: 1, minWidth: 260 }}
                                                                                        noOptionsText="No se encontraron alumnos"
                                                                                    />
                                                                                    <Button
                                                                                        variant="contained"
                                                                                        color="warning"
                                                                                        size="small"
                                                                                        disabled={procesandoConciliacion || !alumnoIdFila}
                                                                                        onClick={() => handleAsignarAlumnoManualDashboard(item, idx)}
                                                                                        sx={{ textTransform: 'none', px: 1.5, whiteSpace: 'nowrap' }}
                                                                                    >
                                                                                        Asignar
                                                                                    </Button>
                                                                                </Box>
                                                                        </TableCell>
                                                                    </TableRow>
                                                                )})}
                                                            </TableBody>
                                                        </Table>
                                                    </TableContainer>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </Box>
                                )}

                                {/* PESTAÑA 4: FACTURACIÓN CFDI UNIFICADA (BORRADORES Y TIMBRADAS SAT) */}
                                {currentTab === 4 && (
                                    <Box>
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                                    <TableRow>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Serie - Folio</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Tipo CFDI</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estudiante(s) Vinculado(s)</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Receptor (RFC - Razón Social)</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus SAT</TableCell>
                                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Acciones</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {([...pendientesRFC, ...pendientesGlobal, ...facturasEmitidas]).length === 0 ? (
                                                        <TableRow>
                                                            <TableCell colSpan={8} align="center" sx={{ py: 4, color: '#888' }}>
                                                                No hay pre-facturas pendientes ni facturas timbradas registradas aún.
                                                            </TableCell>
                                                        </TableRow>
                                                    ) : (
                                                        ([...pendientesRFC.map(p => ({ ...p, estatus: 'PENDIENTE' })), ...pendientesGlobal.map(p => ({ ...p, estatus: 'PENDIENTE' })), ...facturasEmitidas]).map(fac => (
                                                            <TableRow key={fac.id} hover>
                                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', fontSize: '0.95rem' }}>
                                                                    {fac.serie}-{fac.folio}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip
                                                                        label={fac.tipo_cfdi || (fac.es_generico ? 'Factura RFC Genérico' : 'Factura Estudiante')}
                                                                        color={fac.es_generico || (fac.tipo_cfdi && fac.tipo_cfdi.includes('Genérico')) ? 'secondary' : 'primary'}
                                                                        size="small"
                                                                    />
                                                                </TableCell>
                                                                <TableCell>{fac.fecha ? new Date(fac.fecha).toLocaleDateString('es-MX') : new Date().toLocaleDateString('es-MX')}</TableCell>
                                                                <TableCell>
                                                                    {fac.alumnos && fac.alumnos.length > 0 ? (
                                                                        fac.alumnos.map((a, i) => <Typography key={i} variant="caption" display="block"><strong>{a.nombre_completo}</strong> ({a.matricula})</Typography>)
                                                                    ) : (
                                                                        <Typography variant="body2" fontWeight="bold">
                                                                            {fac.alumno_nombre || 'Estudiante General'} ({fac.alumno_matricula || 'N/A'})
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Typography variant="body2" fontWeight="bold" sx={{ fontFamily: 'monospace' }}>
                                                                        {fac.receptor_rfc}
                                                                    </Typography>
                                                                    <Typography variant="caption" display="block">
                                                                        {fac.receptor_nombre} {fac.es_generico ? '(RFC Genérico)' : ''}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', color: fac.estatus === 'TIMBRADO' ? 'success.main' : 'warning.main' }}>
                                                                    ${parseMonto(fac.total || fac.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {fac.estatus === 'TIMBRADO' ? (
                                                                        <Chip label="TIMBRADO SAT" color="success" size="small" icon={<CheckIcon />} />
                                                                    ) : (
                                                                        <Chip label="PRE-FACTURA PENDIENTE" color="warning" size="small" icon={<WarningIcon />} />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    {fac.estatus !== 'TIMBRADO' ? (
                                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                            <Tooltip title="Editar Pre-factura (RFC, Nombre, Concepto, Monto)">
                                                                                <IconButton color="secondary" size="small" onClick={() => handleAbrirEditar(fac)}>
                                                                                    <EditIcon />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                            <Tooltip title="Timbrar esta Pre-factura ante el SAT">
                                                                                <IconButton color="primary" size="small" disabled={timbrandoFacturaId === fac.id} onClick={() => handleTimbrarPendiente(fac.id)}>
                                                                                    {timbrandoFacturaId === fac.id ? <CircularProgress size={16} color="inherit" /> : <FlashIcon />}
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                            <Tooltip title="Eliminar Pre-factura Borrador">
                                                                                <IconButton color="error" size="small" onClick={() => handleAbrirEliminar(fac)}>
                                                                                    <DeleteIcon />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    ) : (
                                                                        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
                                                                            <Tooltip title="Ver PDF Oficial SAT">
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
                                                                                <IconButton color="info" size="small" onClick={() => handleAbrirCorreoModal(fac)}>
                                                                                    <EmailIcon />
                                                                                </IconButton>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))
                                                    )}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}

                                {/* PESTAÑA 5: REPORTE MENSUAL */}
                                {currentTab === 5 && (
                                    <Box>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                                            <TextField type="month" label="Seleccionar Mes" size="small" value={mesPeriodo} onChange={(e) => setMesPeriodo(e.target.value)} InputLabelProps={{ shrink: true }} />
                                            <Button variant="contained" color="success" startIcon={<DownloadIcon />} onClick={handleExportarReporteExcel}>Exportar a Excel (.xlsx)</Button>
                                        </Box>
                                        <TableContainer component={Paper} variant="outlined">
                                            <Table size="small">
                                                <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                                    <TableRow>
                                                        <TableCell>Fecha</TableCell>
                                                        <TableCell>Alumno</TableCell>
                                                        <TableCell>Carrera</TableCell>
                                                        <TableCell>Referencia Múl. 10</TableCell>
                                                        <TableCell>Monto</TableCell>
                                                        <TableCell>Perfil Fiscal</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {reporteMensual.pagos.map(pago => (
                                                        <TableRow key={pago.id} hover>
                                                            <TableCell>{new Date(pago.fecha_pago).toLocaleDateString('es-MX')}</TableCell>
                                                            <TableCell><strong>{pago.alumno_nombre}</strong> ({pago.matricula})</TableCell>
                                                            <TableCell>{pago.carrera}</TableCell>
                                                            <TableCell sx={{ fontFamily: 'monospace' }}>{pago.referencia_bancaria}</TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>${parseMonto(pago.monto).toFixed(2)}</TableCell>
                                                            <TableCell><Chip label={pago.requiere_factura ? `RFC: ${pago.rfc_receptor}` : 'Público en General'} size="small" /></TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    </Box>
                                )}
                            </>
                        )}
                    </Box>
                </Grid>
            </Grid>

            {/* MODAL 1: FICHA DE COBRO IMPRIMIBLE */}
            <Dialog open={openFichaModal} onClose={() => setOpenFichaModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                    📄 Ficha de Cobro y Depósito Bancario
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {cargoSeleccionado && (
                        <Box id="printable-ficha-cobro">
                            <Box sx={{ textAlignment: 'center', mb: 2, textAlign: 'center' }}>
                                <Typography variant="h6" fontWeight="bold" color="primary">
                                    {emisores.find(e => e.id.toString() === cargoSeleccionado.alumno?.emisor_id?.toString())?.nombre || 'UNIVERSIDAD HISPANOAMERICANA S.C.'}
                                </Typography>
                                <Typography variant="caption" color="textSecondary" display="block">
                                    Ficha Oficial de Pago de Colegiatura | Convenio BBVA CIE: 182743
                                </Typography>
                            </Box>
                            <Divider sx={{ my: 2 }} />
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="subtitle2" color="textSecondary">Estudiante / Matrícula:</Typography>
                                    <Typography variant="body1" fontWeight="bold">
                                        {cargoSeleccionado.alumno ? `${cargoSeleccionado.alumno.nombre} ${cargoSeleccionado.alumno.apellido_paterno}` : 'Alumno General'}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        Matrícula: <strong>{cargoSeleccionado.alumno?.matricula || 'N/A'}</strong> | Carrera: <strong>{cargoSeleccionado.alumno?.carrera || 'General'}</strong>
                                    </Typography>
                                </Grid>

                                <Grid item xs={12}>
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
                                </Grid>

                                <Grid item xs={12}>
                                    <Paper elevation={0} sx={{ p: 2, backgroundColor: '#f0f7ff', border: '2px dashed #1976d2', textAlign: 'center' }}>
                                        <Typography variant="caption" display="block" color="textSecondary" fontWeight="bold">
                                            REFERENCIA BANCARIA ÚNICA (CLABE / MÓDULO 10)
                                        </Typography>
                                        <Typography variant="h4" fontWeight="bold" sx={{ fontFamily: 'monospace', color: '#1976d2', letterSpacing: 2, my: 1 }}>
                                            {cargoSeleccionado.alumno?.clabe_interbancaria || cargoSeleccionado.referencia_bancaria}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="caption" display="block" color="textSecondary" fontWeight="bold">
                                            CONCEPTO / DESCRIPCIÓN DE PAGO (DOBLE CONTROL)
                                        </Typography>
                                        <Typography variant="h5" fontWeight="bold" color="secondary.main" sx={{ fontFamily: 'monospace', letterSpacing: 1, my: 1 }}>
                                            {cargoSeleccionado.codigo_ficha || 'N/A'}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                                            Escribe este código exactamente en el campo de Concepto de tu transferencia SPEI
                                        </Typography>
                                    </Paper>
                                </Grid>
                                
                                <Grid item xs={12}>
                                    <Divider sx={{ my: 1 }} />
                                    <Box display="flex" justifyContent="space-between" alignItems="center">
                                        <Typography variant="h6" fontWeight="bold">Monto Total a Pagar:</Typography>
                                        <Typography variant="h5" fontWeight="bold" color="success.dark">
                                            ${parseMonto(cargoSeleccionado.monto_total).toFixed(2)} MXN
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="textSecondary" display="block" textAlign="right">
                                        Fecha Límite de Pago: <span style={{ color: 'red' }}>{new Date(cargoSeleccionado.fecha_vencimiento).toLocaleDateString('es-MX')}</span>
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
                        disabled={enviandoCorreoFicha}
                        onClick={() => handleReenviarCorreoFicha(cargoSeleccionado?.id)}
                    >
                        {enviandoCorreoFicha ? 'Enviando PDF...' : 'Enviar por Correo'}
                    </Button>
                    <Button variant="outlined" startIcon={<PrintIcon />} onClick={() => window.print()}>
                        Imprimir Ficha
                    </Button>
                    <Button onClick={() => setOpenFichaModal(false)} variant="contained" color="primary">
                        Cerrar
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 2: FACTURAR MANUALMENTE UNA FICHA */}
            <Dialog open={openFacturaManualModal} onClose={() => setOpenFacturaManualModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                    🧾 Facturar Manualmente Ficha de Cobro
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {cargoSeleccionado && (
                        <Box>
                            <Alert severity="info" sx={{ mb: 2 }}>
                                Esta acción creará la Factura borrador (PENDIENTE DE TIMBRADO) para la referencia <strong>{cargoSeleccionado.referencia_bancaria}</strong> y marcará la ficha como PAGADA.
                            </Alert>
                            <Typography variant="subtitle1" fontWeight="bold">
                                Alumno: {cargoSeleccionado.alumno ? `${cargoSeleccionado.alumno.nombre} ${cargoSeleccionado.alumno.apellido_paterno}` : 'N/A'}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                Monto a Facturar: <strong>${parseMonto(cargoSeleccionado.monto_total).toFixed(2)}</strong>
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenFacturaManualModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleFacturarManualSubmit} variant="contained" color="primary" disabled={saving}>
                        {saving ? 'Creando...' : 'Crear Factura Borrador'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 3: REGISTRAR NUEVO ALUMNO */}
            <Dialog open={openAlumnoModal} onClose={() => setOpenAlumnoModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold' }}>Registrar Alumno y Configuración de Cobro</DialogTitle>
                <DialogContent dividers>
                    <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Matrícula *" fullWidth value={alumnoForm.matricula} onChange={(e) => setAlumnoForm({ ...alumnoForm, matricula: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Nombre *" fullWidth value={alumnoForm.nombre} onChange={(e) => setAlumnoForm({ ...alumnoForm, nombre: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Apellido Paterno *" fullWidth value={alumnoForm.apellido_paterno} onChange={(e) => setAlumnoForm({ ...alumnoForm, apellido_paterno: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Apellido Materno" fullWidth value={alumnoForm.apellido_materno} onChange={(e) => setAlumnoForm({ ...alumnoForm, apellido_materno: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField select label="Plan de Estudio *" fullWidth value={alumnoForm.programa_academico_id || ''} onChange={(e) => {
                                const selectedProg = programas.find(p => p.id.toString() === e.target.value);
                                setAlumnoForm({ 
                                    ...alumnoForm, 
                                    programa_academico_id: e.target.value,
                                    carrera: selectedProg ? selectedProg.nombre : alumnoForm.carrera
                                });
                            }}>
                                <MenuItem value=""><em>-- Seleccionar Plan --</em></MenuItem>
                                {programas.map((prog) => (
                                    <MenuItem key={prog.id} value={prog.id.toString()}>
                                        {prog.nombre}
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Semestre" type="number" fullWidth value={alumnoForm.semestre} onChange={(e) => setAlumnoForm({ ...alumnoForm, semestre: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                select
                                label="Estatus del Alumno"
                                fullWidth
                                value={alumnoForm.estatus || 'ACTIVO'}
                                onChange={(e) => setAlumnoForm({ ...alumnoForm, estatus: e.target.value })}
                                helperText="Estado académico (Activo / Baja / Graduado)"
                            >
                                <MenuItem value="ACTIVO">🟢 ACTIVO (Predeterminado)</MenuItem>
                                <MenuItem value="BAJA">🔴 BAJA (Desactivado / Detuvo estudios)</MenuItem>
                                <MenuItem value="GRADUADO">🎓 GRADUADO (Completó cursos)</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Monto Personalizado / Beca ($)" type="number" fullWidth value={alumnoForm.monto_personalizado} onChange={(e) => setAlumnoForm({ ...alumnoForm, monto_personalizado: e.target.value })} />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField select label="Día de Corte" fullWidth value={alumnoForm.dia_pago} onChange={(e) => setAlumnoForm({ ...alumnoForm, dia_pago: e.target.value })}>
                                <MenuItem value={5}>Día 5 de cada mes</MenuItem>
                                <MenuItem value={10}>Día 10 de cada mes</MenuItem>
                                <MenuItem value={15}>Día 15 de cada mes</MenuItem>
                            </TextField>
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="CLABE Interbancaria Única (18 dígitos)"
                                fullWidth
                                value={alumnoForm.clabe_interbancaria || ''}
                                onChange={(e) => setAlumnoForm({ ...alumnoForm, clabe_interbancaria: e.target.value })}
                                placeholder="Ej. 012180015012345678"
                                helperText="CLABE personalizada para conciliación bancaria"
                            />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField
                                label="Referencia Personal de Pago Alumno"
                                fullWidth
                                value={alumnoForm.referencia_pago || ''}
                                onChange={(e) => setAlumnoForm({ ...alumnoForm, referencia_pago: e.target.value })}
                                placeholder="Ej. REF-ALU-1002"
                                helperText="Referencia fija asignada para depósitos SPEI"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#166534', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    🎓 ID(s) Alumno / Planes de Estudio Asignados (Múltiples)
                                </Typography>
                                <TextField
                                    fullWidth
                                    size="small"
                                    label="IDs del Alumno por Plan de Estudio (separados por coma)"
                                    value={alumnoForm.ids_alumno || ''}
                                    onChange={(e) => setAlumnoForm({ ...alumnoForm, ids_alumno: e.target.value })}
                                    placeholder="Ej. ID-SYS-2024-001, PLAN-CYBER-005, ID-MAESTRIA-02"
                                    helperText="Permite ingresar varios IDs o matrículas asociadas a los planes de estudio que esté cursando para su conciliación automática."
                                />
                            </Card>
                        </Grid>
                        <Grid item xs={12}>
                            <TextField
                                multiline
                                rows={2}
                                fullWidth
                                label="Información Adicional / Instrucciones de Pago"
                                value={alumnoForm.informacion_pago || ''}
                                onChange={(e) => setAlumnoForm({ ...alumnoForm, informacion_pago: e.target.value })}
                                placeholder="Notas de pago, instrucciones bancarias o detalles específicos del alumno"
                            />
                        </Grid>
                        <Grid item xs={12}>
                            <FormControlLabel control={<Switch checked={alumnoForm.requiere_factura} onChange={(e) => setAlumnoForm({ ...alumnoForm, requiere_factura: e.target.checked })} />} label="¿El alumno requiere Facturación Fiscal Individual con RFC?" />
                        </Grid>
                        {alumnoForm.requiere_factura && (
                            <>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="RFC del Receptor Fiscal *" fullWidth value={alumnoForm.rfc} onChange={(e) => setAlumnoForm({ ...alumnoForm, rfc: e.target.value })} placeholder="Ej. XEXX010101000" helperText="RFC del Padre, Tutor, Empresa o Alumno" />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField label="Nombre o Razón Social Fiscal *" fullWidth value={alumnoForm.razon_social} onChange={(e) => setAlumnoForm({ ...alumnoForm, razon_social: e.target.value })} placeholder="Ej. JUAN PEREZ (PADRE) O EMPRESA SA DE CV" helperText="Nombre a quien se le facturará (puede ser distinto al alumno)" />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField label="Código Postal Fiscal" fullWidth value={alumnoForm.codigo_postal} onChange={(e) => setAlumnoForm({ ...alumnoForm, codigo_postal: e.target.value })} />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField select label="Régimen Fiscal" fullWidth value={alumnoForm.regimen_fiscal} onChange={(e) => setAlumnoForm({ ...alumnoForm, regimen_fiscal: e.target.value })}>
                                        {REGIMENES_FISCALES.map(r => (
                                            <MenuItem key={r.clave} value={r.clave}>{r.clave} - {r.descripcion}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField select label="Uso CFDI" fullWidth value={alumnoForm.uso_cfdi} onChange={(e) => setAlumnoForm({ ...alumnoForm, uso_cfdi: e.target.value })}>
                                        {USOS_CFDI.map(u => (
                                            <MenuItem key={u.clave} value={u.clave}>{u.clave} - {u.descripcion}</MenuItem>
                                        ))}
                                    </TextField>
                                </Grid>
                            </>
                        )}
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAlumnoModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleSaveAlumno} variant="contained" color="primary" disabled={saving}>
                        {saving ? 'Guardando...' : 'Guardar Alumno'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 4: EMITIR FICHA DE COBRO MANUAL / COMPLEMENTARIA */}
            <Dialog open={openCargoManualModal} onClose={() => setOpenCargoManualModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ fontWeight: 'bold', backgroundColor: '#1b384a', color: 'white' }}>
                    📑 Emitir Ficha de Cobro Individual / Complementaria
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <TextField
                                select
                                label="Seleccionar Alumno Destinatario *"
                                fullWidth
                                value={cargoForm.alumnos_ids || 'TODOS'}
                                onChange={(e) => setCargoForm({ ...cargoForm, alumnos_ids: e.target.value })}
                                helperText="Selecciona un alumno específico o todos los alumnos activos"
                            >
                                <MenuItem value="TODOS">👥 Todos los alumnos activos</MenuItem>
                                {alumnos.map(alum => (
                                    <MenuItem key={alum.id} value={alum.id.toString()}>
                                        🎓 {alum.matricula} - {alum.nombre} {alum.apellido_paterno} ({alum.carrera})
                                    </MenuItem>
                                ))}
                            </TextField>
                        </Grid>

                        {/* PANEL INFORMATIVO DEL ALUMNO SELECCIONADO */}
                        {cargoForm.alumnos_ids && cargoForm.alumnos_ids !== 'TODOS' && (() => {
                            const alumObj = alumnos.find(a => a.id.toString() === cargoForm.alumnos_ids);
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
                            {(cargoForm.items || []).map((item, idx) => (
                                <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                                    <TextField
                                        select
                                        label={`Concepto ${idx + 1} *`}
                                        fullWidth
                                        size="small"
                                        value={item.concepto || 'Mensualidad'}
                                        onChange={(e) => handleItemChangeCargo(idx, 'concepto', e.target.value)}
                                    >
                                        <MenuItem value="Mensualidad">Mensualidad</MenuItem>
                                        <MenuItem value="Inscripción">Inscripción</MenuItem>
                                        <MenuItem value="Titulación">Titulación</MenuItem>
                                        <MenuItem value="Examen Extraordinario">Examen Extraordinario</MenuItem>
                                        <MenuItem value="Constancia">Constancia</MenuItem>
                                    </TextField>
                                    <TextField
                                        label="Monto ($) *"
                                        type="number"
                                        size="small"
                                        sx={{ width: 180 }}
                                        value={item.monto}
                                        onChange={(e) => handleItemChangeCargo(idx, 'monto', e.target.value)}
                                        placeholder="0.00"
                                    />
                                    {(cargoForm.items || []).length > 1 && (
                                        <IconButton color="error" size="small" onClick={() => handleRemoveItemCargo(idx)}>
                                            <DeleteIcon fontSize="small" />
                                        </IconButton>
                                    )}
                                </Box>
                            ))}
                            <Button
                                startIcon={<AddIcon />}
                                size="small"
                                variant="outlined"
                                onClick={handleAddItemCargo}
                                sx={{ textTransform: 'none', mt: 1, fontWeight: 'bold' }}
                            >
                                + Agregar otro cobro / concepto a esta ficha
                            </Button>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc', textAlign: 'center' }}>
                                <Typography variant="caption" color="textSecondary" display="block">MONTO TOTAL FICHA:</Typography>
                                <Typography variant="h5" fontWeight="bold" color="success.main">
                                    ${(cargoForm.items || []).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0).toFixed(2)} MXN
                                </Typography>
                            </Paper>
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Fecha Límite de Vencimiento *"
                                type="date"
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                value={cargoForm.fecha_vencimiento}
                                onChange={(e) => setCargoForm({ ...cargoForm, fecha_vencimiento: e.target.value })}
                            />
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenCargoManualModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGenerarManualCargo} variant="contained" color="primary" disabled={saving}>
                        {saving ? 'Emitiendo...' : 'Emitir Ficha de Cobro'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL 5: GENERACIÓN AUTOMÁTICA 1-CLICK */}
            <Dialog open={openAutoModal} onClose={() => setOpenAutoModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#2e7d32', color: 'white', fontWeight: 'bold' }}>
                    ⚡ Generación Masiva 1-Click de Fichas del Periodo
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                        Este proceso emitirá automáticamente las fichas de cobro para todos los estudiantes activos aplicando sus becas o tarifas vigentes.
                    </Typography>
                    <TextField label="Seleccionar Periodo / Mes" type="month" fullWidth value={autoForm.mes_periodo} onChange={(e) => setAutoForm({ ...autoForm, mes_periodo: e.target.value })} InputLabelProps={{ shrink: true }} />
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenAutoModal(false)} color="secondary">Cancelar</Button>
                    <Button onClick={handleGenerarAutomatica} variant="contained" color="success" disabled={saving}>
                        {saving ? 'Generando...' : 'Ejecutar Generación Masiva'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL ENVIAR CORREO FACTURA */}
            <Dialog open={openCorreoModal} onClose={() => setOpenCorreoModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                    ✉️ Enviar Factura por Correo Electrónico
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    {facturaCorreo && (
                        <Box>
                            <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
                                Factura {facturaCorreo.serie}-{facturaCorreo.folio}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                                Ingrese el correo electrónico del estudiante o cliente al que desea enviar los archivos PDF y XML timbrados.
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
                        onClick={handleEnviarCorreoSubmit}
                        variant="contained"
                        color="primary"
                        disabled={enviandoCorreo || !emailDestino}
                    >
                        {enviandoCorreo ? 'Enviando...' : 'Enviar Factura por Correo'}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL EDITAR PRE-FACTURA */}
            <Dialog open={openEditModal} onClose={() => setOpenEditModal(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                    ✏️ Editar Pre-factura Borrador {editForm.folio}
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
                                label="RFC del Receptor / Alumno *"
                                fullWidth
                                value={editForm.receptor_rfc}
                                onChange={(e) => setEditForm({ ...editForm, receptor_rfc: e.target.value.toUpperCase() })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Razón Social / Nombre del Receptor *"
                                fullWidth
                                value={editForm.receptor_nombre}
                                onChange={(e) => setEditForm({ ...editForm, receptor_nombre: e.target.value.toUpperCase() })}
                            />
                        </Grid>

                        <Grid item xs={12} sm={6}>
                            <TextField
                                label="Clave Producto/Servicio SAT"
                                fullWidth
                                value={editForm.clave_prod_serv}
                                onChange={(e) => setEditForm({ ...editForm, clave_prod_serv: e.target.value })}
                            />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField
                                select
                                label="Uso CFDI"
                                fullWidth
                                value={editForm.uso_cfdi}
                                onChange={(e) => setEditForm({ ...editForm, uso_cfdi: e.target.value })}
                            >
                                {USOS_CFDI.map(u => (
                                    <MenuItem key={u.clave} value={u.clave}>{u.clave} - {u.descripcion}</MenuItem>
                                ))}
                            </TextField>
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
                                const subtotalBase = totalSum > 0 ? (totalSum / 1.16) : 0;
                                const ivaTotal = totalSum > 0 ? (totalSum - subtotalBase) : 0;
                                return (
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f8fafc', borderColor: '#cbd5e1' }}>
                                        <Grid container spacing={2} textAlign="center">
                                            <Grid item xs={4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">SUBTOTAL (BASE FISCAL):</Typography>
                                                <Typography variant="h6" fontWeight="bold" color="textPrimary">
                                                    ${subtotalBase.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
                                                <Typography variant="caption" color="textSecondary" fontWeight="bold">IVA (16% TRASLADADO):</Typography>
                                                <Typography variant="h6" fontWeight="bold" color="warning.main">
                                                    ${ivaTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                </Typography>
                                            </Grid>
                                            <Grid item xs={4}>
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
                    <Button onClick={() => setOpenEditModal(false)}>Cancelar</Button>
                    <Button
                        variant="outlined"
                        color="warning"
                        onClick={() => handleGuardarEdicion(false)}
                        disabled={guardandoEdicion}
                    >
                        {guardandoEdicion ? 'Guardando...' : 'Guardar Borrador'}
                    </Button>
                    <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleGuardarEdicion(true)}
                        disabled={guardandoEdicion}
                        startIcon={<FlashIcon />}
                    >
                        Guardar y Timbrar SAT
                    </Button>
                </DialogActions>
            </Dialog>

            {/* MODAL ELIMINAR PRE-FACTURA */}
            <Dialog open={openDeleteModal} onClose={() => setOpenDeleteModal(false)} maxWidth="xs" fullWidth>
                <DialogTitle sx={{ backgroundColor: '#d32f2f', color: 'white', fontWeight: 'bold' }}>
                    🗑️ Eliminar Pre-factura Borrador
                </DialogTitle>
                <DialogContent dividers sx={{ p: 3 }}>
                    <Typography variant="body1">
                        ¿Estás seguro de que deseas eliminar la Pre-factura <strong>{itemAEliminar?.serie}-{itemAEliminar?.folio}</strong> por <strong>${parseMonto(itemAEliminar?.monto || itemAEliminar?.total).toFixed(2)}</strong>?
                    </Typography>
                    <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }}>
                        Esta acción desvinculará el borrador del pago. El pago volverá a quedar disponible para refacturar.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenDeleteModal(false)}>Cancelar</Button>
                    <Button
                        variant="contained"
                        color="error"
                        onClick={handleConfirmarEliminar}
                        disabled={eliminando}
                    >
                        {eliminando ? 'Eliminando...' : 'Sí, Eliminar Borrador'}
                    </Button>
                </DialogActions>
            </Dialog>
        </div>
    );
}
