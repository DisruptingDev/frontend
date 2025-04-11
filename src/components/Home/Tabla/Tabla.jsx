'use client';
import React, { useState, useEffect, useCallback } from 'react';
import MUIDataTable from "mui-datatables";
import {
  Box,
  IconButton,
  Button,
  Menu,
  MenuItem,
  CircularProgress
} from '@mui/material';
import {
  MoreVert,
  CloudDownload,
  Email,
  Receipt
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';
import JSZip from 'jszip';

// Componentes de modales
import ModalLoading from '@/components/Home/Modales/modalLoading';
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar';
import PdfModal from '../Modales/modalPDF';

// Utilidades
import { formatCurrency } from '@/utils/formatCurrency';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function DataTable({ token, filtro }) {
  const router = useRouter();
  const pathname = usePathname();

  // Estados principales
  const [rows, setRows] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [selectedRows, setSelectedRows] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados para menú contextual
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  // Estados para modales
  const [openModal, setOpenModal] = useState(false);
  const [openModalSuccess, setOpenModalSuccess] = useState(false);
  const [openModalError, setOpenModalError] = useState(false);
  const [openModalTimbrar, setOpenModalTimbrar] = useState(false);
  const [openModalCancelar, setOpenModalCancelar] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [facturasTimbradas, setFacturasTimbradas] = useState([]);
  const [facturasRemplazo, setFacturasRemplazo] = useState([]);
  const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
  const [resultadoCancelar, setResultadoCancelar] = useState(null);

  // Estados para PDF
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Textos personalizados para la tabla
  const textLabels = {
    body: {
      noMatch: "No se encontraron registros",
      toolTip: "Ordenar",
    },
    pagination: {
      next: "Siguiente",
      previous: "Anterior",
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
      reset: "LIMPIAR",
    },
    viewColumns: {
      title: "Mostrar columnas",
      titleAria: "Mostrar/Ocultar columnas",
    },
    selectedRows: {
      text: "fila(s) seleccionada(s)",
      delete: "Eliminar",
      deleteAria: "Eliminar filas seleccionadas",
    }
  };

  // Columnas de la tabla
  const columns = [
    {
      name: "ID",
      label: "ID",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{value}</CenterCell>
      }
    },
    {
      name: "Folio",
      label: "Folio",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{value}</CenterCell>
      }
    },
    {
      name: "Emisor.Nombre",
      label: "Emisor",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{value || 'Desconocido'}</CenterCell>
      }
    },
    {
      name: "Receptor.Nombre",
      label: "Receptor",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{value || 'Desconocido'}</CenterCell>
      }
    },
    {
      name: "Fecha",
      label: "Fecha Emisión",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{new Date(value).toLocaleDateString()}</CenterCell>
      }
    },
    {
      name: "fechaTimbrado",
      label: "Fecha Timbrado",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => (
          <CenterCell>
            {tableMeta.rowData[tableMeta.columnIndex] ? new Date(value).toLocaleDateString() : ''}
          </CenterCell>
        )
      }
    },
    {
      name: "Serie",
      label: "Serie",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{value}</CenterCell>
      }
    },
    {
      name: "MetodoPago",
      label: "Método Pago",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => (
          <CenterCell>{tableMeta.rowData[6] === "P" ? "PUE" : value}</CenterCell>
        )
      }
    },
    {
      name: "uuid",
      label: "Estatus",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => (
          <CenterCell>
            {tableMeta.rowData[tableMeta.columnIndex] ? "Timbrada" : "No timbrada"}
          </CenterCell>
        )
      }
    },
    {
      name: "SubTotal",
      label: "Subtotal",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{formatCurrency(value)}</CenterCell>
      }
    },
    {
      name: "Conceptos.TotalImpuestosTrasladados",
      label: "Traslados",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{formatCurrency(value || 0)}</CenterCell>
      }
    },
    {
      name: "Conceptos.TotalImpuestosRetenidos",
      label: "Retenciones",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => <CenterCell>{formatCurrency(value || 0)}</CenterCell>
      }
    },
    {
      name: "Total",
      label: "Total",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value, tableMeta) => (
          <CenterCell>
            {tableMeta.rowData[5] === "P" ?
              formatCurrency(tableMeta.rowData[17]?.Complemento?.Pagos?.Totales?.MontoTotalPagos || 0) :
              formatCurrency(value)}
          </CenterCell>
        )
      }
    },
    {
      name: "actions",
      label: "Acciones",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          const rowData = rows[tableMeta.rowIndex];
          return (
            <div style={{ textAlign: 'center' }}>
              <IconButton onClick={(event) => handleMenuClick(event, rowData)}>
                <MoreVert />
              </IconButton>
            </div>
          );
        }
      }
    }
  ];

  // Componente para centrar celdas
  const CenterCell = ({ children }) => (
    <div style={{ textAlign: 'center', width: '100%' }}>{children}</div>
  );

  // Opciones de la tabla
  const options = {
    filterType: 'dropdown',
    responsive: 'standard',
    selectableRows: 'multiple',
    rowsSelected: selectedRows.map(id => rows.findIndex(row => row.ID === id)),
    onRowSelectionChange: (currentRowsSelected, allRowsSelected) => {
      const selectedIds = allRowsSelected.map(index => rows[index].ID);
      setSelectedRows(selectedIds);
    },
    customToolbarSelect: selected => (
      <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
        <Button
          variant="contained"
          size="small"
          startIcon={<Email />}
          onClick={() => handleEnviarCorreo(selected.map(index => rows[index].ID))}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
        >
          Enviar
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<Receipt />}
          onClick={() => handleTimbrar(selected.map(index => rows[index].ID))}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
        >
          Timbrar
        </Button>
        <Button
          variant="contained"
          size="small"
          startIcon={<CloudDownload />}
          onClick={() => handleDownloadSelecteds(selected.map(index => rows[index].ID))}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
        >
          Descargar
        </Button>
      </div>
    ),
    textLabels,
    onRowClick: (rowData, rowMeta) => {
      handleRowClick(rows[rowMeta.dataIndex]);
    },
    setTableProps: () => ({
      sx: {
        '& .MuiTableCell-head': {
          backgroundColor: '#10968A',
          color: 'white',
          fontWeight: 'bold',
        },
      }
    }),
    customLoadingOverlay: () => (
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100
      }}>
        <CircularProgress />
      </div>
    )
  };

  // Función para obtener datos de la API
  const fetchData = useCallback(async () => {
    if (token) {
      try {
        setLoading(true);
        const response = await fetch(`${apiUrl}/api/facturas/ListarFacturas`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();

        if (Array.isArray(data)) {
          const sortedData = data.sort((a, b) => b.ID - a.ID);
          setRows(sortedData);
          setRegistros(sortedData);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [token]);

  // Efecto para cargar datos iniciales
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Funciones para manejar acciones
  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleDownloadSelecteds = async (ids) => {
    setLoading(true);
    setOpenModal(true);

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
        a.download = ids.length === 1 ? `Factura` : `Facturas`;
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
      setOpenModal(false);
    }
  };

  // ... (Implementa las demás funciones: handleViewSingleFile, handleEnviarCorreo, handleTimbrar, etc.)
  const handleViewSingleFile = async (id) => {
    console.log("Visualizando factura:", id);
    setLoadingPdf(true);
    setPdfError(null);

    try {
      const response = await fetch(`${apiUrl}/api/descargararchivos/DescargarArchivos`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(id),
      });

      if (!response.ok) throw new Error('Error al obtener el archivo desde el servidor.');

      const zipBlob = await response.blob();
      const jszip = new JSZip();
      const zipContent = await jszip.loadAsync(zipBlob);

      const folderName = `Factura_${id}/`;
      const folderFiles = Object.keys(zipContent.files)
        .filter(relativePath => relativePath.startsWith(folderName) && !relativePath.endsWith('/'));

      if (folderFiles.length === 0) throw new Error(`No se encontraron archivos en ${folderName}.`);

      const pdfFileName = folderFiles.find(fileName => fileName.toLowerCase().endsWith('.pdf'));
      if (!pdfFileName) throw new Error('No se encontró un archivo PDF.');

      const pdfFile = zipContent.files[pdfFileName];
      const pdfBlob = await pdfFile.async('blob');
      const url = URL.createObjectURL(pdfBlob);
      
      setPdfUrl(url);
      setPdfModalOpen(true);

    } catch (error) {
      console.error("Error:", error);
      setPdfError("Error al visualizar la factura: " + error.message);
    } finally {
      setLoadingPdf(false);
    }
  };

  // Función auxiliar para verificar los primeros bytes
  async function getFirstBytes(blob) {
    const buffer = await blob.slice(0, 4).arrayBuffer();
    return Array.from(new Uint8Array(buffer)).map(b => b.toString(16)).join(' ');
  }

  // Función para enviar múltiples facturas por correo
  const handleEnviarCorreo = async (ids) => {
    console.log('Enviando facturas por correo:', ids);
    setLoading(true);
    setOpenModal(true);

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
        console.log('Data received from API (correo):', response);
        setLoading(false);
        setConfirmationMessage('Las facturas se han enviado correctamente por correo.');
        setOpenModalSuccess(true);
      } else {
        throw new Error('Error al enviar las facturas por correo');
      }
    } catch (error) {
      console.error('Error:', error);
      setConfirmationMessage('Error al enviar las facturas por correo.');
      setOpenModalError(true);
    } finally {
      setLoading(false);
      setOpenModal(false); // Ocultar el modal de espera
    }
  };



  // Función para timbrar múltiples facturas
  const handleTimbrar = async (ids) => {
    setOpenModal(true);
    setLoading(true);

    try {
      console.log('Timbrando facturas:', ids);
      // const token = localStorage.getItem('authToken');
      const response = await fetch(`${apiUrl}/api/timbradocorporativo/TimbradoCorporativo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ Facturas_ID: ids }),
      });

      if (response.ok) {
        const data = await response.json(); // Obtén la respuesta JSON
        console.log('Data received from API:', data);
        // Dependiendo del status en la respuesta, muestra diferentes notificaciones

        if (data.Facturas.length > 1) {
          setOpenModalTimbrar(true);

          const statusList = data.Facturas.map(factura => ({
            id: factura.facturaID, // Suponiendo que cada factura tiene un ID
            status: factura.status,
            error: factura.error || null,
          }));
          console.log('Status list:', statusList);
          setFacturasTimbradas(statusList); // Guarda el estado de las facturas
        } else if (data.Facturas.length === 1) {
          const factura = data.Facturas[0];
          if (factura.status === 'success') {
            console.log('Factura timbrada:', factura);

            setConfirmationMessage('Facturas timbradas exitosamente.');
            setOpenModalSuccess(true); // Show success modal

          } else if (factura.status === 'error') {
            console.error('Error al timbrar factura:', factura);
            const error = factura.error
            setConfirmationMessage('Error al timbrar facturas:  <br/> ' + error);
            setOpenModalError(true); // Show error modal
          }
        } else {
          setConfirmationMessage('Error en la conexión con el servidor.');
          setOpenModalError(true); // Show error modal
        }
      } else {

        setConfirmationMessage('Error en la conexión con el servidor.');
        setOpenModalError(true); // Show error modal
      }
    } catch (error) {

      console.error('Error:', error);
      setConfirmationMessage('Error en la conexión o en el timbrado.');
      setOpenModalError(true); // Show error modal
    } finally {
      setLoading(false);
      setOpenModal(false); // Hide loading modal
      setActualizar(true);
    }
  };

  // Función para cancelar facturas
  const handleCancelar = () => {
    if (menuRow) {
      console.log('Cancelando factura:', menuRow);
      const filtro = {
        Emisor: menuRow.Emisor.Rfc,
        Receptor: menuRow.Receptor.Rfc,
        Estatus: 'timbrada'
      }
      const registros = filtrado(filtro);
      console.log('Filtrado:', registros);
      console.log("ID", menuRow.ID);
      setIDFacturaCancelada(menuRow.ID);
      setFacturasRemplazo(registros);
      setOpenModalCancelar(true);
    }
  };

  useEffect(() => {
    if (resultadoCancelar === "success") {
      setOpenModalSuccess(true);
      setConfirmationMessage('Factura cancelada exitosamente.');
      setIDFacturaCancelada(null);
      setActualizar(true);
    }
    else if (resultadoCancelar === "error") {
      setOpenModalError(true);
      setConfirmationMessage('Error al cancelar facturas.');
      setIDFacturaCancelada(null);
      setActualizar(true);
    }
  }, [resultadoCancelar]);


  const handleRowClick = (row) => {
    setSelectedRow(row);
    console.log('Selected row:', row);
  };


  const handleEdit = () => {
    if (menuRow) {
      console.log(menuRow);
      router.push(`/EditarFactura/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };

  const handleClone = () => {
    if (menuRow) {
      console.log(menuRow);
      router.push(`/CrearFactura/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };

  const handleDelete = () => {
    if (menuRow) {
      console.log(menuRow);
      router.push(`/CrearFactura/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };

  const handleFacturaPago = async () => {
    if (menuRow) {
      console.log(menuRow);
      if (menuRow.Emisor.ID) {
        console.log("Emisor ID", menuRow.Emisor.ID);
        try {
          const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${menuRow.Emisor.ID}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            console.log('Data received from API:', data);
            const opciones = data.filter(opcion => opcion.TipoComprobante === 'P')
            console.log('Opciones:', opciones);
            if (opciones.length > 0) {
              router.push(`/FacturaPago/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
            }
            else {
              setConfirmationMessage('No existe serie de pago, validar');
              setOpenModalError(true); // Show error modal
            }
          }
        } catch (error) {
          console.error('Error fetching serie:', error);

        }
      }
      // router.push(`/FacturaPago/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };


  return (
    <Box bgcolor="white" my={2}>
      <MUIDataTable
        title="Listado de Facturas"
        data={rows}
        columns={columns}
        options={options}
      />

      {/* Menú contextual */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        {menuRow && !menuRow.uuid && menuRow.TipoDeComprobante !== 'P' && [
          <MenuItem key="timbrar" onClick={() => handleTimbrar([menuRow.ID])}>Timbrar</MenuItem>,
          <MenuItem key="prefactura" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar Prefactura</MenuItem>,
          <MenuItem key="edit" onClick={() => router.push(`/EditarFactura/${menuRow.ID}`)}>Editar</MenuItem>,
          <MenuItem key="clone" onClick={() => router.push(`/CrearFactura/${menuRow.ID}`)}>Clonar</MenuItem>,
          <MenuItem key="delete" onClick={() => router.push(`/CrearFactura/${menuRow.ID}`)}>Eliminar</MenuItem>
        ]}
        {menuRow && menuRow.uuid === '' && menuRow.TipoDeComprobante === 'P' && [
          <MenuItem key="timbrar" onClick={() => handleTimbrar([menuRow.ID])}>Timbrar</MenuItem>,
          <MenuItem key="prefactura" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar Prefactura</MenuItem>,
          <MenuItem key="eliminar" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Eliminar</MenuItem>,
        ]}
        {
          menuRow && menuRow.uuid !== '' && menuRow.TipoDeComprobante !== "P" && [
            <MenuItem key="descargar" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar</MenuItem>,
            <MenuItem key="ver" onClick={() => handleViewSingleFile([menuRow.ID])}>Ver</MenuItem>,
            <MenuItem key="clone" onClick={handleClone}>Clonar</MenuItem>,
            <MenuItem key="cancelar" onClick={handleCancelar}>Cancelar</MenuItem>
          ]
        }
        {
          menuRow && menuRow.uuid !== '' && menuRow.TipoDeComprobante === "P" && [
            <MenuItem key="cancelar" onClick={handleCancelar}>Cancelar</MenuItem>,
            <MenuItem key="clone" onClick={handleClone}>Clonar</MenuItem>,
            <MenuItem key="descargar" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar</MenuItem>,
          ]
        }
        {
          menuRow && menuRow.MetodoPago === 'PPD' && menuRow.uuid !== '' && [
            <MenuItem key="pago" onClick={handleFacturaPago}>Complemento de Pago</MenuItem>
          ]
        }

      </Menu>

      {/* Modales */}
      <ModalLoading openModal={openModal} handleCloseModal={() => setOpenModal(false)} loading={loading} loadingMessage="Espere un momento..." />
      <ModalExito openModalSuccess={openModalSuccess} handleCloseModal={() => setOpenModalSuccess(false)} confirmationMessage={confirmationMessage} />
      <ModalError openModalError={openModalError} handleCloseModal={() => setOpenModalError(false)} confirmationMessage={confirmationMessage} />
      <ModalTimbrar
        openModalTimbrar={openModalTimbrar}
        handleCloseModal={() => setOpenModalTimbrar(false)}
        facturasTimbradas={facturasTimbradas}
      />
      <ModalCancelar
        openModalCancelar={openModalCancelar}
        handleCloseModal={() => setOpenModalCancelar(false)}
        facturasRemplazo={facturasRemplazo}
        IDFacturaCancelada={IDFacturaCancelada}
        token={token}
        setResultadoCancelar={setResultadoCancelar}
      />
      <PdfModal
        open={pdfModalOpen}
        onClose={() => {
          setPdfModalOpen(false);
          if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
            setPdfUrl(null);
          }
        }}
        pdfUrl={pdfUrl}
        loading={loadingPdf}
        error={pdfError}
      />
    </Box>
  );
}