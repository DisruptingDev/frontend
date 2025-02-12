'use client'
//import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box, Button } from '@mui/material';
import VerticalNav, {Menu, MenuItem, SubMenu} from '@menu/vertical-menu';

import DashboardIcon from '@mui/icons-material/Dashboard';
import ClientesIcon from '@mui/icons-material/People';
//import FacturacionIcon from '@mui/icons-material/Receipt';
//import EmpresasIcon from '@mui/icons-material/Business';
//import ReportesIcon from '@mui/icons-material/Assessment';
//import ExitToAppIcon from '@mui/icons-material/ExitToApp';
//import PaymentsIcon from '@mui/icons-material/Payments';
//import Image from 'next/image';


  
    const SideBarMenu = () => {
    return (
     
        <VerticalNav customBreakpoint='200px' >
          <Menu>
            <SubMenu label="Facturacion" icon={<DashboardIcon />} >
              <MenuItem href="/CrearFactura">Nueva Factura</MenuItem>
              <MenuItem href="/ImportarFacturas">Importar Facturas</MenuItem>
            </SubMenu>
            <MenuItem href="/AltaCliente" icon={<ClientesIcon />}>Clientes</MenuItem>
          </Menu>
        </VerticalNav>
    );
};



export default SideBarMenu;
