import React, { useCallback, useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Checkbox, Box, Button, IconButton, Menu, MenuItem, Modal, Typography, Collapse, TextField
} from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ModalComprobante from './ModalComprobante';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function createData(item) {
  return { ...item };
}

const VistaOrdenes = ({token}) => {
  const [selectedRows, setSelectedRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [actualizar, setActualizar] = useState(false);

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);


  // Función para formatear como moneda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  const fetchOrdenes = useCallback( async () => {
    if (token) {
      console.log('Fetching ordenes', token);
      try {
        const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/ListarOrdenes`,{
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();

        if (Array.isArray(data)) {
          const transformedData = data.map((item) => createData(item));
          const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
          console.log('Ordenes:', sortedData);
          setOrdenes(sortedData);
        } else {
          console.error('Expected an array but received:', typeof data);
        }
      } catch (error) {
        console.error('Error fetching ordenes:', error);
      } finally {
        setLoading(false);
      }

    }
  }, [token]);

  useEffect(() => {
    fetchOrdenes();
  }, [fetchOrdenes, token]);

  useEffect(() => {
    if (actualizar) {
      fetchOrdenes();
      setActualizar(false);
      setSelectedRows([]);
    }
  }, [actualizar, fetchOrdenes]);


  
  // const ordenes = [
  //   { ID: 1, Opcion: 'Opcion 1', Monto: 100, FechaOrden: '2022-01-01', FechaPago: '2024-01-01', Empresa: 'Escuela', Comprobante: '' },
  //   { ID: 2, Opcion: 'Opcion 2', Monto: 200, FechaOrden: '2022-01-01', FechaPago: '2024-01-01', Empresa: 'Empresa', Comprobante: 'comprobante1.pdf' },
  //   { ID: 3, Opcion: 'Opcion 3', Monto: 300, FechaOrden: '2022-01-01', FechaPago: '2024-01-01', Empresa: 'Hospital', Comprobante: '' },
  // ];

  const handleMenuClick = (event, row) => {
    setAnchorEl(event.currentTarget);
    setMenuRow(row);
  };
  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleSelectRow = (row) => {
    setSelectedRows((prev) => {
      if (prev.includes(row.ID)) {
        return prev.filter((id) => id !== row.ID);
      } else {
        return [...prev, row.ID];
      }
    });
  };

  const selectedOrdenes = ordenes.filter((orden) => selectedRows.includes(orden.ID));
  const totalAPagar = selectedOrdenes.reduce((acc, orden) => acc + (orden.PlanID? orden.Plan.Costo : orden.Paquete.Costo), 0);

  const handleOpenModal = () => {
    setOpenModal(true);
  };

  const handleCloseModal = () => {
    setOpenModal(false);
    setShowDetails(false); // Resetear al cerrar el modal
  };

  const handleToggleDetails = () => {
    setShowDetails((prev) => !prev);
  };

  const handleVerComprobante = async (ID) => {
    console.log('Ver comprobante', ID);
    try {
      const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/ComprobanteFile/${ID}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        window.open(url);
      }
      else {
        console.error('Error al obtener el comprobante');
      }
    } catch (error) {
      console.error('Error al obtener el comprobante', error
      );
    }
  }
  

  return (
    <Box>
      <Box display="flex" justifyContent="flex-end" mb={2} gap={2}>
        <Button
          variant="contained"
          disabled={selectedRows.length === 0}
          sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
          onClick={handleOpenModal}
        >
          Subir Comprobante
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
            {ordenes.map((orden) => (
              <TableRow key={orden.ID} sx={{ borderBottom: '1px solid #ddd' }}>
                <TableCell padding="checkbox" sx={{ textAlign: 'center' }}>
                  <Checkbox
                    color="primary"
                    checked={selectedRows.includes(orden.ID)}
                    onChange={() => handleSelectRow(orden)}
                    sx={{
                      color: '#04b2ca',
                      '&.Mui-checked': { color: '#028596' },
                    }}
                  />
                </TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.ID}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.PlanID? 'Plan ' +  orden .Plan.ID : 'Paquete '+ orden.Paquete.ID}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.PlanID? orden .Plan.CantidadTimbres :  orden.Paquete.CantidadTimbres}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.EmisorID}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.PlanID?  formatCurrency(orden.Plan.Costo): formatCurrency(orden.Paquete.Costo) }</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.Estatus}</TableCell>
                {/* <TableCell sx={{ textAlign: 'center' }}>{orden.FechaOrden}</TableCell>
                <TableCell sx={{ textAlign: 'center' }}>{orden.FechaPago}</TableCell> */}
                {/* <TableCell sx={{ textAlign: 'center' }}>{orden.ComprobantePath}</TableCell> */}

                <TableCell sx={{ textAlign: 'center' }}>
                  {orden.ComprobantePath ? (
                    <Button
                      variant="text"
                      onClick={() => handleVerComprobante(orden.ID)}>
                      Ver
                    </Button>
                  ) : null}
                  </TableCell>

                <TableCell sx={{ textAlign: 'center' }}>
                  <IconButton onClick={(event) => handleMenuClick(event, orden)}>
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

      {/* Modal para mostrar el resumen */}
        <ModalComprobante
            open={openModal}
            onClose={handleCloseModal}
            ordenesSeleccionadas={selectedOrdenes}
            totalAPagar={totalAPagar}
            token={token}
            setActualizar={setActualizar}
            />
    </Box>
  );
};

export default VistaOrdenes;
