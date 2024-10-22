import React, { useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Box, Button, IconButton, Menu, MenuItem, Collapse, Typography
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';

const Pagos = () => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openDetails, setOpenDetails] = useState({}); // Controla visibilidad de los detalles

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const Pagos = [
    { ID: 1, Usuario: 'Kevin', Ordenes: [
        { ID: 1, Opcion: 'Opcion 1', Monto: 100, Empresa: 'Escuela' },
        { ID: 2, Opcion: 'Opcion 2', Monto: 200, Empresa: 'Empresa' },
        { ID: 3, Opcion: 'Opcion 3', Monto: 300, Empresa: 'Hospital' },
      ], Monto: 600, FechaPago: '2024-01-01', Comprobante: 'c1.pdf' },
    { ID: 2, Usuario: 'Carlos', Ordenes: [
        { ID: 4, Opcion: 'Opcion 4', Monto: 150, Empresa: 'Clínica' },
        { ID: 5, Opcion: 'Opcion 5', Monto: 250, Empresa: 'Escuela' },
      ], Monto: 400, FechaPago: '2024-01-02', Comprobante: 'c2.pdf' },
  ];

  const handleSelectRow = (row) => {
    setSelectedRows((prev) => {
      if (prev.includes(row.ID)) {
        return prev.filter((id) => id !== row.ID);
      } else {
        return [...prev, row.ID];
      }
    });
  };

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const toggleDetails = (id) => {
    setOpenDetails((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
        >
          Asignar Timbres
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#04b2ca' }}>
              <TableCell padding="checkbox" sx={{ textAlign: 'center' }} />
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>ID</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Usuario</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center', width: '300px' }}>Ordenes</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Monto</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha de Pago</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Comprobante</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Pagos.map((pago) => (
              <React.Fragment key={pago.ID}>
                <TableRow sx={{ borderBottom: '1px solid #ddd' }}>
                  <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                    <Checkbox
                      color="primary"
                      checked={selectedRows.includes(pago.ID)}
                      onChange={() => handleSelectRow(pago)}
                      sx={{ color: '#04b2ca', '&.Mui-checked': { color: '#028596' } }}
                    />
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{pago.ID}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{pago.Usuario}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <Box  >
                      <Typography sx={{ textAlign: 'center' }}>
                        Ordenes Pagadas: {pago.Ordenes.length}
                      </Typography>
                      <Button onClick={() => toggleDetails(pago.ID)} sx={{ mt: 1 }}>
                        {openDetails[pago.ID] ? 'Ocultar Detalles' : 'Mostrar Detalles'}
                      </Button>
                    </Box>
                    <Collapse in={openDetails[pago.ID]}>
                      {pago.Ordenes.map((orden) => (
                        <Box key={orden.ID} sx={{ mt: 1 }}>
                          <Typography sx={{ textAlign: 'center' }}>{orden.Opcion} - {formatCurrency(orden.Monto)} - {orden.Empresa} </Typography>

                        </Box>
                      ))}
                    </Collapse>
                  </TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{formatCurrency(pago.Monto)}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{pago.FechaPago}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>{pago.Comprobante}</TableCell>
                  <TableCell sx={{ textAlign: 'center' }}>
                    <IconButton onClick={(event) => handleMenuClick(event, pago)}>
                      <MoreVertIcon />
                    </IconButton>
                    <Menu
                      anchorEl={anchorEl}
                      open={Boolean(anchorEl)}
                      onClose={handleMenuClose}
                      sx={{ boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)' }}
                    >
                      <MenuItem>Descargar</MenuItem>
                    </Menu>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default Pagos;
