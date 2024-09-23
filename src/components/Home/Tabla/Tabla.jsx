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
  CircularProgress, Typography

} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation'; // Importa correctamente desde next/navigation
import generarVistaPrevia from '../Factura/GenerarVistaPrevia';
import { CheckCircleOutline } from '@mui/icons-material';


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

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info'); // info, success, warning, error

  // const [openModal, setOpenModal] = useState(false);
  const [previewContent, setPreviewContent] = useState('');

  const [openModal, setOpenModal] = useState(false); // Para controlar el modal de espera

  const [openModalError, setOpenModalError] = useState(false); // Para controlar el modal de espera

  const [loading, setLoading] = useState(false); // Estado para mostrar el spinner dentro del modal

  const [showConfirmation, setShowConfirmation] = useState(false); // Nuevo estado para mostrar confirmación
  const [confirmationMessage, setConfirmationMessage] = useState(''); // Mensaje de confirmación

  const handleClose = () => {
    setOpen(false);
  };

  const handleCloseModal = () => {
    setShowConfirmation(false); // Cierra el modal de confirmación
    setOpenModal(false);
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

  const handlePrefactura = async (id) => {
    setOpenModal(true);
    setLoading(true);
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
        // console.log('Vista Previa:', vistaPrevia);

        const name = data.Emisor.Nombre + '_' + data.Folio;
        console.log('Nombre:', name);

        const responsePDF = await fetch('/api/generate-pdf', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            htmlContent: vistaPrevia,
            fileName: name
          }),
        });

        if (!responsePDF.ok) {
          console.error('Error al generar PDF:', responsePDF.statusText);
          return;
        }


        const blob = await responsePDF.blob();
        const url = window.URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `${name}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setLoading(false);
        setConfirmationMessage(`Su archivo ${a.download} se ha descargado. <br/>
          Revise su carpeta de descargas.`);

        setShowConfirmation(true);

      }

    } catch (error) {
      console.error('Error:', error);
      setOpenModal(false);

    } finally {
      // Ocultar el modal de espera
      // setLoading(false);
      // setOpenModal(false);
    }
  };

  const handleDownload = async (id) => {
    // Mostrar el modal de espera
    setOpenModal(true);
    setLoading(true);
    let xmlContent, htmlContent, name;
    // const name = `Factura_${id}`;

    // Descargar el XML
    try {
      const token = localStorage.getItem('authToken'); // Asumiendo que necesitas un token
      const responseXML = await fetch(`http://31.220.31.152:8090/DescargaXML/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (responseXML.ok) {
        console.log('Data received from API (xml):', responseXML);
        xmlContent = await responseXML.text(); // Aquí se asigna correctamente a xmlContent
      } else {
        console.log('Error al descargar el XML:', responseXML);
        console.error('Error al descargar el XML:', responseXML.statusText);
      }


      // Descargar la factura (HTML)

      // const token = localStorage.getItem('authToken');
      const response = await fetch(`http://31.220.31.152:8087/ObtenerFactura/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json(); // Aquí se asigna correctamente a htmlContent
        console.log('Data received from API (html):', data);
        name = data.Emisor.Nombre + '_' + data.Folio;
        htmlContent = await generarVistaPrevia(data);
        // console.log('Vista Previa:', vistaPrevia);
      } else {
        console.log('Error al descargar la factura:', response);
        console.error('Error al descargar la factura:', response.statusText);
      }


      // Generar y descargar el archivo ZIP si se obtuvieron ambos contenidos
      if (xmlContent && htmlContent) {
        // const name = `Factura_${id}`;
        try {
          const response = await fetch('/api/generate-zip', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              htmlContent: htmlContent,
              xmlContent: xmlContent,
              fileName: name,
            }),
          });

          if (!response.ok) {
            throw new Error('Error al generar el ZIP');
          }
          console.log('Data received from API (zip):', response);

          // Leer el archivo ZIP como blob
          const zipBlob = await response.blob();

          // Crear un enlace para descargar el archivo ZIP
          const downloadUrl = window.URL.createObjectURL(zipBlob);
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = `${name}.zip`;
          document.body.appendChild(link);
          link.click();
          link.remove();

          setLoading(false);
          setConfirmationMessage(`Su archivo ${link.download} se ha descargado. <br/>
          Revise su carpeta de descargas.`);

          setShowConfirmation(true);
        } catch (error) {
          console.error('Error:', error);
        }
      } else {
        console.log('No se pudieron obtener ambos contenidos para generar el ZIP.');
      }
    } catch (error) {
      console.error('Error:', error);
      setOpenModal(false);
    } finally {
      // // Ocultar el modal de espera
      // setLoading(false);
      // setOpenModal(false);
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
        if (data.Facturas) {
          const factura = data.Facturas[0]; // Tomar la primera factura para este ejemplo
          if (factura.status === 'success') {
            setMessage('Facturas timbradas exitosamente');
            setSeverity('success')

          } else if (factura.status === 'error') {
            const error = factura.message
            setMessage('Error al timbrar facturas:' + error);
            setSeverity('error');
          }
        } else {
          setMessage('Respuesta inesperada del servidor');
          setSeverity('warning');
        }

        // Mostrar el Snackbar con el resultado
        setOpen(true);

        // Si es necesario, puedes refrescar los datos aquí
      } else {
        setMessage('Error al conectar con el servidor');
        setSeverity('error');
        setOpen(true);
      }
    } catch (error) {
      console.error('Error al timbrar:', error);
      setMessage('Error en la conexión o en el timbrado');
      setSeverity('error');
      setOpen(true);
    }
  };

  useEffect(() => {
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

    fetchData();
  }, []);

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
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          color="primary"
          disabled={selectedRows.length === 0}
          onClick={() => handleTimbrar(selectedRows)}
        >
          Timbrar Seleccionadas
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
      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box
          sx={{
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
          }}
        >

          {loading ? (
            <Box

              display="flex"
              flexDirection="column"
              alignItems="center"
            >
              <Typography variant="h6" sx={{ mb: 4 }}>
                Generando descarga
              </Typography>
              <CircularProgress size={60} />
            </Box>

          ) : showConfirmation ? (
            <Box

              display="flex"
              flexDirection="column"
              alignItems="center"

            >
              <CheckCircleOutline sx={{ fontSize: 125, color: 'green', }} />
              <Typography variant="h5" sx={{ mb: 2, color: 'green' }}>
                Éxito
              </Typography>
              <Typography sx={{ mb: 4, textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: confirmationMessage }} />
              <Button
                variant="contained"
                sx={{
                  background: 'green',
                  '&:hover': {
                    background: 'darkgreen', // Color al pasar el mouse
                  },
                }}
                onClick={handleCloseModal}
              >
                OK
              </Button>
            </Box>
          ) : null}
        </Box>
      </Modal>
    
      
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={handleClose} severity={severity} variant="filled" sx={{
          width: '100%',
          fontSize: '1rem',
          padding: '12px'
        }}>
          {message}
        </Alert>
      </Snackbar>
      {/* {selectedRow && (
        <Box mt={2}>
          <h3>Información Completa de la Fila Seleccionada:</h3>
          <pre>{JSON.stringify(selectedRow, null, 2)}</pre>
        </Box>
      )} */}
    </Box>
  );
}
