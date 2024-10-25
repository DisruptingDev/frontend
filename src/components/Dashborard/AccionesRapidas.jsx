import { Button, Stack, Typography, Card, CardContent } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import BarChartIcon from '@mui/icons-material/BarChart';
import SettingsIcon from '@mui/icons-material/Settings';

export default function AccionesRapidas() {
    return (
        <Card sx={{height:'100%'}} >
            <Typography sx={{ fontSize: '1.2em', fontWeight: '600', marginLeft: '0.5em', marginBottom: '1em', marginTop:'0.5em' }}>
                    Acciones Rápidas
                </Typography>
            <CardContent>
                
                <Stack spacing={3}>
                    <Button sx={{backgroundColor:'#1d394d'}} variant="contained" startIcon={<AddIcon />}>Nueva Factura</Button>
                    <Button sx={{backgroundColor:'#1d394d'}} variant="contained" startIcon={<PersonAddIcon />}>Agregar Cliente</Button>
                    <Button sx={{backgroundColor:'#1d394d'}} variant="contained" startIcon={<BarChartIcon />}>Ver Reportes</Button>
                    <Button sx={{backgroundColor:'#1d394d'}} variant="contained" startIcon={<SettingsIcon />}>Configuración del Sistema</Button>
                </Stack>
            </CardContent>
        </Card>
    );
}
