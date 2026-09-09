'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
    Box,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    LinearProgress,
    Chip,
    Menu,
    MenuItem
} from '@mui/material';
import {
    Email as EmailIcon,
    CloudUpload as TimbrarIcon,
    CloudDownload as DescargarIcon,
    Send as TimbrarEnviarIcon,
    PictureAsPdf as PdfIcon,
    Edit as EditIcon,
    ContentCopy as CloneIcon,
    Payment as PaymentIcon,
    MoreVert as MoreVertIcon,
    ViewList as ViewListIcon,
    Delete as DeleteIcon,
    Cancel as CancelIcon
} from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useRouter } from 'next/navigation';
import MUIDataTable from "mui-datatables";
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import { WithPermission } from '@/components/WithPermission';
import PagoModalWithPayPal from '@/components/CompraTimbres/PagoModal';

import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar';
import ModalDocumentosRelacionados from '../Modales/ModalDocumentosRelacionados';

// Utilidades
import { formatCurrency } from '@/utils/formatCurrency';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Componente de menú memoizado
const RowActionMenu = React.memo(({
    anchorEl,
    menuRow,
    handleClose,
    handleTimbrar,
    handleTimbrarYEnviar,
    handleDownloadSelecteds,
    handleViewPdf,
    handleCancelarFactura,
    handleAcuseCancelacion,
    handleFacturaPago,
    handleEdit,
    handleClone,
    handleDelete,
    handleViewDocRel,
    router
}) => {
    const menuItems = [];

    if (menuRow?.Estatus === 'Cancelada') {
        menuItems.push(
            <MenuItem key="descargar-acuse" onClick={() => { handleAcuseCancelacion(menuRow.ID); handleClose(); }}>
                <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar Acuse de Cancelación
            </MenuItem>
        );
    } else {
        if (!menuRow?.uuid && menuRow?.TipoDeComprobante !== 'P') {
            menuItems.push(
                <MenuItem key="timbrar" onClick={() => { handleTimbrar([menuRow.ID]); handleClose(); }}>
                    <TimbrarIcon fontSize="small" sx={{ mr: 1 }} /> Timbrar
                </MenuItem>,
                <MenuItem key="timbraryenviar" onClick={() => { handleTimbrarYEnviar([menuRow.ID]); handleClose(); }}>
                    <TimbrarEnviarIcon fontSize="small" sx={{ mr: 1 }} /> Timbrar y Enviar
                </MenuItem>,
                <MenuItem key="prefactura" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleClose(); }}>
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

        if (!menuRow?.uuid && menuRow?.TipoDeComprobante === 'P') {
            menuItems.push(
                <MenuItem key="timbrar-pago" onClick={() => { handleTimbrar([menuRow.ID]); handleClose(); }}>
                    <TimbrarIcon fontSize="small" sx={{ mr: 1 }} /> Timbrar
                </MenuItem>,
                <MenuItem key="edit-pago" onClick={handleEdit}>
                    <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
                </MenuItem>,
                <MenuItem key="prefactura-pago" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleClose(); }}>
                    <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar Prefactura
                </MenuItem>,
                <MenuItem key="delete-pago" onClick={handleDelete}>
                    <DeleteIcon fontSize="small" sx={{ mr: 1 }} /> Eliminar
                </MenuItem>
            );
        }

        if (menuRow?.uuid && menuRow?.TipoDeComprobante !== "P") {
            menuItems.push(
                <MenuItem key="descargar" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleClose(); }}>
                    <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                </MenuItem>,
                <MenuItem key="ver" onClick={() => { handleViewPdf(menuRow.ID); handleClose(); }}>
                    <PdfIcon fontSize="small" sx={{ mr: 1 }} /> Ver PDF
                </MenuItem>,
                <MenuItem key="clone-timbrada" onClick={handleClone}>
                    <CloneIcon fontSize="small" sx={{ mr: 1 }} /> Clonar
                </MenuItem>,
                <MenuItem key="cancelar" onClick={() => { handleCancelarFactura(menuRow); handleClose(); }}>
                    <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
                </MenuItem>
            );
        }

        if (menuRow?.uuid && menuRow?.TipoDeComprobante === "P") {
            menuItems.push(
                <MenuItem key="cancelar-pago" onClick={() => { handleCancelarFactura(menuRow); handleClose(); }}>
                    <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
                </MenuItem>,
                <MenuItem key="ver" onClick={() => { handleViewPdf(menuRow.ID); handleClose(); }}>
                    <PdfIcon fontSize="small" sx={{ mr: 1 }} /> Ver PDF
                </MenuItem>,
                <MenuItem key="descargar-pago" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleClose(); }}>
                    <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                </MenuItem>
            );
        }

        if (menuRow?.MetodoPago === 'PPD' && menuRow?.uuid && menuRow?.EstatusPagos != 'Liquidado') {
            menuItems.push(
                <MenuItem key="pago" onClick={() => { handleFacturaPago(menuRow); handleClose(); }}>
                    <PaymentIcon fontSize="small" sx={{ mr: 1 }} /> Complemento de Pago
                </MenuItem>
            );
        }
        if (menuRow.MetodoPago === 'PPD' && menuRow.uuid) {
            menuItems.push(
                <MenuItem key="doc-rel" onClick={handleViewDocRel}>
                    <ViewListIcon fontSize="small" sx={{ mr: 1 }} /> Ver documentos relacionados
                </MenuItem>
            );
        }
    }

    return (
        <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            onClick={handleClose}
            anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
            transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
            }}
        >
            {menuItems}
        </Menu>
    );
});

