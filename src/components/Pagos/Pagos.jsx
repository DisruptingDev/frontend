import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Box, Button, IconButton, Menu, MenuItem, Collapse, Typography
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ModalLoading from '../Home/Modales/modalLoading';
import ModalExito from '../Home/Modales/modalExito';
import ModalError from '../Home/Modales/modalError';
import { set } from 'date-fns';

function createData(item) {
  return { ...item };
}

const Pagos = ({ token }) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openDetails, setOpenDetails] = useState({}); // Controla visibilidad de los detalles
  const [pagos, setPagos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openModalExito, setOpenModalExito] = useState(false);
  const [openModalError, setOpenModalError] = useState(false);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // const Pagos = [
  //   { ID: 1, Usuario: 'Kevin', Ordenes: [
  //       { ID: 1, Opcion: 'Opcion 1', Monto: 100, Empresa: 'Escuela' },
  //       { ID: 2, Opcion: 'Opcion 2', Monto: 200, Empresa: 'Empresa' },
  //       { ID: 3, Opcion: 'Opcion 3', Monto: 300, Empresa: 'Hospital' },
  //     ], Monto: 600, FechaPago: '2024-01-01', Comprobante: 'c1.pdf' },
  //   { ID: 2, Usuario: 'Carlos', Ordenes: [
  //       { ID: 4, Opcion: 'Opcion 4', Monto: 150, Empresa: 'Clínica' },
  //       { ID: 5, Opcion: 'Opcion 5', Monto: 250, Empresa: 'Escuela' },
  //     ], Monto: 400, FechaPago: '2024-01-02', Comprobante: 'c2.pdf' },
  // ];


  const fetchOrdenes = useCallback(async () => {
    if (token) {
      console.log('Fetching pagoes', token);
      try {
        const response = await fetch('http://31.220.31.152:8092/ListarOrdenes', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (Array.isArray(data)) {
          const transformedData = data.map((item) => createData(item));
          const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
          const pagos = sortedData.filter((pago) => pago.Estatus !== 'Sin pagar');
          console.log('Pagos:', pagos);
          setPagos(pagos);
        } else {
          console.error('Expected an array but received:', typeof data);
        }
      } catch (error) {
        console.error('Error fetching pagoes:', error);
      } finally {
        setLoading(false);
      }

    }
  }, [token]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes, token]);



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

  const handleAsignarTimbres = async () => {
    setLoading(true);
    const formData = selectedRows;

    console.log('Asignando timbres', formData);
    try {
      const response = await fetch('http://31.220.31.152:8093/ActivarOrden', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });
      const data = await response.json();
      console.log(data);
      if (response.ok) {
        setLoading(false);
        setOpenModalExito(true);
        setPagos((prev) => prev.map((pago) => {
          if (selectedRows.includes(pago.ID)) {
            return { ...pago, Estatus: 'Pagado' };
          } else {
            return pago;
          }
        }));
      } else {
        setLoading(false);
        setOpenModalError(true);
      }
    }
    catch (error) {
      console.error('Error asignando timbres:', error);
      setLoading(false);
      setOpenModalError(true);
    }
  }

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2}>
        <Button
          variant="contained"
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
          onClick={handleAsignarTimbres}
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
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Opción</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Timbres</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Empresa</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Monto</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Estatus</TableCell>
              {/* <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha de Orden</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Fecha de Pago</TableCell> */}
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Comprobante</TableCell>
              <TableCell sx={{ fontSize: '1rem', fontWeight: 'bold', color: 'white', textAlign: 'center' }}>Acción</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pagos.map((pago) => (
              // <React.Fragment key={pago.ID}>
              <TableRow key={pago.ID} sx={{ borderBottom: '1px solid #ddd' }}>
                <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                  <Checkbox
                    color="primary"
                    checked={selectedRows.includes(pago.ID)}
                    onChange={() => handleSelectRow(pago)}
                    sx={{ color: '#04b2ca', '&.Mui-checked': { color: '#028596' } }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.ID}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.PlanID ? 'Plan ' + pago.Plan.ID : 'Paquete ' + pago.Paquete.ID}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.PlanID ? pago.Plan.CantidadTimbres : pago.Paquete.CantidadTimbres}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.EmisorID}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.PlanID ? formatCurrency(pago.Plan.Costo) : formatCurrency(pago.Paquete.Costo)}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.Estatus}</TableCell>
                {/* <TableCell sx={{ textAlign: 'center' }}>{pago.FechaOrden}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{pago.FechaPago}</TableCell> */}
                <TableCell sx={{ textAlign: 'center' }}>{pago.ComprobantePath}</TableCell>
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
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <ModalLoading openModal={loading} handleCloseModal={() => setLoading(false)} loading={loading} loadingMessage="Asignando Timbres..." />
      <ModalExito openModal={openModalExito} handleCloseModal={() => setOpenModalExito(false)} confirmationMessage="Timbres asignados correctamente" />
      <ModalError openModal={openModalError} handleCloseModal={() => setOpenModalError(false)} confirmationMessage="Error al asignar timbres" />

    </Box>
  );
};

export default Pagos;
