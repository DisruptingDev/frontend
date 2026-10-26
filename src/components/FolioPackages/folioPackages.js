'use client';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import StarRoundedIcon from '@mui/icons-material/StarRounded';
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded';
import ShoppingCartRoundedIcon from '@mui/icons-material/ShoppingCartRounded';
import { useRouter } from 'next/navigation';

// Paquetes PyME de compra única (sin caducidad)
const pymePackages = [
  { nombre: 'Paquete 25', folios: 25, precio: 290.00 },
  { nombre: 'Paquete 50', folios: 50, precio: 406.00 },
  { nombre: 'Paquete 100', folios: 100, precio: 570.00 },
  { nombre: 'Paquete 500', folios: 500, precio: 1990.00 },
  { nombre: 'Paquete 1,000', folios: 1000, precio: 2784.00, popular: true },
  { nombre: 'Paquete 2,000', folios: 2000, precio: 4372.00 },
];

// Paquetes de Alto Volumen
const highVolumePackages = [
  { nombre: 'Paquete 5,000', folios: 5000, precio: 5800.00 },
  { nombre: 'Paquete 25,000', folios: 25000, precio: 27550.00 },
  { nombre: 'Paquete 50,000', folios: 50000, precio: 49300.00 },
  { nombre: 'Paquete 100,000', folios: 100000, precio: 87000.00 },
  { nombre: 'Paquete 200,000', folios: 200000, precio: 162400.00 },
  { nombre: 'Paquete 500,000', folios: 500000, precio: 382800.00 },
];

// Propuesta de planes mensuales para facturación y servicios continuos
const monthlyPlans = [
  {
    nombre: 'Emprendedor',
    precio: 199.00,
    folios: '30 folios / mes',
    rfc: '1 RFC',
    caracteristicas: [
      'Emisión CFDI 4.0 ilimitada en el mes',
      'Descarga masiva del SAT básica',
      'Envío por correo de XML y PDF',
      'Soporte por WhatsApp y correo',
    ],
  },
  {
    nombre: 'PyME',
    precio: 499.00,
    folios: '150 folios / mes',
    rfc: 'Hasta 3 RFCs',
    popular: true,
    caracteristicas: [
      'Multi RFC (hasta 3 empresas)',
      'Timbrado de nómina masiva',
      'Descarga masiva de XML y PDF del SAT',
      'Módulo de cobranza y complementos de pago',
      'Soporte prioritario',
    ],
  },
  {
    nombre: 'Despacho / Contador',
    precio: 1190.00,
    folios: '600 folios / mes',
    rfc: 'RFCs Ilimitados',
    caracteristicas: [
      'Multi RFC sin límite de empresas',
      'Módulo de contabilidad y pólizas',
      'Nómina masiva con complemento 1.2',
      'Descarga masiva ilimitada del SAT',
      'Multiusuarios con roles y permisos',
    ],
  },
  {
    nombre: 'Empresarial / Alto Volumen',
    precio: null,
    folios: 'A la medida',
    rfc: 'Ilimitados + API',
    caracteristicas: [
      'Integración vía API REST',
      'Timbrados de alto volumen dedicados',
      'Soporte técnico y asesor dedicado',
      'Personalización de plantillas PDF',
    ],
  },
];

