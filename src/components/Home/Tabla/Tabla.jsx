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
  Snackbar,
  Alert,
  Modal,
  CircularProgress, Typography, List, ListItem, ListItemText, ListItemIcon, Tooltip, LinearProgress, Collapse

} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation'; // Importa correctamente desde next/navigation
import generarVistaPrevia from '../Factura/GenerarVistaPrevia';
import convertXMLToPDF from '../Factura/GenerarAcuse';
import { CheckCircleOutline, ErrorOutline, CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassEmptyIcon, Info as InfoIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material';
import { set } from 'date-fns';
import typography from '@/@core/theme/typography';

import ModalLoading from '@/components/Home/Modales/modalLoading';
import ModalExito from '@/components/Home/Modales/modalExito';
import ModalError from '@/components/Home/Modales/modalError';
import ModalDescarga from '@/components/Home/Modales/modalDescarga';
import ModalTimbrar from '@/components/Home/Modales/modalTimbrar';
import ModalCancelar from '../Modales/modalCancelar';


function createData(item) {
  return { ...item };
}

// Función para formatear como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
}

export default function DataTable({ token, filtro }) {
  const [rows, setRows] = useState([]);
  const [registros, setRegistros] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const router = useRouter(); // Hook de Next.js para manejar la navegación
  const [selectedRows, setSelectedRows] = useState([]);


  // const [openModal, setOpenModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  // const [openModal, setOpenModal] = useState(false); // Para controlar el modal de espera

  // const [openModalError, setOpenModalError] = useState(false); // Para controlar el modal de espera

  // const [loading, setLoading] = useState(false); // Estado para mostrar el spinner dentro del modal

  const [showConfirmation, setShowConfirmation] = useState(false); // Nuevo estado para mostrar confirmación
  // const [confirmationMessage, setConfirmationMessage] = useState(''); // Mensaje de confirmación


  const [expandedIndexes, setExpandedIndexes] = useState({});

  // Función para alternar la expansión de una factura específica
  const handleToggleExpand = (index) => {
    setExpandedIndexes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };
  const [openModal, setOpenModal] = useState(false); // Loading modal
  const [openModalSuccess, setOpenModalSuccess] = useState(false); // Success modal
  const [openModalError, setOpenModalError] = useState(false); // Error modal

  const [loading, setLoading] = useState(false);
  const [confirmationMessage, setConfirmationMessage] = useState(''); // For success/error messages

  const loadingMessage = 'Espere un momento...'; // Mensaje de espera

  const [facturasStatus, setFacturasStatus] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [facturaActual, setFacturaActual] = useState('');



  const [facturasTimbradas, setFacturasTimbradas] = useState([]);
  const [openModalTimbrar, setOpenModalTimbrar] = useState(false)

  const [openModalCancelar, setOpenModalCancelar] = useState(false)
  const [facturasRemplazo, setFacturasRemplazo] = useState([]);
  const [IDFacturaCancelada, setIDFacturaCancelada] = useState(null);
  const [resultadoCancelar, setResultadoCancelar] = useState(null);

  const [progress, setProgress] = useState(0);

  const [actualizar, setActualizar] = useState(false);

  const handleCloseModal = () => {
    setOpenModal(false);
    setOpenModalSuccess(false);
    setOpenModalError(false);
    setIsModalOpen(false);
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

  const obtenerFactura = async (id) => {
    try {
      // const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
      const response = await fetch(`https://facturacioncfditotal.com/api/facturas/ObtenerFactura/${id}`, {
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


  const handleDownloadSelecteds = async (ids) => {
    console.log('Descargando facturas:', ids);
    setLoading(true);
    setOpenModal(true);

    try {
      // Generamos las vistas previas y los datos para el POST
      const facturas = await Promise.all(
        ids.map(async (id) => {
          const factura = await obtenerFactura(id);
          if (factura) {
            let htmlContent;
            let acuseContent;
            if (factura.factura.Estatus === 'Cancelada') {
              console.log('Factura cancelada:', factura);
              await convertXMLToPDF(factura.factura.xmlCancelacion, `Acuse_${factura.factura.Emisor.Nombre}_${factura.factura.Folio}.pdf`);
            }
            else {
              console.log('Factura:', factura);
              htmlContent = await generarVistaPrevia(factura);
              console.log('HTML content:', htmlContent);
            }



            // Verificamos si hay un solo ID para recuperar el nombre
            const name = ids.length === 1 ? `${factura.factura.Emisor.Nombre}_${factura.factura.Folio}` : null;

            return {
              ID: id,
              htmlString: htmlContent,
              ...(name && { name }) // Agregamos el nombre solo si existe
            };
          } else {
            console.error('Error al obtener la factura', id);
            return null;
          }
        })
      );


      // Filtramos facturas válidas
      const facturasValidas = facturas.filter(factura => factura !== null);
      console.log('Facturas válidas:', facturasValidas);

      // Enviamos la solicitud POST a /DescargarArchivos con las facturas
      const response = await fetch('https://facturacioncfditotal.com/api/descargararchivos/DescargarArchivos', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(facturasValidas),
      });
      if (response.ok) {

        console.log('Data received from API (zip):', response);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        if (facturasValidas.length === 1) {
          a.download = `${facturasValidas[0].name}`;
        }
        else {

          a.download = `Facturas`;
        }
        document.body.appendChild(a);
        a.click();
        a.remove();

        setLoading(false);
        if (facturasValidas.length === 1) {
          setConfirmationMessage(`Su archivo ${facturasValidas[0].name}.zip se ha descargado. <br/>
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



  // Función para timbrar múltiples facturas
  const handleTimbrar = async (ids) => {
    setOpenModal(true);
    setLoading(true);

    try {
      console.log('Timbrando facturas:', ids);
      // const token = localStorage.getItem('authToken');
      const response = await fetch('https://facturacioncfditotal.com/api/timbradocorporativo/TimbradoCorporativo', {
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
          // for (const factura of data.Facturas) {
          //   if (factura.status === 'success') {
          //     console.log('Factura timbrada:', factura);
          //   } else if (factura.status === 'error') {
          //     console.error('Error al timbrar factura:', factura);
          //   }
          // }
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

  const handleCancelar = () => {
    if (menuRow) {
      console.log('Cancelando factura:', menuRow);
      const filtro ={
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
    if(resultadoCancelar === "success"){
      setOpenModalSuccess(true);
      setConfirmationMessage('Factura cancelada exitosamente.');
      setIDFacturaCancelada(null);
      setActualizar(true);
    }
    else if(resultadoCancelar === "error"){
      setOpenModalError(true);
      setConfirmationMessage('Error al cancelar facturas.');
      setIDFacturaCancelada(null);
      setActualizar(true);
    }
  }, [resultadoCancelar]);

  // Función para cancelar múltiples facturas
  // const handleCancelar = async (ids) => {
  //   setOpenModal(true);
  //   setLoading(true);
  //   console.log('Cancelando facturas:', ids);
  //   console.log('Selcted rows:', selectedRows);

  //   try {
  //     console.log('Cancelando facturas:', ids);
  //     // const token = localStorage.getItem('authToken');
  //     const response = await fetch('https://facturacioncfditotal.com/api/cancelacionfacturas/CancelacionFacturas/Cancelar', {
  //       method: 'POST',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(selectedRows),
  //     });

  //     if (response.ok) {
  //       const data = await response.json(); // Obtén la respuesta JSON
  //       console.log('Data received from API:', data);
  //       console.log('Data received from API tamaño:', data.length);
  //       if (data.length > 1) {
  //         console.log('Entre al mas de 1');
  //         setOpenModalTimbrar(true);
  //         // for (const factura of data) {

  //         const statusList = data.map(factura => ({
  //           id: factura.facturaID, // Suponiendo que cada factura tiene un ID
  //           status: factura.status === 'success' ? 'success' : 'error',
  //           error: factura.error || null,
  //         }));
  //         console.log('Status list:', statusList);
  //         setFacturasTimbradas(statusList); // Guarda el estado de las facturas

  //         // console.log('Factura:', factura); 
  //         // if (factura.status === 'success') {
  //         //   console.log('Factura cancelada:', factura);
  //         // } else if (factura.status === 'Error') {
  //         //   console.error('Error al cancelar factura:', factura);
  //         // }

  //         // }
  //       }
  //       else {
  //         console.log('Entre al 1');
  //         if (data[0].status === 'success') {
  //           console.log('Factura cancelada:', data);
  //           setConfirmationMessage('Facturas canceladas exitosamente.');
  //           setOpenModalSuccess(true); // Show success modal
  //         }
  //         else if (data[0].status === 'Error') {
  //           console.error('Error al cancelar factura:', data);
  //           setConfirmationMessage('Error al cancelar facturas:  <br/> ' + data[0].error);
  //           setOpenModalError(true); // Show error modal
  //         }

  //       }

  //     }
  //     else {
  //       setConfirmationMessage('Error en la conexión con el servidor.');
  //       setOpenModalError(true); // Show error modal
  //     }
  //   } catch (error) {
  //     console.error('Error:', error);
  //     setConfirmationMessage('Error en la conexión o en el timbrado.');
  //     setOpenModalError(true); // Show error modal
  //   } finally {
  //     setLoading(false);
  //     setOpenModal(false); // Hide loading modal
  //     setActualizar(true);
  //   }
  // };


  const fetchData = useCallback(async () => {
    if (token) {
      try {
        // const token = localStorage.getItem('authToken');

        const response = await fetch('https://facturacioncfditotal.com/api/facturas/ListarFacturas', {
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
  useEffect(() => {


    fetchData();
  }, [fetchData, token]);

  useEffect(() => {
    if (actualizar) {
      console.log('Actualizando');
      fetchData();
      setActualizar(false);
    }

  }, [actualizar, fetchData]);

  const filtrado = (filtro) => {
    const fechaInicio = filtro.FechaInicio ? new Date(filtro.FechaInicio) : null;
    const fechaFin = filtro.FechaFin ? new Date(filtro.FechaFin) : null;
    let newFilteredRows = registros;

    console.log('Filtered rows after Emisor and Receptor:', newFilteredRows);

    if (filtro.Emisor !== "") {
      newFilteredRows = registros.filter(registro =>
        registro.Emisor.Rfc.includes(filtro.Emisor)
      );
    }
    if (filtro.Receptor !== "") {
      newFilteredRows = registros.filter(registro =>
        registro.Receptor.Rfc.includes(filtro.Receptor)
      );
    }
    if (filtro.Emisor !== "" && filtro.Receptor !== "") {
      newFilteredRows = registros.filter(registro =>
        registro.Emisor.Rfc.includes(filtro.Emisor) && registro.Receptor.Rfc.includes(filtro.Receptor)
      );
    }

    // Filtrando por Estatus
    if (filtro.Estatus === 'timbrada') {
      console.log('Filtrando timbradas');
      newFilteredRows = newFilteredRows.filter(registro => registro.uuid !== '');
      console.log('Filtered rows after Estatus:', newFilteredRows);
    } else if (filtro.Estatus === 'notimbrada') {
      console.log('Filtrando no timbradas');
      newFilteredRows = newFilteredRows.filter(registro => registro.uuid === '');
      console.log('Filtered rows after Estatus:', newFilteredRows);
    }
    // Filtrando por fecha
    if (fechaInicio && fechaFin) {
      newFilteredRows = newFilteredRows.filter(registro => {
        const fechaRegistro = new Date(registro.Fecha);
        return fechaRegistro >= fechaInicio && fechaRegistro <= fechaFin;
      });
    }
    console.log('Filtered rows after Fecha:', newFilteredRows);
    return newFilteredRows;
  }

  useEffect(() => {
    if (filtro) {
      console.log('Filtrando:', filtro);

      const newFilteredRows = filtrado(filtro);
      setRows(newFilteredRows);

    } else {
      console.log('No hay filtro');
    }
  }, [filtro]);

  // Usa filteredRows para renderizar la tabla


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

  const handleClone = () => {
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
          const response = await fetch(`https://facturacioncfditotal.com/api/catalogos/Catalogos/Serie?emisorID=${menuRow.Emisor.ID}`, {
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

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box bgcolor="white" mx={4} p={4} boxShadow={3} borderRadius={2}>
      <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
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
          // onClick={() => descargarZIPServers(selectedRows)}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f', } }}
        >
          Descargar Seleccionadas
        </Button>
        {/* <Button
          variant="contained"
          onClick={() => handleCancelar(selectedRows)}
          disabled={selectedRows.length === 0}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f', } }}
        >
          Cancelar Seleccionadas
        </Button> */}
      </Box>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer align='center'>
          <Table sx={{ minWidth: 650 }} aria-label="customized table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#04b2ca' }}>
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
              {rows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
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
                  <TableCell sx={{ textAlign: 'center' }}>{row.MetodoPago}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.Estatus ? row.Estatus : row.uuid === "" ? "No timbrada" : "Timbrada"}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.SubTotal)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.Conceptos?.TotalImpuestosTrasladados || 0)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.Conceptos?.TotalImpuestosRetenidos || 0)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.Total)}</TableCell>
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
                        <MenuItem key="prefactura" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar Prefactura</MenuItem>,
                        <MenuItem key="edit" onClick={handleEdit}>Editar</MenuItem>,
                        <MenuItem key="clone" onClick={handleClone}>Clonar</MenuItem>
                        // <MenuItem key="delete" onClick={() => console.log('Eliminar', menuRow.ID)}>Eliminar</MenuItem>

                      ]}
                      {menuRow && menuRow.uuid === '' && menuRow.TipoDeComprobante === 'P' && [
                        <MenuItem key="timbrar" onClick={() => handleTimbrar([menuRow.ID])}>Timbrar</MenuItem>,
                      ]}
                      {
                        menuRow && menuRow.uuid !== '' && [
                          <MenuItem key="descargar" onClick={() => handleDownloadSelecteds([menuRow.ID])}>Descargar</MenuItem>,
                          <MenuItem key="clone" onClick={handleClone}>Clonar</MenuItem>,
                          <MenuItem key="cancelar" onClick={handleCancelar}>Cancelar</MenuItem>
                        ]
                      }
                      {
                        menuRow && menuRow.MetodoPago === 'PPD' && menuRow.uuid !== '' && [
                          <MenuItem key="pago" onClick={handleFacturaPago}>Factura de Pago</MenuItem>
                        ]
                      }
                      

                    </Menu>
                  </TableCell>
                </TableRow>
              ))}
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

      {/* Descarga Modal */}
      <ModalDescarga isModalOpen={isModalOpen} handleCloseModal={handleCloseModal} loading={loading} facturaActual={facturaActual} progress={progress} />

      {/* Timbrado Modal */}
      <ModalTimbrar openModalTimbrar={openModalTimbrar} handleCloseModal={handleCloseModal} facturasTimbradas={facturasTimbradas} expandedIndexes={expandedIndexes} handleToggleExpand={handleToggleExpand} />

      {/* Cancelar Modal */}
      <ModalCancelar openModalCancelar={openModalCancelar} handleCloseModal={handleCloseModal} facturasRemplazo={facturasRemplazo} IDFacturaCancelada={IDFacturaCancelada} token={token} setResultadoCancelar={setResultadoCancelar} />

    </Box>
  );
}
