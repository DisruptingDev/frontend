'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
    Delete as DeleteIcon,
    Cancel as CancelIcon,
    Payment as PaymentIcon,
    MoreVert as MoreVertIcon
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import MUIDataTable from "mui-datatables";

// Importación de componentes de modal
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar';

// Utilidades
import { formatCurrency } from '@/utils/formatCurrency';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

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

    // Estados para operaciones
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [facturasTimbrar, setFacturasTimbrar] = useState([]);
    const [facturasRemplazo, setFacturasRemplazo] = useState([]);
    const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
    const [resultadoCancelar, setResultadoCancelar] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);

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
                        Receptor: item.Receptor || { Nombre: 'Desconocido', Rfc: '' }
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
    const handleTimbrar = async (ids) => {
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
    };

    const handleDownloadSelecteds = async (ids) => {
        setLoading(true);
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
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = ids.length === 1 ? 'Factura.zip' : 'Facturas.zip';
                document.body.appendChild(a);
                a.click();
                a.remove();

                setConfirmationMessage(ids.length === 1 ?
                    'Su archivo se ha descargado. Revise su carpeta de descargas.' :
                    'Su archivo Facturas.zip se ha descargado. Revise su carpeta de descargas.');
                setOpenModalSuccess(true);
            }
        } catch (error) {
            setConfirmationMessage('Error al descargar la factura.');
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    };

    const handleEnviarCorreo = async (ids) => {
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
    };

    const handleTimbrarYEnviar = async (ids) => {
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
    };

    // Operaciones con una sola factura
    const handleViewPdf = async (id) => {
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
    };

    const handleCancelarFactura = (row) => {
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
    };

    const handleDeleteFactura = async () => {
        try {
            const response = await fetch(`${apiUrl}/api/facturas/${menuRow.ID}`, {
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
        } finally {
            setOpenModalConfirm(false);
            setMenuRow(null);
        }
    };

    const handleFacturaPago = async (row) => {
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
    };

    // Configuración de columnas para mui-datatables
    const columns = [
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
                customBodyRender: (value) => value || 'Sin timbrar'
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
            name: "Conceptos.TotalImpuestosTrasladados",
            label: "Traslados",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value || 0)
            }
        },
        {
            name: "Conceptos.TotalImpuestosRetenidos",
            label: "Retenciones",
            options: {
                filter: false,
                sort: true,
                customBodyRender: (value) => formatCurrency(value || 0)
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
    ];

    // Opciones de la tabla
    const options = {
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
        setTableProps: () => ({
            style: {
                // Estilos para la tabla completa
            },
        }),
        setHeaderProps: () => ({
            style: {
                backgroundColor: '#1976d2', // Color de fondo del encabezado
                color: 'white',            // Color del texto
                fontWeight: 'bold',        // Negrita
                fontSize: '14px',          // Tamaño de fuente
            },
        }),
        customToolbarSelect: (selectedRows, displayData, setSelectedRows) => {
            const selectedIds = selectedRows.data.map(index => data[index.dataIndex].ID);

            return (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <Button
                        startIcon={<EmailIcon />}
                        onClick={() => handleEnviarCorreo(selectedIds)}
                    >
                        Enviar
                    </Button>
                    <Button
                        startIcon={<TimbrarIcon />}
                        onClick={() => handleTimbrar(selectedIds)}
                    >
                        Timbrar
                    </Button>
                    <Button
                        startIcon={<DescargarIcon />}
                        onClick={() => handleDownloadSelecteds(selectedIds)}
                    >
                        Descargar
                    </Button>
                    <Button
                        startIcon={<TimbrarEnviarIcon />}
                        onClick={() => handleTimbrarYEnviar(selectedIds)}
                    >
                        Timbrar y Enviar
                    </Button>
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
    };

    // Menú contextual
    const ActionMenu = () => {
        if (!menuRow) return null;

        const handleClose = () => {
            setAnchorEl(null);
            setMenuRow(null);
        };

        const handleEdit = () => {
            if (menuRow.TipoDeComprobante === 'P') {
                router.push(`/EditarComplementoPago/${menuRow.ID}`);
            } else {
                router.push(`/EditarFactura/${menuRow.ID}`);
            }
            handleClose();
        };

        const handleClone = () => {
            router.push(`/CrearFactura/${menuRow.ID}`);
            handleClose();
        };

        const handleDelete = () => {
            setConfirmationMessage('¿Estás seguro de que deseas eliminar esta factura?');
            setOpenModalConfirm(true);
            handleClose();
        };

        return (
            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={handleClose}
            >
                {!menuRow.uuid && menuRow.TipoDeComprobante !== 'P' && [
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

                {!menuRow.uuid && menuRow.TipoDeComprobante === 'P' && [
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
                    </MenuItem>,
                ]}

                {menuRow.uuid && menuRow.TipoDeComprobante !== "P" && [
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

                {menuRow.uuid && menuRow.TipoDeComprobante === "P" && [
                    <MenuItem key="cancelar-pago" onClick={() => { handleCancelarFactura(menuRow); handleClose(); }}>
                        <CancelIcon fontSize="small" sx={{ mr: 1 }} /> Cancelar
                    </MenuItem>,
                    <MenuItem key="clone-pago" onClick={handleClone}>
                        <CloneIcon fontSize="small" sx={{ mr: 1 }} /> Clonar
                    </MenuItem>,
                    <MenuItem key="descargar-pago" onClick={() => { handleDownloadSelecteds([menuRow.ID]); handleClose(); }}>
                        <DescargarIcon fontSize="small" sx={{ mr: 1 }} /> Descargar
                    </MenuItem>,
                ]}

                {menuRow.MetodoPago === 'PPD' && menuRow.uuid && [
                    <MenuItem key="pago" onClick={() => { handleFacturaPago(menuRow); handleClose(); }}>
                        <PaymentIcon fontSize="small" sx={{ mr: 1 }} /> Complemento de Pago
                    </MenuItem>
                ]}
            </Menu>
        );
    };

    return (
        <Box>
            <MUIDataTable
                title="Vista General de Facturas"
                data={data}
                columns={columns}
                options={options}
            />

            <ActionMenu />

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