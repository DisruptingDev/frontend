'use client';
import { useState } from 'react';
import { Drawer, List, ListItemButton, ListItemIcon, ListItemText, Collapse, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import ClientesIcon from '@mui/icons-material/People';
import FacturacionIcon from '@mui/icons-material/Receipt';
import EmpresasIcon from '@mui/icons-material/Business';
import SeriesIcon from '@mui/icons-material/ViewList';
import TimbresIcon from '@mui/icons-material/Assignment';
import ConceptosIcon from '@mui/icons-material/Category';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useRouter } from 'next/navigation';
import { usePathname } from 'next/navigation';

const SideBarMenu = () => {
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleSubMenuClick = (subMenu) => {
    setOpenSubMenu((prev) => (prev === subMenu ? null : subMenu));
  };

  const handleNavigation = (href) => {
    router.push(href);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      open={drawerOpen}
      sx={{
        width: drawerOpen ? 240 : 60,
        flexShrink: 0,
        marginLeft: "4px", // Agrega un margen a la izquierda
        '& .MuiDrawer-paper': {
          width: drawerOpen ? 240 : 60,
          transition: 'width 0.3s',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1300, 
          height: '100vh',
          marginLeft: "4px", // Agrega un margen a la izquierda
        }
      }}
    >
      <Toolbar sx={{
        display: 'flex',
        justifyContent: 'center', // Centra el contenido horizontalmente
        alignItems: 'center', // Asegura que también esté centrado verticalmente
        zIndex: 1300,
        position: 'relative',
      }}>
        <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <List>
        <ListItemButton
          selected={pathname.startsWith('/CrearFactura') || pathname.startsWith('/ImportarFacturas')}
          onClick={() => handleSubMenuClick("Facturacion")}
        >
          <ListItemIcon><FacturacionIcon /></ListItemIcon>
          {drawerOpen && <ListItemText primary="Facturación" />}
          {drawerOpen && (openSubMenu === "Facturacion" ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
        <Collapse in={openSubMenu === "Facturacion" && drawerOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname === "/CrearFactura"}
              onClick={() => handleNavigation("/CrearFactura")}
            >
              <ListItemText primary="Nueva Factura" />
            </ListItemButton>
            <ListItemButton
              sx={{ pl: 4 }}
              selected={pathname === "/ImportarFacturas"}
              onClick={() => handleNavigation("/ImportarFacturas")}
            >
              <ListItemText primary="Importar Facturas" />
            </ListItemButton>
          </List>
        </Collapse>
        <ListItemButton
          selected={pathname === "/AltaCliente"}
          onClick={() => handleNavigation("/AltaCliente")}
        >
          <ListItemIcon><ClientesIcon /></ListItemIcon>
          {drawerOpen && <ListItemText primary="Clientes" />}
        </ListItemButton>
        <ListItemButton
          selected={pathname === "/Empresas"}
          onClick={() => handleNavigation("/Empresas")}
        >
          <ListItemIcon><EmpresasIcon /></ListItemIcon>
          {drawerOpen && <ListItemText primary="Empresas" />}
        </ListItemButton>
        <ListItemButton
          selected={pathname === "/AltaSerie"}
          onClick={() => handleNavigation("/AltaSerie")}
        >
          <ListItemIcon><SeriesIcon /></ListItemIcon>
          {drawerOpen && <ListItemText primary="Series" />}
        </ListItemButton>
        <ListItemButton
          selected={pathname === "/Timbres"}
          onClick={() => handleNavigation("/Timbres")}
        >
          <ListItemIcon><TimbresIcon /></ListItemIcon>
          {drawerOpen && <ListItemText primary="Timbres" />}
        </ListItemButton>
        <ListItemButton
          selected={pathname === "/Conceptos"}
          onClick={() => handleNavigation("/Conceptos")}
        >
          <ListItemIcon><ConceptosIcon /></ListItemIcon>
          {drawerOpen && <ListItemText primary="Conceptos" />}
        </ListItemButton>
      </List>
    </Drawer>
  );
};

export default SideBarMenu;
