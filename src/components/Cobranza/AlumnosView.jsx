'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
    FormControlLabel,
    Switch,
    Alert,
    CircularProgress,
    MenuItem,
    IconButton,
    Tooltip,
    Divider,
    Checkbox,
    Tabs,
    Tab
} from '@mui/material';
import {
    Add as AddIcon,
    Person as PersonIcon,
    Receipt as ReceiptIcon,
    School as SchoolIcon,
    History as HistoryIcon,
    Business as BusinessIcon,
    Edit as EditIcon,
    CheckCircle as CheckIcon,
    Cancel as CancelIcon,
    FlashOn as FlashIcon,
    FilterList as FilterListIcon,
    Delete as DeleteIcon,
    CloudUpload as CloudUploadIcon,
    Download as DownloadIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { REGIMENES_FISCALES, USOS_CFDI, getDescripcionRegimen, getDescripcionUsoCFDI } from '@/utils/catalogoSAT';

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

export default function AlumnosView() {
    const router = useRouter();
    const [alumnos, setAlumnos] = useState([]);
    const [emisores, setEmisores] = useState([]);
    const [loading, setLoading] = useState(true);

    const [openModal, setOpenModal] = useState(false);
    const [openMasivaModal, setOpenMasivaModal] = useState(false);
    const [openComplementariaModal, setOpenComplementariaModal] = useState(false);
    const [alumnoComplementario, setAlumnoComplementario] = useState(null);

    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [filtroEstatus, setFiltroEstatus] = useState('TODOS');

    // Estado para Importación de Alumnos desde Excel
    const [openImportModal, setOpenImportModal] = useState(false);
    const [importRows, setImportRows] = useState([]);
    const [importErrors, setImportErrors] = useState([]);
    const [importSuccessMessage, setImportSuccessMessage] = useState('');
    const [importFile, setImportFile] = useState(null);

    const handleDescargarPlantillaAlumnos = () => {
        const headers = [
            "Matrícula",
            "Nombre",
            "Apellido Paterno",
            "Apellido Materno",
            "Email",
            "Teléfono",
            "Carrera",
            "Semestre",
            "Monto Mensual",
            "Día de Pago",
            "CLABE Interbancaria",
            "Referencia Pago",
            "Información Pago",
            "IDs Alumno",
            "Requiere Factura",
            "RFC Facturación",
            "Razón Social Facturación",
            "Código Postal Facturación",
            "Régimen Fiscal Facturación",
            "Uso CFDI Facturación"
        ];
        
        const exampleData = [
            {
                "Matrícula": "12345678",
                "Nombre": "Juan",
                "Apellido Paterno": "Pérez",
                "Apellido Materno": "López",
                "Email": "juan.perez@example.com",
                "Teléfono": "5551234567",
                "Carrera": "Ingeniería en Sistemas",
                "Semestre": 3,
                "Monto Mensual": 3500.00,
                "Día de Pago": 5,
                "CLABE Interbancaria": "123456789012345678",
                "Referencia Pago": "REF-1234",
                "Información Pago": "Pago ordinario",
                "IDs Alumno": "ID-A, ID-B",
                "Requiere Factura": "SÍ",
                "RFC Facturación": "XAXX010101000",
                "Razón Social Facturación": "JUAN PEREZ LOPEZ",
                "Código Postal Facturación": "01000",
                "Régimen Fiscal Facturación": "605",
                "Uso CFDI Facturación": "D10"
            }
        ];

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exampleData, { header: headers });
        XLSX.utils.book_append_sheet(wb, ws, "Alumnos");
        XLSX.writeFile(wb, "Plantilla_Importar_Alumnos.xlsx");
    };

    const handleUploadExcel = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setImportFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const data = evt.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const firstSheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[firstSheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                const mappedRows = jsonData.map((row) => ({
                    matricula: String(row["Matrícula"] || row["matricula"] || "").trim(),
                    nombre: String(row["Nombre"] || row["nombre"] || "").trim(),
                    apellido_paterno: String(row["Apellido Paterno"] || row["apellido_paterno"] || "").trim(),
                    apellido_materno: String(row["Apellido Materno"] || row["apellido_materno"] || "").trim(),
                    email: String(row["Email"] || row["email"] || "").trim(),
                    telefono: String(row["Teléfono"] || row["telefono"] || "").trim(),
                    carrera: String(row["Carrera"] || row["carrera"] || "").trim(),
                    semestre: parseInt(row["Semestre"] || row["semestre"] || "1"),
                    monto_personalizado: parseFloat(row["Monto Mensual"] || row["monto_mensual"] || "0"),
                    dia_pago: parseInt(row["Día de Pago"] || row["dia_pago"] || "5"),
                    clabe_interbancaria: String(row["CLABE Interbancaria"] || row["clabe_interbancaria"] || "").trim(),
                    referencia_pago: String(row["Referencia Pago"] || row["referencia_pago"] || "").trim(),
                    informacion_pago: String(row["Información Pago"] || row["informacion_pago"] || "").trim(),
                    ids_alumno: String(row["IDs Alumno"] || row["ids_alumno"] || "").trim(),
                    requiere_factura: row["Requiere Factura"] || row["requiere_factura"] || "NO",
                    rfc: String(row["RFC Facturación"] || row["rfc_facturacion"] || "").trim(),
                    razon_social: String(row["Razón Social Facturación"] || row["razon_social_facturacion"] || "").trim(),
                    codigo_postal: String(row["Código Postal Facturación"] || row["codigo_postal_facturacion"] || "").trim(),
                    regimen_fiscal: String(row["Régimen Fiscal Facturación"] || row["regimen_fiscal_facturacion"] || "").trim(),
                    uso_cfdi: String(row["Uso CFDI Facturación"] || row["uso_cfdi_facturacion"] || "").trim()
                }));

                const errors = [];
                mappedRows.forEach((r, idx) => {
                    if (!r.matricula) errors.push(`Fila ${idx + 2}: Matrícula es requerida.`);
                    if (!r.nombre) errors.push(`Fila ${idx + 2}: Nombre es requerido.`);
                    if (!r.apellido_paterno) errors.push(`Fila ${idx + 2}: Apellido Paterno es requerido.`);
                    if (isNaN(r.monto_personalizado) || r.monto_personalizado <= 0) {
                        errors.push(`Fila ${idx + 2}: Monto Mensual debe ser un número válido mayor a 0.`);
                    }
                    if (r.requiere_factura === 'SÍ' || r.requiere_factura === 'SI' || r.requiere_factura === true) {
                        if (!r.rfc || !r.razon_social) {
                            errors.push(`Fila ${idx + 2}: RFC y Razón Social son requeridos si requiere factura.`);
                        }
                    }
                    if (r.carrera) {
                        const normalizedCarrera = r.carrera.trim().toLowerCase();
                        const existeProg = (programas || []).some(p => (p.nombre || '').trim().toLowerCase() === normalizedCarrera);
                        if (!existeProg) {
                            errors.push(`Fila ${idx + 2}: El plan de estudio/carrera "${r.carrera}" no existe en el catálogo.`);
                        }
                    } else {
                        errors.push(`Fila ${idx + 2}: Carrera/Plan de estudio es requerido.`);
                    }
                });

                setImportRows(mappedRows);
                setImportErrors(errors);
            } catch (err) {
                setImportErrors([`Error al procesar el archivo: ${err.message}`]);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleUpdateImportRow = (idx, field, value) => {
        setImportRows(prev => {
            const newRows = [...prev];
            newRows[idx] = { ...newRows[idx], [field]: value };
            
            const errors = [];
            newRows.forEach((r, rowIdx) => {
                if (!r.matricula) errors.push(`Fila ${rowIdx + 2}: Matrícula es requerida.`);
                if (!r.nombre) errors.push(`Fila ${rowIdx + 2}: Nombre es requerido.`);
                if (!r.apellido_paterno) errors.push(`Fila ${rowIdx + 2}: Apellido Paterno es requerido.`);
                if (isNaN(parseFloat(r.monto_personalizado)) || parseFloat(r.monto_personalizado) <= 0) {
                    errors.push(`Fila ${rowIdx + 2}: Monto Mensual debe ser un número válido mayor a 0.`);
                }
                if (r.requiere_factura === 'SÍ' || r.requiere_factura === 'SI' || r.requiere_factura === true) {
                    if (!r.rfc || !r.razon_social) {
                        errors.push(`Fila ${rowIdx + 2}: RFC y Razón Social son requeridos si requiere factura.`);
                    }
                }
                if (r.carrera) {
                    const normalizedCarrera = r.carrera.trim().toLowerCase();
                    const existeProg = (programas || []).some(p => (p.nombre || '').trim().toLowerCase() === normalizedCarrera);
                    if (!existeProg) {
                        errors.push(`Fila ${rowIdx + 2}: El plan de estudio/carrera "${r.carrera}" no existe en el catálogo.`);
                    }
                } else {
                    errors.push(`Fila ${rowIdx + 2}: Carrera/Plan de estudio es requerido.`);
                }
            });
            setImportErrors(errors);
            return newRows;
        });
    };

    const handleConfirmImport = async () => {
        if (importRows.length === 0) return;
        setSaving(true);
        setError('');
        setImportSuccessMessage('');

        try {
            const res = await fetch('/api/cobranza/alumnos/importar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alumnos: importRows })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al importar alumnos');

            if (data.errores && data.errores.length > 0) {
                setImportErrors(data.errores);
                setMensajeExito(`Importación parcial: Se crearon ${data.creados} alumnos, pero hubo algunos errores.`);
            } else {
                setImportSuccessMessage(`¡Importación exitosa! Se importaron ${data.creados} alumnos correctamente.`);
                setTimeout(() => {
                    setOpenImportModal(false);
                    fetchData();
                }, 2000);
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const [formComplementario, setFormComplementario] = useState({
        items: [
            { concepto: 'Mensualidad', monto: '' }
        ],
        fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });

    const handleAddItemComplementario = () => {
        setFormComplementario(prev => ({
            ...prev,
            items: [...prev.items, { concepto: 'Mensualidad', monto: '' }]
        }));
    };

    const handleRemoveItemComplementario = (index) => {
        setFormComplementario(prev => ({
            ...prev,
            items: prev.items.filter((_, idx) => idx !== index)
        }));
    };

    const handleItemChangeComplementario = (index, field, value) => {
        setFormComplementario(prev => {
            const newItems = [...prev.items];
            newItems[index] = { ...newItems[index], [field]: value };
            return { ...prev, items: newItems };
        });
    };

    const handleAbrirModalComplementario = (alum) => {
        setAlumnoComplementario(alum);
        setFormComplementario({
            items: [
                { concepto: 'Mensualidad', monto: alum.monto_personalizado ? alum.monto_personalizado.toString() : '' }
            ],
            fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        });
        setError('');
        setOpenComplementariaModal(true);
    };

    const handleEmitirFichaComplementaria = async () => {
        if (!alumnoComplementario) return;
        const itemsValidos = (formComplementario.items || []).map(it => ({
            concepto: (it.concepto || 'Mensualidad').trim(),
            monto: parseFloat(it.monto || 0)
        })).filter(it => it.monto > 0);

        if (itemsValidos.length === 0) {
            setError('Agregue al menos un concepto de cobro con un monto válido mayor a $0.');
            return;
        }

        setSaving(true);
        setError('');
        setMensajeExito('');

        try {
            const res = await fetch('/api/cobranza/cargos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    alumno_id: alumnoComplementario.id.toString(),
                    items: itemsValidos,
                    fecha_vencimiento: formComplementario.fecha_vencimiento
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al emitir ficha complementaria');

            const montoTotal = itemsValidos.reduce((acc, curr) => acc + curr.monto, 0);
            setMensajeExito(`Ficha complementaria por $${montoTotal.toFixed(2)} emitida exitosamente para ${alumnoComplementario.nombre} ${alumnoComplementario.apellido_paterno}.`);
            setOpenComplementariaModal(false);
            fetchData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // Estado Formulario Individual (Registro / Edición)
    const [form, setForm] = useState({
        alumno_id: '',
        matricula: '',
        nombre: '',
        apellido_paterno: '',
        apellido_materno: '',
        email: '',
        telefono: '',
        carrera: '',
        programa_academico_id: '',
        semestre: 1,
        estatus: 'ACTIVO',
        concepto_id: '',
        monto_personalizado: '',
        motivo_cambio: '',
        dia_pago: 5,
        emisor_id: '',
        requiere_factura: false,
        rfc: '',
        razon_social: '',
        codigo_postal: '',
        regimen_fiscal: '605',
        uso_cfdi: 'D10'
    });

    // Estado Formulario Asignación Masiva
    const [masivaForm, setMasivaForm] = useState({
        emisor_id: '',
        carrera_filtro: 'TODAS',
        asignacion_total: true,
        alumnos_ids_seleccionados: []
    });

    const [programas, setProgramas] = useState([]);

    const fetchData = async () => {
        setLoading(true);
        try {
            let token = '';
            if (typeof window !== 'undefined') {
                token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '';
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

            // 2. Cargar Alumnos
            const resAlum = await fetch('/api/cobranza/alumnos').then(r => r.json()).catch(() => []);
            if (Array.isArray(resAlum)) setAlumnos(resAlum);

            // 3. Cargar Programas Académicos
            const resProg = await fetch('/api/cobranza/programas').then(r => r.json()).catch(() => []);
            if (Array.isArray(resProg)) {
                setProgramas(resProg);
            } else if (resProg && Array.isArray(resProg.programas)) {
                setProgramas(resProg.programas);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { name, value, checked, type } = e.target;
        setForm(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCambiarEstatus = async (alumnoId, nuevoEstatus) => {
        try {
            const res = await fetch('/api/cobranza/alumnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'CAMBIAR_ESTATUS',
                    alumno_id: alumnoId.toString(),
                    estatus: nuevoEstatus
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al cambiar estatus del alumno');
            
            const desc = nuevoEstatus === 'ACTIVO' ? 'Activo' : (nuevoEstatus === 'BAJA' ? 'Baja' : 'Graduado');
            setMensajeExito(`Estatus de alumno actualizado a ${desc} correctamente.`);
            fetchData();
        } catch (err) {
            setError(err.message);
        }
    };

    const handleOpenNuevoModal = () => {
        setForm({
            alumno_id: '',
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
            concepto_id: '',
            monto_personalizado: '',
            motivo_cambio: '',
            dia_pago: 5,
            emisor_id: emisores.length > 0 ? emisores[0].id : '',
            requiere_factura: false,
            rfc: '',
            razon_social: '',
            codigo_postal: '',
            regimen_fiscal: '605',
            uso_cfdi: 'D10'
        });
        setError('');
        setOpenModal(true);
    };

    const handleEditAlumno = (alum) => {
        setForm({
            alumno_id: alum.id.toString(),
            matricula: alum.matricula || '',
            nombre: alum.nombre || '',
            apellido_paterno: alum.apellido_paterno || '',
            apellido_materno: alum.apellido_materno || '',
            email: alum.email || '',
            telefono: alum.telefono || '',
            carrera: alum.carrera || '',
            programa_academico_id: alum.programa_academico_id ? alum.programa_academico_id.toString() : '',
            semestre: alum.semestre || 1,
            estatus: alum.estatus || 'ACTIVO',
            clabe_interbancaria: alum.clabe_interbancaria || '',
            referencia_pago: alum.referencia_pago || '',
            informacion_pago: alum.informacion_pago || '',
            ids_alumno: alum.ids_alumno || '',
            concepto_id: alum.concepto_id ? alum.concepto_id.toString() : '',
            monto_personalizado: alum.monto_personalizado ? alum.monto_personalizado.toString() : '',
            motivo_cambio: '',
            dia_pago: alum.dia_pago || 5,
            emisor_id: alum.emisor_id ? alum.emisor_id.toString() : (emisores.length > 0 ? emisores[0].id : ''),
            requiere_factura: Boolean(alum.requiere_factura),
            rfc: alum.receptor?.rfc || '',
            razon_social: alum.receptor?.nombre || '',
            codigo_postal: alum.receptor?.domicilio_fiscal_receptor || '',
            regimen_fiscal: alum.receptor?.regimen_fiscal_receptor || '605',
            uso_cfdi: alum.receptor?.uso_cfdi || 'D10'
        });
        setError('');
        setOpenModal(true);
    };

    // Abrir Modal de Historial de Pagos del Alumno -> Ahora redirige a nueva página
    const handleVerHistorial = (alum) => {
        router.push(`/Cobranza/Alumnos/${alum.id}`);
    };

    const handleSave = async () => {
        if (!form.matricula || !form.nombre || !form.apellido_paterno || !form.monto_personalizado) {
            setError('Matrícula, Nombre, Apellido Paterno y Monto Mensual son campos obligatorios.');
            return;
        }

        if (form.requiere_factura && (!form.rfc || !form.razon_social)) {
            setError('Al activar facturación con RFC, el RFC y el Nombre/Razón Social Fiscal son obligatorios (nombre de a quien se le facturará).');
            return;
        }

        setSaving(true);
        setError('');

        try {
            const res = await fetch('/api/cobranza/alumnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Error al guardar alumno');
            }

            setMensajeExito(`Alumno ${form.nombre} ${form.apellido_paterno} guardado exitosamente.`);
            setOpenModal(false);
            fetchData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    // EJECUTAR ASIGNACIÓN MASIVA DE RAZÓN SOCIAL EMISORA
    const handleEjecutarAsignacionMasiva = async () => {
        if (!masivaForm.emisor_id) {
            setError('Debe seleccionar una Razón Social Emisora para asignar.');
            return;
        }

        setSaving(true);
        setError('');
        setMensajeExito('');

        try {
            const res = await fetch('/api/cobranza/alumnos', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'ASIGNACION_MASIVA_EMISOR',
                    emisor_id: masivaForm.emisor_id,
                    carrera_filtro: masivaForm.carrera_filtro,
                    asignacion_total: masivaForm.asignacion_total,
                    alumnos_ids: masivaForm.alumnos_ids_seleccionados
                })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error en la asignación masiva');

            setMensajeExito(data.mensaje);
            setOpenMasivaModal(false);
            fetchData();

        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    const toggleSeleccionAlumnoMasivo = (idStr) => {
        setMasivaForm(prev => {
            const existe = prev.alumnos_ids_seleccionados.includes(idStr);
            const nuevos = existe
                ? prev.alumnos_ids_seleccionados.filter(i => i !== idStr)
                : [...prev.alumnos_ids_seleccionados, idStr];

            return {
                ...prev,
                alumnos_ids_seleccionados: nuevos,
                asignacion_total: nuevos.length === 0
            };
        });
    };

    const alumnosFiltrados = alumnos.filter(a => {
        if (filtroEstatus === 'TODOS') return true;
        return (a.estatus || 'ACTIVO').toUpperCase() === filtroEstatus;
    });

    return (
        <Box sx={{ width: '100%' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', color: '#1b384a' }}>
                                    Padrón de Estudiantes Universitarios
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Administra los alumnos registrados, su estatus académico (Activo, Baja, Graduado) y su Razón Social Emisora.
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2 }}>
                                <Button
                                     variant="outlined"
                                     color="primary"
                                     startIcon={<CloudUploadIcon />}
                                     onClick={() => {
                                         setOpenImportModal(true);
                                         setImportRows([]);
                                         setImportErrors([]);
                                         setImportSuccessMessage('');
                                         setImportFile(null);
                                     }}
                                     sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                 >
                                     📥 Importar desde Excel
                                 </Button>

                                <Button
                                    variant="outlined"
                                    color="secondary"
                                    startIcon={<BusinessIcon />}
                                    onClick={() => {
                                        setMasivaForm({
                                            emisor_id: emisores.length > 0 ? emisores[0].id : '',
                                            carrera_filtro: 'TODAS',
                                            asignacion_total: true,
                                            alumnos_ids_seleccionados: []
                                        });
                                        setError('');
                                        setOpenMasivaModal(true);
                                    }}
                                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                >
                                    ⚡ Asignación Masiva de Razón Social Emisora
                                </Button>

                                <Button
                                    variant="contained"
                                    color="primary"
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenNuevoModal}
                                    sx={{ fontWeight: 'bold', textTransform: 'none' }}
                                >
                                    + Registrar Nuevo Alumno
                                </Button>
                            </Box>
                        </Box>

                        {mensajeExito && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setMensajeExito('')}>{mensajeExito}</Alert>}
                        {error && <Alert severity="error" sx={{ mb: 2, fontWeight: 'bold' }} onClose={() => setError('')}>{error}</Alert>}

                        {/* Barra de Filtros */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <FilterListIcon color="action" />
                                <Typography variant="body2" fontWeight="bold" color="textSecondary">
                                    Filtrar por Estatus:
                                </Typography>
                            </Box>
                            <TextField
                                select
                                size="small"
                                value={filtroEstatus}
                                onChange={(e) => setFiltroEstatus(e.target.value)}
                                sx={{ minWidth: 200, bgcolor: '#f8fafc' }}
                            >
                                <MenuItem value="TODOS">Todos los alumnos ({alumnos.length})</MenuItem>
                                <MenuItem value="ACTIVO">🟢 Activos ({alumnos.filter(a => (a.estatus || 'ACTIVO') === 'ACTIVO').length})</MenuItem>
                                <MenuItem value="BAJA">🔴 Baja ({alumnos.filter(a => a.estatus === 'BAJA').length})</MenuItem>
                                <MenuItem value="GRADUADO">🎓 Graduados ({alumnos.filter(a => a.estatus === 'GRADUADO').length})</MenuItem>
                            </TextField>
                        </Box>

                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Matrícula</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Nombre Completo</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Carrera / Semestre</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus Alumno</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Razón Social Emisora (Empresa)</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus Fiscal Receptor</TableCell>
                                        <TableCell sx={{ color: 'white', fontWeight: 'bold', textAlign: 'center' }}>Acciones</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                <CircularProgress size={30} />
                                                <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                                                    Cargando padrón de alumnos y empresas emisoras...
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : alumnosFiltrados.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                                                <Typography variant="body1" color="textSecondary">
                                                    No se encontraron alumnos con los criterios seleccionados.
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        alumnosFiltrados.map((alum) => (
                                            <TableRow key={alum.id} hover>
                                                <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>
                                                    {alum.matricula}
                                                </TableCell>
                                                <TableCell>
                                                    <Box onClick={() => window.location.href = `/Cobranza/Alumnos/${alum.id}`} sx={{ textDecoration: 'none' }}>
                                                        <Typography 
                                                            variant="body1" 
                                                            fontWeight="bold"
                                                            sx={{ cursor: 'pointer', color: 'primary.main', textDecoration: 'underline', '&:hover': { color: 'secondary.main' } }}
                                                        >
                                                            {alum.nombre} {alum.apellido_paterno} {alum.apellido_materno || ''}
                                                        </Typography>
                                                    </Box>
                                                    <Typography variant="caption" color="textSecondary">
                                                        {alum.email || 'Sin correo electrónico'}
                                                    </Typography>
                                                    {alum.ids_alumno && (
                                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mt: 0.5 }}>
                                                            {alum.ids_alumno.split(',').map((idItem, idx) => (
                                                                <Chip
                                                                    key={idx}
                                                                    label={`ID: ${idItem.trim()}`}
                                                                    color="success"
                                                                    variant="outlined"
                                                                    size="small"
                                                                    sx={{ fontSize: '0.7rem', height: 20, fontFamily: 'monospace' }}
                                                                />
                                                            ))}
                                                        </Box>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Typography variant="body2">{alum.carrera}</Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Semestre {alum.semestre}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell>
                                                    <TextField
                                                        select
                                                        size="small"
                                                        value={(alum.estatus || 'ACTIVO').toUpperCase()}
                                                        onChange={(e) => handleCambiarEstatus(alum.id, e.target.value)}
                                                        sx={{
                                                            minWidth: 130,
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 2,
                                                                fontSize: '0.8rem',
                                                                fontWeight: 'bold',
                                                                bgcolor: (alum.estatus || 'ACTIVO').toUpperCase() === 'ACTIVO'
                                                                    ? '#e8f5e9'
                                                                    : (alum.estatus || '').toUpperCase() === 'BAJA'
                                                                        ? '#ffebee'
                                                                        : '#ede7f6',
                                                                color: (alum.estatus || 'ACTIVO').toUpperCase() === 'ACTIVO'
                                                                    ? '#2e7d32'
                                                                    : (alum.estatus || '').toUpperCase() === 'BAJA'
                                                                        ? '#c62828'
                                                                        : '#512da8',
                                                            }
                                                        }}
                                                    >
                                                        <MenuItem value="ACTIVO">🟢 ACTIVO</MenuItem>
                                                        <MenuItem value="BAJA">🔴 BAJA</MenuItem>
                                                        <MenuItem value="GRADUADO">🎓 GRADUADO</MenuItem>
                                                    </TextField>
                                                </TableCell>
                                                <TableCell>
                                                    {alum.emisor ? (
                                                        <Chip
                                                            icon={<BusinessIcon />}
                                                            label={`${alum.emisor.rfc} - ${alum.emisor.nombre}`}
                                                            color="primary"
                                                            variant="outlined"
                                                            size="small"
                                                            sx={{ fontWeight: 'bold' }}
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="⚠️ Sin Asignar (Predeterminado)"
                                                            color="warning"
                                                            size="small"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {alum.requiere_factura && alum.receptor ? (
                                                        <Chip
                                                            icon={<ReceiptIcon />}
                                                            label={`RFC: ${alum.receptor.rfc}`}
                                                            color="success"
                                                            size="small"
                                                        />
                                                    ) : (
                                                        <Chip
                                                            label="RFC Genérico (Público General)"
                                                            color="default"
                                                            size="small"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell align="center">
                                                    <Tooltip title="⚡ Emitir Ficha de Pago Complementaria / Trámite">
                                                        <IconButton size="small" color="secondary" onClick={() => handleAbrirModalComplementario(alum)}>
                                                            <ReceiptIcon />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Editar Alumno y Estatus">
                                                        <IconButton size="small" color="primary" onClick={() => handleEditAlumno(alum)}>
                                                            <EditIcon />
                                                        </IconButton>
                                                    </Tooltip>

                                                    <Tooltip title="Ver Detalles e Historial del Alumno">
                                                        <IconButton size="small" color="info" onClick={() => window.location.href = `/Cobranza/Alumnos/${alum.id}`}>
                                                            <HistoryIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>

                        {/* MODAL EMISIÓN DE FICHA COMPLEMENTARIA POR ALUMNO */}
                        <Dialog open={openComplementariaModal} onClose={() => setOpenComplementariaModal(false)} maxWidth="sm" fullWidth>
                            <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ReceiptIcon /> Emitir Ficha de Pago Complementaria por Alumno
                            </DialogTitle>
                            <DialogContent dividers sx={{ p: 3 }}>
                                {alumnoComplementario && (
                                    <Box sx={{ mb: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                        <Typography variant="subtitle2" color="primary" fontWeight="bold">
                                            Estudiante: {alumnoComplementario.nombre} {alumnoComplementario.apellido_paterno} {alumnoComplementario.apellido_materno || ''}
                                        </Typography>
                                        <Typography variant="caption" color="textSecondary" display="block">
                                            Matrícula: <strong>{alumnoComplementario.matricula}</strong> | Carrera: {alumnoComplementario.carrera} (Semestre {alumnoComplementario.semestre})
                                        </Typography>
                                    </Box>
                                )}

                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                                <Grid container spacing={2}>
                                    {/* SECCIÓN MULTI-CONCEPTO DE COBRO PARA LA FICHA */}
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#1b384a', mb: 1 }}>
                                            📑 Conceptos de Cobro y Facturación incluidos en esta Ficha:
                                        </Typography>
                                        {(formComplementario.items || []).map((item, idx) => (
                                            <Box key={idx} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1.5 }}>
                                                <TextField
                                                    select
                                                    label={`Concepto ${idx + 1} *`}
                                                    fullWidth
                                                    size="small"
                                                    value={item.concepto || 'Mensualidad'}
                                                    onChange={(e) => handleItemChangeComplementario(idx, 'concepto', e.target.value)}
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
                                                    onChange={(e) => handleItemChangeComplementario(idx, 'monto', e.target.value)}
                                                    placeholder="0.00"
                                                />
                                                {(formComplementario.items || []).length > 1 && (
                                                    <IconButton color="error" size="small" onClick={() => handleRemoveItemComplementario(idx)}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                )}
                                            </Box>
                                        ))}
                                        <Button
                                            startIcon={<AddIcon />}
                                            size="small"
                                            variant="outlined"
                                            onClick={handleAddItemComplementario}
                                            sx={{ textTransform: 'none', mt: 1, fontWeight: 'bold' }}
                                        >
                                            + Agregar otro cobro / concepto a esta ficha
                                        </Button>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: '#f8fafc', textAlign: 'center' }}>
                                            <Typography variant="caption" color="textSecondary" display="block">MONTO TOTAL FICHA:</Typography>
                                            <Typography variant="h5" fontWeight="bold" color="success.main">
                                                ${(formComplementario.items || []).reduce((acc, curr) => acc + (parseFloat(curr.monto) || 0), 0).toFixed(2)} MXN
                                            </Typography>
                                        </Paper>
                                    </Grid>

                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            fullWidth
                                            type="date"
                                            label="Fecha de Vencimiento *"
                                            InputLabelProps={{ shrink: true }}
                                            value={formComplementario.fecha_vencimiento}
                                            onChange={(e) => setFormComplementario({ ...formComplementario, fecha_vencimiento: e.target.value })}
                                        />
                                    </Grid>
                                </Grid>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setOpenComplementariaModal(false)}>Cancelar</Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleEmitirFichaComplementaria}
                                    disabled={saving}
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <ReceiptIcon />}
                                >
                                    {saving ? 'Generando...' : '⚡ Emitir Ficha Complementaria'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* MODAL ASIGNACIÓN MASIVA DE RAZÓN SOCIAL EMISORA */}
                        <Dialog open={openMasivaModal} onClose={() => setOpenMasivaModal(false)} maxWidth="md" fullWidth>
                            <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <BusinessIcon /> Asignación Masiva de Razón Social Emisora a Alumnos
                            </DialogTitle>
                            <DialogContent dividers sx={{ p: 3 }}>
                                <Typography variant="body2" color="textSecondary" sx={{ mb: 3 }}>
                                    Selecciona la Empresa/Razón Social Emisora que emitirá las pre-facturas de colegiatura para el grupo de estudiantes seleccionado.
                                </Typography>

                                <Grid container spacing={3} sx={{ mb: 3 }}>
                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Razón Social Emisora a Asignar"
                                            value={masivaForm.emisor_id}
                                            onChange={(e) => setMasivaForm({ ...masivaForm, emisor_id: e.target.value })}
                                        >
                                            {emisores.length === 0 ? (
                                                <MenuItem disabled value="">No hay emisores configurados</MenuItem>
                                            ) : (
                                                emisores.map((em) => (
                                                    <MenuItem key={em.id} value={em.id}>
                                                        {em.rfc} - {em.nombre}
                                                    </MenuItem>
                                                ))
                                            )}
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12} md={6}>
                                        <TextField
                                            select
                                            fullWidth
                                            label="Filtrar por Carrera"
                                            value={masivaForm.carrera_filtro}
                                            onChange={(e) => setMasivaForm({
                                                ...masivaForm,
                                                carrera_filtro: e.target.value,
                                                asignacion_total: e.target.value === 'TODAS'
                                            })}
                                        >
                                            <MenuItem value="TODAS">Todas las Carreras (Todos los Alumnos)</MenuItem>
                                            <MenuItem value="Ingeniería en Sistemas">Ingeniería en Sistemas</MenuItem>
                                            <MenuItem value="Administración de Empresas">Administración de Empresas</MenuItem>
                                            <MenuItem value="Derecho">Derecho</MenuItem>
                                            <MenuItem value="Contaduría Pública">Contaduría Pública</MenuItem>
                                            <MenuItem value="Medicina">Medicina</MenuItem>
                                        </TextField>
                                    </Grid>
                                </Grid>

                                <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1 }}>
                                    Seleccionar Alumnos Específicos (opcional):
                                </Typography>

                                <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 250 }}>
                                    <Table size="small" stickyHeader>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell padding="checkbox"></TableCell>
                                                <TableCell>Matrícula</TableCell>
                                                <TableCell>Nombre Alumno</TableCell>
                                                <TableCell>Carrera</TableCell>
                                                <TableCell>Estatus</TableCell>
                                                <TableCell>Emisor Actual</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {alumnos
                                                .filter(a => masivaForm.carrera_filtro === 'TODAS' || a.carrera === masivaForm.carrera_filtro)
                                                .map((alum) => {
                                                    const isChecked = masivaForm.alumnos_ids_seleccionados.includes(alum.id.toString());
                                                    return (
                                                        <TableRow key={alum.id} hover onClick={() => toggleSeleccionAlumnoMasivo(alum.id.toString())} sx={{ cursor: 'pointer' }}>
                                                            <TableCell padding="checkbox">
                                                                <Checkbox checked={isChecked} />
                                                            </TableCell>
                                                            <TableCell sx={{ fontFamily: 'monospace' }}>{alum.matricula}</TableCell>
                                                            <TableCell>{alum.nombre} {alum.apellido_paterno}</TableCell>
                                                            <TableCell>{alum.carrera}</TableCell>
                                                            <TableCell>
                                                                <Chip
                                                                    label={(alum.estatus || 'ACTIVO').toUpperCase()}
                                                                    size="small"
                                                                    color={(alum.estatus || 'ACTIVO').toUpperCase() === 'ACTIVO' ? 'success' : ((alum.estatus || '').toUpperCase() === 'BAJA' ? 'error' : 'secondary')}
                                                                />
                                                            </TableCell>
                                                            <TableCell>
                                                                {alum.emisor ? `${alum.emisor.rfc}` : 'Sin Asignar'}
                                                            </TableCell>
                                                        </TableRow>
                                                    );
                                                })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </DialogContent>
                            <DialogActions sx={{ p: 2 }}>
                                <Button onClick={() => setOpenMasivaModal(false)}>Cancelar</Button>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={handleEjecutarAsignacionMasiva}
                                    disabled={saving || !masivaForm.emisor_id}
                                    startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <FlashIcon />}
                                >
                                    {saving ? 'Asignando...' : '⚡ Aplicar Asignación Masiva'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* MODAL REGISTRO / EDICIÓN INDIVIDUAL DE ALUMNO */}
                        <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="md" fullWidth>
                            <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold' }}>
                                {form.alumno_id ? '✏️ Editar Alumno y Estatus Académico' : '👤 Registrar Nuevo Alumno'}
                            </DialogTitle>
                            <DialogContent dividers sx={{ p: 3 }}>
                                <Grid container spacing={2}>
                                    <Grid item xs={12} sm={4}>
                                        <TextField label="Matrícula" name="matricula" fullWidth value={form.matricula} onChange={handleChange} required />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField label="Nombre(s)" name="nombre" fullWidth value={form.nombre} onChange={handleChange} required />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField label="Apellido Paterno" name="apellido_paterno" fullWidth value={form.apellido_paterno} onChange={handleChange} required />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <TextField label="Apellido Materno" name="apellido_materno" fullWidth value={form.apellido_materno} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField label="Correo Electrónico" name="email" fullWidth value={form.email} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField label="Teléfono" name="telefono" fullWidth value={form.telefono} onChange={handleChange} />
                                    </Grid>

                                    <Grid item xs={12} sm={4}>
                                        <TextField select label="Plan de Estudio" name="programa_academico_id" fullWidth value={form.programa_academico_id || ''} onChange={(e) => {
                                            const selectedProg = programas.find(p => p.id.toString() === e.target.value);
                                            setForm(prev => ({
                                                ...prev,
                                                programa_academico_id: e.target.value,
                                                carrera: selectedProg ? selectedProg.nombre : prev.carrera
                                            }));
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
                                        <TextField label="Semestre" name="semestre" type="number" fullWidth value={form.semestre} onChange={handleChange} />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            select
                                            label="Estatus del Alumno"
                                            name="estatus"
                                            fullWidth
                                            value={form.estatus || 'ACTIVO'}
                                            onChange={handleChange}
                                            helperText="Estatus académico del alumno"
                                        >
                                            <MenuItem value="ACTIVO">🟢 ACTIVO (Predeterminado)</MenuItem>
                                            <MenuItem value="BAJA">🔴 BAJA (Manual / Detuvo estudios)</MenuItem>
                                            <MenuItem value="GRADUADO">🎓 GRADUADO (Manual / Completó cursos)</MenuItem>
                                        </TextField>
                                    </Grid>

                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="subtitle2" color="primary" fontWeight="bold">Configuración de Cobro Mensual</Typography>
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Monto Mensual de Colegiatura" 
                                            name="monto_personalizado" 
                                            type="number" 
                                            fullWidth 
                                            value={form.monto_personalizado} 
                                            onChange={handleChange} 
                                            required 
                                            helperText="Monto fijo que se cobrará cada mes a este alumno"
                                            InputProps={{ startAdornment: <Typography sx={{mr: 1, color: 'text.secondary'}}>$</Typography> }}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField 
                                            label="Motivo del Cambio de Monto (Opcional)" 
                                            name="motivo_cambio" 
                                            fullWidth 
                                            value={form.motivo_cambio || ''} 
                                            onChange={handleChange} 
                                            helperText="Si estás modificando el monto, indica la razón (ej. Beca 50%, Aumento anual)"
                                        />
                                    </Grid>

                                    {/* CLABE Y REFERENCIA DE PAGO PARA CONCILIACIÓN */}
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="CLABE Interbancaria Única (18 dígitos)"
                                            name="clabe_interbancaria"
                                            fullWidth
                                            value={form.clabe_interbancaria || ''}
                                            onChange={handleChange}
                                            placeholder="Ej. 012180015012345678"
                                            helperText="CLABE personalizada para conciliación bancaria automática"
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={6}>
                                        <TextField
                                            label="Referencia Personal de Pago Alumno"
                                            name="referencia_pago"
                                            fullWidth
                                            value={form.referencia_pago || ''}
                                            onChange={handleChange}
                                            placeholder="Ej. REF-ALU-1002"
                                            helperText="Referencia fija asignada para depósitos SPEI"
                                        />
                                    </Grid>

                                    {/* ID(S) ALUMNO / PLANES DE ESTUDIO ASOCIADOS */}
                                    <Grid item xs={12}>
                                        <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#166534', display: 'flex', alignItems: 'center', gap: 1 }}>
                                                🎓 ID(s) Alumno / Planes de Estudio Asignados (Múltiples)
                                            </Typography>
                                            <TextField
                                                fullWidth
                                                size="small"
                                                name="ids_alumno"
                                                label="IDs del Alumno por Plan de Estudio (separados por coma)"
                                                value={form.ids_alumno || ''}
                                                onChange={handleChange}
                                                placeholder="Ej. ID-SYS-2024-001, PLAN-CYBER-005, ID-MAESTRIA-02"
                                                helperText="Permite ingresar varios IDs o matrículas asociadas a los planes de estudio que esté cursando para su conciliación automática."
                                            />
                                        </Card>
                                    </Grid>

                                    {/* INFORMACIÓN ADICIONAL DE PAGO */}
                                    <Grid item xs={12}>
                                        <TextField
                                            multiline
                                            rows={2}
                                            fullWidth
                                            name="informacion_pago"
                                            label="Información Adicional / Instrucciones de Pago"
                                            value={form.informacion_pago || ''}
                                            onChange={handleChange}
                                            placeholder="Notas de pago, instrucciones bancarias o detalles específicos del alumno"
                                            helperText="Información complementaria de pago del estudiante"
                                        />
                                    </Grid>

                                    {/* SELECCIÓN DE RAZÓN SOCIAL EMISORA ASIGNADA */}
                                    <Grid item xs={12}>
                                        <Card variant="outlined" sx={{ p: 2, backgroundColor: '#f8fafc' }}>
                                            <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <BusinessIcon color="primary" /> Razón Social Emisora Asignada a este Alumno
                                            </Typography>
                                            <TextField
                                                select
                                                fullWidth
                                                size="small"
                                                name="emisor_id"
                                                label="Empresa / Razón Social Emisora"
                                                value={form.emisor_id}
                                                onChange={handleChange}
                                            >
                                                {emisores.map(e => (
                                                    <MenuItem key={e.id} value={e.id}>
                                                        {e.rfc} - {e.nombre} ({getDescripcionRegimen(e.regimen_fiscal || '601')})
                                                    </MenuItem>
                                                ))}
                                            </TextField>
                                        </Card>
                                    </Grid>

                                    {/* PERFIL FISCAL DEL ALUMNO */}
                                    <Grid item xs={12}>
                                        <Divider sx={{ my: 1 }} />
                                        <FormControlLabel
                                            control={<Switch checked={form.requiere_factura} onChange={handleChange} name="requiere_factura" color="primary" />}
                                            label={<Typography fontWeight="bold">El alumno solicita Factura CFDI con RFC propio</Typography>}
                                        />
                                    </Grid>

                                    {form.requiere_factura && (
                                        <>
                                            <Grid item xs={12} sm={6}>
                                                <TextField label="RFC del Alumno / Padre" name="rfc" fullWidth value={form.rfc} onChange={handleChange} required />
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                                <TextField label="Razón Social / Nombre Fiscal" name="razon_social" fullWidth value={form.razon_social} onChange={handleChange} required />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField label="Código Postal Fiscal" name="codigo_postal" fullWidth value={form.codigo_postal} onChange={handleChange} />
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField select label="Régimen Fiscal" name="regimen_fiscal" fullWidth value={form.regimen_fiscal} onChange={handleChange}>
                                                    {REGIMENES_FISCALES.map(r => (
                                                        <MenuItem key={r.clave} value={r.clave}>{r.clave} - {r.descripcion}</MenuItem>
                                                    ))}
                                                </TextField>
                                            </Grid>
                                            <Grid item xs={12} sm={4}>
                                                <TextField select label="Uso CFDI" name="uso_cfdi" fullWidth value={form.uso_cfdi} onChange={handleChange}>
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
                                <Button onClick={() => setOpenModal(false)}>Cancelar</Button>
                                <Button variant="contained" color="primary" onClick={handleSave} disabled={saving}>
                                    {saving ? 'Guardando...' : 'Guardar Alumno'}
                                </Button>
                            </DialogActions>
                        </Dialog>

                        {/* MODAL DE IMPORTACIÓN DESDE EXCEL */}
                        <Dialog open={openImportModal} onClose={() => !saving && setOpenImportModal(false)} maxWidth="md" fullWidth>
                            <DialogTitle sx={{ backgroundColor: '#1b384a', color: 'white', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>📥 Importar Alumnos desde Excel</span>
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    size="small"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleDescargarPlantillaAlumnos}
                                    sx={{ textTransform: 'none', fontWeight: 'bold' }}
                                >
                                    Descargar Plantilla
                                </Button>
                            </DialogTitle>
                            <DialogContent dividers sx={{ p: 3 }}>
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                                {importSuccessMessage && <Alert severity="success" sx={{ mb: 2 }}>{importSuccessMessage}</Alert>}
                                
                                <Box sx={{ border: '2px dashed #cbd5e1', borderRadius: 2, p: 3, textAlign: 'center', mb: 3, bgcolor: '#f8fafc' }}>
                                    <CloudUploadIcon sx={{ fontSize: 40, color: 'text.secondary', mb: 1 }} />
                                    <Typography variant="body1" fontWeight="bold" sx={{ mb: 1 }}>
                                        Selecciona el archivo Excel (.xlsx)
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary" display="block" sx={{ mb: 2 }}>
                                        Usa la plantilla descargada para asegurar que los encabezados correspondan.
                                    </Typography>
                                    <Button variant="outlined" component="label" disabled={saving}>
                                        Seleccionar Archivo
                                        <input type="file" accept=".xlsx" hidden onChange={handleUploadExcel} />
                                    </Button>
                                    {importFile && (
                                        <Typography variant="body2" sx={{ mt: 2, fontWeight: 'bold' }} color="primary">
                                            Archivo cargado: {importFile.name} ({importRows.length} filas detectadas)
                                        </Typography>
                                    )}
                                </Box>

                                {importErrors.length > 0 && (
                                    <Box sx={{ mb: 3, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fca5a5' }}>
                                        <Typography variant="subtitle2" color="error" fontWeight="bold" sx={{ mb: 1 }}>
                                            ⚠️ Errores / Advertencias detectadas:
                                        </Typography>
                                        <Box sx={{ maxHeight: 150, overflowY: 'auto' }}>
                                            {importErrors.map((err, idx) => (
                                                <Typography key={idx} variant="caption" color="error" display="block">
                                                    • {err}
                                                </Typography>
                                            ))}
                                        </Box>
                                    </Box>
                                )}

                                {importRows.length > 0 && (
                                     <Box>
                                         <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 1, color: '#1b384a' }}>
                                             Vista Previa de Alumnos ({importRows.length} detectados):
                                         </Typography>
                                         <TableContainer component={Paper} variant="outlined" sx={{ maxHeight: 350 }}>
                                             <Table size="small" stickyHeader>
                                                 <TableHead>
                                                     <TableRow>
                                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Matrícula *</TableCell>
                                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Nombre *</TableCell>
                                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Apellido Paterno *</TableCell>
                                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Plan de Estudios (Carrera) *</TableCell>
                                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9' }}>Monto Mensual *</TableCell>
                                                         <TableCell sx={{ fontWeight: 'bold', backgroundColor: '#f1f5f9', textAlign: 'center' }}>Quitar</TableCell>
                                                     </TableRow>
                                                 </TableHead>
                                                 <TableBody>
                                                     {importRows.map((row, idx) => {
                                                         const isCarreraValida = (programas || []).some(p => (p.nombre || '').trim().toLowerCase() === (row.carrera || '').trim().toLowerCase());
                                                         return (
                                                             <TableRow key={idx} hover>
                                                                 <TableCell sx={{ minWidth: 110 }}>
                                                                     <TextField
                                                                         size="small"
                                                                         variant="standard"
                                                                         value={row.matricula}
                                                                         onChange={(e) => handleUpdateImportRow(idx, 'matricula', e.target.value)}
                                                                         error={!row.matricula}
                                                                         fullWidth
                                                                     />
                                                                 </TableCell>
                                                                 <TableCell sx={{ minWidth: 120 }}>
                                                                     <TextField
                                                                         size="small"
                                                                         variant="standard"
                                                                         value={row.nombre}
                                                                         onChange={(e) => handleUpdateImportRow(idx, 'nombre', e.target.value)}
                                                                         error={!row.nombre}
                                                                         fullWidth
                                                                     />
                                                                 </TableCell>
                                                                 <TableCell sx={{ minWidth: 120 }}>
                                                                     <TextField
                                                                         size="small"
                                                                         variant="standard"
                                                                         value={row.apellido_paterno}
                                                                         onChange={(e) => handleUpdateImportRow(idx, 'apellido_paterno', e.target.value)}
                                                                         error={!row.apellido_paterno}
                                                                         fullWidth
                                                                     />
                                                                 </TableCell>
                                                                 <TableCell sx={{ minWidth: 260 }}>
                                                                     <TextField
                                                                         select
                                                                         size="small"
                                                                         variant="standard"
                                                                         value={row.carrera}
                                                                         onChange={(e) => handleUpdateImportRow(idx, 'carrera', e.target.value)}
                                                                         error={!isCarreraValida}
                                                                         fullWidth
                                                                     >
                                                                         {row.carrera && !isCarreraValida && (
                                                                             <MenuItem value={row.carrera} disabled style={{ color: 'red', fontWeight: 'bold' }}>
                                                                                 ⚠️ Sin Catálogo: {row.carrera}
                                                                             </MenuItem>
                                                                         )}
                                                                         {(programas || []).map((p) => (
                                                                             <MenuItem key={p.id.toString()} value={p.nombre}>
                                                                                 {p.nombre}
                                                                             </MenuItem>
                                                                         ))}
                                                                     </TextField>
                                                                 </TableCell>
                                                                 <TableCell sx={{ minWidth: 100 }}>
                                                                     <TextField
                                                                         size="small"
                                                                         variant="standard"
                                                                         type="number"
                                                                         value={row.monto_personalizado}
                                                                         onChange={(e) => handleUpdateImportRow(idx, 'monto_personalizado', parseFloat(e.target.value) || 0)}
                                                                         error={isNaN(parseFloat(row.monto_personalizado)) || parseFloat(row.monto_personalizado) <= 0}
                                                                         fullWidth
                                                                     />
                                                                 </TableCell>
                                                                 <TableCell align="center">
                                                                     <IconButton
                                                                         color="error"
                                                                         size="small"
                                                                         onClick={() => {
                                                                             setImportRows(prev => {
                                                                                 const newRows = prev.filter((_, rowIdx) => rowIdx !== idx);
                                                                                 const errors = [];
                                                                                 newRows.forEach((r, rowIdx) => {
                                                                                     if (!r.matricula) errors.push(`Fila ${rowIdx + 2}: Matrícula es requerida.`);
                                                                                     if (!r.nombre) errors.push(`Fila ${rowIdx + 2}: Nombre es requerido.`);
                                                                                     if (!r.apellido_paterno) errors.push(`Fila ${rowIdx + 2}: Apellido Paterno es requerido.`);
                                                                                     if (isNaN(parseFloat(r.monto_personalizado)) || parseFloat(r.monto_personalizado) <= 0) {
                                                                                         errors.push(`Fila ${rowIdx + 2}: Monto Mensual debe ser un número válido mayor a 0.`);
                                                                                     }
                                                                                     if (r.requiere_factura === 'SÍ' || r.requiere_factura === 'SI' || r.requiere_factura === true) {
                                                                                         if (!r.rfc || !r.razon_social) {
                                                                                             errors.push(`Fila ${rowIdx + 2}: RFC y Razón Social son requeridos si requiere factura.`);
                                                                                         }
                                                                                     }
                                                                                     if (r.carrera) {
                                                                                         const normalizedCarrera = r.carrera.trim().toLowerCase();
                                                                                         const existeProg = (programas || []).some(p => (p.nombre || '').trim().toLowerCase() === normalizedCarrera);
                                                                                         if (!existeProg) {
                                                                                             errors.push(`Fila ${rowIdx + 2}: El plan de estudio/carrera "${r.carrera}" no existe en el catálogo.`);
                                                                                         }
                                                                                     } else {
                                                                                         errors.push(`Fila ${rowIdx + 2}: Carrera/Plan de estudio es requerido.`);
                                                                                     }
                                                                                 });
                                                                                 setImportErrors(errors);
                                                                                 return newRows;
                                                                             });
                                                                         }}
                                                                     >
                                                                         <DeleteIcon fontSize="small" />
                                                                     </IconButton>
                                                                 </TableCell>
                                                             </TableRow>
                                                         );
                                                     })}
                                                 </TableBody>
                                             </Table>
                                         </TableContainer>
                                     </Box>
                                 )}
                             </DialogContent>
                             <DialogActions sx={{ p: 2 }}>
                                 <Button onClick={() => setOpenImportModal(false)} disabled={saving}>Cancelar</Button>
                                 <Button
                                     variant="contained"
                                     color="primary"
                                     onClick={handleConfirmImport}
                                     disabled={saving || importRows.length === 0 || importErrors.length > 0}
                                     startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <CloudUploadIcon />}
                                 >
                                     {saving ? 'Importando...' : 'Confirmar e Importar'}
                                 </Button>
                             </DialogActions>
                         </Dialog>
         </Box>
    );
}
