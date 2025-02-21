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
import Tooltip from '@mui/material/Tooltip';

const SideBarMenu = () => {
  const [openSubMenu, setOpenSubMenu] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
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
        marginLeft: "4px",
        '& .MuiDrawer-paper': {
          width: drawerOpen ? 240 : 60,
          transition: 'width 0.3s',
          overflowX: 'hidden',
          position: 'relative',
          zIndex: 1300,
          height: '100vh',
          marginLeft: "4px",
        }
      }}
    >
      <Toolbar sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1300,
        position: 'relative',
      }}>
        <IconButton onClick={() => setDrawerOpen(!drawerOpen)}>
          <MenuIcon />
        </IconButton>
      </Toolbar>
      <List>
        <Tooltip title="Facturación" placement="right" disableHoverListener={drawerOpen}>
          <ListItemButton
            selected={pathname.startsWith('/CrearFactura') || pathname.startsWith('/ImportarFacturas')}
            onClick={() => handleSubMenuClick("Facturacion")}
          >
            <ListItemIcon><FacturacionIcon /></ListItemIcon>
            {drawerOpen && <ListItemText primary="Facturación" />}
            {drawerOpen && (openSubMenu === "Facturacion" ? <ExpandLess /> : <ExpandMore />)}
          </ListItemButton>
        </Tooltip>
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
        <Tooltip title="Clientes" placement="right" disableHoverListener={drawerOpen}>
          <ListItemButton
            selected={pathname === "/AltaCliente"}
            onClick={() => handleNavigation("/AltaCliente")}
          >
            <ListItemIcon><ClientesIcon /></ListItemIcon>
            {drawerOpen && <ListItemText primary="Clientes" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Empresas" placement="right" disableHoverListener={drawerOpen}>
          <ListItemButton
            selected={pathname === "/Empresas"}
            onClick={() => handleNavigation("/Empresas")}
          >
            <ListItemIcon><EmpresasIcon /></ListItemIcon>
            {drawerOpen && <ListItemText primary="Empresas" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Series" placement="right" disableHoverListener={drawerOpen}>
          <ListItemButton
            selected={pathname === "/AltaSerie"}
            onClick={() => handleNavigation("/AltaSerie")}
          >
            <ListItemIcon><SeriesIcon /></ListItemIcon>
            {drawerOpen && <ListItemText primary="Series" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Timbres" placement="right" disableHoverListener={drawerOpen}>
          <ListItemButton
            selected={pathname === "/Timbres"}
            onClick={() => handleNavigation("/Timbres")}
          >
            <ListItemIcon><TimbresIcon /></ListItemIcon>
            {drawerOpen && <ListItemText primary="Timbres" />}
          </ListItemButton>
        </Tooltip>
        <Tooltip title="Conceptos" placement="right" disableHoverListener={drawerOpen}>
          <ListItemButton
            selected={pathname === "/Conceptos"}
            onClick={() => handleNavigation("/Conceptos")}
          >
            <ListItemIcon><ConceptosIcon /></ListItemIcon>
            {drawerOpen && <ListItemText primary="Conceptos" />}
          </ListItemButton>
        </Tooltip>
      </List>
    </Drawer>
  );
};

export default SideBarMenu;
