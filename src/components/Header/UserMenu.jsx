"use client";
import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, ListItemIcon, Typography, Divider, Box } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import SecurityIcon from '@mui/icons-material/Security';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ClearIcon from '@mui/icons-material/Clear';
import { useRouter } from 'next/navigation';
import { offSuplantar } from '@/utils/desactivarSuplantar';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import { WithPermission } from '@/components/WithPermission';

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
    localStorage.removeItem('usuarioSuplantado');
    sessionStorage.removeItem('authToken');
    router.push('/IniciaSesion');
  };

  const handleOffSuplantar = async () => {
    console.log('Desactivando suplantar');
    localStorage.removeItem('usuarioSuplantado');
    setUsuarioSuplantado('');
    offSuplantar();
    router.push('/Dashboard');
  };

  const handlePermisions = () => {
    handleMenuClose();
    router.push('/Permisos');
  }

  return (
    <>
      <IconButton onClick={handleMenuOpen} sx={{ marginLeft: "auto" }}>
        <AccountCircleIcon fontSize="large" sx={{ color: "white", marginLeft: "auto" }} />
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
          <AccountCircleIcon sx={{ fontSize: '3.5em', color: '#333' }} /> {/* Color del ícono invertido */}
        </Box>

        <Typography variant="h6" textAlign="center" sx={{ fontWeight: '600', paddingTop: '10px', color: '#333' }}>
          {usuario}
        </Typography>
        <Typography variant="subtitle2" textAlign="center" sx={{ fontSize: '0.7em', color: '#777' }}>
          {correo}
        </Typography>

        {usuarioSuplantado && [
          <Divider
            key="divider"
            sx={{ margin: '10px 0', backgroundColor: '#1d394d' }}
          />,
          <Typography
            key="suplantando-text"
            variant="subtitle2"
            textAlign="center"
            sx={{ fontSize: '0.9em', color: '#333', fontWeight: '600' }}
          >
            Suplantando a: {usuarioSuplantado}
          </Typography>,
          <MenuItem
            key="dejar-suplantar"
            onClick={handleOffSuplantar}
            sx={{
              padding: '10px 20px',
              "&:hover": {
                backgroundColor: '#1d394d', // Color de fondo al hacer hover
                color: '#fff',
                '& .MuiListItemIcon-root': {
                  color: '#fff', // Cambiar color del ícono al hacer hover
                },
                '& .MuiSvgIcon-root': {
                  // Cambiar color del ícono al hacer hover
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: '#333' }}>
              <ClearIcon />
            </ListItemIcon>
            <Typography noWrap sx={{ color: 'inherit' }}>
              Dejar de suplantar
            </Typography>
          </MenuItem>
        ]}

        <Divider sx={{ margin: '10px 0', backgroundColor: '#1d394d' }} />

        {superUser === 'true' && (
          <MenuItem
            onClick={handleDashboardClick}
            sx={{
              padding: '10px 20px',
              "&:hover": {
                backgroundColor: '#1d394d',
                color: '#fff',
                '& .MuiListItemIcon-root': {
                  color: '#fff',
                },
                '& MuiSvgIcon-root': {
                  color: '#fff',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: '#333' }}>
              <DashboardIcon />
            </ListItemIcon>
            <Typography noWrap sx={{ color: 'inherit', }}>
              Dashboard
            </Typography>
          </MenuItem>
        )}
        <WithPermission permission="ver_roles">
          <MenuItem
            onClick={handlePermisions}
            sx={{
              padding: '10px 20px',
              "&:hover": {
                backgroundColor: '#1d394d',
                color: '#fff',
                '& .MuiListItemIcon-root': {
                  color: '#fff',
                },
                '& MuiSvgIcon-root': {
                  color: '#fff',
                },
              },
            }}
          >
            <ListItemIcon sx={{ color: '#333' }}>
              <SecurityIcon />
            </ListItemIcon>
            <Typography noWrap sx={{ color: 'inherit', }}>
              Administrar Roles y Permisos
            </Typography>
          </MenuItem>
        </WithPermission>


        <MenuItem
          onClick={handleBuyClick}
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
            <ShoppingCartIcon /> {/* Cambiar color del ícono */}
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit', }}>
            Comprar Timbres
          </Typography>
        </MenuItem>

        <MenuItem
          onClick={handleViewOrdersClick}
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
            <ListAltIcon /> {/* Cambiar color del ícono */}
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit', }}>
            Ver órdenes
          </Typography>
        </MenuItem>

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
            <GroupAddIcon /> {/* Cambiar color del ícono */}
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit', }}>
            Invitar Miembros del Equipo
          </Typography>
        </MenuItem>


        <Divider sx={{ margin: '10px 0', backgroundColor: '#1d394d' }} />

        <MenuItem
          onClick={handleLogout}
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
            <LogoutIcon /> {/* Cambiar color del ícono */}
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit', }}>
            Cerrar sesión
          </Typography>
        </MenuItem>
      </Menu>
      <ModalCorreos open={open} onClose={() => setOpen(false)} setOpen={setOpen} />
    </>
  );
}
