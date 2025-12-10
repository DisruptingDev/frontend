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
    MenuItem,
    Typography,
    Alert
} from '@mui/material';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
    Send as TimbrarEnviarIcon,
    PictureAsPdf as PdfIcon,
    Edit as EditIcon,
    ContentCopy as CloneIcon,
    Delete as DeleteIcon,
    Cancel as CancelIcon,
    Payment as PaymentIcon,
    MoreVert as MoreVertIcon,
    Email as EmailIcon,
    CloudUpload as TimbrarIcon,
    CloudDownload as DescargarIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
const MUIDataTable = dynamic(() => import('mui-datatables'), { ssr: false });

// Importación de componentes de modal
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar';
import PagoModal from '@/components/CompraTimbres/PagoModal'; // Importar el modal de pago

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
    isBOD
}) => {
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
            {menuRow?.Estatus === 'Cancelada' ? (
                [
                    <MenuItem key="descargar-acuse" onClick={() => { handleAcuseCancelacion(menuRow.ID); handleClose(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar Acuse de Cancelación
                    </MenuItem>
                ]
            ) : (
                <>
                    {!menuRow?.uuid && menuRow?.TipoDeComprobante !== 'P' && [
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
                    ]}

                    {!menuRow?.uuid && menuRow?.TipoDeComprobante === 'P' && [
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
                    ]}

                    {menuRow?.uuid && menuRow?.TipoDeComprobante !== "P" && [
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
                    ]}

                    {menuRow?.uuid && menuRow?.TipoDeComprobante === "P" && [
                        <MenuItem key="cancelar-pago" onClick={() => { handleCancelarFactura(menuRow); handleClose(); }}>
                            <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
                        </MenuItem>,
                        <MenuItem key="ver" onClick={() => { handleViewPdf(menuRow.ID); handleClose(); }}>
                            <PdfIcon fontSize="small" sx={{ mr: 1 }} /> Ver PDF
                        </MenuItem>,
                        <MenuItem key="descargar-pago" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleClose(); }}>
                            <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                        </MenuItem>,
                    ]}

                    {menuRow?.MetodoPago === 'PPD' && menuRow?.uuid && menuRow?.EstatusPagos != 'Liquidado' && [
                        <MenuItem key="pago" onClick={() => { handleFacturaPago(menuRow); handleClose(); }}>
                            <PaymentIcon fontSize="small" sx={{ mr: 1 }} /> Complemento de Pago
                        </MenuItem>
                    ]}
                </>
            )}
        </Menu>
    );
});

RowActionMenu.displayName = 'RowActionMenu';

