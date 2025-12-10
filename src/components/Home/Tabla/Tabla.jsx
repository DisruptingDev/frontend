'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  TablePagination,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from '@mui/material';

import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation'; // Importa correctamente desde next/navigation


import ModalLoading from '@/components/Home/Modales/modalLoading';
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar';

import { formatCurrency } from '@/utils/formatCurrency';
import JSZip from 'jszip';

import PdfModal from '../Modales/modalPDF';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function createData(item) {
  return { ...item };
}

// Función para formatear como moneda

export default function DataTable({ token, filtro }) {
  const router = useRouter(); // Hook de Next.js para manejar la navegación

  //Estados Principales
  const [rows, setRows] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  //Modales
  const [openModal, setOpenModal] = useState(false); // Loading modal
  const [openModalSuccess, setOpenModalSuccess] = useState(false); // Success modal
  const [openModalError, setOpenModalError] = useState(false); // Error modal
  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState('');
  const [openModalTimbrar, setOpenModalTimbrar] = useState(false);
  const [openModalCancelar, setOpenModalCancelar] = useState(false);

  //Estados para menú
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);

  //Otros estados auxiliares
  const loadingMessage = 'Espere un momento...'; // Mensaje de espera
  const [facturasTimbradas, setFacturasTimbradas] = useState([]);
  const [facturasRemplazo, setFacturasRemplazo] = useState([]);
  const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
  const [resultadoCancelar, setResultadoCancelar] = useState(null);
  const [expandedIndexes, setExpandedIndexes] = useState({});
  const [actualizar, setActualizar] = useState(false);
  const [mensajeFiltros, setmensajeFiltros] = useState("");

  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  const [openModalConfirm, setOpenModalConfirm] = useState(false);

  // Función para alternar la expansión de una factura específica
  const handleToggleExpand = (index) => {
    setExpandedIndexes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  // Cierra todos los modales
  const handleCloseModal = () => {
    setOpenModal(false);
    setOpenModalSuccess(false);
    setOpenModalError(false);
    setOpenModalTimbrar(false);
    setOpenModalCancelar(false);
  };


  // Función para manejar la selección de filas
  const handleSelectRow = (row) => {
    setSelectedRows((prev) => {
      if (prev.includes(row.ID)) {
        return prev.filter((id) => id !== row.ID);
      } else {
        return [...prev, row.ID];
      }
    });
  };

  // Obtiene detalles de una factura por ID
  const obtenerFactura = async (id) => {
    try {
      // const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
      const response = await fetch(`${apiUrl}/api/facturas/ObtenerFactura/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Data received from API:', data);
        return data;
      }
    } catch (error) {
    }
  };

  // Función para descargar múltiples facturas
  const handleDownloadSelecteds = async (ids) => {
    console.log('Descargando facturas:', ids);
    setLoading(true);
    setOpenModal(true);

    try {
      const response = await fetch(`${apiUrl}/api/descargararchivos/DescargarArchivos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        // body: JSON.stringify(facturasValidas),
        body: JSON.stringify(ids),
      });
      if (response.ok) {
        console.log('Data received from API (zip):', response);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        if (ids.length === 1) {
          // a.download = `${facturasValidas[0].name}`;
          a.download = `Factura`;
        }
        else {
          a.download = `Facturas`;
        }
        document.body.appendChild(a);
        a.click();
        a.remove();
        setLoading(false);
        if (ids.length === 1) {
          setConfirmationMessage(`Su archivo  se ha descargado. <br/>
          Revise su carpeta de descargas.`);
        }
        else {
          setConfirmationMessage(`Su archivo Facturas.zip se ha descargado. <br/>
          Revise su carpeta de descargas.`);
        }
        setOpenModalSuccess(true);
      }
      if (!response.ok) {
        throw new Error('Error en la descarga de archivos');
      }
    } catch (error) {
      console.error('Error:', error);
      console.error('Error:', error);
      setConfirmationMessage('Error al descargar la factura.');
      setOpenModalError(true);
    } finally {
      setLoading(false);
      setOpenModal(false); // Ocultar el modal de espera
    }
  };

  const handleViewSingleFile = async (id) => {
    console.log("Visualizando factura:", id);
    setLoadingPdf(true);
    setPdfError(null);

    try {
      const response = await fetch(`${apiUrl}/api/descargararchivos/VerPDF/${id}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al obtener el PDF desde el servidor.');
      }

      // Verificar el tipo de contenido
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/pdf')) {
        // Opcional: Ver los primeros bytes para diagnóstico
        const blob = await response.blob();
        const firstBytes = await getFirstBytes(blob);
        console.log("Primeros bytes del archivo:", firstBytes);
        throw new Error('El archivo recibido no es un PDF válido.');
      }

      const pdfBlob = await response.blob();
      const pdfUrl = URL.createObjectURL(pdfBlob);

      // Opción 1: Mostrar en modal
      // setPdfUrl(pdfUrl);
      // setPdfModalOpen(true);

      // Opción 2: Abrir en nueva pestaña
      window.open(pdfUrl, '_blank');

    } catch (error) {
      console.error("Error:", error);
      setPdfError("Error al visualizar la factura: " + error.message);
    } finally {
      setLoadingPdf(false);
    }
  };

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

  // Función para timbrar y enviar facturas
  const handleTimbrarYEnviar = async (ids) => {
    setOpenModal(true);
    setLoading(true);
    setConfirmationMessage('Procesando timbrado y envío de facturas...');

    try {
      console.log('Timbrando y enviando facturas:', ids);

      // 1. Primero timbramos las facturas
      const timbradoResponse = await fetch(`${apiUrl}/api/timbradocorporativo/TimbradoCorporativo`, {
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
      console.log('Resultado timbrado:', timbradoData);

      // Filtrar solo las facturas que se timbraron correctamente
      const facturasTimbradasExitosas = timbradoData.Facturas.filter(
        factura => factura.status === 'success'
      );

      if (facturasTimbradasExitosas.length === 0) {
        throw new Error('Ninguna factura se timbró correctamente');
      }

      // 2. Luego enviamos por correo las facturas timbradas
      const idsTimbrados = facturasTimbradasExitosas.map(factura => factura.facturaID);

      const envioResponse = await fetch(`${apiUrl}/api/enviofacturas/EnviarFacturas`, {
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
        // Todas se timbraron y enviaron
        message = 'Todas las facturas se timbraron y enviaron correctamente.';
      } else {
        // Algunas fallaron
        const fallidas = ids.length - facturasTimbradasExitosas.length;
        message = `${facturasTimbradasExitosas.length} facturas timbradas y enviadas correctamente. ${fallidas} facturas no se pudieron procesar.`;
      }

      // Mostrar detalles si es una sola factura
      if (ids.length === 1) {
        if (facturasTimbradasExitosas.length === 1) {
          message = 'Factura timbrada y enviada correctamente.';
        } else {
          const error = timbradoData.Facturas[0].error || 'Error desconocido';
          message = `Error al timbrar y enviar: ${error}`;
        }
      }

      setConfirmationMessage(message);
      setOpenModalSuccess(true);

      // Si hay resultados mixtos, mostramos el modal de timbrado con detalles
      if (facturasTimbradasExitosas.length > 0 && facturasTimbradasExitosas.length < ids.length) {
        setFacturasTimbradas(timbradoData.Facturas.map(factura => ({
          id: factura.facturaID,
          status: factura.status,
          error: factura.error || null,
        })));
        setOpenModalTimbrar(true);
      }

    } catch (error) {
      console.error('Error en timbrado y envío:', error);
      setConfirmationMessage(`Error al procesar las facturas: ${error.message}`);
      setOpenModalError(true);
    } finally {
      setLoading(false);
      setOpenModal(false);
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



  // Función para obtener datos de la API
  const fetchData = useCallback(async () => {
    if (token) {
      try {
        // const token = localStorage.getItem('authToken');

        const response = await fetch(`${apiUrl}/api/facturas/ListarFacturas`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        console.log('Data received from API:', data);

        if (Array.isArray(data)) {
          const transformedData = data.map((item) => createData(item));
          const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
          setRows(sortedData);
          setRegistros(sortedData);
        } else {
          console.error('Expected an array but received:', typeof data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    }
  }, [token]);

  // Obtiene los datos al cargar el componente
  useEffect(() => {
    fetchData();
  }, [fetchData, token]);

  // Actualiza los datos al cambiar el estado de actualizar
  useEffect(() => {
    if (actualizar) {
      console.log('Actualizando');
      fetchData();
      setActualizar(false);
    }
  }, [actualizar, fetchData]);

  // Filtrado de datos
  const filtrado = (filtro) => {
    const fechaInicio = filtro.FechaInicio ? new Date(filtro.FechaInicio) : null;
    const fechaFin = filtro.FechaFin ? new Date(filtro.FechaFin) : null;
    let filteredRows = registros;

    // Filtra por Emisor, Receptor, Estatus y Fechas
    if (filtro.Emisor) filteredRows = filteredRows.filter((registro) => registro.Emisor.Rfc.includes(filtro.Emisor));
    if (filtro.Receptor) filteredRows = filteredRows.filter((registro) => registro.Receptor.Rfc.includes(filtro.Receptor));
    if (filtro.Estatus === 'timbrada') filteredRows = filteredRows.filter((registro) => registro.uuid);
    if (filtro.Estatus === 'notimbrada') filteredRows = filteredRows.filter((registro) => !registro.uuid);
    if (fechaInicio && fechaFin)
      filteredRows = filteredRows.filter(
        (registro) => new Date(registro.Fecha) >= fechaInicio && new Date(registro.Fecha) <= fechaFin
      );
    return filteredRows;
  };

  useEffect(() => {
    if (filtro) {
      console.log('Filtrando:', filtro);
      const newFilteredRows = filtrado(filtro);
      if (newFilteredRows.length === 0) {
        console.log('No hay resultados con los filtros aplicados: ', filtro);

        // Construir un mensaje legible a partir de los valores del filtro
        const filtroDescripcion = Object.entries(filtro)
          .map(([key, value]) => `<strong>${key}</strong>: ${value || 'N/A'}`)
          .join(', ');

        setmensajeFiltros(
          `No hay resultados con los filtros aplicados: ${filtroDescripcion}`
        );
      } else {
        setmensajeFiltros(''); // Limpiar el mensaje si hay resultados
      }
      setRows(newFilteredRows);
    } else {
      console.log('No hay filtro');
      setmensajeFiltros(''); // Limpiar el mensaje si no hay filtro
    }
  }, [filtro]);


  // Función para manejar el click en una fila
  const handleRowClick = (row) => {
    setSelectedRow(row);
    console.log('Selected row:', row);
  };

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleEdit = () => {
    if (menuRow) {
      console.log(menuRow);
      router.push(`/EditarFactura/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };

  const handleEditPay = () => {
    if (menuRow) {
      console.log(menuRow);
      router.push(`/EditarComplementoPago/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };

  const handleClone = () => {
    if (menuRow) {
      console.log(menuRow);
      router.push(`/CrearFactura/${menuRow.ID}`); // Redirige a la página de edición con el ID de la factura
    }
  };

  const handleDelete = async () => {
    if (menuRow) {
      setConfirmationMessage('¿Estás seguro de que deseas eliminar esta factura?');
      setOpenModalConfirm(true);
    }
  };

  // Función para manejar la confirmación (se ejecuta cuando el usuario acepta en el modal)
  const handleConfirmDelete = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/facturas/${menuRow.ID}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        console.log('Factura eliminada exitosamente');
        setConfirmationMessage('La factura se ha eliminado correctamente.');
        setOpenModalSuccess(true);
        setActualizar(true);
        setOpenModalConfirm(false);
        handleMenuClose();
      } else {
        console.error('Error al eliminar la factura:', response.statusText);
        setConfirmationMessage('Error al eliminar la factura.');
        setOpenModalError(true);
        setOpenModalConfirm(false);
      }
    } catch (error) {
      console.error('Error en la solicitud DELETE:', error);
      setOpenModalConfirm(false);
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


  // Paginación
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box bgcolor="white" my={2} >
      <Box display="flex" justifyContent="flex-end" mb={2} gap={2} >
        <Button
          variant="contained"
          disabled={selectedRows.length === 0}
          onClick={() => handleEnviarCorreo(selectedRows)}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
        >
          Enviar por correo
        </Button>
        <Button
          variant="contained"
          disabled={selectedRows.length === 0}
          onClick={() => handleTimbrar(selectedRows)}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
        >
          Timbrar Seleccionadas
        </Button>
        <Button
          variant="contained"

          disabled={selectedRows.length === 0}
          onClick={() => handleDownloadSelecteds(selectedRows)}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f', } }}
        >
          Descargar Seleccionadas
        </Button>
        <Button
          variant="contained"

          disabled={selectedRows.length === 0}
          onClick={() => handleTimbrarYEnviar(selectedRows)}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f', } }}
        >
          Timbrar y enviar seleccionadas
        </Button>
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer align='center'>
          <Table sx={{ minWidth: 650 }} aria-label="customized table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#10968A' }}>
                <TableCell padding="checkbox" sx={{ textAlign: 'center' }} />
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Folio</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Emisor</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Receptor</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha Emisión</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha Timbrado</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Serie</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Método de Pago</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Estatus</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Subtotal</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Traslados</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Retenciones</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Total</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length > 0 ? (
                rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                  <TableRow
                    key={row.ID}
                    onClick={() => handleRowClick(row)}
                    style={{ cursor: 'pointer' }}
                  >
                    <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                      <Checkbox
                        color="primary"
                        checked={selectedRows.includes(row.ID)}
                        onChange={() => handleSelectRow(row)}
                        sx={{
                          color: '#04b2ca', // Color del checkbox cuando no está seleccionado
                          '&.Mui-checked': {
                            color: '#028596', // Color del checkbox cuando está seleccionado
                          },
                        }}
                      />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.ID}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Folio}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Emisor.Nombre || 'Desconocido'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Receptor.Nombre || 'Desconocido'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{new Date(row.Fecha).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.uuid === "" ? "" : new Date(row.fechaTimbrado).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Serie}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Serie === "P" ? "PUE" : row.MetodoPago}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Estatus ? row.Estatus : row.uuid === "" ? "No timbrada" : "Timbrada"}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.SubTotal)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.Conceptos?.TotalImpuestosTrasladados || 0)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.Conceptos?.TotalImpuestosRetenidos || 0)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.TipoDeComprobante === "P" ? formatCurrency(row.Complemento.Pagos.Totales.MontoTotalPagos) : formatCurrency(row.Total)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>
                      <IconButton onClick={(event) => handleMenuClick(event, row)}>
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                        sx={{
                          "& .MuiPaper-root": {

                            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.125)',
                          },
                        }}
                      >
                        {menuRow && menuRow.uuid === '' && menuRow.TipoDeComprobante !== 'P' && [
                          <MenuItem key="timbrar" onClick={() => handleTimbrar([menuRow.ID])}>Timbrar</MenuItem>,
                          <MenuItem key="timbraryenviar" onClick={() => handleTimbrarYEnviar([menuRow.ID])}>Timbrar y Enviar</MenuItem>,
                          <MenuItem key="prefactura" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar Prefactura</MenuItem>,
                          <MenuItem key="edit" onClick={handleEdit}>Editar</MenuItem>,
                          <MenuItem key="clone" onClick={handleClone}>Clonar</MenuItem>,
                          <MenuItem key="delete" onClick={() => handleDelete([menuRow.ID])}>Eliminar</MenuItem>
                          // <MenuItem key="delete" onClick={() => console.log('Eliminar', menuRow.ID)}>Eliminar</MenuItem>

                        ]}
                        {menuRow && menuRow.uuid === '' && menuRow.TipoDeComprobante === 'P' && [
                          <MenuItem key="timbrar" onClick={() => handleTimbrar([menuRow.ID])}>Timbrar</MenuItem>,
                          <MenuItem key="editar" onClick={handleEditPay}>Editar</MenuItem>,
                          <MenuItem key="prefactura" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar Prefactura</MenuItem>,
                          <MenuItem key="delete" onClick={() => handleDelete([menuRow.ID])}>Eliminar</MenuItem>,
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
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={16}
                    sx={{
                      textAlign: 'center',
                      color: '#555',
                      backgroundColor: '#f9f9f9',
                      fontSize: '1rem',
                      padding: '20px',
                      border: '1px solid #ddd',
                    }}
                  >
                    {mensajeFiltros === '' ? (
                      <span style={{ fontStyle: 'italic', color: '#888' }}>
                        No hay datos para mostrar
                      </span>
                    ) : (
                      <span
                        dangerouslySetInnerHTML={{ __html: mensajeFiltros }}
                        style={{
                          display: 'block',
                          padding: '10px',
                          borderRadius: '4px',
                        }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={rows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>


      {/* Loading Modal */}
      <ModalLoading openModal={openModal} handleCloseModal={handleCloseModal} loading={loading} loadingMessage={loadingMessage} />

      {/* Success Modal */}
      <ModalExito openModalSuccess={openModalSuccess} handleCloseModal={handleCloseModal} confirmationMessage={confirmationMessage} />

      {/* Error Modal */}
      <ModalError openModalError={openModalError} handleCloseModal={handleCloseModal} confirmationMessage={confirmationMessage} />

      {/* Timbrado Modal */}
      <ModalTimbrar openModalTimbrar={openModalTimbrar} handleCloseModal={handleCloseModal} facturasTimbradas={facturasTimbradas} expandedIndexes={expandedIndexes} handleToggleExpand={handleToggleExpand} />

      {/* Cancelar Modal */}
      <ModalCancelar openModalCancelar={openModalCancelar} handleCloseModal={handleCloseModal} facturasRemplazo={facturasRemplazo} IDFacturaCancelada={IDFacturaCancelada} token={token} setResultadoCancelar={setResultadoCancelar} />

      {/* Modal para confirmar eliminación */}
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
          <Button onClick={handleConfirmDelete} color="secondary" autoFocus>
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>

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