'use client';
import { useState } from 'react';
import { 
  Drawer, 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  IconButton, 
  Toolbar,
  Tooltip,
  Box
} from '@mui/material';
import { 
  Menu as MenuIcon,
  Home as HomeIcon,
  People as ClientesIcon,
  Receipt as FacturacionIcon,
  Business as EmpresasIcon,
  ViewList as SeriesIcon,
  Assignment as TimbresIcon,
  Category as ConceptosIcon,
  AttachMoney as AttachMoneyIcon,
  AddBox as AddIcon,
  FileOpen as ImportarIcon,
  
  ExpandLess,
  ExpandMore
} from '@mui/icons-material';
import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
  {
    title: "Vista Principal",
    icon: <HomeIcon />,
    path: "/Home",
    subItems: null
  },
  {
    title: "Nueva Factura",
    icon: <AddIcon />,
    path: "/CrearFactura",
    subItems: null
  },
  {
    title: "Importar Facturas",
    icon: <ImportarIcon />,
    path: "/ImportarFacturas",
    subItems: null
  },
  {
    title: "Nóminas",
    icon: <AttachMoneyIcon />,
    path: "/AltaNomina",
    subItems: null
  },
  {
    title: "Clientes",
    icon: <ClientesIcon />,
    path: "/AltaCliente",
    subItems: null
  },
  {
    title: "Empresas",
    icon: <EmpresasIcon />,
    path: "/Empresas",
    subItems: null
  },
  {
    title: "Series",
    icon: <SeriesIcon />,
    path: "/AltaSerie",
    subItems: null
  },
  {
    title: "Timbres",
    icon: <TimbresIcon />,
    path: "/Timbres",
    subItems: null
  },
  {
    title: "Conceptos",
    icon: <ConceptosIcon />,
    path: "/Conceptos",
    subItems: null
  }
];

const SideBarMenu = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const handleNavigation = (path) => {
    if (path) router.push(path);
  };

  const isSelected = (path, subItems) => {
    if (path) return pathname === path;
    if (subItems) return subItems.some(item => pathname.startsWith(item.path));
    return false;
  };

  return (
    <Box
      sx={{
        display: 'block',
        height: '100vh',
        position: 'fixed',
        left: "10px",
        bottom: "10x",
        zIndex: 1200
      }}
    >
      <Drawer
        variant="permanent"
        open={drawerOpen}
        sx={{
          width: drawerOpen ? 240 : 60,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerOpen ? 240 : 60,
            transition: 'width 0.3s ease',
            overflowX: 'hidden',
            height: '100vh',
            boxSizing: 'border-box',
            position: 'relative'
          }
        }}
      >
        <Toolbar 
          sx={{ 
            minHeight: '64px !important',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            px: '0 !important'
          }}
        >
          <IconButton 
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ margin: '0 auto' }}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
        
        <List sx={{ overflow: 'auto', flexGrow: 1 }}>
          {menuItems.map((item) => (
            <div key={item.title}>
              <Tooltip 
                title={item.title} 
                placement="right" 
                disableHoverListener={drawerOpen}
              >
                <ListItemButton
                  selected={isSelected(item.path, item.subItems)}
                  onClick={() => item.subItems 
                    ? handleSubMenuToggle(item.title)
                    : handleNavigation(item.path)
                  }
                  sx={{
                    minHeight: 48,
                    justifyContent: drawerOpen ? 'initial' : 'center',
                    px: 2.5,
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: drawerOpen ? 3 : 'auto',
                      justifyContent: 'center',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  {drawerOpen && (
                    <>
                      <ListItemText primary={item.title} />
                      
                    </>
                  )}
                </ListItemButton>
              </Tooltip>

              {item.subItems && (
                <Collapse 
                  in={openSubMenu === item.title && drawerOpen} 
                  timeout="auto" 
                  unmountOnExit
                >
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.title}
                        sx={{ pl: 4 }}
                        selected={pathname === subItem.path}
                        onClick={() => handleNavigation(subItem.path)}
                      >
                        <ListItemText primary={subItem.title} />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </div>
          ))}
        </List>
      </Drawer>
    </Box>
  );
};

export default SideBarMenu;
