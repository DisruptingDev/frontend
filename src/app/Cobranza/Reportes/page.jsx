'use client';
import { useState, useEffect } from 'react';
import { WithPermission } from '@/components/WithPermission';

function AccesoDenegado() {
    return (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh" p={4}>
            <Paper elevation={4} sx={{ p: 5, textAlign: 'center', maxWidth: 500, borderRadius: 3 }}>
                <Typography variant="h1" color="error" sx={{ fontSize: '4rem', mb: 1 }}>
                    🚫
                </Typography>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 2, color: '#1b384a' }}>
                    Acceso Restringido
                </Typography>
                <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
                    No cuentas con los permisos necesarios (<strong>PAGOS_VER</strong> o <strong>REPORTES_EXPORTAR</strong>) para acceder a Reportes.
                </Typography>
                <Button variant="contained" color="primary" href="/Home">
                    Volver al Inicio
                </Button>
            </Paper>
        </Box>
    );
}
import Header from '@/components/Header/Header.jsx';
import SideBarMenu from '@/components/Dashborard/SideBarMenu';
import {
    Box,
    Button,
    Card,
    CardContent,
    Typography,
    Grid,
    TextField,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Chip,
    Alert,
    CircularProgress
} from '@mui/material';
import {
    Assessment as AssessmentIcon,
    Download as DownloadIcon,
    CalendarMonth as CalendarIcon,
    TrendingUp as TrendingIcon,
    Receipt as ReceiptIcon,
    Group as GroupIcon,
    CheckCircle as CheckIcon
} from '@mui/icons-material';
import * as XLSX from 'xlsx';