const formatCurrency = (val) => {
  return val.toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function FolioPackages() {
  const router = useRouter();
  const [tabIndex, setTabIndex] = useState(0);

  const handleBuy = () => {
    router.push('/AltaUsuarios');
  };

  const renderMobileCards = (packages) => (
    <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', gap: 2, width: '100%', px: 1 }}>
      {packages.map((pkg) => {
        const unitCost = (pkg.precio / pkg.folios).toFixed(2);
        return (
          <Card
            key={pkg.nombre}
            sx={{
              borderRadius: '16px',
              border: pkg.popular ? '2px solid #10968A' : '1px solid #e2e8f0',
              boxShadow: pkg.popular ? '0 8px 16px rgba(16, 150, 138, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
              backgroundColor: '#ffffff',
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#063F53' }}>
                  {pkg.nombre}
                </Typography>
                {pkg.popular && (
                  <Chip
                    icon={<StarRoundedIcon sx={{ fontSize: 16, color: '#10968A !important' }} />}
                    label="Más popular"
                    size="small"
                    sx={{ backgroundColor: '#e6fffa', color: '#10968A', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', my: 1.5 }}>
                <div>
                  <Typography variant="caption" sx={{ color: '#64748b', display: 'block' }}>
                    Folios incluidos:
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: '#1e293b' }}>
                    {pkg.folios.toLocaleString('es-MX')} folios
                  </Typography>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <Typography variant="caption" sx={{ color: '#10968A', fontWeight: 600, display: 'block' }}>
                    ${unitCost} / folio
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#063F53' }}>
                    {formatCurrency(pkg.precio)}
                  </Typography>
                </div>
              </Box>

              <Button
                variant={pkg.popular ? 'contained' : 'outlined'}
                fullWidth
                onClick={handleBuy}
                startIcon={<ShoppingCartRoundedIcon />}
                sx={{
                  minHeight: '44px',
                  fontWeight: 700,
                  borderRadius: '10px',
                  mt: 1,
                  backgroundColor: pkg.popular ? '#10968A' : 'transparent',
                  borderColor: '#10968A',
                  color: pkg.popular ? '#ffffff' : '#10968A',
                  '&:hover': {
                    backgroundColor: pkg.popular ? '#0d8076' : 'rgba(16, 150, 138, 0.08)',
                    borderColor: '#10968A',
                  },
                }}
              >
                Comprar Paquete
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );

  const renderTable = (packages) => (
    <TableContainer
      component={Paper}
      sx={{
        display: { xs: 'none', md: 'block' },
        borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
        overflowX: 'auto',
        maxWidth: 900,
        mx: 'auto',
      }}
    >
      <Table sx={{ minWidth: 650 }}>
        <TableHead sx={{ backgroundColor: '#063F53' }}>
          <TableRow>
            <TableCell sx={{ color: '#ffffff', fontWeight: 700, py: 2, whiteSpace: 'nowrap' }}>Paquete</TableCell>
            <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, py: 2 }}>Folios</TableCell>
            <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, py: 2 }}>Costo por Folio</TableCell>
            <TableCell align="right" sx={{ color: '#ffffff', fontWeight: 700, py: 2 }}>Precio Total (MXN)</TableCell>
            <TableCell align="center" sx={{ color: '#ffffff', fontWeight: 700, py: 2 }}></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {packages.map((pkg) => {
            const unitCost = (pkg.precio / pkg.folios).toFixed(2);
            return (
              <TableRow
                key={pkg.nombre}
                sx={{
                  backgroundColor: pkg.popular ? 'rgba(16, 150, 138, 0.04)' : '#ffffff',
                  '&:hover': { backgroundColor: '#f8fafc' },
                }}
              >
                <TableCell sx={{ fontWeight: 700, color: '#063F53', whiteSpace: 'nowrap', py: 2 }}>
                  <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                    <span>{pkg.nombre}</span>
                    {pkg.popular && (
                      <Chip
                        icon={<StarRoundedIcon sx={{ fontSize: 14, color: '#10968A !important' }} />}
                        label="Más popular"
                        size="small"
                        sx={{ backgroundColor: '#e6fffa', color: '#10968A', fontWeight: 700, fontSize: '0.7rem' }}
                      />
                    )}
                  </Box>
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 600, color: '#334155' }}>
                  {pkg.folios.toLocaleString('es-MX')}
                </TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: '#10968A' }}>
                  ${unitCost} / folio
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: '#063F53', fontSize: '1.05rem' }}>
                  {formatCurrency(pkg.precio)}
                </TableCell>
                <TableCell align="center" sx={{ py: 1.5 }}>
                  <Button
                    variant="contained"
                    size="small"
                    onClick={handleBuy}
                    sx={{
                      minHeight: '44px',
                      px: 2.5,
                      fontWeight: 700,
                      borderRadius: '8px',
                      backgroundColor: pkg.popular ? '#10968A' : '#063F53',
                      '&:hover': {
                        backgroundColor: pkg.popular ? '#0d8076' : '#042834',
                      },
                    }}
                  >
                    Comprar
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box id="paquetes" sx={{ py: { xs: 8, sm: 12 }, backgroundColor: '#f1f5f9', scrollMarginTop: '90px' }}>
      <Container maxWidth="lg">
        {/* Encabezado */}
        <Box sx={{ textAlign: 'center', mb: 5 }}>
          <Typography
            component="h2"
            variant="h4"
            sx={{ fontWeight: 800, color: '#063F53', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.5rem' } }}
          >
            Precios transparentes y sin sorpresas
          </Typography>
          <Typography variant="body1" sx={{ color: '#64748b', maxWidth: 650, mx: 'auto', mb: 3 }}>
            Elige entre <strong>paquetes de folios sin caducidad</strong> (pago único) o <strong>planes mensuales</strong> para mayor volumen de timbrado y servicios continuos.
          </Typography>

          {/* Selector de Pestañas con Pestaña Planes Mensuales incluida */}
          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Tabs
              value={tabIndex}
              onChange={(e, val) => setTabIndex(val)}
              variant="scrollable"
              scrollButtons="auto"
              sx={{
                backgroundColor: '#ffffff',
                borderRadius: '14px',
                p: 0.5,
                boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                '& .MuiTabs-indicator': { backgroundColor: '#10968A', height: 3, borderRadius: 2 },
                '& .MuiTab-root': {
                  textTransform: 'none',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  minHeight: '44px',
                  color: '#64748b',
                  '&.Mui-selected': { color: '#10968A' },
                },
              }}
            >
              <Tab label="Paquetes PyMEs (Sin caducidad)" />
              <Tab label="Paquetes de Alto Volumen" />
              <Tab label="Planes Mensuales" />
            </Tabs>
          </Box>
        </Box>

        {/* Tab 0: Paquetes PyME */}
        {tabIndex === 0 && (
          <Box>
            <Typography variant="body2" sx={{ textAlign: 'center', color: '#475569', mb: 3, fontWeight: 500 }}>
              💡 Compra única: los timbres nunca caducan y puedes usarlos en cualquiera de tus RFCs.
            </Typography>
            {renderMobileCards(pymePackages)}
            {renderTable(pymePackages)}
          </Box>
        )}

        {/* Tab 1: Alto Volumen */}
        {tabIndex === 1 && (
          <Box>
            <Typography variant="body2" sx={{ textAlign: 'center', color: '#475569', mb: 3, fontWeight: 500 }}>
              💡 El menor costo por folio en México: desde $0.77 MXN por comprobante fiscal.
            </Typography>
            {renderMobileCards(highVolumePackages)}
            {renderTable(highVolumePackages)}
          </Box>
        )}

        {/* Tab 2: Planes Mensuales */}
        {tabIndex === 2 && (
          <Box>
            <Typography variant="body2" sx={{ textAlign: 'center', color: '#475569', mb: 3, fontWeight: 500 }}>
              💡 Suscripción mensual con renovación automática, timbres mensuales y soporte prioritario.
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {monthlyPlans.map((plan) => (
                <Grid item xs={12} sm={6} md={3} key={plan.nombre}>
                  <Card
                    sx={{
                      height: '100%',
                      borderRadius: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      border: plan.popular ? '2px solid #10968A' : '1px solid #e2e8f0',
                      boxShadow: plan.popular ? '0 10px 24px rgba(16, 150, 138, 0.15)' : '0 2px 6px rgba(0,0,0,0.04)',
                      backgroundColor: '#ffffff',
                    }}
                  >
                    <CardContent sx={{ p: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 800, color: '#063F53' }}>
                          {plan.nombre}
                        </Typography>
                        {plan.popular && (
                          <Chip
                            icon={<StarRoundedIcon sx={{ fontSize: 14, color: '#10968A !important' }} />}
                            label="Recomendado"
                            size="small"
                            sx={{ backgroundColor: '#e6fffa', color: '#10968A', fontWeight: 700, fontSize: '0.7rem' }}
                          />
                        )}
                      </Box>

                      <Box sx={{ my: 2 }}>
                        {plan.precio !== null ? (
                          <Box sx={{ display: 'flex', alignItems: 'baseline' }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#063F53' }}>
                              {formatCurrency(plan.precio)}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b', ml: 0.5, fontWeight: 600 }}>
                              / mes
                            </Typography>
                          </Box>
                        ) : (
                          <Typography variant="h5" sx={{ fontWeight: 800, color: '#10968A', my: 0.5 }}>
                            Cotización personalizada
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#10968A', mt: 0.5 }}>
                          {plan.folios} · {plan.rfc}
                        </Typography>
                      </Box>

                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3, flexGrow: 1 }}>
                        {plan.caracteristicas.map((c, cIdx) => (
                          <Box key={cIdx} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <CheckCircleRoundedIcon sx={{ fontSize: 16, color: '#10968A', mt: 0.3, flexShrink: 0 }} />
                            <Typography variant="body2" sx={{ color: '#475569', fontSize: '0.85rem' }}>
                              {c}
                            </Typography>
                          </Box>
                        ))}
                      </Box>

                      <Button
                        variant={plan.popular ? 'contained' : 'outlined'}
                        fullWidth
                        onClick={handleBuy}
                        sx={{
                          minHeight: '44px',
                          fontWeight: 700,
                          borderRadius: '10px',
                          backgroundColor: plan.popular ? '#10968A' : 'transparent',
                          borderColor: '#10968A',
                          color: plan.popular ? '#ffffff' : '#10968A',
                          '&:hover': {
                            backgroundColor: plan.popular ? '#0d8076' : 'rgba(16, 150, 138, 0.08)',
                            borderColor: '#10968A',
                          },
                        }}
                      >
                        {plan.precio ? 'Contratar Plan' : 'Cotizar con Asesor'}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Container>
    </Box>
  );
}
