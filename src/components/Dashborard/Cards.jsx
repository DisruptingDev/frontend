"use client";
import { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Grid, Box, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Button, CardActionArea } from '@mui/material';
import DescriptionIcon from '@mui/icons-material/Description';
import GroupIcon from '@mui/icons-material/Group';
import WalletIcon from '@mui/icons-material/Wallet';
import LabelIcon from '@mui/icons-material/Label';
import VerifiedIcon from '@mui/icons-material/Verified';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';

export default function Cards() {
  const [stampedCount, setStampedCount] = useState(0);
  const [payrollStampedCount, setPayrollStampedCount] = useState(0);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [openDateModal, setOpenDateModal] = useState(false);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [stampedRes, payrollRes] = await Promise.all([
          fetch(`/api/dashboard/stamped-count?startDate=${startDate}&endDate=${endDate}`),
          fetch(`/api/dashboard/payroll-stamped-count?startDate=${startDate}&endDate=${endDate}`)
        ]);

        if (stampedRes.ok) {
          const data = await stampedRes.json();
          setStampedCount(data.count);
        }
        if (payrollRes.ok) {
          const data = await payrollRes.json();
          setPayrollStampedCount(data.count);
        }
      } catch (error) {
        console.error("Error fetching dashboard counts:", error);
      }
    };

    if (startDate && endDate) {
      fetchCounts();
    }
  }, [startDate, endDate]);

  const handleOpenDateModal = () => setOpenDateModal(true);
  const handleCloseDateModal = () => setOpenDateModal(false);

  return (
    <Grid container spacing={3}>
      {/* Facturas Timbradas */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%', position: 'relative' }}>
          <CardActionArea onClick={handleOpenDateModal} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8em' }}>Facturas Timbradas</Typography>
                <VerifiedIcon sx={{ fontSize: '1.5em', color: '#1d394d' }} />
              </Box>

              <Typography sx={{ fontSize: '1.5em', fontWeight: '600', mb: 1 }}>{stampedCount}</Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ababae' }}>
                <CalendarMonthIcon sx={{ fontSize: '1em' }} />
                <Typography sx={{ fontSize: '0.75em' }}>
                  {startDate} - {endDate}
                </Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>

      {/* Nóminas Timbradas */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%', position: 'relative' }}>
          <CardActionArea onClick={handleOpenDateModal} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: '0.8em' }}>Nóminas Timbradas</Typography>
                <LabelIcon sx={{ fontSize: '1.5em', color: '#2e7d32' }} />
              </Box>

              <Typography sx={{ fontSize: '1.5em', fontWeight: '600', mb: 1 }}>{payrollStampedCount}</Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#ababae' }}>
                <CalendarMonthIcon sx={{ fontSize: '1em' }} />
                <Typography sx={{ fontSize: '0.75em' }}>
                  {startDate} - {endDate}
                </Typography>
              </Box>
            </CardContent>
          </CardActionArea>
        </Card>
      </Grid>

      {/* Date Range Modal */}
      <Dialog open={openDateModal} onClose={handleCloseDateModal}>
        <DialogTitle>Seleccionar Rango de Fechas</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1, minWidth: '300px' }}>
            <TextField
              label="Fecha Inicio"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Fecha Fin"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDateModal}>Cerrar</Button>
        </DialogActions>
      </Dialog>


      {/* Facturas Totales */}
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8em' }}>Facturas Totales</Typography>
              <DescriptionIcon sx={{ fontSize: '1.5em', color: '#1d394d' }} />
            </Box>

            <Typography sx={{ fontSize: '1.5em', fontWeight: '600' }}>1,234</Typography>
            <Typography sx={{ fontSize: '0.8em', color: '#ababae' }}>+20.1% desde el último mes</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8em' }}>Clientes Activo</Typography>
              <GroupIcon sx={{ fontSize: '1.5em', color: '#1d394d' }} />
            </Box>

            <Typography sx={{ fontSize: '1.5em', fontWeight: '600' }}>573</Typography>
            <Typography sx={{ fontSize: '0.8em', color: '#ababae' }}>+180 nuevos este mes</Typography>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Typography sx={{ fontSize: '0.8em' }}>Ingresos Mensuales</Typography>
              <WalletIcon sx={{ fontSize: '1.5em', color: '#1d394d' }} />
            </Box>

            <Typography sx={{ fontSize: '1.5em', fontWeight: '600' }}>$54,231</Typography>
            <Typography sx={{ fontSize: '0.8em', color: '#ababae' }}>+19% desde el último mes</Typography>
          </CardContent>
        </Card>
      </Grid>


      {/* 
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ height: '100%' }}>
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
      */}


    </Grid>
  );
}