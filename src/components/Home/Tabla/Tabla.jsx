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
  TextField,
} from '@mui/material';

function createData(id, folio, emisor, receptor, serie, estatus, subtotal, traslados, retenciones, total, usuario) {
  return { id, folio, emisor, receptor, serie, estatus, subtotal, traslados, retenciones, total, usuario };
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
  const [filters, setFilters] = useState({ id: '', folio: '', emisor: '', receptor: '' });

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
            createData(
              item.ID,
              item.Folio,
              item.Emisor.Nombre || 'Desconocido',
              item.Receptor.Nombre || 'Desconocido',
              item.Serie,
              'Timbrada',
              item.SubTotal,
              item.Conceptos?.TotalImpuestosTrasladados || 0,
              item.Conceptos?.TotalImpuestosRetenidos || 0,
              item.Total,
              'Usuario'
            )
          );

          // Ordena los datos por id en orden descendente
          const sortedData = transformedData.sort((a, b) => b.id - a.id);
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

  // Filtra los datos basándose en los filtros
  const filteredRows = rows.filter((row) =>
    (filters.id ? row.id.toString().includes(filters.id) : true) &&
    (filters.folio ? row.folio.toLowerCase().includes(filters.folio.toLowerCase()) : true) &&
    (filters.emisor ? row.emisor.toLowerCase().includes(filters.emisor.toLowerCase()) : true) &&
    (filters.receptor ? row.receptor.toLowerCase().includes(filters.receptor.toLowerCase()) : true)
  );

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({
      ...filters,
      [name]: value,
    });
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
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Usuario</TableCell>
              </TableRow>
              <TableRow sx={{ padding: 0 }}>
                <TableCell padding="checkbox" sx={{ textAlign: 'center' }}></TableCell>
                <TableCell sx={{ padding: 0 }} align='center'>
                  <TextField
                    variant="outlined"
                    size="small"
                    name="id"
                    value={filters.id}
                    onChange={handleFilterChange}
                    placeholder="ID"
                    fullWidth
                    sx={{
                      width: { xs: '60px', sm: '80px', md: '80px' }, // Ancho responsivo
             
                    }}
                  />
                </TableCell>
                <TableCell sx={{ px: "1" }} align='center'>
                  <TextField
                    variant="outlined"
                    size="small"
                    name="folio"
                    value={filters.folio}
                    onChange={handleFilterChange}
                    placeholder="Folio"
                    fullWidth
                    sx={{
                      width: { xs: '80px', sm: '100px', md: '140px' }, // Ancho responsivo
                    }}
                  />
                </TableCell>
                <TableCell align='center' sx={{ padding: 0 }}>
                  <TextField
                    variant="outlined"
                    size="small"
                    name="emisor"
                    value={filters.emisor}
                    onChange={handleFilterChange}
                    placeholder="Emisor"
                    fullWidth
                    // sx={{
                    //   width: { xs: '100px', sm: '120px', md: '120px' }, // Ancho responsivo
                    // }}
                  />
                </TableCell>
                <TableCell align='center' sx={{ padding: 0 }}> 
                  <TextField
                    variant="outlined"
                    size="small"
                    name="receptor"
                    value={filters.receptor}
                    onChange={handleFilterChange}
                    placeholder="Receptor"
                    fullWidth
                    // sx={{
                    //   width: { xs: '100px', sm: '120px', md: '150px' }, // Ancho responsivo
                    //   marginBottom: '4px',
                    // }}
                  />
                </TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredRows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                      <Checkbox color="primary" />
                    </TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.id}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.folio}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.emisor}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.receptor}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.serie}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.estatus}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.subtotal)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.traslados)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.retenciones)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(row.total)}</TableCell>
                    <TableCell sx={{ textAlign: 'center' }}>{row.usuario}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          labelRowsPerPage="Filas por página:"
          labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count !== -1 ? count : `más de ${to}`}`}
        />
      </Paper>
    </Box>
  );
}
