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
} from '@mui/material';

function createData(id, folio, emisor, receptor, estatus, subtotal, traslados, retenciones, total, usuario) {
  return { id, folio, emisor, receptor, estatus, subtotal, traslados, retenciones, total, usuario };
}

export default function DataTable() {
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
              'Timbrada',
              item.SubTotal,
              item.Conceptos?.TotalImpuestosTrasladados || 0,
              item.Conceptos?.TotalImpuestosRetenidos || 0,
              item.Total,
              'Usuario'
            )
          );
          setRows(transformedData);
        } else {
          console.error('Expected an array but received:', typeof data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);


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
        <TableContainer>
          <Table sx={{ minWidth: 650 }} aria-label="customized table">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#04b2ca' }}>
                <TableCell padding="checkbox">
                  {/* <Checkbox color="primary" /> */}
                </TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>ID</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Folio</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Emisor</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Receptor</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Estatus</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Subtotal</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Traslados</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Retenciones</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Total</TableCell>
                <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white' }}>Usuario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id}>
                    <TableCell padding="checkbox">
                      <Checkbox color="primary" />
                    </TableCell>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.folio}</TableCell>
                    <TableCell>{row.emisor}</TableCell>
                    <TableCell>{row.receptor}</TableCell>
                    <TableCell>{row.estatus}</TableCell>
                    <TableCell>{row.subtotal}</TableCell>
                    <TableCell>{row.traslados}</TableCell>
                    <TableCell>{row.retenciones}</TableCell>
                    <TableCell>{row.total}</TableCell>
                    <TableCell>{row.usuario}</TableCell>
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
    </Box>
  );
}
