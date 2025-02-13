"use client";

import Header from '@/components/Header/Header';
import { Box, Tabs, Tab, Typography, Button, Grid } from '@mui/material';
import VistaOrdenes from '@/components/VistaOrdenes/VistaOrdenes';
import VistaPaquetes from '@/components/VistaOrdenes/VistaPaquetes';
import VistaPlanes from '@/components/VistaOrdenes/VistaPlanes';
import ModalComprobante from '@/components/VistaOrdenes/ModalComprobante';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';


import React, { use, useCallback, useEffect, useState } from 'react';
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/utils/authRedirect";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function createData(item) {
  return { ...item };
}


export default function VerOrdenes() {
  const [valorTab, setValorTab] = useState(0);
  const router = useRouter(); // Inicializa el router
  const [token, setToken] = useState("");

  const [selectedRows, setSelectedRows] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const [actualizar, setActualizar] = useState(false);

  const [ordenes, setOrdenes] = useState([]);
  const [loading, setLoading] = useState(true);

  const [paquetes, setPaquetes] = useState([]);
  const [planes, setPlanes] = useState([]);

  const [totalAPagar, setTotalAPagar] = useState(0);



  useEffect(() => {
    // Verifica la autenticación al montar el componente
    const token = isAuthenticated();
    if (!token) {
      // console.log("SEsion",!isAuthenticated());
      router.push("/IniciaSesion"); // Redirige a la página de login si no está autenticado
    }
    else {
      console.log('Token', token);
      setToken(token);
    }
  }, [router]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  }

  const fetchPaquetes = useCallback(async () => {
    if (token) {
      console.log('Fetching Paquetes', token);
      try {
        const response = await fetch(`${apiUrl}/api/compratimbres/ListarOrdenesPaquetes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log('Data', data);

        if (Array.isArray(data)) {
          const transformedData = data.map((item) => createData(item));
          const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
          setPaquetes(sortedData);

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

  const fetchPlanes = useCallback(async () => {
    if (token) {
      console.log('Fetching Paquetes', token);
      try {
        const response = await fetch(`${apiUrl}/api/compratimbres/ListarOrdenesPlanes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        console.log('Data', data);

        if (Array.isArray(data)) {
          const transformedData = data.map((item) => createData(item));
          const sortedData = transformedData.sort((a, b) => b.ID - a.ID);
          setPlanes(sortedData);
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
    fetchPaquetes();
    fetchPlanes();

    // setOrdenes(...paquetes, ...planes);
  }, [fetchPaquetes, fetchPlanes, token]);

  useEffect(() => {
    if (actualizar) {

      fetchPaquetes();
      fetchPlanes();

      setActualizar(false);
      setSelectedRows([]);
    }
  }, [actualizar, fetchPaquetes, fetchPlanes]);


  useEffect(() => {
    if (valorTab === 0) {
      setOrdenes(paquetes);
    }
    else {
      setOrdenes(planes);
    }
  }, [planes, paquetes, valorTab]);

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
    console.log('Selected rows', selectedRows);
  };

  const selectedOrdenes = ordenes.filter((orden) => selectedRows.includes(orden.ID));
  // const totalAPagar = selectedRows.reduce((acc, orden) => acc + (orden.PlanID ? orden.Plan.Costo : orden.Paquete.Costo), 0);

  const handleOpenModal = () => {
    console.log('Abrir modal', selectedOrdenes);
    // setTotalAPagar(0)
    if (valorTab === 0) {
      setTotalAPagar(selectedOrdenes.reduce((acc, orden) => acc + orden.Paquete.Costo, 0));
    }
    else {
      setTotalAPagar(selectedOrdenes.reduce((acc, orden) => acc + orden.Plan.Costo, 0));
    }
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
      const response = await fetch(`${apiUrl}/api/activacionordenes/ActivacionOrdenes/ComprobanteFile/${ID}`, {
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


  const manejarCambioTab = (event, newValue) => {
    setValorTab(newValue);
    if (newValue === 0) {
      setOrdenes(paquetes);
    }
    else {
      setOrdenes(planes);
    }

    setSelectedRows([]);
  };

  return (
    <div>
      <Header />
      <Grid container>
        <Grid item>
          <SideBarMenu />
        </Grid>
        <Grid item sx={{ flexGrow: 1 }}>
          <Box bgcolor="white" my={4} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Tabs
              value={valorTab}
              onChange={manejarCambioTab}

              textColor="#1b384a"
              centered
              sx={{
                marginBottom: '0.5rem',

                '& .MuiTabs-indicator': {
                  backgroundColor: '#1b384a', // Cambiar el color del indicador aquí
                },
              }}
            >
              <Tab label="Paquetes" />
              <Tab label="Planes" />
            </Tabs>

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

            {/* Mostrar el componente correspondiente */}
            {valorTab === 0 ? <VistaPaquetes paquetes={paquetes} selectedRows={selectedRows} handleSelectRow={handleSelectRow} handleVerComprobante={handleVerComprobante} /> :
              <VistaPlanes planes={planes} selectedRows={selectedRows} handleSelectRow={handleSelectRow} handleVerComprobante={handleVerComprobante} />}
          </Box>
        </Grid>
      </Grid>
      {/* Modal para mostrar el resumen */}
      <ModalComprobante
        open={openModal}
        onClose={handleCloseModal}
        ordenesSeleccionadas={selectedOrdenes}
        totalAPagar={totalAPagar}
        token={token}
        setActualizar={setActualizar}
      />
    </div>
  );
}