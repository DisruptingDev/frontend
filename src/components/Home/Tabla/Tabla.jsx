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
import { CheckCircleOutline, ErrorOutline } from '@mui/icons-material';
import { set } from 'date-fns';


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

 

  const handleCloseModal = () => {
    setOpenModal(false);
    setOpenModalSuccess(false);
    setOpenModalError(false);
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
    const factura = await obtenerFactura(id);
    if (factura) {
      const htmlContent = await generarVistaPrevia(factura);
      const fileName = `${factura.Emisor.Nombre}_${factura.Folio}`;
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
  try {
    for (const id of ids) {
      const factura = await obtenerFactura(id);
      if (factura) {
        const htmlContent = await generarVistaPrevia(factura);
        const name = `${factura.Emisor.Nombre}_${factura.Folio}`;
        if (factura.uuid === '') {
          await generarPDF(htmlContent, name);
        }
        else {
          const xmlContent = await generarXML(id);
          if (xmlContent) {
            await generarZIP(htmlContent, xmlContent, name);
          }
          else {
            console.error('Error al descargar el XML:', xmlContent);
          }
        }
      }
      else {
        console.error('Error al obtener la factura');
      }
    }
  } catch (error) {
    console.error('Error:', error);

  }

}

const handleDownload = async (id) => {
  // Mostrar el modal de espera
  setOpenModal(true);
  setLoading(true);
  // const name = `Factura_${id}`;

  // Descargar el XML
  try {
    const factura = await obtenerFactura(id);
    if (factura) {
      const htmlContent = await generarVistaPrevia(factura);
      const name = `${factura.Emisor.Nombre}_${factura.Folio}`;
      if (factura.uuid === '') {
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
      if (data.Facturas) {
        const factura = data.Facturas[0]; // Tomar la primera factura para este ejemplo
        if (factura.status === 'success') {

          setConfirmationMessage('Facturas timbradas exitosamente.');
          setOpenModalSuccess(true); // Show success modal

        } else if (factura.status === 'error') {
          const error = factura.message

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
          mt: 2, background: 'green',
          '&:hover': {
            background: 'darkgreen', // Color al pasar el mouse
          },
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
          mt: 2, backgroundColor: 'red', '&:hover': {
            background: 'darkred', // Color al pasar el mouse
          },
        }}>
          OK
        </Button>
      </Box>
    </Modal>


   
  </Box>
);
}