function parseMonto(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    }
    if (typeof val === 'object') {
        const str = String(val);
        const num = parseFloat(str);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

export default function ReporteMensualCobranzaPage() {
    const [mesPeriodo, setMesPeriodo] = useState(new Date().toISOString().slice(0, 7));
    const [loading, setLoading] = useState(true);
    const [reporte, setReporte] = useState({
        resumen_mensual: {
            monto_total_recaudado: 0,
            monto_pagos_rfc: 0,
            monto_pagos_publico_general: 0,
            total_transacciones: 0
        },
        pagos: []
    });

    const fetchReporte = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/cobranza/reportes?mes_periodo=${mesPeriodo}`);
            const data = await res.json();
            if (res.ok) {
                setReporte(data);
            }
        } catch (err) {
            console.error('Error al cargar reporte mensual:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReporte();
    }, [mesPeriodo]);

    // Exportar Reporte Mensual a Excel
    const handleExportarExcel = () => {
        if (!reporte.pagos || reporte.pagos.length === 0) return;

        const excelRows = reporte.pagos.map(p => ({
            'Fecha de Pago': new Date(p.fecha_pago).toLocaleDateString('es-MX'),
            'Matrícula': p.matricula,
            'Alumno / Pagador': p.alumno_nombre,
            'Programa / Carrera': p.carrera,
            'Concepto': p.concepto,
            'Referencia Bancaria Módulo 10': p.referencia_bancaria,
            'Monto Recaudado ($)': parseMonto(p.monto),
            'Perfil Fiscal': p.requiere_factura ? `RFC (${p.rfc_receptor})` : 'Público en General (XAXX010101000)',
            'Factura CFDI 4.0': p.serie_folio_factura,
            'Estado Conciliación': p.estado_conciliacion
        }));

        const ws = XLSX.utils.json_to_sheet(excelRows);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, `Cobranza_${mesPeriodo}`);
        XLSX.writeFile(wb, `Reporte_Cobranza_Mensual_${mesPeriodo}.xlsx`);
    };

    return (
        <WithPermission permission="PAGOS_VER" fallback={<AccesoDenegado />}>
            <div>
            <Header title="Reporte Mensual de Cobranza e Ingresos" />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item xs>
                    <Box
                        bgcolor="white"
                        ml={{ xs: 10, md: 10 }}
                        mr={2}
                        mt={2}
                        p={3}
                        boxShadow={3}
                        borderRadius={2}
                        width={{ xs: "80%", md: "93%" }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Box>
                                <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                    Reporte Ejecutivo de Cobranza Mensual
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    Filtra por mes el acumulado de ingresos conciliados, desglose por alumno y exporta el reporte oficial.
                                </Typography>
                            </Box>

                            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                                <TextField
                                    label="Seleccionar Mes / Periodo"
                                    type="month"
                                    size="small"
                                    value={mesPeriodo}
                                    onChange={(e) => setMesPeriodo(e.target.value)}
                                    InputLabelProps={{ shrink: true }}
                                />
                                <Button
                                    variant="contained"
                                    color="success"
                                    startIcon={<DownloadIcon />}
                                    onClick={handleExportarExcel}
                                    disabled={loading || !reporte.pagos || reporte.pagos.length === 0}
                                >
                                    Exportar a Excel (.xlsx)
                                </Button>
                            </Box>
                        </Box>

                        {/* Tarjetas Resumen Mensual */}
                        <Grid container spacing={3} sx={{ mb: 4 }}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={3} sx={{ backgroundColor: '#e8f5e9', borderLeft: '5px solid #2e7d32' }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography color="textSecondary" variant="overline" fontWeight="bold">
                                                    Total Recaudado en el Mes
                                                </Typography>
                                                <Typography variant="h4" fontWeight="bold" color="success.dark">
                                                    ${parseMonto(reporte.resumen_mensual?.monto_total_recaudado).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <TrendingIcon sx={{ fontSize: 40, color: '#2e7d32' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={3} sx={{ backgroundColor: '#e3f2fd', borderLeft: '5px solid #0288d1' }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography color="textSecondary" variant="overline" fontWeight="bold">
                                                    Ingresos con RFC Individual
                                                </Typography>
                                                <Typography variant="h4" fontWeight="bold" color="primary.dark">
                                                    ${parseMonto(reporte.resumen_mensual?.monto_pagos_rfc).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <ReceiptIcon sx={{ fontSize: 40, color: '#0288d1' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={3} sx={{ backgroundColor: '#fff3e0', borderLeft: '5px solid #ed6c02' }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography color="textSecondary" variant="overline" fontWeight="bold">
                                                    Ingresos Público en General
                                                </Typography>
                                                <Typography variant="h4" fontWeight="bold" color="warning.dark">
                                                    ${parseMonto(reporte.resumen_mensual?.monto_pagos_publico_general).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                </Typography>
                                            </Box>
                                            <GroupIcon sx={{ fontSize: 40, color: '#ed6c02' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>

                            <Grid item xs={12} sm={6} md={3}>
                                <Card elevation={3} sx={{ backgroundColor: '#f3e5f5', borderLeft: '5px solid #9c27b0' }}>
                                    <CardContent>
                                        <Box display="flex" justifyContent="space-between" alignItems="center">
                                            <Box>
                                                <Typography color="textSecondary" variant="overline" fontWeight="bold">
                                                    Total Transacciones Conciliadas
                                                </Typography>
                                                <Typography variant="h4" fontWeight="bold" color="secondary.main">
                                                    {reporte.resumen_mensual?.total_transacciones || 0}
                                                </Typography>
                                            </Box>
                                            <CheckIcon sx={{ fontSize: 40, color: '#9c27b0' }} />
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Tabla de Pagos por Mes */}
                        <Card elevation={3}>
                            <CardContent sx={{ p: 0 }}>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" p={5}>
                                        <CircularProgress />
                                    </Box>
                                ) : (
                                    <TableContainer component={Paper}>
                                        <Table size="small">
                                            <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                                <TableRow>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fecha Pago</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Alumno / Matrícula</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Programa / Carrera</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Referencia Módulo 10</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Monto</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Perfil Fiscal</TableCell>
                                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Factura CFDI 4.0</TableCell>
                                                </TableRow>
                                            </TableHead>
                                            <TableBody>
                                                {!reporte.pagos || reporte.pagos.length === 0 ? (
                                                    <TableRow>
                                                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: '#888' }}>
                                                            No hay pagos conciliados registrados para el periodo seleccionado ({mesPeriodo}).
                                                        </TableCell>
                                                    </TableRow>
                                                ) : (
                                                    reporte.pagos.map(pago => (
                                                        <TableRow key={pago.id} hover>
                                                            <TableCell>{new Date(pago.fecha_pago).toLocaleDateString('es-MX')}</TableCell>
                                                            <TableCell>
                                                                <strong>{pago.alumno_nombre}</strong> ({pago.matricula})
                                                            </TableCell>
                                                            <TableCell>{pago.carrera}</TableCell>
                                                            <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: '#1976d2' }}>
                                                                {pago.referencia_bancaria}
                                                            </TableCell>
                                                            <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>
                                                                ${parseMonto(pago.monto).toFixed(2)}
                                                            </TableCell>
                                                            <TableCell>
                                                                {pago.requiere_factura ? (
                                                                    <Chip label={`RFC: ${pago.rfc_receptor}`} color="primary" size="small" />
                                                                ) : (
                                                                    <Chip label="Público en General" color="default" size="small" />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Chip label={pago.serie_folio_factura} color={pago.serie_folio_factura !== 'PENDIENTE' ? 'success' : 'warning'} size="small" />
                                                            </TableCell>
                                                        </TableRow>
                                                    ))
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                )}
                            </CardContent>
                        </Card>
                    </Box>
                </Grid>
            </Grid>
        </div>
        </WithPermission>
    );
}
