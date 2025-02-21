"use client";
import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, ListItemIcon, Typography, Divider, Box } from '@mui/material';
import { useRouter } from 'next/navigation';
import { offSuplantar } from '@/utils/desactivarSuplantar';
import NotificationsIcon from '@mui/icons-material/Notifications'
import ReceiptIcon from '@mui/icons-material/Receipt'; 
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import ModalCorreos from '../ModalCorreos/ModalCorreos';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter();

  const [correo, setCorreo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [superUser, setSuperUser] = useState('');
  const [usuarioSuplantado, setUsuarioSuplantado] = useState('');

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCorreo = localStorage.getItem('correo');
      const storedUsuario = localStorage.getItem('usuario');
      const superUser = localStorage.getItem('superUser');
      setSuperUser(superUser || '');
      setCorreo(storedCorreo || '');
      setUsuario(storedUsuario || '');

      const usuarioSuplantado = localStorage.getItem('usuarioSuplantado');
      setUsuarioSuplantado(usuarioSuplantado || '');
    }
  }, []);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget); // Abrir el menú
  };

  const handleMenuClose = () => {
    setAnchorEl(null); // Cerrar el menú
  };

  const handleDashboardClick = () => {
    handleMenuClose();
    router.push('/Dashboard');
  };

  const handleBuyClick = () => {
    handleMenuClose();
    router.push('/CompraTimbres');
  };

  const handleViewOrdersClick = () => {
    handleMenuClose();
    router.push('/VerOrdenes');
  };

  const handleInviteTeamMembersClick = () => {
    handleMenuClose();
    const handleOpen = () => setOpen(true);
    handleOpen();
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    router.push('/IniciaSesion');
  };
  const handleOffSuplantar = async () => {
    console.log('Desactivando suplantar');
    setUsuarioSuplantado('');


    offSuplantar();
    // setUsuarioSuplantado('');
    router.push('/Dashboard');
   
  };

  return (
    <>
      <IconButton onClick={handleMenuOpen} sx={{ marginLeft: "auto" }}>
        <NotificationsIcon  fontSize="large" sx={{ color: "white", marginLeft: "auto" }} />
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
            backgroundColor: '#fff', // Color de fondo invertido
            color: '#333', // Color de texto invertido
            minWidth: '250px',
            borderRadius: '8px',
            boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.5)',
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', paddingTop: '10px' }}>
          <ReceiptIcon sx={{ fontSize: '3.5em', color: '#333' }} /> {/* Color del ícono invertido */}
        </Box>

        



        <Divider sx={{ margin: '10px 0', backgroundColor: '#1d394d' }} />

        <MenuItem
          onClick={handleInviteTeamMembersClick}
          sx={{
            padding: '10px 20px',
            "&:hover": {
              // backgroundColor: '#04b2ca', // Color de fondo al hacer hover
              backgroundColor: '#1d394d', // Color de fondo al hacer hover
              color: '#fff',
              '& .MuiListItemIcon-root': {
                color: '#fff', // Cambiar color del ícono al hacer hover
              },
              '& MuiSvgIcon-root': {
                color: '#fff', // Cambiar color del ícono al hacer hover
              },
            },
          }}
        >
          <ListItemIcon sx={{ color: '#333' }}>
            <CheckCircleIcon /> {/* Cambiar color del ícono */}
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit', }}>
            Validar facturas PPD
          </Typography>
        </MenuItem>
      </Menu>
    </>
  );
}
