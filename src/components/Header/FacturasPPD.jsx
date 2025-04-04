"use client";
import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, ListItemIcon, Typography, Divider, Box, Badge } from '@mui/material';
import { useRouter } from 'next/navigation';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ReceiptIcon from '@mui/icons-material/Receipt'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CircleIcon from '@mui/icons-material/Circle';

export default function UserMenu({ token }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter();
  const [pendingInvoices, setPendingInvoices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Función para verificar si estamos en los primeros 5 días del mes
  const shouldFetchData = () => {
    const today = new Date();
    const dayOfMonth = today.getDate();
    return dayOfMonth <= 5;
  };

  useEffect(() => {
    const fetchPendingInvoices = async () => {
      // Solo hacer la consulta los primeros 5 días del mes
      if (!shouldFetchData()) {
        setLoading(false);
        setPendingInvoices([]);
        return;
      }

      try {
        const response = await fetch('https://api.sandbox.wisefacturacion.com/api/facturas/FacturasPendientes', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Ordenar por ID (asumiendo que ID más bajo = más antiguo) y tomar los 3 más antiguos
          const sortedInvoices = [...data].sort((a, b) => a.ID - b.ID);
          const oldestInvoices = sortedInvoices.slice(0, 3);
          
          setPendingInvoices(oldestInvoices);
        }
      } catch (error) {
        console.error('Error fetching pending invoices:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchPendingInvoices();
  }, [token]);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handlePPDInvoicesClick = () => {
    handleMenuClose();
    router.push('/ValidarPPD');
  };

  // Mostrar mensaje cuando no es tiempo de consulta
  const showNoQueryPeriodMessage = !shouldFetchData() && !loading && pendingInvoices.length === 0;

  return (
    <>
      <IconButton onClick={handleMenuOpen} sx={{ marginLeft: "auto" }}>
        <Badge 
          color="error" 
          variant="dot" 
          invisible={pendingInvoices.length === 0 || !shouldFetchData()}
        >
          <NotificationsIcon fontSize="large" sx={{ color: "white", marginLeft: "auto" }} />
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        sx={{
          "& .MuiPaper-root": {
            backgroundColor: '#fff',
            color: '#333',
            minWidth: '250px',
            borderRadius: '8px',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '10px' }}>
          <ReceiptIcon sx={{ fontSize: '3.5em', color: '#333' }} />
        </Box>

        <Divider sx={{ margin: '10px 0', backgroundColor: '#1d394d' }} />

        {/* Mostrar las facturas pendientes */}
        {loading ? (
          <MenuItem>
            <Typography>Cargando...</Typography>
          </MenuItem>
        ) : showNoQueryPeriodMessage ? (
          <MenuItem>
            <Typography>Consulta disponible solo los primeros 5 días del mes</Typography>
          </MenuItem>
        ) : pendingInvoices.length > 0 ? (
          pendingInvoices.map((invoice, index) => (
            <MenuItem 
              key={invoice.ID} // Usar el ID como key en lugar del índice
              sx={{
                padding: '10px 20px',
                "&:hover": {
                  backgroundColor: '#1d394d',
                  color: '#fff',
                  '& .MuiListItemIcon-root': {
                    color: '#fff',
                  },
                },
              }}
            >
              <ListItemIcon sx={{ color: '#333' }}>
                <CircleIcon sx={{ fontSize: '0.8em' }} />
              </ListItemIcon>
              <Box>
                <Typography fontWeight="bold">Folio: {invoice.Folio}</Typography>
                <Typography variant="body2">Emisor: {invoice.Emisor.Nombre}</Typography>
                <Typography variant="body2">Saldo: ${invoice.SaldoInsoluto}</Typography>
              </Box>
            </MenuItem>
          ))
        ) : (
          <MenuItem>
            <Typography>No hay facturas pendientes</Typography>
          </MenuItem>
        )}

        <Divider sx={{ margin: '10px 0', backgroundColor: '#1d394d' }} />

        <MenuItem
          onClick={handlePPDInvoicesClick}
          sx={{
            padding: '10px 20px',
            "&:hover": {
              backgroundColor: '#1d394d',
              color: '#fff',
              '& .MuiListItemIcon-root': {
                color: '#fff',
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#333' }}>
            <CheckCircleIcon />
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit' }}>
            Ver todas las Facturas PPD
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}