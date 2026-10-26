'use client';
import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import CancelRoundedIcon from '@mui/icons-material/CancelRounded';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';

const comparisonData = [
  { feature: 'Multi RFC (múltiples emisores en una cuenta)', wise: true, sat: false, otros: 'Parcial / Costo extra' },
  { feature: 'Descarga masiva de XML y PDF del SAT', wise: true, sat: false, otros: 'Lento / Módulo aparte' },
  { feature: 'Timbrado de recibos de nómina masiva (1.2)', wise: true, sat: 'Muy complejo', otros: true },
  { feature: 'Módulo de contabilidad y conciliación', wise: true, sat: false, otros: 'Costo adicional' },
  { feature: 'Velocidad de timbrado (< 2 segundos)', wise: true, sat: 'Lento / Caídas frecuentes', otros: true },
  { feature: 'Folios sin caducidad', wise: true, sat: true, otros: false },
  { feature: 'Soporte humano por WhatsApp y teléfono', wise: true, sat: false, otros: 'Solo tickets lentos' },
];

export default function ComparisonTable() {
  const renderStatus = (val, isWise = false) => {
    if (val === true) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: isWise ? '#10968A' : '#16a34a' }}>
          <CheckCircleRoundedIcon fontSize="small" />
          <Typography variant="body2" sx={{ fontWeight: 600 }}>Incluido</Typography>
        </Box>
      );
    }
    if (val === false) {
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#ef4444' }}>
          <CancelRoundedIcon fontSize="small" />
          <Typography variant="body2">No disponible</Typography>
        </Box>
      );
    }
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5, color: '#f59e0b' }}>
        <RemoveCircleOutlineRoundedIcon fontSize="small" />
        <Typography variant="body2">{val}</Typography>
      </Box>
    );
  };

  return (
    <Box sx={{ py: { xs: 8, sm: 10 }, backgroundColor: '#f8fafc' }}>
      <Container maxWidth="lg">
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            component="h2"
            variant="h4"
            sx={{ fontWeight: 800, color: '#063F53', mb: 2 }}
          >
            ¿Por qué elegir Wise Facturación?
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', maxWidth: 650, mx: 'auto' }}>
            Compara Wise contra el facturador gratuito del SAT y otras plataformas comerciales del mercado mexicano.
          </Typography>
        </Box>

        <TableContainer component={Paper} sx={{ borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)', overflowX: 'auto' }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ backgroundColor: '#063F53' }}>
              <TableRow>
                <TableCell sx={{ color: '#ffffff', fontWeight: 700, fontSize: '1rem', py: 2 }}>Funcionalidad / Característica</TableCell>
                <TableCell align="center" sx={{ color: '#10968A', backgroundColor: '#e6fffa', fontWeight: 800, fontSize: '1.05rem', py: 2 }}>
                  Wise Facturación ⭐
                </TableCell>
                <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', py: 2 }}>Facturador SAT</TableCell>
                <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, fontSize: '0.95rem', py: 2 }}>Otros Proveedores</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comparisonData.map((row, index) => (
                <TableRow
                  key={index}
                  sx={{
                    '&:nth-of-type(odd)': { backgroundColor: '#f8fafc' },
                    '&:hover': { backgroundColor: '#f1f5f9' },
                  }}
                >
                  <TableCell component="th" scope="row" sx={{ fontWeight: 600, color: '#1e293b' }}>
                    {row.feature}
                  </TableCell>
                  <TableCell align="center" sx={{ backgroundColor: 'rgba(16, 150, 138, 0.05)', borderLeft: '1px solid #ccfbf1', borderRight: '1px solid #ccfbf1' }}>
                    {renderStatus(row.wise, true)}
                  </TableCell>
                  <TableCell align="center">{renderStatus(row.sat)}</TableCell>
                  <TableCell align="center">{renderStatus(row.otros)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Container>
    </Box>
  );
}