RowActionMenu.displayName = 'RowActionMenu';

const CustomToolbarSelect = ({
    selectedRows,
    handleEnviarCorreo,
    handleTimbrar,
    handleDownloadSelecteds,
    handleTimbrarYEnviar
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const open = Boolean(anchorEl);

    const handleClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    return (
        <div style={{ display: 'flex', gap: '8px', marginRight: '24px', alignItems: 'center' }}>
            {/* Desktop View */}
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
                <Button
                    variant="contained"
                    size="small"
                    color="secondary"
                    startIcon={<EmailIcon />}
                    onClick={handleEnviarCorreo}
                    sx={{ color: 'white' }}
                >
                    Enviar
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    color="primary"
                    startIcon={<TimbrarIcon />}
                    onClick={handleTimbrar}
                >
                    Timbrar
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    color="info"
                    startIcon={<DescargarIcon />}
                    onClick={handleDownloadSelecteds}
                >
                    Descargar
                </Button>
                <Button
                    variant="contained"
                    size="small"
                    color="success"
                    startIcon={<TimbrarEnviarIcon />}
                    onClick={handleTimbrarYEnviar}
                >
                    Timbrar y Enviar
                </Button>
            </Box>

            {/* Mobile View */}
            <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
                <Button
                    onClick={handleClick}
                    variant="contained"
                    size="small"
                    color="primary"
                    endIcon={<MoreVertIcon />}
                >
                    Acciones
                </Button>
                <Menu
                    anchorEl={anchorEl}
                    open={open}
                    onClose={handleClose}
                >
                    <MenuItem onClick={() => { handleEnviarCorreo(); handleClose(); }}>
                        <EmailIcon fontSize="small" sx={{ mr: 1 }} /> Enviar
                    </MenuItem>
                    <MenuItem onClick={() => { handleTimbrar(); handleClose(); }}>
                        <TimbrarIcon fontSize="small" sx={{ mr: 1 }} /> Timbrar
                    </MenuItem>
                    <MenuItem onClick={() => { handleDownloadSelecteds(); handleClose(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                    </MenuItem>
                    <MenuItem onClick={() => { handleTimbrarYEnviar(); handleClose(); }}>
                        <TimbrarEnviarIcon fontSize="small" sx={{ mr: 1 }} /> Timbrar y Enviar
                    </MenuItem>
                </Menu>
            </Box>
        </div>
    );
};

export default function DataTable({ token }) {
    const router = useRouter();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRows, setSelectedRows] = useState([]);

    // Estados para modales
    const [openModalSuccess, setOpenModalSuccess] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [openModalTimbrar, setOpenModalTimbrar] = useState(false);
    const [openModalCancelar, setOpenModalCancelar] = useState(false);
    const [openModalConfirm, setOpenModalConfirm] = useState(false);
    const [openModalDocRel, setOpenModalDocRel] = useState(false);

    // Estados para operaciones
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [uuidDocRel, setUuidDocRel] = useState(null);
    const [facturasTimbrar, setFacturasTimbrar] = useState([]);
    const [facturasRemplazo, setFacturasRemplazo] = useState([]);
    const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
    const [resultadoCancelar, setResultadoCancelar] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [facturaIdToDelete, setFacturaIdToDelete] = useState(null);

    const [openPagoModal, setOpenPagoModal] = useState(false);
    const [idsPendientesTimbrar, setIdsPendientesTimbrar] = useState([]);
    const [pagoConfirmado, setPagoConfirmado] = useState(false);
    const [accionPostPago, setAccionPostPago] = useState(null);

    const isBOD = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('BOD')) === true;
        } catch {
            return false;
        }
    }, []);


    // Obtener datos de la API
    const fetchData = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`${apiUrl}/api/facturas/ListarFacturas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const responseData = await response.json();

                if (Array.isArray(responseData)) {
                    const normalizedData = responseData.map(item => ({
                        ...item,
                        Conceptos: item.Conceptos || {
                            TotalImpuestosTrasladados: 0,
                            TotalImpuestosRetenidos: 0
                        },
                        Emisor: item.Emisor || { Nombre: 'Desconocido', Rfc: '' },
                        Receptor: item.Receptor || { Nombre: 'Desconocido', Rfc: '' },
                        // Normalizar MontoTotalPagos
                        MontoTotalPagos: item.Complemento?.Pagos?.Totales?.MontoTotalPagos || 0,
                        fullObject: item,
                        statusObj: item
                    }));

                    setData(normalizedData.sort((a, b) => b.ID - a.ID));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Manejar resultado de cancelación
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

    // Operaciones con múltiples facturas
    const handleTimbrar = useCallback(async (ids) => {

        if (isBOD) {
            // Guardamos las facturas y abrimos modal de pago
            setIdsPendientesTimbrar(ids);
            setOpenPagoModal(true);
            return;
        }

        setLoading(true);
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
                    setFacturasTimbrar(data.Facturas.map(factura => ({
                        id: factura.facturaID,
                        status: factura.status,
                        error: factura.error || null,
                    })));
                } else if (data.Facturas.length === 1) {
                    const factura = data.Facturas[0];
                    if (factura.status === 'success') {
                        setConfirmationMessage('Facturas timbradas exitosamente.');
                        setOpenModalSuccess(true);
                    } else {
                        setConfirmationMessage('Error al timbrar facturas: ' + (factura.error || ''));
                        setOpenModalError(true);
                    }
                }
            }
        } catch (error) {
            setConfirmationMessage('Error en la conexión o en el timbrado.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
            fetchData();
        }
    }, [token, fetchData]);

    const handleTimbrarBOD = useCallback(async (ids) => {
        setLoading(true);
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

            const data = await response.json();

            setConfirmationMessage('Facturas timbradas correctamente.');
            setOpenModalSuccess(true);

        } catch (error) {
            setConfirmationMessage(error.message || 'Error en timbrado BOD');
            setOpenModalError(true);
        } finally {
            setLoading(false);
            fetchData();
        }
    }, [token, fetchData]);


    const handleDownloadSelecteds = useCallback(async (ids) => {
        const cleanIds = (Array.isArray(ids) ? ids : [ids])
            .map(id => (typeof id === 'object' && id !== null) ? (id.ID ?? id.id ?? id.Id) : id)
            .filter(id => id !== undefined && id !== null && id !== '');

        if (cleanIds.length === 0) {
            setConfirmationMessage('No se seleccionó ninguna factura válida para descargar.');
            setOpenModalError(true);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/descargararchivos/DescargarArchivos`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(cleanIds),
            });

            if (response.ok) {
                const blob = await response.blob();

                // Función para extraer el nombre del archivo del header
                const getFileNameFromHeaders = (headers) => {
                    const contentDisposition = headers.get('Content-Disposition');
                    if (!contentDisposition) return null;

                    // Buscar el patrón filename="nombre.extension" o filename=nombre.extension
                    const matches = contentDisposition.match(/filename\*?=["']?([^"']+)["']?/i) ||
                        contentDisposition.match(/filename=["']?([^"']+)["']?/i);

                    if (matches && matches[1]) {
                        // Decodificar si está en formato URL encoded (filename*=UTF-8''archivo.zip)
                        let fileName = matches[1];
                        if (fileName.startsWith("UTF-8''")) {
                            fileName = decodeURIComponent(fileName.substring(7));
                        }
                        return fileName.replace(/"/g, '');
                    }
                    return null;
                };

                // Obtener nombre del archivo o usar uno por defecto
                const fileName = getFileNameFromHeaders(response.headers) ||
                    (cleanIds.length === 1 ? 'Factura.zip' : 'Facturas.zip');

                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                a.remove();

                // Liberar el objeto URL
                window.URL.revokeObjectURL(url);

                setConfirmationMessage(`Su archivo "${fileName}" se ha descargado. Revise su carpeta de descargas.`);
                setOpenModalSuccess(true);
            } else {
                // Fallback para prefacturas individuales vía VerPDF
                if (cleanIds.length === 1) {
                    try {
                        const pdfRes = await fetch(`${apiUrl}/api/descargararchivos/VerPDF/${cleanIds[0]}`, {
                            method: 'GET',
                            headers: { Authorization: `Bearer ${token}` },
                        });
                        if (pdfRes.ok) {
                            const pdfBlob = await pdfRes.blob();
                            const pdfUrl = window.URL.createObjectURL(pdfBlob);
                            const a = document.createElement('a');
                            a.href = pdfUrl;
                            a.download = `Prefactura_${cleanIds[0]}.pdf`;
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            window.URL.revokeObjectURL(pdfUrl);

                            setConfirmationMessage(`Su prefactura se ha descargado exitosamente como archivo PDF.`);
                            setOpenModalSuccess(true);
                            return;
                        }
                    } catch (fallbackErr) {
                        console.warn('Fallback VerPDF falló:', fallbackErr);
                    }
                }

                let errorMsg = 'Error en la respuesta del servidor';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData?.error || errorData?.message || (typeof errorData === 'string' ? errorData : errorMsg);
                } catch {
                    try {
                        const errorText = await response.text();
                        if (errorText && errorText.length < 300) {
                            errorMsg = errorText;
                        }
                    } catch {}
                }
                throw new Error(errorMsg);
            }
        } catch (error) {
            console.error('Error al descargar:', error);
            setConfirmationMessage(error.message || 'Error al descargar la factura.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleEnviarCorreo = useCallback(async (ids) => {
        setLoading(true);
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
            setLoading(false);
        }
    }, [token]);

    const handleTimbrarYEnviar = useCallback(async (ids) => {
        if (isBOD) {
            setIdsPendientesTimbrar(ids);
            setAccionPostPago('TIMBRAR_Y_ENVIAR');
            setOpenPagoModal(true);
            return;
        }

        setLoading(true);
        setConfirmationMessage('Procesando timbrado y envío de facturas...');

        try {
            // 1. Timbrado
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

            // 2. Envío por correo
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
            setLoading(false);
            fetchData();
        }
    }, [token, fetchData]);

    // Operaciones con una sola factura
    const handleViewPdf = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/descargararchivos/VerPDF/${id}`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
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
            setLoading(false);
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
        setLoading(true);
        try {
            const response = await fetch(`/api/facturas/acuse/${id}`, {
                method: 'GET',
            });
            if (response.ok) {
                const blob = await response.blob();
                const pdfUrl = URL.createObjectURL(blob);
                window.open(pdfUrl, '_blank');
            } else {
                const errData = await response.json();
                setConfirmationMessage(errData.error || 'Error al descargar el acuse de cancelación.');
                setOpenModalError(true);
            }
        } catch (error) {
            setConfirmationMessage('Error al descargar el acuse de cancelación: ' + error.message);
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleDeleteFactura = useCallback(async () => {
        if (!facturaIdToDelete) return;

        try {
            const response = await fetch(`${apiUrl}/api/facturas/EliminarFactura/${facturaIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                setConfirmationMessage('La factura se ha eliminado correctamente.');
                setOpenModalSuccess(true);
                fetchData();
            } else {
                setConfirmationMessage('Error al eliminar la factura.');
                setOpenModalError(true);
            }
        } catch (error) {
            console.error('Error en la solicitud DELETE:', error);
            setConfirmationMessage('Error al eliminar la factura.');
            setOpenModalError(true);
        } finally {
            setOpenModalConfirm(false);
            setMenuRow(null);
            setFacturaIdToDelete(null);
        }
    }, [facturaIdToDelete, token, fetchData]);

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

    // Funciones del menú
    const handleEdit = useCallback(() => {
        if (menuRow?.TipoDeComprobante === 'P') {
            router.push(`/EditarComplementoPago/${menuRow.ID}`);
        } else {
            router.push(`/EditarFactura/${menuRow.ID}`);
        }
        setAnchorEl(null);
        setMenuRow(null);
    }, [menuRow, router]);

    const handleClone = useCallback(() => {
        router.push(`/CrearFactura/${menuRow.ID}`);
        setAnchorEl(null);
        setMenuRow(null);
    }, [menuRow, router]);

    const handleDelete = useCallback(() => {
        setFacturaIdToDelete(menuRow.ID);
        setConfirmationMessage('¿Estás seguro de que deseas eliminar esta factura?');
        setOpenModalConfirm(true);
        setAnchorEl(null);
        setMenuRow(null);
    }, [menuRow]);

    const handleViewDocRel = useCallback(() => {
        if (menuRow && menuRow.uuid) {
            setUuidDocRel(menuRow.uuid);
            setOpenModalDocRel(true);
        }
        setAnchorEl(null);
        setMenuRow(null);
    }, [menuRow]);

    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
        setMenuRow(null);
    }, []);

    useEffect(() => {
        if (pagoConfirmado && idsPendientesTimbrar.length > 0) {
            handleTimbrarBOD(idsPendientesTimbrar);
            setPagoConfirmado(false);
            setIdsPendientesTimbrar([]);
        }
    }, [pagoConfirmado, idsPendientesTimbrar, handleTimbrarBOD]);

    useEffect(() => {
        if (!pagoConfirmado || idsPendientesTimbrar.length === 0) return;

        const procesarPostPago = async () => {
            try {
                if (accionPostPago === 'TIMBRAR') {
                    await handleTimbrarBOD(idsPendientesTimbrar);
                }

                if (accionPostPago === 'TIMBRAR_Y_ENVIAR') {
                    await handleTimbrarBOD(idsPendientesTimbrar);
                    await enviarFacturasPorCorreo(idsPendientesTimbrar);

                    setConfirmationMessage(
                        'Facturas timbradas y enviadas correctamente.'
                    );
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
        fetchData
    ]);


    const enviarFacturasPorCorreo = async (ids) => {
        await fetch(`${apiUrl}/api/enviofacturas/EnviarFacturas`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(ids),
        });
    };



    // Cálculo memoizado de opciones únicas para los filtros
    const uniqueFolios = useMemo(() => {
        return [...new Set(data.map(item => item.Folio).filter(Boolean))].sort();
    }, [data]);

    const uniqueUUIDs = useMemo(() => {
        return [...new Set(data.map(item => item.uuid).filter(Boolean))].sort();
    }, [data]);

    // Para Emisor y Receptor guardamos el objeto completo o una cadena única para mostrar
    // Aquí usaremos la cadena "Nombre (Rfc)" como valor para filtrar
    const uniqueEmisores = useMemo(() => {
        const emisores = data.map(item => {
            const e = item.Emisor || { Nombre: 'Desconocido', Rfc: '' };
            return `${e.Nombre} (${e.Rfc})`;
        });
        return [...new Set(emisores)].sort();
    }, [data]);

    const uniqueReceptores = useMemo(() => {
        const receptores = data.map(item => {
            const r = item.Receptor || { Nombre: 'Desconocido', Rfc: '' };
            return `${r.Nombre} (${r.Rfc})`;
        });
        return [...new Set(receptores)].sort();
    }, [data]);

    const columns = useMemo(() => [
        {
            name: "ID",
            label: "ID",
            options: {
                filter: false,
                sort: true,
                display: true,
            }
        },
        {
            name: "Folio",
            label: "Folio",
            options: {
                filter: true,
                filterType: 'textField',
                sort: true,
            }
        },
        {
            name: "uuid",
            label: "UUID",
            options: {
                filter: true,
                filterType: 'textField',
                sort: true,
                customBodyRender: (value) => value || 'Sin timbrar'
            }
        },
        {
            name: "Emisor",
            label: "Emisor",
            options: {
                filter: true,
                filterType: 'custom',
                sort: true,
                customBodyRender: (value) => {
                    const emisor = value || { Nombre: 'Desconocido', Rfc: '' };
                    return `${emisor.Nombre} (${emisor.Rfc})`;
                },
                customFilterListOptions: {
                    render: (v) => v.Nombre ? `${v.Nombre} (${v.Rfc})` : v
                },
                filterOptions: {
                    logic: (value, filterVal) => {
                        if (!filterVal || filterVal.length === 0 || !filterVal[0]) return false;
                        const emisorStr = `${value?.Nombre || ''} (${value?.Rfc || ''})`.toLowerCase();
                        const filterStr = filterVal[0].toLowerCase();
                        return !emisorStr.includes(filterStr);
                    },
                    display: (filterList, onChange, index, column) => (
                        <Autocomplete
                            freeSolo
                            options={uniqueEmisores}
                            value={filterList[index][0] || ''}
                            onChange={(event, newValue) => {
                                filterList[index][0] = newValue || '';
                                onChange(filterList[index], index, column);
                            }}
                            onInputChange={(event, newInputValue) => {
                                filterList[index][0] = newInputValue || '';
                                onChange(filterList[index], index, column);
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Emisor" fullWidth />
                            )}
                        />
                    ),
                },
            }
        },
        {
            name: "Receptor",
            label: "Receptor",
            options: {
                filter: true,
                filterType: 'custom',
                sort: true,
                customBodyRender: (value) => {
                    const receptor = value || { Nombre: 'Desconocido', Rfc: '' };
                    if (!receptor || !receptor.Nombre) return 'Desconocido';
                    return `${receptor.Nombre} (${receptor.Rfc})`;
                },
                customFilterListOptions: {
                    render: (v) => v.Nombre ? `${v.Nombre} (${v.Rfc})` : v
                },
                filterOptions: {
                    logic: (value, filterVal) => {
                        if (!filterVal || filterVal.length === 0 || !filterVal[0]) return false;
                        const receptorStr = `${value?.Nombre || ''} (${value?.Rfc || ''})`.toLowerCase();
                        const filterStr = filterVal[0].toLowerCase();
                        return !receptorStr.includes(filterStr);
                    },
                    display: (filterList, onChange, index, column) => (
                        <Autocomplete
                            freeSolo
                            options={uniqueReceptores}
                            value={filterList[index][0] || ''}
                            onChange={(event, newValue) => {
                                filterList[index][0] = newValue || '';
                                onChange(filterList[index], index, column);
                            }}
                            onInputChange={(event, newInputValue) => {
                                filterList[index][0] = newInputValue || '';
                                onChange(filterList[index], index, column);
                            }}
                            renderInput={(params) => (
                                <TextField {...params} label="Receptor" fullWidth />
                            )}
                        />
                    ),
                }
            }
        },
        {
            name: "Fecha",
            label: "Fecha Emisión",
            options: {
                filter: true,
                filterType: 'custom',
                sort: true,
                filterOptions: {
                    logic: (value, filterVal) => {
                        if (!filterVal || filterVal.length === 0 || !filterVal[0]) return false;
                        const dateSelected = filterVal[0];
                        const dateRow = dayjs(value).format('YYYY-MM-DD');
                        return dateRow !== dateSelected;
                    },
                    display: (filterList, onChange, index, column) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Fecha Emisión"
                                value={filterList[index][0] ? dayjs(filterList[index][0]) : null}
                                onChange={(newValue) => {
                                    // Guardamos como string YYYY-MM-DD
                                    filterList[index][0] = newValue ? newValue.format('YYYY-MM-DD') : null;
                                    onChange(filterList[index], index, column);
                                }}
                                slotProps={{ textField: { fullWidth: true } }}
                                disableFuture
                            />
                        </LocalizationProvider>
                    ),
                }
            }
        },
        {
            name: "fechaTimbrado",
            label: "Fecha Timbrado",
            options: {
                filter: true,
                filterType: 'custom',
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    // tableMeta.rowData es el arreglo de columnas visibles.
                    // El UUID está en el índice 2.
                    const uuid = tableMeta.rowData[2];
                    if (!uuid) {
                        return <Chip label="Sin timbrar" color="warning" size="small" />;
                    }
                    return value || 'Sin timbrar';
                },
                filterOptions: {
                    logic: (value, filterVal) => {
                        if (!filterVal || filterVal.length === 0 || !filterVal[0]) return false;
                        // Si no hay valor en la celda (sin timbrar) y se filtra algo, no mostrar
                        if (!value) return true;

                        const dateSelected = filterVal[0];
                        const dateRow = dayjs(value).format('YYYY-MM-DD');
                        return dateRow !== dateSelected;
                    },
                    display: (filterList, onChange, index, column) => (
                        <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DatePicker
                                label="Fecha Timbrado"
                                value={filterList[index][0] ? dayjs(filterList[index][0]) : null}
                                onChange={(newValue) => {
                                    // Guardamos como string YYYY-MM-DD
                                    filterList[index][0] = newValue ? newValue.format('YYYY-MM-DD') : null;
                                    onChange(filterList[index], index, column);
                                }}
                                slotProps={{ textField: { fullWidth: true } }}
                                disableFuture
                            />
                        </LocalizationProvider>
                    ),
                }
            }
        },
        {
            name: "Serie",
            label: "Serie",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "MetodoPago",
            label: "Método Pago",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "statusObj", // Usamos statusObj para evitar nombres duplicados
            label: "Estatus",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) => {
                    // value es el objeto completo
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
                customFilterListOptions: {
                    render: (v) => {
                        if (v.Estatus === 'Cancelada') return 'Cancelada';
                        if (v.uuid) return 'Timbrada';
                        return 'No timbrada';
                    }
                },
                filterOptions: {
                    names: ['Timbrada', 'No timbrada', 'Cancelada'],
                    logic: (value, filterVal) => {
                        let status = 'No timbrada';
                        if (value.Estatus === 'Cancelada') status = 'Cancelada';
                        else if (value.uuid) status = 'Timbrada';

                        return filterVal.indexOf(status) === -1;
                    }
                }
            }
        },
        {
            name: "SubTotal",
            label: "Subtotal",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value || 0)
            }
        },
        {
            name: "Conceptos",
            label: "Traslados",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value?.TotalImpuestosTrasladados || 0)
            }
        },
        {
            name: "Conceptos",
            label: "Retenciones",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value?.TotalImpuestosRetenidos || 0)
            }
        },
        {
            name: "Total",
            label: "Total",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value || 0)
            }
        },
        {
            name: "MontoTotalPagos",
            label: "Monto Pagado",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value || 0)
            }
        },
        {
            name: "fullObject",
            label: "Acciones",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value) => {
                    return (
                        <IconButton onClick={(e) => {
                            e.stopPropagation();
                            setMenuRow(value);
                            setAnchorEl(e.currentTarget);
                        }}>
                            <MoreVertIcon />
                        </IconButton>
                    );
                }
            }
        }
    ], [uniqueEmisores, uniqueReceptores]);

    // Opciones de la tabla memoizada
    const options = useMemo(() => ({
        filterType: 'dropdown',
        responsive: 'standard',
        serverSide: false,
        selectableRows: 'multiple',
        print: true,
        download: true,
        viewColumns: true,
        filter: true,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 25, 50],
        pagination: true,
        customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
            const selectedIds = selectedRows.data.map(index => data[index.dataIndex].ID);
            return (
                <CustomToolbarSelect
                    selectedRows={selectedRows}
                    handleEnviarCorreo={() => handleEnviarCorreo(selectedIds)}
                    handleTimbrar={() => handleTimbrar(selectedIds)}
                    handleDownloadSelecteds={() => handleDownloadSelecteds(selectedIds)}
                    handleTimbrarYEnviar={() => handleTimbrarYEnviar(selectedIds)}
                />
            );
        },
        onRowSelectionChange: (currentRowsSelected, allRowsSelected, rowsSelected) => {
            try {
                const selectedIds = rowsSelected
                    .map(row => data[row.dataIndex]?.ID)
                    .filter(id => id !== undefined);
                setSelectedRows(selectedIds);
            } catch (error) {
                console.error('Error al procesar filas seleccionadas:', error);
                setSelectedRows([]);
            }
        },
        textLabels: {
            body: {
                noMatch: "No hay registros coincidentes",
                toolTip: "Ordenar",
            },
            pagination: {
                next: "Página siguiente",
                previous: "Página anterior",
                rowsPerPage: "Filas por página:",
                displayRows: "de",
            },
            toolbar: {
                search: "Buscar",
                downloadCsv: "Descargar CSV",
                print: "Imprimir",
                viewColumns: "Ver columnas",
                filterTable: "Filtrar",
            },
            filter: {
                all: "Todos",
                title: "FILTROS",
                reset: "Reiniciar",
            },
            viewColumns: {
                title: "Mostrar columnas",
                titleAria: "Mostrar/Ocultar columnas",
            },
            selectedRows: {
                text: "fila(s) seleccionada(s)",
                delete: "Borrar",
                deleteAria: "Borrar filas seleccionadas",
            },
        },
    }), [data, handleEnviarCorreo, handleTimbrar, handleDownloadSelecteds, handleTimbrarYEnviar]);

    return (
        <Box>
            {loading && <LinearProgress />}

            <MUIDataTable
                title="Vista General de Facturas"
                data={data}
                columns={columns}
                options={options}
            />

            <RowActionMenu
                anchorEl={anchorEl}
                menuRow={menuRow}
                handleClose={handleCloseMenu}
                handleTimbrar={handleTimbrar}
                handleTimbrarYEnviar={handleTimbrarYEnviar}
                handleDownloadSelecteds={handleDownloadSelecteds}
                handleViewPdf={handleViewPdf}
                handleCancelarFactura={handleCancelarFactura}
                handleAcuseCancelacion={handleAcuseCancelacion}
                handleFacturaPago={handleFacturaPago}
                handleEdit={handleEdit}
                handleClone={handleClone}
                handleDelete={handleDelete}
                handleViewDocRel={handleViewDocRel}
                router={router}
            />

            {/* Modales */}
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
                    Emisor: 94

                }}
                token={token}
                setCompra={(success) => {
                    if (success) {
                        setPagoConfirmado(true);
                        setOpenPagoModal(false);
                    }
                }}
            />


            <Dialog
                open={openModalConfirm}
                onClose={() => setOpenModalConfirm(false)}
            >
                <DialogTitle>Confirmar eliminación</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        {confirmationMessage}
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModalConfirm(false)} color="primary">
                        Cancelar
                    </Button>
                    <Button onClick={handleDeleteFactura} color="error" autoFocus>
                        Confirmar
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}
