'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
    MRT_Localization_ES
} from 'material-react-table';
import {
    Box,
    IconButton,
    Chip,
    Menu,
    MenuItem,
    LinearProgress,
    Button,
    Tooltip,
    Typography,
    useTheme,
    useMediaQuery,
    Grid,
    Drawer,
    Stack
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Payment as PaymentIcon,
    Email as EmailIcon,
    CloudUpload as TimbrarIcon,
    CloudDownload as DescargarIcon,
    Send as TimbrarEnviarIcon,
    PictureAsPdf as PdfIcon,
    ContentCopy as CloneIcon,
    Cancel as CancelIcon,
    FileDownload as ExportIcon,
    FilterList as FilterListIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import { WithPermission } from '@/components/WithPermission';

// Modals
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar'; // Relative path from original file structure
import ModalConfirm from '@/components/Home/Modales/modalConfirm'; // Assuming this exists based on usage in original
import PagoModalWithPayPal from '@/components/CompraTimbres/PagoModal';

// Utils
import { formatCurrency } from '@/utils/formatCurrency';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const DataTableMRT = ({ token, filterType = "EXCLUDE_N" }) => {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

    // Action Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);

    // Modal States
    const [openModalSuccess, setOpenModalSuccess] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalTimbrar, setOpenModalTimbrar] = useState(false);
    const [openModalCancelar, setOpenModalCancelar] = useState(false);
    const [openModalConfirm, setOpenModalConfirm] = useState(false);

    // Operation States
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [facturasTimbrar, setFacturasTimbrar] = useState([]);
    const [facturasRemplazo, setFacturasRemplazo] = useState([]);
    const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
    const [resultadoCancelar, setResultadoCancelar] = useState(null);
    const [idsFacturasToDelete, setIdsFacturasToDelete] = useState([]);

    // --- BOD ---
    const [isBOD] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('BOD')) === true;
        } catch {
            return false;
        }
    });

    const [openPagoModal, setOpenPagoModal] = useState(false);
    const [idsPendientesTimbrar, setIdsPendientesTimbrar] = useState([]);
    const [pagoConfirmado, setPagoConfirmado] = useState(false);
    const [accionPostPago, setAccionPostPago] = useState(null);

    // -- Data Fetching --
    const fetchData = useCallback(async () => {
        if (token) {
            setIsLoading(true);
            try {
                const response = await fetch(`${apiUrl}/api/facturas/ListarFacturas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const responseData = await response.json();

                if (Array.isArray(responseData)) {
                    // Aplicar filtrado dinámico según el prop filterType
                    let filteredData = responseData;

                    if (filterType === "EXCLUDE_N") {
                        filteredData = responseData.filter(item => item.TipoDeComprobante !== 'N');
                    } else if (filterType === "ONLY_N") {
                        filteredData = responseData.filter(item => item.TipoDeComprobante === 'N');
                    }

                    const normalizedData = filteredData.map(item => ({
                        ...item,
                        Conceptos: item.Conceptos || {
                            TotalImpuestosTrasladados: 0,
                            TotalImpuestosRetenidos: 0
                        },
                        Emisor: item.Emisor || { Nombre: 'Desconocido', Rfc: '' },
                        Receptor: item.Receptor || { Nombre: 'Desconocido', Rfc: '' },
                        MontoTotalPagos: item.Complemento?.Pagos?.Totales?.MontoTotalPagos || 0,
                        fullObject: item,
                        statusObj: item
                    }));
                    setData(normalizedData.sort((a, b) => b.ID - a.ID));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setIsLoading(false);
            }
        }
    }, [token, filterType]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // -- Action Handlers --

    // Handle Cancel Results
    useEffect(() => {
        if (resultadoCancelar === "success") {
            setOpenModalSuccess(true);
            setConfirmationMessage('Factura cancelada exitosamente.');
            setIDFacturaCancelada(null);
            fetchData();
        } else if (resultadoCancelar === "error") {
            setOpenModalError(true);
            setConfirmationMessage('Error al cancelar facturas.');
            setIDFacturaCancelada(null);
            fetchData();
        }
    }, [resultadoCancelar, fetchData]);

    const handleEnviarCorreo = useCallback(async (ids) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/enviofacturas/EnviarFacturas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ids),
            });

            if (response.ok) {
                setConfirmationMessage('Las facturas se han enviado correctamente por correo.');
                setOpenModalSuccess(true);
            }
        } catch (error) {
            setConfirmationMessage('Error al enviar las facturas por correo.');
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const handleTimbrar = useCallback(async (ids) => {

        if (isBOD) {
            setIdsPendientesTimbrar(ids);
            setAccionPostPago('TIMBRAR');
            setOpenPagoModal(true);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/timbradocorporativo/TimbradoCorporativo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Facturas_ID: ids }),
            });

            if (response.ok) {
                const data = await response.json();
                if (data.Facturas.length > 1) {
                    setOpenModalTimbrar(true);
                    setFacturasTimbrar(data.Facturas.map(f => ({
                        id: f.facturaID,
                        status: f.status,
                        error: f.error || null,
                    })));
                } else {
                    const factura = data.Facturas[0];
                    if (factura.status === 'success') {
                        setConfirmationMessage('Facturas timbradas exitosamente.');
                        setOpenModalSuccess(true);
                    } else {
                        const errorMensaje =
                            factura?.error ||
                            data?.servicioTimbrado?.mensaje ||
                            data?.mensaje ||
                            'Error desconocido al timbrar';
                        setConfirmationMessage('Error al timbrar facturas: ' + errorMensaje);
                        setOpenModalError(true);
                    }
                }
            }
        } catch {
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
            fetchData();
        }
    }, [token, fetchData, isBOD]);


    const handleTimbrarBOD = useCallback(async (ids) => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `${apiUrl}/api/timbradocorporativo/TimbradoCorporativoBOD`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ Facturas_ID: ids }),
                }
            );

            if (!response.ok) {
                throw new Error('Error en timbrado BOD');
            }

            setConfirmationMessage('Facturas timbradas correctamente.');
            setOpenModalSuccess(true);

        } catch (error) {
            setConfirmationMessage(error.message || 'Error en timbrado BOD');
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
            fetchData();
        }
    }, [token, fetchData]);


    const handleDownloadSelecteds = useCallback(async (ids) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/descargararchivos/DescargarArchivos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ids),
            });

            if (response.ok) {
                const blob = await response.blob();
                const getFileNameFromHeaders = (headers) => {
                    const contentDisposition = headers.get('Content-Disposition');
                    if (!contentDisposition) return null;
                    const matches = contentDisposition.match(/filename\*?=["']?([^"']+)["']?/i) ||
                        contentDisposition.match(/filename=["']?([^"']+)["']?/i);
                    if (matches && matches[1]) {
                        let fileName = matches[1];
                        if (fileName.startsWith("UTF-8''")) {
                            fileName = decodeURIComponent(fileName.substring(7));
                        }
                        return fileName.replace(/"/g, '');
                    }
                    return null;
                };
                const fileName = getFileNameFromHeaders(response.headers) ||
                    (ids.length === 1 ? 'Factura.zip' : 'Facturas.zip');

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();
                window.URL.revokeObjectURL(url);

                setConfirmationMessage(`Su archivo "${fileName}" se ha descargado. Revise su carpeta de descargas.`);
                setOpenModalSuccess(true);
            } else {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Error en la respuesta del servidor');
            }
        } catch (error) {
            console.error('Error al descargar:', error);
            setConfirmationMessage(error.message || 'Error al descargar la factura.');
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const handleTimbrarYEnviar = useCallback(async (ids) => {
        setIsLoading(true);
        setConfirmationMessage('Procesando timbrado y envío de facturas...');
        try {
            const timbradoResponse = await fetch(`${apiUrl}/api/timbradocorporativo/TimbradoCorporativo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Facturas_ID: ids }),
            });

            if (!timbradoResponse.ok) throw new Error('Error en el timbrado');
            const timbradoData = await timbradoResponse.json();
            const facturasTimbradasExitosas = timbradoData.Facturas.filter(
                factura => factura.status === 'success'
            );

            if (facturasTimbradasExitosas.length === 0) {
                throw new Error('Ninguna factura se timbró correctamente');
            }

            const idsTimbrados = facturasTimbradasExitosas.map(factura => factura.facturaID);
            await fetch(`${apiUrl}/api/enviofacturas/EnviarFacturas`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(idsTimbrados),
            });

            let message = '';
            if (facturasTimbradasExitosas.length === ids.length) {
                message = 'Todas las facturas se timbraron y enviaron correctamente.';
            } else {
                const fallidas = ids.length - facturasTimbradasExitosas.length;
                message = `${facturasTimbradasExitosas.length} facturas timbradas y enviadas correctamente. ${fallidas} facturas no se pudieron procesar.`;
            }

            setConfirmationMessage(message);
            setOpenModalSuccess(true);

            if (facturasTimbradasExitosas.length > 0 && facturasTimbradasExitosas.length < ids.length) {
                setFacturasTimbrar(timbradoData.Facturas.map(factura => ({
                    id: factura.facturaID,
                    status: factura.status,
                    error: factura.error || null,
                })));
                setOpenModalTimbrar(true);
            }
        } catch (error) {
            setConfirmationMessage(`Error al procesar las facturas: ${error.message}`);
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
            fetchData();
        }
    }, [token, fetchData]);

    const handleViewPdf = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/descargararchivos/VerPDF/${id}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                const blob = await response.blob();
                const pdfUrl = URL.createObjectURL(blob);
                window.open(pdfUrl, '_blank');
            }
        } catch (error) {
            setConfirmationMessage('Error al visualizar la factura: ' + error.message);
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const handleCancelarFactura = useCallback((row) => {
        const filtro = {
            Emisor: row.Emisor.Rfc,
            Receptor: row.Receptor.Rfc,
            Estatus: 'timbrada'
        };
        const registros = data.filter(r =>
            r.Emisor.Rfc === filtro.Emisor &&
            r.Receptor.Rfc === filtro.Receptor &&
            r.uuid
        );
        setIDFacturaCancelada(row.ID);
        setFacturasRemplazo(registros);
        setOpenModalCancelar(true);
    }, [data]);

    const handleAcuseCancelacion = useCallback(async (id) => {
        setIsLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/descargararchivos/VerPDF/${id}`, {
                method: 'GET',
                headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
                const blob = await response.blob();
                const pdfUrl = URL.createObjectURL(blob);
                window.open(pdfUrl, '_blank');
            }
        } catch (error) {
            setConfirmationMessage('Error al visualizar el acuse de cancelación: ' + error.message);
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    const handleDeleteFactura = useCallback(async () => {
        const idsToDelete = [...idsFacturasToDelete];
        if (idsToDelete.length === 0) return;

        setIsLoading(true);
        try {
            const results = await Promise.all(idsToDelete.map(async (id) => {
                if (!id) return false;
                const url = `${window.location.origin}/api/facturas/direct-delete?id=${id}`;
                console.log(`Intentando eliminar factura directamente en: ${url}`);
                try {
                    const response = await fetch(url, {
                        method: 'DELETE',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                    });


                    if (!response.ok) {
                        const errorBody = await response.text();
                        console.error(`Error al eliminar ID ${id}. Status: ${response.status}, Body: ${errorBody}`);
                        return false;
                    }
                    console.log(`ID ${id} eliminado exitosamente.`);
                    return true;
                } catch (err) {
                    console.error(`Error de red al eliminar ID ${id}:`, err);
                    return false;
                }
            }));


            const allOk = results.length > 0 && results.every(res => res);
            const someOk = results.some(res => res);

            if (allOk) {
                setConfirmationMessage(idsToDelete.length === 1 ? 'Factura eliminada correctamente.' : 'Facturas eliminadas correctamente.');
                setOpenModalSuccess(true);
            } else if (someOk) {
                setConfirmationMessage('Algunas facturas no se pudieron eliminar.');
                setOpenModalError(true);
            } else {
                setConfirmationMessage('Error al eliminar las facturas. Por favor, verifica el estado de las mismas.');
                setOpenModalError(true);
            }
            fetchData();
        } catch (error) {
            console.error('Error en la solicitud DELETE:', error);
            setConfirmationMessage('Ocurrió un error inesperado al eliminar.');
            setOpenModalError(true);
        } finally {
            setIsLoading(false);
            setOpenModalConfirm(false);
            setMenuRow(null);
            setIdsFacturasToDelete([]);
        }
    }, [idsFacturasToDelete, token, fetchData]);

    const handleFacturaPago = useCallback(async (row) => {
        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${row.Emisor.ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const data = await response.json();
                const opciones = data.filter(opcion => opcion.TipoComprobante === 'P');
                if (opciones.length > 0) {
                    router.push(`/FacturaPago/${row.ID}`);
                } else {
                    setConfirmationMessage('No existe serie de pago, validar');
                    setOpenModalError(true);
                }
            }
        } catch (error) {
            console.error('Error fetching serie:', error);
        }
    }, [token, router]);

    useEffect(() => {
        if (!pagoConfirmado || idsPendientesTimbrar.length === 0) return;

        const procesarPostPago = async () => {
            try {
                if (accionPostPago === 'TIMBRAR') {
                    await handleTimbrarBOD(idsPendientesTimbrar);
                }

                if (accionPostPago === 'TIMBRAR_Y_ENVIAR') {
                    await handleTimbrarBOD(idsPendientesTimbrar);
                    await fetch(`${apiUrl}/api/enviofacturas/EnviarFacturas`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(idsPendientesTimbrar),
                    });

                    setConfirmationMessage('Facturas timbradas y enviadas correctamente.');
                    setOpenModalSuccess(true);
                }
            } catch (error) {
                setConfirmationMessage(
                    error.message || 'Error al procesar facturas después del pago.'
                );
                setOpenModalError(true);
            } finally {
                setPagoConfirmado(false);
                setIdsPendientesTimbrar([]);
                setAccionPostPago(null);
                fetchData();
            }
        };

        procesarPostPago();
    }, [
        pagoConfirmado,
        idsPendientesTimbrar,
        accionPostPago,
        handleTimbrarBOD,
        token,
        fetchData
    ]);


    // -- Unique Lists for Autocomplete --
    const uniqueEmisores = useMemo(() => {
        const emisores = data.map(item => item.Emisor).filter(Boolean);
        const unique = Array.from(new Set(emisores.map(e => JSON.stringify({ Nombre: e.Nombre, Rfc: e.Rfc }))))
            .map(s => JSON.parse(s));
        return unique.sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || ''));
    }, [data]);

    const uniqueReceptores = useMemo(() => {
        const receptores = data.map(item => item.Receptor).filter(Boolean);
        const unique = Array.from(new Set(receptores.map(r => JSON.stringify({ Nombre: r.Nombre, Rfc: r.Rfc }))))
            .map(s => JSON.parse(s));
        return unique.sort((a, b) => (a.Nombre || '').localeCompare(b.Nombre || ''));
    }, [data]);

    // -- Columns Definition --
    const columns = useMemo(() => [
        {
            id: 'MobileSummary',
            header: 'Resumen',
            enableColumnFilter: false,
            enableSorting: false,
            Cell: ({ row }) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" fontWeight="bold">#{row.original.ID}</Typography>
                        {(() => {
                            const value = row.original;
                            let status = 'No timbrada';
                            let color = 'default';
                            if (value.Estatus === 'Cancelada') {
                                status = 'Cancelada';
                                color = 'error';
                            } else if (value.uuid) {
                                status = 'Timbrada';
                                color = 'success';
                            }
                            return <Chip label={status} color={color} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />;
                        })()}
                    </Box>
                    <Typography variant="caption" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        <b>Emisor:</b> {row.original.Emisor?.Nombre || 'Desconocido'}
                    </Typography>
                    <Typography variant="caption" sx={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
                        <b>Receptor:</b> {row.original.Receptor?.Nombre || 'Desconocido'}
                    </Typography>
                    <Typography variant="subtitle2" fontWeight="bold" sx={{ mt: 0.5 }}>
                        Total: {formatCurrency(row.original.Total || 0)}
                    </Typography>
                </Box>
            ),
        },
        {
            accessorKey: 'ID',
            header: 'ID',
            enableColumnFilter: false,
            size: 80,
        },
        {
            accessorKey: 'Folio',
            header: 'Folio',
            size: 100,
            filterFn: 'contains',
        },
        {
            accessorKey: 'uuid',
            header: 'UUID',
            size: 250,
            filterFn: 'contains',
            Cell: ({ cell }) => cell.getValue() || 'Sin timbrar',
        },
        {
            accessorKey: 'Emisor',
            header: 'Emisor',
            size: 250,
            Cell: ({ cell }) => {
                const emisor = cell.getValue();
                return emisor ? `${emisor.Nombre} (${emisor.Rfc})` : '';
            },
            filterFn: (row, id, filterValue) => {
                const emisor = row.getValue(id);
                const str = `${emisor?.Nombre || ''} (${emisor?.Rfc || ''})`.toLowerCase();
                return str.includes(filterValue.toLowerCase());
            },
            Filter: ({ column, table }) => {
                return (
                    <Autocomplete
                        options={uniqueEmisores}
                        getOptionLabel={(option) => `${option.Nombre} (${option.Rfc})`}
                        onChange={(e, value) => {
                            column.setFilterValue(value ? `${value.Nombre} (${value.Rfc})` : '');
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                variant="standard"
                                placeholder="Filtrar Emisor"
                            />
                        )}
                    />
                );
            }
        },
        {
            accessorKey: 'Receptor',
            header: 'Receptor',
            size: 250,
            Cell: ({ cell }) => {
                const receptor = cell.getValue();
                return receptor ? `${receptor.Nombre} (${receptor.Rfc})` : '';
            },
            filterFn: (row, id, filterValue) => {
                const receptor = row.getValue(id);
                const str = `${receptor?.Nombre || ''} (${receptor?.Rfc || ''})`.toLowerCase();
                return str.includes(filterValue.toLowerCase());
            },
            Filter: ({ column }) => (
                <Autocomplete
                    options={uniqueReceptores}
                    getOptionLabel={(option) => `${option.Nombre} (${option.Rfc})`}
                    onChange={(e, value) => {
                        column.setFilterValue(value ? `${value.Nombre} (${value.Rfc})` : '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="standard"
                            placeholder="Filtrar Receptor"
                        />
                    )}
                />
            )
        },
        {
            accessorKey: 'Fecha',
            header: 'Fecha\nEmisión',
            size: 250,
            filterFn: (row, id, filterValue) => {
                if (!filterValue) return true;
                // filterValue expects [start, end] strings in YYYY-MM-DD format
                const [start, end] = Array.isArray(filterValue) ? filterValue : [null, null];
                if (!start && !end) return true;

                const rowDate = dayjs(row.getValue(id));
                if (!rowDate.isValid()) return false;

                const s = start ? dayjs(start) : null;
                const e = end ? dayjs(end) : null;

                if (s && e) {
                    return rowDate.isSame(s, 'day') || rowDate.isSame(e, 'day') || (rowDate.isAfter(s) && rowDate.isBefore(e));
                } else if (s) {
                    return rowDate.isSame(s, 'day') || rowDate.isAfter(s);
                } else if (e) {
                    return rowDate.isSame(e, 'day') || rowDate.isBefore(e);
                }
                return true;
            },
            Filter: ({ column }) => {
                const filterValue = column.getFilterValue() || [null, null];
                const [startDate, endDate] = filterValue;

                return (
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            <DatePicker
                                value={startDate ? dayjs(startDate) : null}
                                onChange={(newValue) => {
                                    const newStart = newValue ? newValue.format('YYYY-MM-DD') : null;
                                    column.setFilterValue([newStart, endDate]);
                                }}
                                slotProps={{
                                    textField: {
                                        variant: 'standard',
                                        placeholder: 'De',
                                        sx: { minWidth: '100px' }
                                    }
                                }}
                                disableFuture
                            />
                            <DatePicker
                                value={endDate ? dayjs(endDate) : null}
                                onChange={(newValue) => {
                                    const newEnd = newValue ? newValue.format('YYYY-MM-DD') : null;
                                    column.setFilterValue([startDate, newEnd]);
                                }}
                                slotProps={{
                                    textField: {
                                        variant: 'standard',
                                        placeholder: 'Hasta',
                                        sx: { minWidth: '100px' }
                                    }
                                }}
                                disableFuture
                            />
                        </Box>
                    </LocalizationProvider>
                );
            },
            Cell: ({ cell }) => dayjs(cell.getValue()).format('DD/MM/YYYY HH:mm')
        },
        {
            accessorKey: 'fechaTimbrado',
            header: 'Fecha\nTimbrado',
            size: 150,
            filterFn: (row, id, filterValue) => {
                if (!filterValue) return true;
                const val = row.getValue(id);
                if (!val) return false;
                const dateRow = dayjs(val).format('YYYY-MM-DD');
                return dateRow === filterValue;
            },
            Filter: ({ column }) => (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                        onChange={(newValue) => {
                            column.setFilterValue(newValue ? newValue.format('YYYY-MM-DD') : undefined);
                        }}
                        slotProps={{
                            textField: {
                                variant: 'standard',
                                placeholder: 'Filtrar Fecha'
                            }
                        }}
                        disableFuture
                    />
                </LocalizationProvider>
            ),
            Cell: ({ cell }) => {
                const val = cell.getValue();
                return val ? dayjs(val).format('DD/MM/YYYY HH:mm') : <Chip label="Sin timbrar" color="warning" size="small" />;
            }
        },
        {
            accessorKey: 'MetodoPago',
            header: 'Método de\nPago',
            size: 100,
            filterFn: 'contains',
        },
        {
            accessorKey: 'Serie',
            header: 'Serie',
            size: 100,
            filterFn: 'contains',
        },
        {
            accessorKey: 'MontoTotalPagos',
            header: 'Monto Pago',
            size: 120,
            Cell: ({ row }) => {
                if (row.original.TipoDeComprobante === 'P') {
                    return formatCurrency(row.original.MontoTotalPagos || 0);
                }
                return '-';
            },
            enableColumnFilter: false,
        },
        {
            id: 'Estatus',
            accessorFn: (row) => row.statusObj,
            header: 'Estatus',
            size: 150,
            Cell: ({ row }) => {
                const value = row.original;
                let status = 'No timbrada';
                let color = 'default';

                if (value.Estatus === 'Cancelada') {
                    status = 'Cancelada';
                    color = 'error';
                } else if (value.uuid) {
                    status = 'Timbrada';
                    color = 'success';
                }
                return <Chip label={status} color={color} size="small" />;
            },
            filterVariant: 'select',
            filterSelectOptions: ['Timbrada', 'No timbrada', 'Cancelada'],
            filterFn: (row, id, filterValue) => {
                const value = row.original;
                let status = 'No timbrada';
                if (value.Estatus === 'Cancelada') status = 'Cancelada';
                else if (value.uuid) status = 'Timbrada';
                return status === filterValue;
            }
        },
        {
            accessorKey: 'SubTotal',
            header: 'Subtotal',
            size: 120,
            Cell: ({ cell }) => formatCurrency(cell.getValue() || 0),
            enableColumnFilter: false,
        },
        {
            accessorKey: 'Total',
            header: 'Total',
            size: 120,
            Cell: ({ cell }) => formatCurrency(cell.getValue() || 0),
            enableColumnFilter: false,
        },
    ], [uniqueEmisores, uniqueReceptores]);

    // -- Row Menu Helpers --
    const handleCloseMenu = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    const handleEdit = () => {
        if (menuRow?.TipoDeComprobante === 'P') {
            router.push(`/EditarComplementoPago/${menuRow.ID}`);
        } else {
            router.push(`/EditarFactura/${menuRow.ID}`);
        }
        handleCloseMenu();
    };

    const handleClone = () => {
        router.push(`/CrearFactura/${menuRow.ID}`);
        handleCloseMenu();
    };

    const handleDelete = () => {
        const id = menuRow.ID || menuRow.id || menuRow.Id;
        if (!id) {
            setConfirmationMessage('No se pudo identificar el ID de la factura.');
            setOpenModalError(true);
            return;
        }
        setIdsFacturasToDelete([id]);
        setConfirmationMessage('¿Estás seguro de que deseas eliminar esta factura?');
        setOpenModalConfirm(true);
        handleCloseMenu();
    };

    const handleDeleteSelected = (selectedRows) => {
        const rowsToDelete = selectedRows.filter(row => !row.original.uuid);
        const stampedCount = selectedRows.length - rowsToDelete.length;

        if (rowsToDelete.length === 0) {
            setConfirmationMessage('No se pueden eliminar las facturas seleccionadas porque están timbradas.');
            setOpenModalError(true);
            return;
        }

        const ids = rowsToDelete.map(row => row.original.ID || row.original.id || row.original.Id).filter(Boolean);

        if (ids.length === 0) {
            setConfirmationMessage('No se pudieron identificar los IDs de las facturas seleccionadas.');
            setOpenModalError(true);
            return;
        }

        setIdsFacturasToDelete(ids);
        setConfirmationMessage(
            stampedCount > 0
                ? `Se eliminarán ${ids.length} facturas no timbradas. Las ${stampedCount} facturas timbradas serán ignoradas. ¿Deseas continuar?`
                : `¿Estás seguro de que deseas eliminar las ${ids.length} facturas seleccionadas?`
        );
        setOpenModalConfirm(true);
    };


    // --- Responsive Logic ---
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const table = useMaterialReactTable({
        columns,
        data,
        enableColumnActions: false,
        enableRowSelection: true,
        enableColumnFiltering: true,
        enableGlobalFilter: true,
        enableSorting: true,
        muiTableBodyCellProps: {
            sx: {
                fontSize: '11px',
            },
        },
        muiTableHeadCellProps: {
            sx: {
                backgroundColor: filterType === 'ONLY_N' ? '#1b384a' : '#10968a',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '10.5px',
                verticalAlign: 'bottom',
                whiteSpace: 'normal',
                lineHeight: 'normal',
                '& .Mui-TableHeadCell-Content': {
                    justifyContent: 'center',
                },
            },
        },
        enableRowVirtualization: true,
        initialState: { density: 'comfortable' },
        localization: MRT_Localization_ES,
        enableTableHead: !isMobile,
        state: {
            isLoading: isLoading,
            showProgressBars: isLoading,
            columnVisibility: isMobile ? {
                MobileSummary: true,
                ID: false,
                Folio: false,
                uuid: false,
                Emisor: false,
                Receptor: false,
                Fecha: false,
                fechaTimbrado: false,
                MetodoPago: false,
                Serie: false,
                MontoTotalPagos: false,
                Estatus: false,
                SubTotal: false,
                Total: false,
            } : {
                MobileSummary: false,
            },
        },
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: 'Acciones',
                size: 100,
            },
        },
        renderDetailPanel: isMobile ? ({ row }) => (
            <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
                gap: '1rem',
                p: 2,
                backgroundColor: '#f5f5f5'
            }}>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Folio:</Typography>
                    <Typography variant="body2">{row.original.Folio || '-'}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">UUID:</Typography>
                    <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>{row.original.uuid || 'Sin timbrar'}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Fecha Emisión:</Typography>
                    <Typography variant="body2">{dayjs(row.original.Fecha).format('DD/MM/YYYY HH:mm')}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Fecha Timbrado:</Typography>
                    <Typography variant="body2">{row.original.fechaTimbrado ? dayjs(row.original.fechaTimbrado).format('DD/MM/YYYY HH:mm') : '-'}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Método de Pago:</Typography>
                    <Typography variant="body2">{row.original.MetodoPago || '-'}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Serie:</Typography>
                    <Typography variant="body2">{row.original.Serie || '-'}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Subtotal:</Typography>
                    <Typography variant="body2">{formatCurrency(row.original.SubTotal || 0)}</Typography>
                </Box>
                {row.original.TipoDeComprobante === 'P' && (
                    <Box>
                        <Typography variant="subtitle2" color="textSecondary">Monto Pago:</Typography>
                        <Typography variant="body2">{formatCurrency(row.original.MontoTotalPagos || 0)}</Typography>
                    </Box>
                )}
            </Box>
        ) : undefined,
        renderRowActions: ({ row }) => (
            <IconButton onClick={(e) => {
                setAnchorEl(e.currentTarget);
                setMenuRow(row.original);
            }}>
                <MoreVertIcon />
            </IconButton>
        ),
        renderTopToolbarCustomActions: ({ table }) => {
            const selectedRows = table.getSelectedRowModel().flatRows;
            const selectedIds = selectedRows.map(row => row.original.ID);

            return (

                <Box sx={{
                    display: isMobile ? 'grid' : 'flex',
                    gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : undefined,
                    gap: '8px',
                    p: '4px',
                    alignItems: 'center',
                    width: isMobile ? '100%' : 'auto'
                }}>
                    {/* Main Toolbar Buttons */}
                    {isMobile && (
                        <Button
                            color="primary"
                            startIcon={isMobile ? undefined : <FilterListIcon />}
                            onClick={() => setOpenFilterDrawer(true)}
                            variant="contained"
                            size="small"
                            fullWidth={isMobile}
                            sx={{
                                fontSize: isMobile ? '0.75rem' : undefined,
                                whiteSpace: isMobile ? 'normal' : 'nowrap',
                                textAlign: 'center',
                                lineHeight: isMobile ? 1.2 : undefined,
                                minWidth: 'auto'
                            }}
                        >
                            Filtros
                        </Button>
                    )}
                    <Tooltip title="Exportar a CSV">
                        <Button
                            color="primary"
                            startIcon={isMobile ? undefined : <ExportIcon />}
                            onClick={() => {
                                const rows = table.getFilteredRowModel().rows;
                                const json = rows.map((row) => ({
                                    ID: row.original.ID,
                                    Folio: row.original.Folio,
                                    Serie: row.original.Serie,
                                    UUID: row.original.uuid,
                                    EmisorNombre: row.original.Emisor?.Nombre,
                                    EmisorRFC: row.original.Emisor?.Rfc,
                                    ReceptorNombre: row.original.Receptor?.Nombre,
                                    ReceptorRFC: row.original.Receptor?.Rfc,
                                    Fecha: dayjs(row.original.Fecha).format('DD/MM/YYYY HH:mm'),
                                    FechaTimbrado: row.original.fechaTimbrado ? dayjs(row.original.fechaTimbrado).format('DD/MM/YYYY HH:mm') : '',
                                    MontoPago: row.original.TipoDeComprobante === 'P' ? row.original.MontoTotalPagos : '',
                                    SubTotal: row.original.SubTotal,
                                    TotalImpuestosTrasladados: row.original.Conceptos?.TotalImpuestosTrasladados || 0,
                                    TotalImpuestosRetenidos: row.original.Conceptos?.TotalImpuestosRetenidos || 0,
                                    Total: row.original.Total,
                                    Moneda: row.original.Moneda,
                                    MetodoPago: row.original.MetodoPago,
                                    Estatus: row.original.Estatus === 'Cancelada' ? 'Cancelada' : (row.original.uuid ? 'Timbrada' : 'No timbrada'),
                                    TipoDeComprobante: row.original.TipoDeComprobante,
                                }));
                                const worksheet = XLSX.utils.json_to_sheet(json);
                                const workbook = XLSX.utils.book_new();
                                XLSX.utils.book_append_sheet(workbook, worksheet, "Facturas");
                                XLSX.writeFile(workbook, "Facturas.csv");
                            }}
                            variant="outlined"
                            size="small"
                            fullWidth={isMobile}
                            sx={{
                                fontSize: isMobile ? '0.75rem' : undefined,
                                whiteSpace: isMobile ? 'normal' : 'nowrap',
                                textAlign: 'center',
                                lineHeight: isMobile ? 1.2 : undefined,
                                minWidth: 'auto'
                            }}
                        >
                            Exportar
                        </Button>
                    </Tooltip>
                    <Tooltip title="Timbrar Seleccionados">
                        <span>
                            <Button
                                color="secondary"
                                startIcon={isMobile ? undefined : <TimbrarIcon />}
                                onClick={() => handleTimbrar(selectedIds)}
                                variant="contained"
                                size="small"
                                disabled={selectedIds.length === 0}
                                fullWidth={isMobile}
                                sx={{
                                    fontSize: isMobile ? '0.75rem' : undefined,
                                    whiteSpace: isMobile ? 'normal' : 'nowrap',
                                    textAlign: 'center',
                                    lineHeight: isMobile ? 1.2 : undefined,
                                    minWidth: 'auto',
                                    ml: isMobile ? 0 : 1,
                                    backgroundColor: selectedIds.length > 0 ? '#ba68c8' : 'rgba(0, 0, 0, 0.12)',
                                    '&:hover': {
                                        backgroundColor: '#ab47bc',
                                    }
                                }}
                            >
                                Enviar a Timbrar
                            </Button>
                        </span>
                    </Tooltip>
                    {selectedIds.length > 0 && (
                        <>
                            <Tooltip title="Enviar por Correo">
                                <Button
                                    color="primary"
                                    startIcon={isMobile ? undefined : <EmailIcon />}
                                    onClick={() => handleEnviarCorreo(selectedIds)}
                                    variant="contained"
                                    size="small"
                                    fullWidth={isMobile}
                                    sx={{
                                        fontSize: isMobile ? '0.75rem' : undefined,
                                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                                        textAlign: 'center',
                                        lineHeight: isMobile ? 1.2 : undefined,
                                        minWidth: 'auto'
                                    }}
                                >
                                    Enviar
                                </Button>
                            </Tooltip>
                            <Tooltip title="Descargar">
                                <Button
                                    color="info"
                                    startIcon={isMobile ? undefined : <DescargarIcon />}
                                    onClick={() => handleDownloadSelecteds(selectedIds)}
                                    variant="contained"
                                    size="small"
                                    fullWidth={isMobile}
                                    sx={{
                                        fontSize: isMobile ? '0.75rem' : undefined,
                                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                                        textAlign: 'center',
                                        lineHeight: isMobile ? 1.2 : undefined,
                                        minWidth: 'auto'
                                    }}
                                >
                                    Descargar
                                </Button>
                            </Tooltip>
                            <Tooltip title="Timbrar y Enviar">
                                <Button
                                    color="success"
                                    startIcon={isMobile ? undefined : <TimbrarEnviarIcon />}
                                    onClick={() => handleTimbrarYEnviar(selectedIds)}
                                    variant="contained"
                                    size="small"
                                    fullWidth={isMobile}
                                    sx={{
                                        fontSize: isMobile ? '0.75rem' : undefined,
                                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                                        textAlign: 'center',
                                        lineHeight: isMobile ? 1.2 : undefined,
                                        minWidth: 'auto'
                                    }}
                                >
                                    Timbrar+Enviar
                                </Button>
                            </Tooltip>
                            <Tooltip title="Eliminar Seleccionados">
                                <Button
                                    color="error"
                                    startIcon={isMobile ? undefined : <DeleteIcon />}
                                    onClick={() => handleDeleteSelected(selectedRows)}
                                    variant="contained"
                                    size="small"
                                    fullWidth={isMobile}
                                    sx={{
                                        fontSize: isMobile ? '0.75rem' : undefined,
                                        whiteSpace: isMobile ? 'normal' : 'nowrap',
                                        textAlign: 'center',
                                        lineHeight: isMobile ? 1.2 : undefined,
                                        minWidth: 'auto'
                                    }}
                                >
                                    Eliminar
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </Box >
            );
        },
    });

    // -- Render Menu Items --
    const renderMenuItems = () => {
        if (!menuRow) return null;
        const menuItems = [];

        if (menuRow.Estatus === 'Cancelada') {
            menuItems.push(
                <MenuItem key="descargar-acuse" onClick={() => { handleAcuseCancelacion(menuRow.ID); handleCloseMenu(); }}>
                    <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar Acuse de Cancelación
                </MenuItem>
            );
        } else {
            // Logic derived from original RowActionMenu
            if (!menuRow.uuid && menuRow.TipoDeComprobante !== 'P') {
                menuItems.push(
                    <MenuItem key="timbrar" onClick={() => { handleTimbrar([menuRow.ID]); handleCloseMenu(); }}>
                        <TimbrarIcon fontSize="small" sx={{ mr: 1 }} /> Enviar a Timbrar
                    </MenuItem>,
                    <MenuItem key="timbraryenviar" onClick={() => { handleTimbrarYEnviar([menuRow.ID]); handleCloseMenu(); }}>
                        <TimbrarEnviarIcon fontSize="small" sx={{ mr: 1 }} /> Timbrar y Enviar
                    </MenuItem>,
                    <MenuItem key="prefactura" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleCloseMenu(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar Prefactura
                    </MenuItem>,
                    <MenuItem key="edit" onClick={handleEdit}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
                    </MenuItem>,
                    <MenuItem key="clone" onClick={handleClone}>
                        <CloneIcon fontSize="small" sx={{ mr: 1 }} /> Clonar
                    </MenuItem>,
                    <MenuItem key="delete" onClick={handleDelete}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar
                    </MenuItem>
                );
            }

            if (!menuRow.uuid && menuRow.TipoDeComprobante === 'P') {
                menuItems.push(
                    <MenuItem key="timbrar-pago" onClick={() => { handleTimbrar([menuRow.ID]); handleCloseMenu(); }}>
                        <TimbrarIcon fontSize="small" sx={{ mr: 1 }} /> Enviar a Timbrar
                    </MenuItem>,
                    <MenuItem key="edit-pago" onClick={handleEdit}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
                    </MenuItem>,
                    <MenuItem key="prefactura-pago" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleCloseMenu(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar Prefactura
                    </MenuItem>,
                    <MenuItem key="delete-pago" onClick={handleDelete}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar
                    </MenuItem>
                );
            }

            if (menuRow.uuid && menuRow.TipoDeComprobante !== "P") {
                menuItems.push(
                    <MenuItem key="descargar" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleCloseMenu(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                    </MenuItem>,
                    <MenuItem key="ver" onClick={() => { handleViewPdf(menuRow.ID); handleCloseMenu(); }}>
                        <PdfIcon fontSize="small" sx={{ mr: 1 }} /> Ver PDF
                    </MenuItem>,
                    <MenuItem key="clone-timbrada" onClick={handleClone}>
                        <CloneIcon fontSize="small" sx={{ mr: 1 }} /> Clonar
                    </MenuItem>,
                    <MenuItem key="cancelar" onClick={() => { handleCancelarFactura(menuRow); handleCloseMenu(); }}>
                        <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
                    </MenuItem>
                );
            }

            if (menuRow.uuid && menuRow.TipoDeComprobante === "P") {
                menuItems.push(
                    <MenuItem key="cancelar-pago" onClick={() => { handleCancelarFactura(menuRow); handleCloseMenu(); }}>
                        <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
                    </MenuItem>,
                    <MenuItem key="ver" onClick={() => { handleViewPdf(menuRow.ID); handleCloseMenu(); }}>
                        <PdfIcon fontSize="small" sx={{ mr: 1 }} /> Ver PDF
                    </MenuItem>,
                    <MenuItem key="descargar-pago" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleCloseMenu(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                    </MenuItem>
                );
            }

            if (menuRow.MetodoPago === 'PPD' && menuRow.uuid && menuRow.EstatusPagos != 'Liquidado') {
                menuItems.push(
                    <MenuItem key="pago" onClick={() => { handleFacturaPago(menuRow); handleCloseMenu(); }}>
                        <PaymentIcon fontSize="small" sx={{ mr: 1 }} /> Complemento de Pago
                    </MenuItem>
                );
            }
        }
        return menuItems;
    };

    return (
        <WithPermission permission="ver_facturas">
            <Box sx={{ width: '100%' }}>
                <MaterialReactTable table={table} />

                {/* --- MOBILE FILTER DRAWER --- */}
                <Drawer
                    anchor="right"
                    open={openFilterDrawer}
                    onClose={() => setOpenFilterDrawer(false)}
                >
                    <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Filtros</Typography>
                            <IconButton onClick={() => setOpenFilterDrawer(false)}>
                                <CancelIcon />
                            </IconButton>
                        </Box>

                        {/* Fecha Emisión Filter */}
                        <Typography variant="subtitle2">Fecha Emisión</Typography>
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <DatePicker
                                    label="De"
                                    value={(() => {
                                        const val = table.getColumn('Fecha')?.getFilterValue();
                                        return val && val[0] ? dayjs(val[0]) : null;
                                    })()}
                                    onChange={(newValue) => {
                                        const val = table.getColumn('Fecha')?.getFilterValue() || [null, null];
                                        const newStart = newValue ? newValue.format('YYYY-MM-DD') : null;
                                        table.getColumn('Fecha').setFilterValue([newStart, val[1]]);
                                    }}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                                <DatePicker
                                    label="Hasta"
                                    value={(() => {
                                        const val = table.getColumn('Fecha')?.getFilterValue();
                                        return val && val[1] ? dayjs(val[1]) : null;
                                    })()}
                                    onChange={(newValue) => {
                                        const val = table.getColumn('Fecha')?.getFilterValue() || [null, null];
                                        const newEnd = newValue ? newValue.format('YYYY-MM-DD') : null;
                                        table.getColumn('Fecha').setFilterValue([val[0], newEnd]);
                                    }}
                                    slotProps={{ textField: { size: 'small', fullWidth: true } }}
                                />
                            </Box>
                        </LocalizationProvider>

                        {/* Emisor Filter */}
                        <Autocomplete
                            options={uniqueEmisores}
                            getOptionLabel={(option) => `${option.Nombre} (${option.Rfc})`}
                            value={(() => {
                                const filterVal = table.getColumn('Emisor')?.getFilterValue();
                                if (!filterVal) return null;
                                return uniqueEmisores.find(e => `${e.Nombre} (${e.Rfc})` === filterVal) || null;
                            })()}
                            onChange={(e, value) => {
                                table.getColumn('Emisor').setFilterValue(value ? `${value.Nombre} (${value.Rfc})` : '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Emisor"
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                        />

                        {/* Receptor Filter */}
                        <Autocomplete
                            options={uniqueReceptores}
                            getOptionLabel={(option) => `${option.Nombre} (${option.Rfc})`}
                            value={(() => {
                                const filterVal = table.getColumn('Receptor')?.getFilterValue();
                                if (!filterVal) return null;
                                return uniqueReceptores.find(r => `${r.Nombre} (${r.Rfc})` === filterVal) || null;
                            })()}
                            onChange={(e, value) => {
                                table.getColumn('Receptor').setFilterValue(value ? `${value.Nombre} (${value.Rfc})` : '');
                            }}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="Receptor"
                                    variant="outlined"
                                    size="small"
                                />
                            )}
                        />

                        <TextField
                            label="Folio"
                            variant="outlined"
                            size="small"
                            value={table.getColumn('Folio')?.getFilterValue() || ''}
                            onChange={(e) => table.getColumn('Folio').setFilterValue(e.target.value)}
                        />

                        <TextField
                            label="UUID"
                            variant="outlined"
                            size="small"
                            value={table.getColumn('uuid')?.getFilterValue() || ''}
                            onChange={(e) => table.getColumn('uuid').setFilterValue(e.target.value)}
                        />

                        <TextField
                            select
                            label="Estatus"
                            variant="outlined"
                            size="small"
                            value={table.getColumn('Estatus')?.getFilterValue() || ''}
                            onChange={(e) => table.getColumn('Estatus').setFilterValue(e.target.value)}
                            SelectProps={{ native: true }}
                        >
                            <option value="">Todos</option>
                            <option value="Timbrada">Timbrada</option>
                            <option value="No timbrada">No timbrada</option>
                            <option value="Cancelada">Cancelada</option>
                        </TextField>

                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                                table.resetColumnFilters();
                                setOpenFilterDrawer(false);
                            }}
                        >
                            Limpiar Filtros
                        </Button>
                    </Box>
                </Drawer>

                {/* --- MENUS --- */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleCloseMenu}
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                >
                    {renderMenuItems()}
                </Menu>

                {/* --- MODALS --- */}
                <ModalExito
                    openModalSuccess={openModalSuccess}
                    handleCloseModal={() => setOpenModalSuccess(false)}
                    confirmationMessage={confirmationMessage}
                />
                <ModalError
                    openModalError={openModalError}
                    handleCloseModal={() => setOpenModalError(false)}
                    confirmationMessage={confirmationMessage}
                />
                <ModalTimbrar
                    openModalTimbrar={openModalTimbrar}
                    handleCloseModal={() => setOpenModalTimbrar(false)}
                    facturasTimbradas={facturasTimbrar}
                />
                <ModalCancelar
                    openModalCancelar={openModalCancelar}
                    handleCloseModal={() => setOpenModalCancelar(false)}
                    facturasRemplazo={facturasRemplazo}
                    IDFacturaCancelada={IDFacturaCancelada}
                    token={token}
                    setResultadoCancelar={setResultadoCancelar}
                />

                <PagoModalWithPayPal
                    open={openPagoModal}
                    onClose={() => setOpenPagoModal(false)}
                    opcion={{
                        Nombre: 'Paquete Timbrado BOD',
                        Costo: 10,
                        CantidadTimbres: idsPendientesTimbrar.length,
                        Emisor: 94,
                    }}
                    token={token}
                    setCompra={(success) => {
                        if (success) {
                            setPagoConfirmado(true);
                            setOpenPagoModal(false);
                        }
                    }}
                />

                {openModalConfirm && (
                    <ModalConfirm
                        open={openModalConfirm}
                        onClose={() => setOpenModalConfirm(false)}
                        onConfirm={handleDeleteFactura}
                        title="Eliminar Factura"
                        message={confirmationMessage}
                    />
                )}
            </Box>
        </WithPermission>
    );
};

export default DataTableMRT;
