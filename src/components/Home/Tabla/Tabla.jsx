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
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { useRouter } from 'next/navigation';

function createData(item) {
  // Retorna todo el objeto original para que contenga toda la información
  return { ...item };
}

// Función para formatear como moneda
const formatCurrency = (value) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(value);
};

export default function DataTable() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedRow, setSelectedRow] = useState(null); // Estado para la fila seleccionada
  const [anchorEl, setAnchorEl] = useState(null); // Estado para el ancla del menú
  const [menuRow, setMenuRow] = useState(null); // Estado para la fila asociada al menú abierto
  const router = useRouter(); // Hook de Next.js para manejar la navegación

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('authToken'); // Recupera el token del localStorage

        const response = await fetch('http://31.220.31.152:8087/ListarFacturas', {
          headers: {
            'Authorization': `Bearer ${token}`, // Incluye el token en los headers
            'Content-Type': 'application/json',
          }
        });
        const data = await response.json();
        console.log('Data received from API:', data); // Verifica qué se está recibiendo

        if (Array.isArray(data)) {
          const transformedData = data.map((item) =>
            createData(item) // Guarda todo el objeto original
          );

          // Ordena los datos por id en orden descendente
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
    console.log('Selected row:', row); // Muestra la fila seleccionada en la consola
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
    // Guarda los datos de la fila seleccionada en localStorage
    localStorage.setItem('EditFactura', JSON.stringify(menuRow));
    handleMenuClose();
    // Redirige a la página de edición con los datos
    router.push('/EditarFactura'); // Cambia '/editar' por la ruta real de tu página de edición
  };

  const handleClone = () => {
    // Guarda los datos de la fila seleccionada en localStorage
    localStorage.setItem('selectedRowData', JSON.stringify(menuRow));
    handleMenuClose();
    // Redirige a la página de clonación con los datos
    // router.push('/clonar'); // Cambia '/clonar' por la ruta real de tu página de clonación
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
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer align='center'>
          <Table sx={{ minWidth: 650 }} aria-label="customized table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                  {/* <Checkbox color="primary" /> */}
                </TableCell>
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
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow 
                    key={row.ID} 
                    onClick={() => handleRowClick(row)} 
                    style={{ cursor: 'pointer' }} // Cambia el cursor para indicar que la fila es clickeable
                  >
                    <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                      <Checkbox color="primary" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.ID}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Folio}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Emisor.Nombre || 'Desconocido'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Receptor.Nombre || 'Desconocido'}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Serie}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.Estatus || 'Timbrada'}</TableCell>
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
                        {/* Mostrar "Editar" solo si el estatus es diferente a "Timbrada" */}
                        {menuRow && menuRow.Estatus !== 'Timbrada' && (
                          <MenuItem onClick={handleEdit}>Editar</MenuItem>
                        )}
                        <MenuItem onClick={handleClone}>Clonar</MenuItem>
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
      {/* Muestra la información completa de la fila seleccionada */}
      {selectedRow && (
        <Box mt={2}>
          <h3>Información Completa de la Fila Seleccionada:</h3>
          <pre>{JSON.stringify(selectedRow, null, 2)}</pre>
        </Box>
      )}
    </Box>
  );
}
