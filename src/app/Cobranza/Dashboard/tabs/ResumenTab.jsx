'use client';
import { useState, useEffect } from 'react';
import { Box, Card, CardContent, Typography, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, CircularProgress } from '@mui/material';
import { 
    Group as GroupIcon, 
    MonetizationOn as MoneyIcon, 
    Payment as PaymentIcon, 
    Assessment as AssessmentIcon 
} from '@mui/icons-material';

import { isAuthenticated } from "@/utils/authRedirect";

function parseMonto(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return isNaN(val) ? 0 : val;
    if (typeof val === 'string') {
        const num = parseFloat(val);
        return isNaN(num) ? 0 : num;
    }
    return 0;
}

export default function ResumenTab({ emisorSeleccionado }) {
    const [stats, setStats] = useState({
        totalCobrado: 0,
        totalPendiente: 0,
        totalAlumnos: 0,
        totalPagos: 0,
        ultimosPagos: [],
        ultimasPrefacturas: []
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        const fetchData = async () => {
            setLoading(true);
            try {
                let token = typeof window !== 'undefined' ? (localStorage.getItem('authToken') || sessionStorage.getItem('authToken') || '') : '';
                let grupoId = '';
                if (token) {
                    try {
                        const parsed = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
                        grupoId = parsed.grupo_id || parsed.grupoId || parsed.GrupoID || '';
                    } catch (e) { }
                }
                if (!grupoId && typeof window !== 'undefined') {
                    try {
                        const userStr = localStorage.getItem('usuario');
                        if (userStr) {
                            const parsed = JSON.parse(userStr);
                            grupoId = parsed.grupo_id || parsed.grupoId || '';
                        }
                    } catch (e) { }
                }
                if (!grupoId && typeof window !== 'undefined') grupoId = localStorage.getItem('grupo_id') || '';
                
                const isSuplantando = typeof window !== 'undefined' && Boolean(localStorage.getItem('usuarioSuplantado'));
                const isSuper = !isSuplantando && typeof window !== 'undefined' && (localStorage.getItem('superUser') === 'true' || localStorage.getItem('BOD') === 'true');

                const qGrupo = (grupoId && grupoId !== 'undefined' && grupoId !== 'null') ? `grupo_id=${grupoId}` : '';
                const qEmisor = emisorSeleccionado ? `emisor_id=${emisorSeleccionado}` : '';
                const qSuper = isSuper ? 'is_superadmin=true' : '';
                
                const qAlum = [qGrupo, qSuper].filter(Boolean).join('&');
                const qAlumStr = qAlum ? `?${qAlum}` : '';

                const qCargosArr = ['estatus=TODOS', qGrupo, qSuper].filter(Boolean);
                const qCargos = `?${qCargosArr.join('&')}`;

                const qFact = [qGrupo, qEmisor, qSuper].filter(Boolean).join('&');
                const qFactStr = qFact ? `?${qFact}` : '';

                const urlAlum = `/api/cobranza/alumnos${qAlumStr}`;
                const urlCargos = `/api/cobranza/cargos${qCargos}`;
                const urlFact = `/api/cobranza/facturacion${qFactStr}`;
                
                const reqHeaders = {
                    'Authorization': token ? `Bearer ${token}` : '',
                    'x-grupo-id': grupoId || ''
                };

                const [resAlum, resCargos, resFact] = await Promise.all([
                    fetch(urlAlum, { headers: reqHeaders }).then(r => r.json()).catch(() => []),
                    fetch(urlCargos, { headers: reqHeaders }).then(r => r.json()).catch(() => []),
                    fetch(urlFact, { headers: reqHeaders }).then(r => r.json()).catch(() => ({}))
                ]);

                const alumnosArr = Array.isArray(resAlum) ? resAlum : [];
                const cargosArr = Array.isArray(resCargos) ? resCargos : [];
                let prefacturasArr = [];
                if (resFact && Array.isArray(resFact.pre_facturas)) {
                    prefacturasArr = resFact.pre_facturas;
                } else if (resFact && Array.isArray(resFact.pendientes_rfc)) {
                    prefacturasArr = [...resFact.pendientes_rfc, ...(resFact.pendientes_global || [])];
                }

                let cobrado = 0;
                let pendiente = 0;
                cargosArr.forEach(c => {
                    cobrado += parseMonto(c.monto_pagado);
                    pendiente += parseMonto(c.monto_pendiente);
                });

                if (mounted) {
                    setStats({
                        totalCobrado: cobrado,
                        totalPendiente: pendiente,
                        totalAlumnos: alumnosArr.length,
                        totalPagos: cargosArr.filter(c => c.estatus === 'PAGADO').length,
                        ultimosPagos: cargosArr.slice(0, 5),
                        ultimasPrefacturas: prefacturasArr.slice(0, 5)
                    });
                }
            } catch (error) {
                console.error("Error loading ResumenTab data:", error);
            } finally {
                if (mounted) setLoading(false);
            }
        };

        fetchData();
        return () => { mounted = false; };
    }, [emisorSeleccionado]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" p={5}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box>
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3} sx={{ backgroundColor: '#e8f5e9', borderLeft: '5px solid #2e7d32' }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="overline" fontWeight="bold">Total Cobrado</Typography>
                            <Typography variant="h4" fontWeight="bold" color="success.dark">
                                ${stats.totalCobrado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3} sx={{ backgroundColor: '#fff3e0', borderLeft: '5px solid #ed6c02' }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="overline" fontWeight="bold">Cartera Pendiente</Typography>
                            <Typography variant="h4" fontWeight="bold" color="warning.dark">
                                ${stats.totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3} sx={{ backgroundColor: '#e3f2fd', borderLeft: '5px solid #0288d1' }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="overline" fontWeight="bold">Total Alumnos</Typography>
                            <Typography variant="h4" fontWeight="bold" color="primary.dark">{stats.totalAlumnos}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card elevation={3} sx={{ backgroundColor: '#f3e5f5', borderLeft: '5px solid #9c27b0' }}>
                        <CardContent>
                            <Typography color="textSecondary" variant="overline" fontWeight="bold">Pagos Liquidados</Typography>
                            <Typography variant="h4" fontWeight="bold" color="secondary.main">{stats.totalPagos}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Card elevation={3}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Últimas Fichas Emitidas</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
                                <TableRow>
                                    <TableCell>Código de Ficha</TableCell>
                                    <TableCell>Referencia Múlt. 10</TableCell>
                                    <TableCell>Alumno / Matrícula</TableCell>
                                    <TableCell>Concepto</TableCell>
                                    <TableCell>Monto Total</TableCell>
                                    <TableCell>Prefactura Relacionada</TableCell>
                                    <TableCell>Estatus</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.ultimosPagos.map((cargo) => (
                                    <TableRow key={cargo.id} hover>
                                        <TableCell>
                                            <Chip label={cargo.codigo_ficha || `F-${cargo.id}`} color="secondary" size="small" sx={{ fontWeight: 'bold', fontFamily: 'monospace' }} />
                                        </TableCell>
                                        <TableCell sx={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{cargo.alumno?.clabe_interbancaria || cargo.referencia_bancaria}</TableCell>
                                        <TableCell>{cargo.alumno ? `${cargo.alumno.nombre} ${cargo.alumno.apellido_paterno} ${cargo.alumno.apellido_materno || ''}`.trim() + ` (${cargo.alumno.matricula})` : 'N/A'}</TableCell>
                                        <TableCell>{cargo.concepto?.nombre || 'Colegiatura'}</TableCell>
                                        <TableCell>${parseMonto(cargo.monto_total).toFixed(2)}</TableCell>
                                        <TableCell>
                                            {(() => {
                                                const comprobantes = cargo.PagoAlumno?.map(p => p.comprobante).filter(c => c) || [];
                                                const uniqueComprobantes = Array.from(new Set(comprobantes.map(c => `${c.serie || 'F'}-${c.folio}`)));
                                                return uniqueComprobantes.length > 0 ? (
                                                    uniqueComprobantes.map(comp => <Chip key={comp} label={comp} size="small" color="primary" sx={{ mr: 0.5, mb: 0.5 }} />)
                                                ) : <Typography variant="body2" color="textSecondary">Ninguna</Typography>;
                                            })()}
                                        </TableCell>
                                        <TableCell>
                                            <Chip label={cargo.estatus} color={cargo.estatus === 'PAGADO' ? 'success' : 'error'} size="small" />
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>

            <Card elevation={3} sx={{ mt: 3 }}>
                <CardContent>
                    <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Últimas Pre-facturas Listas para Timbrar</Typography>
                    <TableContainer component={Paper} variant="outlined">
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#1b384a' }}>
                                <TableRow>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Folio</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Receptor</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Total</TableCell>
                                    <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Estatus</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {stats.ultimasPrefacturas.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} align="center" sx={{ py: 3, color: '#888' }}>
                                            No hay pre-facturas recientes
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats.ultimasPrefacturas.map((fac) => (
                                        <TableRow key={fac.id} hover>
                                            <TableCell sx={{ fontWeight: 'bold' }}>{fac.serie || 'F'}-{fac.folio}</TableCell>
                                            <TableCell>{fac.receptor_nombre || fac.receptor_rfc}</TableCell>
                                            <TableCell>${parseMonto(fac.total).toFixed(2)}</TableCell>
                                            <TableCell>
                                                <Chip label="PRE-FACTURA" color="warning" size="small" />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </CardContent>
            </Card>
        </Box>
    );
}
