import { Card, CardContent, Typography, Grid, Box } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import WalletIcon from '@mui/icons-material/Wallet';
import LabelIcon from '@mui/icons-material/Label';
export default function Cards() {
return (
    <Grid container spacing={3}>
      {/* Facturas Totales */}
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{display:'flex', justifyContent:'space-between'}}>
                <Typography sx={{fontSize:'0.8em'}}>Facturas Totales</Typography>
                <DescriptionIcon sx={{fontSize:'1.5em', color:'#1d394d'}}/>
            </Box>
            
            <Typography sx={{fontSize:'1.5em', fontWeight:'600'}}>1,234</Typography>
            <Typography sx={{fontSize:'0.8em', color:'#ababae'}}>+20.1% desde el último mes</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{display:'flex', justifyContent:'space-between'}}>
                <Typography sx={{fontSize:'0.8em'}}>Clientes Activo</Typography>
                <GroupIcon sx={{fontSize:'1.5em', color:'#1d394d'}}/>
            </Box>
            
            <Typography sx={{fontSize:'1.5em', fontWeight:'600'}}>573</Typography>
            <Typography sx={{fontSize:'0.8em', color:'#ababae'}}>+180 nuevos este mes</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{display:'flex', justifyContent:'space-between'}}>
                <Typography sx={{fontSize:'0.8em'}}>Ingresos Mensuales</Typography>
                <WalletIcon sx={{fontSize:'1.5em', color:'#1d394d'}}/>
            </Box>
            
            <Typography sx={{fontSize:'1.5em', fontWeight:'600'}}>$54,231</Typography>
            <Typography sx={{fontSize:'0.8em', color:'#ababae'}}>+19% desde el último mes</Typography>
          </CardContent>
        </Card>
      </Grid>

     
      <Grid item xs={12} sm={6} md={3}>
        <Card>
          <CardContent>
            <Box sx={{display:'flex', justifyContent:'space-between'}}>
                <Typography sx={{fontSize:'0.8em'}}>Timbres Utilizados</Typography>
                <LabelIcon sx={{fontSize:'1.5em', color:'#1d394d'}}/>
            </Box>
            
            <Typography sx={{fontSize:'1.5em', fontWeight:'600'}}>8,742</Typography>
            <Typography sx={{fontSize:'0.8em', color:'#ababae'}}>+7% desde la semana pasada</Typography>
          </CardContent>
        </Card>
      </Grid>
  

    </Grid>
  );
}