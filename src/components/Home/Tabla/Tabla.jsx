'use client';

import React, { useEffect, useState } from 'react';
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
  CircularProgress, Typography, List, ListItem, ListItemText, ListItemIcon, Tooltip, LinearProgress

} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation'; // Importa correctamente desde next/navigation
import generarVistaPrevia from '../Factura/GenerarVistaPrevia';
import { CheckCircleOutline, ErrorOutline, CheckCircle as CheckCircleIcon, HourglassEmpty as HourglassEmptyIcon, Info as InfoIcon } from '@mui/icons-material';
import { set } from 'date-fns';
import typography from '@/@core/theme/typography';


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

export default function DataTable() {
  const [rows, setRows] = useState([]);
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

  const [progress, setProgress] = useState(0);

  const [actualizar, setActualizar] = useState(false);

  const handleCloseModal = () => {
    setOpenModal(false);
    setOpenModalSuccess(false);
    setOpenModalError(false);
    setIsModalOpen(false);
    setOpenModalTimbrar(false);
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
      const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
      const response = await fetch(`http://31.220.31.152:8087/ObtenerFactura/${id}`, {
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

  const generarPDF = async (htmlContent, fileName) => {
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: htmlContent,
          fileName: fileName,
        }),
      });

      if (response.ok) {
        console.log('Data received from API (pdf):', response);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        console.error('Error al generar PDF:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generarXML = async (id) => {
    try {
      const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
      const responseXML = await fetch(`http://31.220.31.152:8090/DescargaXML/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (responseXML.ok) {
        const xmlContent = await responseXML.text();
        return xmlContent;
      }
    } catch (error) {

    }
  };

  const generarZIP = async (htmlContent, xmlContent, fileName) => {
    try {
      const response = await fetch('/api/generate-zip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          htmlContent: htmlContent,
          xmlContent: xmlContent,
          fileName: fileName,
        }),
      });

      if (response.ok) {
        console.log('Data received from API (zip):', response);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${fileName}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      } else {
        console.error('Error al generar ZIP:', response.statusText);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handlePrefactura = async (id) => {
    setOpenModal(true);
    setLoading(true);
    try {
      const data = await obtenerFactura(id);
      if (data) {
        const htmlContent = await generarVistaPrevia(data);
        const fileName = `${data.factura.Emisor.Nombre}_${data.factura.Folio}`;
        await generarPDF(htmlContent, fileName);
        setLoading(false);
        setConfirmationMessage(`Su archivo ${fileName} se ha descargado. <br/>Revise su carpeta de descargas.`);
        setOpenModalSuccess(true);
      }
      else {
        console.error('Error al obtener la factura:', id);
      }

    } catch (error) {
      console.error('Error:', error);
      setOpenModal(false);
      setConfirmationMessage('Error al descargar la prefactura.');
      setOpenModalError(true);

    } finally {
      setLoading(false);
      setOpenModal(false); // Ocultar el modal de espera
    }
  };

  const handleDownloadSelecteds = async (ids) => {
    console.log('Descargando facturas:', ids);
    setLoading(true);
    setProgress(0);
  
    // Inicializamos el arreglo de estatus
    const initialStatus = ids.map(id => ({
      id,
      name: 'Cargando nombre...', // Se muestra "Cargando nombre..." mientras se obtienen las facturas
      status: 'progress', // 'progress' indica que aún no ha sido descargada
    }));
  
    setFacturasStatus(initialStatus);
    setIsModalOpen(true); // Abrimos el modal
  
    try {
      // Primero obtenemos todas las facturas para mostrar sus nombres
      const facturas = await Promise.all(
        ids.map(async (id) => {
          const data = await obtenerFactura(id);
          if (data) {
            const name = `${data.factura.Emisor.Nombre}_${data.factura.Folio}`;
            return { id, factura: data.factura, name };
          } else {
            console.error('Error al obtener la factura', id);
            return null;
          }
        })
      );
  
      // Actualizar el nombre de las facturas en el estado
      setFacturasStatus(prevStatus =>
        prevStatus.map(f =>
          facturas.find(facturaObj => facturaObj && facturaObj.id === f.id)
            ? { ...f, name: facturas.find(facturaObj => facturaObj && facturaObj.id === f.id).name }
            : f
        )
      );
  
      // Usa facturas.length en lugar de facturasStatus.length
      const totalFacturas = facturas.length;
      let downloadedFacturas = 0;
  
      // Después generamos los archivos
      for (const { id, factura, name } of facturas) {
        console.log('Progress:', progress);
        if (factura) {
          setFacturaActual(name);
          const htmlContent = await generarVistaPrevia(factura);
  
          if (factura.uuid === '') {
            // Generar PDF
            await generarPDF(htmlContent, `${name}.pdf`);
  
            // Actualizar nombre con extensión PDF en el estado
            setFacturasStatus(prevStatus =>
              prevStatus.map(f =>
                f.id === id ? { ...f, name: `${name}.pdf`, status: 'downloaded' } : f
              )
            );
          } else {
            // Generar XML y ZIP
            const xmlContent = await generarXML(id);
            if (xmlContent) {
              await generarZIP(htmlContent, xmlContent, `${name}.zip`);
  
              // Actualizar nombre con extensión ZIP en el estado
              setFacturasStatus(prevStatus =>
                prevStatus.map(f =>
                  f.id === id ? { ...f, name: `${name}.zip`, status: 'downloaded' } : f
                )
              );
            } else {
              console.error('Error al descargar el XML', id);
            }
          }
        }
  
        // Incrementa el contador de facturas descargadas
        downloadedFacturas += 1;
  
        // Calcula el progreso y actualiza el estado
        const newProgress = (downloadedFacturas / totalFacturas) * 100;
        console.log('downloadedFacturas:', downloadedFacturas);
        console.log('totalFacturas:', totalFacturas);
        console.log('Progress:', newProgress);
        setProgress(newProgress);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };
  

  const handleDownload = async (id) => {
    // Mostrar el modal de espera
    setOpenModal(true);
    setLoading(true);
    // const name = `Factura_${id}`;

    // Descargar el XML
    try {
      const data = await obtenerFactura(id);
      if (data) {
        const htmlContent = await generarVistaPrevia(data);
        const name = `${data.factura.Emisor.Nombre}_${data.factura.Folio}`;
        if (data.factura.uuid === '') {
          await generarPDF(htmlContent, name);
        }
        else {
          const xmlContent = await generarXML(id);
          if (xmlContent) {
            await generarZIP(htmlContent, xmlContent, name);
            setLoading(false);
            setConfirmationMessage(`Su archivo ${name}.zip se ha descargado. <br/>
         Revise su carpeta de descargas.`);
            setOpenModalSuccess(true);
          }
          else {
            console.error('Error al descargar el XML:', xmlContent);
            console.error('Error al descargar el XML:', xmlContent.statusText);
          }
        }
      }
      else {
        console.error('Error al obtener la factura:', id);

      }

    } catch (error) {
      console.error('Error:', error);
      setConfirmationMessage('Error al descargar la factura.');
      setOpenModalError(true);
    } finally {
      setLoading(false);
      setOpenModal(false); // Ocultar el modal de espera
    }
  };

  const handleVistaPrevia = async (id) => {
    console.log('ID:', id);
    try {
      const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
      const response = await fetch(`http://31.220.31.152:8087/ObtenerFactura/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Data received from API:', data);
        const vistaPrevia = await generarVistaPrevia(data);
        console.log('Vista Previa:', vistaPrevia);
        setPreviewContent(vistaPrevia);
        setOpenModal(true);

      }

    } catch (error) {

    }

  };

  // Función para timbrar múltiples facturas
  const handleTimbrar = async (ids) => {
    setOpenModal(true);
    setLoading(true);

    try {
      console.log('Timbrando facturas:', ids);
      const token = localStorage.getItem('authToken');
      const response = await fetch('http://31.220.31.152:8088/TimbradoCorporativo', {
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
            error: factura.message || null,
          }));
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

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://31.220.31.152:8087/ListarFacturas', {
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
      } else {
        console.error('Expected an array but received:', typeof data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };
  useEffect(() => {
   

    fetchData();
  }, []);

  useEffect(()=> {
    if(actualizar) {
      console.log('Actualizando');
      fetchData();
      setActualizar(false);
    }
      
    }, [actualizar]);

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
          color="primary"
          disabled={selectedRows.length === 0}
          onClick={() => handleTimbrar(selectedRows)}
        >
          Timbrar Seleccionadas
        </Button>
        <Button
          variant="contained"
          color="primary"

          disabled={selectedRows.length === 0}
          onClick={() => handleDownloadSelecteds(selectedRows)}
        >
          Descargar Seleccionadas
        </Button>
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
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Serie</TableCell>
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
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.ID}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.Folio}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.Emisor.Nombre || 'Desconocido'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.Receptor.Nombre || 'Desconocido'}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.Serie}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{row.uuid === "" ? "No timbrada" : "Timbrada"}</TableCell>
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
                    >
                      {menuRow && menuRow.uuid === '' && [
                        <MenuItem key="timbrar" onClick={() => handleTimbrar([menuRow.ID])}>Timbrar</MenuItem>,
                        <MenuItem key="prefactura" onClick={() => handlePrefactura([menuRow.ID])}>Descargar Prefactura</MenuItem>,
                        <MenuItem key="edit" onClick={handleEdit}>Editar</MenuItem>,
                        // <MenuItem key="delete" onClick={() => console.log('Eliminar', menuRow.ID)}>Eliminar</MenuItem>

                      ]}
                      {
                        menuRow && menuRow.uuid !== '' && [
                          <MenuItem key="descargar" onClick={() => handleDownload([menuRow.ID])}>Descargar</MenuItem>,
                          <MenuItem key="clone" onClick={handleClone}>Clonar</MenuItem>
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
      <Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          minWidth: '300px',
          minHeight: '175px',

          bgcolor: 'white',
          boxShadow: 24,
          p: 2,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {loading &&
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <Typography variant="h6" sx={{ mb: 2 }}>{loadingMessage}</Typography>
              <CircularProgress />
            </Box>}

        </Box>
      </Modal>

      {/* Success Modal */}
      <Modal open={openModalSuccess} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          minWidth: '400px',

          bgcolor: 'white',
          boxShadow: 24,
          p: 2,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <CheckCircleOutline sx={{ fontSize: 80, color: 'green', mb: 2 }} />
          <Typography sx={{ mb: 2, textAlign: 'center', fontSize: '1.2em' }} dangerouslySetInnerHTML={{ __html: confirmationMessage }} />
          <Button onClick={handleCloseModal} variant="contained" sx={{
            mt: 2, 
          }}>
            Cerrar
          </Button>
        </Box>
      </Modal>

      {/* Error Modal */}
      <Modal open={openModalError} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          minWidth: '400px',
          maxWidth: '40%',
          bgcolor: 'white',
          boxShadow: 24,
          p: 2,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          <ErrorOutline sx={{ fontSize: 80, color: 'red' }} />
          <Typography sx={{ mb: 2, textAlign: 'center', fontSize: '1.2em' }} dangerouslySetInnerHTML={{ __html: confirmationMessage }} />
          <Button onClick={handleCloseModal} variant="contained" sx={{
            mt: 2,
          }}>
            OK
          </Button>
        </Box>
      </Modal>



      <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          minWidth: '400px',
          maxWidth: '40%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <Typography variant="h6" gutterBottom>
          {loading ? "Descargando Facturas" : 'Facturas Descargadas'}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {loading ? facturaActual : ''}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10, // Altura de la barra de progreso
              borderRadius: 5, // Bordes redondeados
              // bgcolor: '#e0e0e0', // Color de fondo
              // '& .MuiLinearProgress-bar': {
              //   backgroundColor: progress >= 100 ? '#4caf50' : '#1a90ff', // Cambia el color cuando llegue al 100%
              // },
            }}
          />
          
          {!loading && (
            // Si no está cargando, muestra el botón de OK
            <>
              <Typography>Revise su carpeta de descargas </Typography>
              <Button onClick={handleCloseModal} variant="contained" sx={{
                mt: 2, 
              }}>
                OK
              </Button>
            </>
          )} 
          {/* <List>
            {facturasStatus.map(factura => (
              <ListItem key={factura.id}>
                <ListItemText sx={{ mx: 3 }}
                  primary={factura.name || 'Descargando...'}
                />
                <ListItemIcon>
                  {factura.status === 'downloaded' ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CircularProgress size={24} />
                  )}
                </ListItemIcon>
              </ListItem>
            ))}
          </List> */}



          {/* {loading && (
            
          )}

          {!loading && (
            // Si no está cargando, muestra el botón de OK
            <>
              <Typography>Revise su carpeta de descargas </Typography>
              <Button onClick={handleCloseModal} variant="contained" sx={{
                mt: 2, backgroundColor: 'green', '&:hover': {
                  background: 'darkgreen', // Color al pasar el mouse
                },
              }}>
                OK
              </Button>
            </>
          )} */}

        </Box>
      </Modal>


      <Modal open={openModalTimbrar} onClose={handleCloseModal}>
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto',
            minWidth: '400px',
            maxWidth: '60%',
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: '16px',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" gutterBottom>
            Estado de Timbrado
          </Typography>
          <List>
            {facturasTimbradas.map((factura, index) => (
              <ListItem key={index}>
                <ListItemText primary={`ID: ${factura.id}`} />
                <ListItemText primary={`Estatus: ${factura.status}`} />
                {factura.error ? (
                  <Tooltip
                    title={
                      <Typography variant="body1" sx={{ color: 'white' }}>
                        {factura.error}
                      </Typography>
                    }
                    arrow
                  //  sx={{
                  //    bgcolor: 'error.main', // Color de fondo
                  //    '& .MuiTooltip-arrow': {
                  //      color: 'error.main', // Color de la flecha
                  //    },
                  //  }}
                  >
                    <ListItemIcon sx={{
                      display: 'flex',
                      justifyContent: 'center', // Centra el contenido en el eje horizontal
                      alignItems: 'center', // Centra el contenido en el eje vertical
                    }}>
                      <InfoIcon sx={{ color: 'red' }} />
                    </ListItemIcon>
                  </Tooltip>
                ) : (
                  <ListItemIcon sx={{
                    display: 'flex',
                    justifyContent: 'center', // Centra el contenido en el eje horizontal
                    alignItems: 'center', // Centra el contenido en el eje vertical
                  }}>
                    <CheckCircleIcon color="success" />
                  </ListItemIcon>
                )}
              </ListItem>
            ))}
          </List>
          <Button
            onClick={handleCloseModal}
            variant="contained"
            sx={{
              mt: 2,
             
            }}
          >
            OK
          </Button>
        </Box>
      </Modal>




    </Box>
  );
}
