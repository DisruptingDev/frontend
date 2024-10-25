import { Drawer, List, ListItem, ListItemIcon, ListItemText, Toolbar, Box, Button } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FacturacionIcon from '@mui/icons-material/Receipt';
import ClientesIcon from '@mui/icons-material/People';
import EmpresasIcon from '@mui/icons-material/Business';
import ReportesIcon from '@mui/icons-material/Assessment';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import PaymentsIcon from '@mui/icons-material/Payments';
import Image from 'next/image';
import Link from "next/link";

const drawerWidth = 240;

const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon /> },
    // { text: 'Usuarios', icon: <FacturacionIcon /> },
    { text: 'Usuarios', icon: <ClientesIcon /> },

    { text: 'Pagos', icon: <PaymentsIcon /> },
    // { text: 'Reportes', icon: <ReportesIcon /> },
];

const SideBar = () => {
    return (
        <Drawer
            variant="permanent"
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                    width: drawerWidth,
                    boxSizing: 'border-box',
                    backgroundColor: '#1d394d',
                    display: 'flex',
                    flexDirection: 'column',
                    margin: '0.5rem',
                   
                    // marginTop: '5.5rem',
                    marginTop: '6rem',
                    height: 'calc(100vh - 6.5rem)',
                    borderRadius: '0.2rem',
                    boxShadow: '0px 0px 10px 0px rgba(0,0,0,0.45)',
                    // justifyContent: 'space-between',
                },
            }}
        >
            {/* <Box sx={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                <Image
                    src="/images/logo.png"
                    alt="Logo de la empresa"
                    width={203}
                    height={64}
                />
            </Box> */}
            <Box>
        
                <List sx={{marginTop:'1rem'}}>
                    <Link href="/Dashboard">

                        <ListItem button >
                            <ListItemIcon sx={{ color: '#ffffff' }}>
                                <DashboardIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Dashboard'} sx={{ color: '#ffffff' }} />
                        </ListItem>
                    </Link>
                    <Link href="/Usuarios">
                        <ListItem button >
                            <ListItemIcon sx={{ color: '#ffffff' }}>
                                <ClientesIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Usuarios'} sx={{ color: '#ffffff' }} />
                        </ListItem>
                    </Link>


                    <Link href="/AsignarTimbres">
                        <ListItem button >
                            <ListItemIcon sx={{ color: '#ffffff' }}>
                                <PaymentsIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Pagos'} sx={{ color: '#ffffff' }} />
                        </ListItem>
                    </Link>
                        {/* <ListItem button >
                            <ListItemIcon sx={{ color: '#ffffff' }}>
                                <ReportesIcon />
                            </ListItemIcon>
                            <ListItemText primary={'Reportes'} sx={{ color: '#ffffff' }} />
                        </ListItem> */}
                 
                </List>
            </Box>

            <Box sx={{ padding: '16px', marginTop:'auto' }}>
            <Link href="/IniciaSesion" passHref>
                <Button
                    variant="outlined"
                    // color="secondary"
                    startIcon={<ExitToAppIcon />}
                    fullWidth
                    sx={{ color: '#fff' }} // Rojo para "Cerrar sesión"
                    onClick={() => {  localStorage.removeItem('authToken');
                        sessionStorage.removeItem('authToken');}}
                >
                    Cerrar sesión
                </Button>
                </Link>
            </Box>
        </Drawer>
    );
};

export default SideBar;
