// // components/UserMenu.js
// import { useState } from 'react';
// import { Menu, MenuItem, IconButton, ListItemIcon, Typography, Divider, Box } from '@mui/material';
// import AccountCircleIcon from '@mui/icons-material/AccountCircle';
// import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
// import ListAltIcon from '@mui/icons-material/ListAlt';
// import LogoutIcon from '@mui/icons-material/Logout';
// import { useRouter } from 'next/navigation';

// export default function UserMenu() {
//   const [anchorEl, setAnchorEl] = useState(null);
//   const router = useRouter();

//   const handleMenuOpen = (event) => {
//     setAnchorEl(event.currentTarget); // Abrir el menú
//   };

//   const handleMenuClose = () => {
//     setAnchorEl(null); // Cerrar el menú
//   };

//   const handleBuyClick = () => {
//     handleMenuClose();
//     router.push('/CompraTimbres');
//   };

//   const handleViewOrdersClick = () => {
//     handleMenuClose();
//     router.push('/VerOrdenes');
//   };

//   const handleLogout = () => {
//     localStorage.removeItem('authToken');
//     sessionStorage.removeItem('authToken');
//     router.push('/IniciaSesion');
//   };

//   return (
//     <>
//       <IconButton onClick={handleMenuOpen} className="ml-auto text-white">
//         <AccountCircleIcon fontSize="large" />
//       </IconButton>

//       <Menu
//         anchorEl={anchorEl}
//         open={Boolean(anchorEl)}
//         onClose={handleMenuClose}
//         anchorOrigin={{
//           vertical: 'bottom',
//           horizontal: 'right',
//         }}
//         transformOrigin={{
//           vertical: 'top',
//           horizontal: 'right',
//         }}
//         sx={{
//           "& .MuiPaper-root": {
//             // backgroundColor: '#333', // Color de fondo personalizado
//             backgroundColor:'#1d394d ',
//             color: '#fff', // Color de texto personalizado
//             minWidth: '250px',
//             borderRadius: '8px',
//             boxShadow: '0px 4px 12px rgba(0, 0, 0, 1)',
//           },
//         }}
//       >
//       <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center',paddingTop:'10px' }}>
//   <AccountCircleIcon sx={{ fontSize: '3.5em' }} />
// </Box>

//         <Typography variant="h6" textAlign="center"  sx={{ fontWeight: '600', paddingTop:'10px'}}>
//           Kevin
//         </Typography>
//         <Typography variant="subtitle2" textAlign="center" sx={{fontSize:'0.7em'}}>
//           kevin@gmail.com
//         </Typography>

//         <Divider sx={{ margin: '10px 0', backgroundColor:'#607d8b' }} />
//         {/* <Typography variant="caption" sx={{  padding: '10px 20px',}}> 
//           Compras
//         </Typography> */}
//         <MenuItem 
//           onClick={handleBuyClick} 
//           sx={{
//             padding: '10px 20px',
//             "&:hover": {
//               backgroundColor: '#04b2ca', // Color de fondo al hacer hover
//               color: '#fff', // Asegura que el color del texto siga visible
//             },
//           }}
//         >
//           <ListItemIcon>
//             <ShoppingCartIcon sx={{ color: '#fff' }} />
//           </ListItemIcon>
//           <Typography variant="inherit" noWrap sx={{ color: '#fff' }}>
//             Comprar Timbres
//           </Typography>
//         </MenuItem>

//         <MenuItem 
//           onClick={handleViewOrdersClick} 
//           sx={{
//             padding: '10px 20px',
//             "&:hover": {
//               backgroundColor: '#04b2ca', // Color de fondo al hacer hover
//               color: '#fff',
//             },
//           }}
//         >
//           <ListItemIcon>
//             <ListAltIcon sx={{ color: '#fff' }} />
//           </ListItemIcon>
//           <Typography variant="inherit" noWrap sx={{ color: '#fff' }}>
//             Ver órdenes
//           </Typography>
//         </MenuItem>

//         <Divider sx={{ margin: '10px 0', backgroundColor:'#607d8b' }} />

//         <MenuItem 
//           onClick={handleLogout} 
//           sx={{
//             padding: '10px 20px',
//             "&:hover": {
//               backgroundColor: '#04b2ca', // Color de fondo al hacer hover
//               color: '#fff',
//             },
//           }}
//         >
//           <ListItemIcon>
//             <LogoutIcon sx={{ color: '#fff' }} />
//           </ListItemIcon>
//           <Typography variant="inherit" noWrap sx={{ color: '#fff' }}>
//             Cerrar sesión
//           </Typography>
//         </MenuItem>
//       </Menu>
//     </>
//   );
// }
"use client";
import { useState, useEffect } from 'react';
import { Menu, MenuItem, IconButton, ListItemIcon, Typography, Divider, Box } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import ListAltIcon from '@mui/icons-material/ListAlt';
import LogoutIcon from '@mui/icons-material/Logout';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useRouter } from 'next/navigation';

export default function UserMenu() {
  const [anchorEl, setAnchorEl] = useState(null);
  const router = useRouter();

  const [correo, setCorreo] = useState('');
  const [usuario, setUsuario] = useState('');
  const [superUser, setSuperUser] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedCorreo = localStorage.getItem('correo');
      const storedUsuario = localStorage.getItem('usuario');
      const superUser = localStorage.getItem('superUser');
      setSuperUser(superUser || '');
      setCorreo(storedCorreo || '');
      setUsuario(storedUsuario || '');
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

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    sessionStorage.removeItem('authToken');
    router.push('/IniciaSesion');
  };

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
        <Typography variant="subtitle2" textAlign="center" sx={{ fontSize: '0.7em', color: '#666' }}>
          {correo}
        </Typography>

        <Divider sx={{ margin: '10px 0', backgroundColor: '#1d394d' }} />


        {superUser === 'true' && (<MenuItem
          onClick={handleDashboardClick}
           
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
            <DashboardIcon /> {/* Cambiar color del ícono */}
          </ListItemIcon>
          <Typography noWrap sx={{ color: 'inherit', }}>
            Dashboard
          </Typography>
        </MenuItem>
          )}

        

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
    </>
  );
}