export default function DataTable({ token, isBOD }) {
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
    const [openPagoModal, setOpenPagoModal] = useState(false);

    // Estados para operaciones
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [facturasTimbrar, setFacturasTimbrar] = useState([]);
    const [facturasRemplazo, setFacturasRemplazo] = useState([]);
    const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
    const [resultadoCancelar, setResultadoCancelar] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [facturaIdToDelete, setFacturaIdToDelete] = useState(null);
    
    // Estados específicos para BOD
    const [facturaParaTimbrarBOD, setFacturaParaTimbrarBOD] = useState(null);
    const [pagoCompletado, setPagoCompletado] = useState(false);

    console.log("DataTable - isBOD value:", isBOD);

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
                        MontoTotalPagos: item.Complemento?.Pagos?.Totales?.MontoTotalPagos || 0,
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

    // Si el pago se completó, timbrar la factura
    useEffect(() => {
        if (pagoCompletado && facturaParaTimbrarBOD) {
            handleTimbrarBOD(facturaParaTimbrarBOD);
            setPagoCompletado(false);
            setFacturaParaTimbrarBOD(null);
        }
    }, [pagoCompletado, facturaParaTimbrarBOD]);

    // Manejar resultado de cancelación
    useEffect(() => {
        if (resultadoCancelar === "success") {
            setOpenModalSuccess(true);
            setConfirmationMessage('Factura cancelada exitosamente.');
            setIDFacturaCancelada(null);
            fetchData();
        } else if (resultadoCancelar === "error") {
            setOpenModalError(true);
            setConfirmationMessage('Error al cancelar la factura.');
        }
        setResultadoCancelar(null);
    }, [resultadoCancelar, fetchData]);

    // Función para timbrar en modo normal (NO BOD)
    const handleTimbrarNormal = useCallback(async (ids) => {
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
                const result = await response.json();
                setFacturasTimbrar(result);
                setOpenModalTimbrar(true);
                fetchData();
            } else {
                setConfirmationMessage('Error al timbrar las facturas.');
                setOpenModalError(true);
            }
        } catch (error) {
            console.error('Error al timbrar:', error);
            setConfirmationMessage('Error de conexión al timbrar.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token, fetchData]);

    // Función para timbrar en modo BOD (después de pago)
    const handleTimbrarBOD = useCallback(async (id) => {
        setLoading(true);
        try {
            console.log("Timbrando factura BOD después de pago:", id);
            
            const response = await fetch(`${apiUrl}/api/timbradocorporativo/TimbradoCorporativoBOD`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Facturas_ID: [id] }),
            });

            if (response.ok) {
                const result = await response.json();
                console.log("Resultado timbrado BOD:", result);
                
                if (result.Facturas && result.Facturas.length > 0) {
                    const factura = result.Facturas[0];
                    
                    if (factura.status === 'success') {
                        setConfirmationMessage('Factura timbrada exitosamente.');
                        setOpenModalSuccess(true);
                        fetchData();
                    } else {
                        setConfirmationMessage(`Error al timbrar: ${factura.error || 'Error desconocido'}`);
                        setOpenModalError(true);
                    }
                } else {
                    setConfirmationMessage('Error en la respuesta del servidor.');
                    setOpenModalError(true);
                }
            } else {
                const errorData = await response.json().catch(() => ({}));
                setConfirmationMessage(errorData.message || 'Error al timbrar la factura.');
                setOpenModalError(true);
            }
        } catch (error) {
            console.error('Error al timbrar BOD:', error);
            setConfirmationMessage('Error de conexión al timbrar.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token, fetchData]);

    // Función principal para timbrar (determina el flujo según modo)
    const handleTimbrar = useCallback(async (ids) => {
        // Validación para BOD: solo una factura a la vez
        if (isBOD && ids.length > 1) {
            setConfirmationMessage('En modo BOD solo se puede timbrar una factura a la vez.');
            setOpenModalError(true);
            return;
        }

        // Si está en modo BOD, redirigir a pasarela de pago primero
        if (isBOD) {
            const facturaId = ids[0];
            
            // Guardar la factura que se va a timbrar después del pago
            setFacturaParaTimbrarBOD(facturaId);
            
            // Abrir modal de pago
            setOpenPagoModal(true);
            return;
        }

        // Modo normal: timbrar directamente
        await handleTimbrarNormal(ids);
    }, [isBOD, handleTimbrarNormal]);

    // Función para manejar éxito del pago en modo BOD
    const handlePagoSuccess = useCallback(() => {
        setConfirmationMessage('Pago realizado exitosamente. Procediendo a timbrar...');
        setOpenModalSuccess(true);
        setPagoCompletado(true);
        
        // Cerrar modal de pago
        setTimeout(() => {
            setOpenPagoModal(false);
        }, 1500);
    }, []);

    // Función para timbrar y enviar (con lógica BOD)
    const handleTimbrarYEnviar = useCallback(async (ids) => {
        // Validación para BOD: solo una factura a la vez
        if (isBOD && ids.length > 1) {
            setConfirmationMessage('En modo BOD solo se puede timbrar una factura a la vez.');
            setOpenModalError(true);
            return;
        }

        // Si está en modo BOD, manejamos el flujo completo
        if (isBOD) {
            const facturaId = ids[0];
            
            // Guardar la factura
            setFacturaParaTimbrarBOD(facturaId);
            
            // Abrir modal de pago
            setOpenPagoModal(true);
            return;
        }

        // Modo normal: timbrar y enviar
        setLoading(true);
        try {
            // Primero timbrar
            const timbradoResponse = await fetch(`${apiUrl}/api/facturas/TimbrarFactura`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Facturas_ID: ids }),
            });

            if (!timbradoResponse.ok) {
                throw new Error('Error en el timbrado de facturas');
            }

            const timbradoData = await timbradoResponse.json();
            
            // Filtrar solo las facturas que se timbraron correctamente
            const facturasTimbradasExitosas = timbradoData.Facturas?.filter(
                factura => factura.status === 'success'
            ) || [];

            if (facturasTimbradasExitosas.length === 0) {
                throw new Error('Ninguna factura se timbró correctamente');
            }

            // Enviar por correo las facturas timbradas
            const idsTimbrados = facturasTimbradasExitosas.map(factura => factura.facturaID);

            const envioResponse = await fetch(`${apiUrl}/api/facturas/EnviarFactura`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(idsTimbrados),
            });

            if (!envioResponse.ok) {
                throw new Error('Error al enviar facturas por correo');
            }

            // Procesar resultados
            let message = '';
            
            if (facturasTimbradasExitosas.length === ids.length) {
                message = 'Facturas timbradas y enviadas correctamente.';
            } else {
                const fallidas = ids.length - facturasTimbradasExitosas.length;
                message = `${facturasTimbradasExitosas.length} factura(s) timbrada(s) y enviada(s). ${fallidas} fallaron.`;
            }

            setConfirmationMessage(message);
            setOpenModalSuccess(true);
            fetchData();

        } catch (error) {
            console.error('Error en timbrado y envío:', error);
            setConfirmationMessage(`Error: ${error.message}`);
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token, fetchData, isBOD]);

    // Función para timbrar y enviar después de pago BOD
    const handleTimbrarYEnviarBOD = useCallback(async (id) => {
        setLoading(true);
        try {
            // Primero timbrar (endpoint BOD)
            const response = await fetch(`${apiUrl}/api/timbradocorporativo/TimbradoCorporativoBOD`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ Facturas_ID: [id] }),
            });

            if (!response.ok) {
                throw new Error('Error en el timbrado');
            }

            const result = await response.json();
            
            if (result.Facturas && result.Facturas[0]?.status === 'success') {
                // Enviar por correo
                const envioResponse = await fetch(`${apiUrl}/api/facturas/EnviarFactura`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify([id]),
                });

                if (!envioResponse.ok) {
                    throw new Error('Error al enviar factura por correo');
                }

                setConfirmationMessage('Factura timbrada y enviada correctamente.');
                setOpenModalSuccess(true);
                fetchData();
            } else {
                throw new Error(result.Facturas?.[0]?.error || 'Error al timbrar');
            }

        } catch (error) {
            console.error('Error en timbrado y envío BOD:', error);
            setConfirmationMessage(`Error: ${error.message}`);
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token, fetchData]);

    // Resto de funciones (descargar, enviar correo, ver PDF, etc.)
    const handleDownloadSelecteds = useCallback(async (ids) => {
        setLoading(true);
        try {
            for (const id of ids) {
                const response = await fetch(`${apiUrl}/api/facturas/DescargarFactura/${id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });

                if (response.ok) {
                    const blob = await response.blob();
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `factura_${id}.zip`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                } else {
                    console.error(`Error al descargar factura ${id}`);
                }
            }
        } catch (error) {
            console.error('Error al descargar:', error);
            setConfirmationMessage('Error al descargar los archivos.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleEnviarCorreo = useCallback(async (ids) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/facturas/EnviarFactura`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(ids),
            });

            if (response.ok) {
                setConfirmationMessage('Correos enviados exitosamente.');
                setOpenModalSuccess(true);
            } else {
                setConfirmationMessage('Error al enviar los correos.');
                setOpenModalError(true);
            }
        } catch (error) {
            console.error('Error al enviar correo:', error);
            setConfirmationMessage('Error de conexión al enviar correo.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleViewPdf = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/facturas/VerPdf/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                setConfirmationMessage('Error al visualizar el PDF.');
                setOpenModalError(true);
            }
        } catch (error) {
            console.error('Error al ver PDF:', error);
            setConfirmationMessage('Error de conexión al ver PDF.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleCancelarFactura = useCallback((row) => {
        setIDFacturaCancelada(row.ID);
        setOpenModalCancelar(true);
    }, []);

    const handleAcuseCancelacion = useCallback(async (id) => {
        setLoading(true);
        try {
            const response = await fetch(`${apiUrl}/api/facturas/DescargarAcuse/${id}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `acuse_cancelacion_${id}.pdf`;
                document.body.appendChild(a);
                a.click();
                a.remove();
            } else {
                setConfirmationMessage('Error al descargar el acuse.');
                setOpenModalError(true);
            }
        } catch (error) {
            console.error('Error al descargar acuse:', error);
            setConfirmationMessage('Error de conexión al descargar acuse.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    }, [token]);

    const handleDeleteFactura = useCallback(async () => {
        if (!facturaIdToDelete) return;

        try {
            const response = await fetch(`${apiUrl}/api/facturas/EliminarFactura/${facturaIdToDelete}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                setConfirmationMessage('Factura eliminada exitosamente.');
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

    const handleCloseMenu = useCallback(() => {
        setAnchorEl(null);
        setMenuRow(null);
    }, []);

    // Configuración de columnas (igual que antes)
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
                filter: false,
                sort: true,
            }
        },
        {
            name: "uuid",
            label: "UUID",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) => value || 'Sin timbrar'
            }
        },
        {
            name: "Emisor",
            label: "Emisor",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const rowData = data[tableMeta.rowIndex];
                    const emisor = rowData.Emisor || { Nombre: 'Desconocido', Rfc: '' };
                    return `${emisor.Nombre} (${emisor.Rfc})`;
                }
            }
        },
        {
            name: "Receptor",
            label: "Receptor",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const rowData = data[tableMeta.rowIndex];
                    const receptor = rowData.Receptor || { Nombre: 'Desconocido', Rfc: '' };
                    if (!receptor || !receptor.Nombre) return 'Desconocido';
                    return `${receptor.Nombre} (${receptor.Rfc})`;
                }
            }
        },
        {
            name: "Fecha",
            label: "Fecha Emisión",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "fechaTimbrado",
            label: "Fecha Timbrado",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const rowData = data[tableMeta.rowIndex];
                    if (!rowData.uuid) {
                        return <Chip label="Sin timbrar" color="warning" size="small" />;
                    }
                    return value || 'Sin timbrar';
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
            name: "Estatus",
            label: "Estatus",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value, tableMeta) => {
                    const rowData = data[tableMeta.rowIndex];
                    let status = 'No timbrada';
                    let color = 'default';

                    if (rowData.Estatus === 'Cancelada') {
                        status = 'Cancelada';
                        color = 'error';
                    } else if (rowData.uuid) {
                        status = 'Timbrada';
                        color = 'success';
                    }

                    return <Chip label={status} color={color} size="small" />;
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
            name: "actions",
            label: "Acciones",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const rowData = data[tableMeta.rowIndex];
                    return (
                        <IconButton onClick={(e) => {
                            e.stopPropagation();
                            setMenuRow(rowData);
                            setAnchorEl(e.currentTarget);
                        }}>
                            <MoreVertIcon />
                        </IconButton>
                    );
                }
            }
        }
    ], [data]);

    // Opciones de la tabla
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
            
            const isMultipleSelection = selectedIds.length > 1;
            const isBODDisabled = isBOD && isMultipleSelection;

            return (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        startIcon={<EmailIcon />}
                        onClick={() => handleEnviarCorreo(selectedIds)}
                        disabled={selectedIds.length === 0}
                    >
                        Enviar
                    </Button>
                    <Button
                        startIcon={<TimbrarIcon />}
                        onClick={() => handleTimbrar(selectedIds)}
                        disabled={selectedIds.length === 0 || isBODDisabled}
                        title={isBODDisabled ? "En modo BOD solo se puede timbrar una factura a la vez" : ""}
                    >
                        {isBOD ? "Timbrar Factura" : "Timbrar"}
                    </Button>
                    <Button
                        startIcon={<DescargarIcon />}
                        onClick={() => handleDownloadSelecteds(selectedIds)}
                        disabled={selectedIds.length === 0}
                    >
                        Descargar
                    </Button>
                    {!isBOD && (
                        <Button
                            startIcon={<TimbrarEnviarIcon />}
                            onClick={() => handleTimbrarYEnviar(selectedIds)}
                            disabled={selectedIds.length === 0}
                        >
                            Timbrar y Enviar
                        </Button>
                    )}
                </div>
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
    }), [data, handleEnviarCorreo, handleTimbrar, handleDownloadSelecteds, handleTimbrarYEnviar, isBOD]);

    // Tema personalizado
    const getMuiTheme = () => createTheme({
        components: {
            MUIDataTableBodyCell: {
                styleOverrides: {
                    root: {
                        fontSize: '11px',
                        padding: '0px 5px',
                    }
                }
            },
            MUIDataTableHeadCell: {
                styleOverrides: {
                    root: {
                        fontSize: '12px',
                        fontWeight: 'bold',
                        color: '#000',
                        backgroundColor: '#f0f0f0',
                        paddingTop: '5px',
                        paddingBottom: '5px',
                        paddingLeft: '0px',
                        paddingRight: '0px',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '100%',
                    }
                }
            }
        }
    });

    return (
        <Box>
            {loading && <LinearProgress />}
            
            {/* Indicador de modo BOD */}
            {isBOD && (
                <Alert 
                    severity="info" 
                    sx={{ mb: 2 }}
                    action={
                        <Chip 
                            label="MODO PAGO POR USO" 
                            color="primary" 
                            size="small"
                        />
                    }
                >
                    <Typography variant="body2" fontWeight="bold">
                        Modo BOD Activado - Pago por transacción
                    </Typography>
                    <Typography variant="caption">
                        Cada timbrado requiere pago previo. Seleccione solo una factura para proceder con el pago.
                    </Typography>
                </Alert>
            )}

            <ThemeProvider theme={getMuiTheme()}>
                <MUIDataTable
                    title="Vista General de Facturas"
                    data={data}
                    columns={columns}
                    options={options}
                />
            </ThemeProvider>

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
                isBOD={isBOD}
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

            {/* Modal de pago para BOD */}
            {openPagoModal && (
                <PagoModal
                    open={openPagoModal}
                    onClose={() => {
                        setOpenPagoModal(false);
                        setFacturaParaTimbrarBOD(null);
                    }}
                    token={token}
                    setCompra={handlePagoSuccess}
                    opcion={{
                        ID: 'timbre_individual',
                        Nombre: 'Timbre Individual',
                        Costo: 10, // Precio por timbre individual
                        CantidadTimbres: 1,
                        Descripcion: 'Timbre de factura electrónica'
                    }}
                />
            )}

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