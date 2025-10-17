"use client";
import React, { useState, useEffect } from "react";
import {
    Box,
    Card,
    CardContent,
    Typography,
    Grid,
    Chip,
    Divider,
    Alert,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa";
import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD";
import AltaCliente from "@/components/AltaCliente/AltaCliente";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaXMLImportado = ({
    facturaXML,
    token,
    actualizarFacturas,
}) => {
    const [validaciones, setValidaciones] = useState({
        emisor: { valido: false, cargando: false, datos: null },
        receptor: { valido: false, cargando: false, datos: null },
        serie: { valido: false, cargando: false, datos: null }
    });
    const [openDialog, setOpenDialog] = useState({
        emisor: false,
        receptor: false,
        serie: false
    });

    // Estados para el modal de AltaEmpresa
    const [empresa, setEmpresa] = useState('');
    const [empresaIdEditar, setEmpresaIdEditar] = useState('');
    const [editar, setEditar] = useState(false);

    // Estados para el modal de AltaCliente
    const [cliente, setCliente] = useState([]);
    const [clienteIdEditar, setClienteIdEditar] = useState('');
    const [actualizar, setActualizar] = useState(false);

    // Efecto para realizar validaciones cuando llega una nueva factura
    useEffect(() => {
        if (facturaXML && facturaXML.EmisorID) {
            validarEmisor();
            validarReceptor();
            if (facturaXML.EmisorID && facturaXML.Serie) {
                validarSerie();
            }
        }
    }, [facturaXML]);

    const validarEmisor = async () => {
        if (!facturaXML?.EmisorID) return;

        setValidaciones(prev => ({ ...prev, emisor: { ...prev.emisor, cargando: true } }));

        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor/${facturaXML.EmisorID}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const emisorData = await response.json();
                setValidaciones(prev => ({
                    ...prev,
                    emisor: {
                        valido: true,
                        cargando: false,
                        datos: emisorData
                    }
                }));
            } else {
                setValidaciones(prev => ({
                    ...prev,
                    emisor: {
                        valido: false,
                        cargando: false,
                        datos: null
                    }
                }));
            }
        } catch (error) {
            console.error("Error validando emisor:", error);
            setValidaciones(prev => ({
                ...prev,
                emisor: {
                    valido: false,
                    cargando: false,
                    datos: null
                }
            }));
        }
    };

    const validarReceptor = async () => {
        if (!facturaXML?.ReceptorID) return;

        setValidaciones(prev => ({ ...prev, receptor: { ...prev.receptor, cargando: true } }));

        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor/${facturaXML.ReceptorID}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const receptorData = await response.json();
                setValidaciones(prev => ({
                    ...prev,
                    receptor: {
                        valido: true,
                        cargando: false,
                        datos: receptorData
                    }
                }));
            } else {
                setValidaciones(prev => ({
                    ...prev,
                    receptor: {
                        valido: false,
                        cargando: false,
                        datos: null
                    }
                }));
            }
        } catch (error) {
            console.error("Error validando receptor:", error);
            setValidaciones(prev => ({
                ...prev,
                receptor: {
                    valido: false,
                    cargando: false,
                    datos: null
                }
            }));
        }
    };

    const validarSerie = async () => {
        if (!facturaXML?.EmisorID || !facturaXML?.Serie) return;

        setValidaciones(prev => ({ ...prev, serie: { ...prev.serie, cargando: true } }));

        try {
            const response = await fetch(
                `${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${facturaXML.EmisorID}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (response.ok) {
                const series = await response.json();
                // Buscar la serie por el campo "Clave" en lugar de "Serie"
                const serieEncontrada = series.find(serie => serie.Clave === facturaXML.Serie);
                setValidaciones(prev => ({
                    ...prev,
                    serie: {
                        valido: !!serieEncontrada,
                        cargando: false,
                        datos: serieEncontrada
                    }
                }));
            } else {
                setValidaciones(prev => ({
                    ...prev,
                    serie: {
                        valido: false,
                        cargando: false,
                        datos: null
                    }
                }));
            }
        } catch (error) {
            console.error("Error validando serie:", error);
            setValidaciones(prev => ({
                ...prev,
                serie: {
                    valido: false,
                    cargando: false,
                    datos: null
                }
            }));
        }
    };

    const handleEliminar = () => {
        if (actualizarFacturas) {
            actualizarFacturas([]);
        }
    };

    const handleOpenDialog = (tipo) => {
        setOpenDialog(prev => ({ ...prev, [tipo]: true }));
    };

    const handleCloseDialog = (tipo) => {
        setOpenDialog(prev => ({ ...prev, [tipo]: false }));
    };

    // Función para manejar el cierre del modal de AltaEmpresa
    const handleCloseModalEmpresa = () => {
        setEmpresa('');
        setEmpresaIdEditar('');
        setEditar(false);
        handleCloseDialog('emisor');
    };

    // Función para manejar el cierre del modal de AltaCliente
    const handleCloseModalCliente = () => {
        setCliente('');
        setClienteIdEditar('');
        handleCloseDialog('receptor');
    };

    // Función para manejar la actualización después de crear/editar empresa
    const handleUpdateEmpresa = (empresaCreada) => {
        if (empresaCreada && empresaCreada.ID) {
            // Actualizar la factura con el nuevo ID del emisor
            const facturaActualizada = {
                ...facturaXML,
                EmisorID: empresaCreada.ID
            };
            actualizarFacturas([facturaActualizada]);

            // Recargar validación del emisor
            setTimeout(() => {
                validarEmisor();
            }, 500);

            // Cerrar el modal
            handleCloseModalEmpresa();
        }
    };

    // Función para manejar la actualización después de crear/editar cliente
    const handleUpdateCliente = (clienteCreado) => {
        if (clienteCreado && clienteCreado.ID) {
            // Actualizar la factura con el nuevo ID del receptor
            const facturaActualizada = {
                ...facturaXML,
                ReceptorID: clienteCreado.ID
            };
            actualizarFacturas([facturaActualizada]);

            // Recargar validación del receptor
            setTimeout(() => {
                validarReceptor();
            }, 500);

            // Cerrar el modal
            handleCloseModalCliente();
        }
    };

    const handleCrearSerie = async () => {
        if (!facturaXML.EmisorID) {
            alert('Primero debe crear el emisor');
            return;
        }

        try {
            // Determinar el tipo de comprobante basado en el XML
            const tipoComprobanteMap = {
                'I': 'I', // Ingreso
                'E': 'E', // Egreso
                'T': 'T', // Traslado
                'P': 'P', // Pago
                'N': 'N'  // Nómina
            };

            const tipoComprobanteClave = tipoComprobanteMap[facturaXML.TipoDeComprobante?.charAt(0)] || 'I';

            const nuevaSerie = {
                Clave: facturaXML.Serie,
                Descripcion: `Serie ${facturaXML.Serie}`,
                UltimoFolio: 0, // Se inicia en 0, el primer folio será 1
                TipoComprobante: tipoComprobanteClave,
                TimbresDisponibles: 0,
                EmisorID: facturaXML.EmisorID
            };

            console.log('Datos de serie a enviar:', nuevaSerie);

            const response = await fetch(`${apiUrl}/api/series/CrearSerie`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(nuevaSerie),
            });

            if (!response.ok) {
                if (response.status === 401) {
                    const errorData = await response.json();
                    console.error('Error de autenticación:', errorData);
                    alert('El Rol actual no cuenta con los permisos necesarios para crear series.');
                } else {
                    const errorData = await response.json();
                    console.error('Error al crear serie:', errorData);
                    alert(errorData.error || 'Error al crear la serie');
                }
                return;
            }

            const result = await response.json();
            console.log('Serie creada exitosamente:', result);

            // Recargar validación de serie
            await validarSerie();
            handleCloseDialog('serie');

            // Mostrar mensaje de éxito
            alert('Serie creada exitosamente');

        } catch (error) {
            console.error('Error creando serie:', error);
            alert('Ocurrió un error al crear la serie');
        }
    };

    const EstadoChip = ({ valido, cargando, texto, onCrear }) => {
        if (cargando) {
            return <Chip icon={<CircularProgress size={16} />} label={texto} color="default" size="small" />;
        }

        if (!valido) {
            return (
                <Box display="flex" alignItems="center" gap={1}>
                    <Chip
                        icon={<ErrorIcon />}
                        label={texto}
                        color="error"
                        size="small"
                    />
                    <Button
                        startIcon={<AddIcon />}
                        size="small"
                        variant="outlined"
                        onClick={onCrear}
                    >
                        Crear
                    </Button>
                </Box>
            );
        }

        return (
            <Chip
                icon={<CheckCircleIcon />}
                label={texto}
                color="success"
                size="small"
            />
        );
    };

    if (!facturaXML) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                <Typography variant="h6" color="textSecondary">
                    No hay factura XML cargada
                </Typography>
            </Box>
        );
    }

    return (
        <Box>
            {/* Encabezado de la factura */}
            <Card sx={{ mb: 3, border: facturaXML.estaTimbrado ? '2px solid #4caf50' : '2px solid #f44336' }}>
                <CardContent>
                    <Grid container spacing={2} alignItems="center">
                        <Grid item xs={10}>
                            <Typography variant="h5" gutterBottom>
                                Factura {facturaXML.estaTimbrado ? "Timbrada" : "No Timbrada"}
                            </Typography>
                            <Typography variant="body1" color="textSecondary">
                                UUID: {facturaXML.infoTimbrado?.UUID || "No disponible"}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Tipo: {facturaXML.TipoDeComprobante || "N/A"}
                            </Typography>
                        </Grid>
                        <Grid item xs={2} container justifyContent="flex-end">
                            <Box textAlign="right">
                                <Button
                                    variant="outlined"
                                    color="error"
                                    startIcon={<DeleteIcon />}
                                    onClick={handleEliminar}
                                    size="small"
                                >
                                    Eliminar
                                </Button>
                                <Typography variant="h6" sx={{ mt: 1 }}>
                                    {facturaXML.Serie}-{facturaXML.Folio}
                                </Typography>
                                <Typography variant="body2" color="textSecondary">
                                    {new Date(facturaXML.Fecha).toLocaleDateString()}
                                </Typography>
                                <Chip
                                    label={facturaXML.estaTimbrado ? "TIMBRADO" : "NO TIMBRADO"}
                                    color={facturaXML.estaTimbrado ? "success" : "error"}
                                    sx={{ mt: 1 }}
                                />
                            </Box>
                        </Grid>
                    </Grid>
                </CardContent>
            </Card>

            {/* Estado de validaciones */}
            <Alert
                severity={
                    validaciones.emisor.valido && validaciones.receptor.valido && validaciones.serie.valido
                        ? "success"
                        : "warning"
                }
                sx={{ mb: 3 }}
            >
                <Typography variant="subtitle1" gutterBottom>
                    Estado de Validaciones:
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
                    <EstadoChip
                        valido={validaciones.emisor.valido}
                        cargando={validaciones.emisor.cargando}
                        texto="Emisor"
                        onCrear={() => handleOpenDialog('emisor')}
                    />
                    <EstadoChip
                        valido={validaciones.receptor.valido}
                        cargando={validaciones.receptor.cargando}
                        texto="Receptor"
                        onCrear={() => handleOpenDialog('receptor')}
                    />
                    <EstadoChip
                        valido={validaciones.serie.valido}
                        cargando={validaciones.serie.cargando}
                        texto="Serie"
                        onCrear={() => handleOpenDialog('serie')}
                    />
                </Box>
            </Alert>

            <Grid container spacing={3}>
                {/* Columna izquierda - Información general */}
                <Grid item xs={12} md={6}>
                    {/* Sección Emisor */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" color="primary">
                                    Emisor
                                </Typography>
                                {!validaciones.emisor.valido && !validaciones.emisor.cargando && (
                                    <Button
                                        startIcon={<AddIcon />}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleOpenDialog('emisor')}
                                    >
                                        Crear Emisor
                                    </Button>
                                )}
                            </Box>
                            <Grid container spacing={1}>
                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">ID:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.EmisorID || "No asignado"}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">RFC:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.EmisorRFC}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Nombre:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.emisor.datos?.Nombre || facturaXML.Emisor?.Nombre || "N/A"}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Regimen:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.emisor.datos?.RegimenFiscal || facturaXML.Emisor?.RegimenFiscal || "N/A"}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Lugar Expedición:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.emisor.datos?.LugarExpedicion || facturaXML.LugarExpedicion || "N/A"}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Sección Receptor */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" color="primary">
                                    Receptor
                                </Typography>
                                {!validaciones.receptor.valido && !validaciones.receptor.cargando && (
                                    <Button
                                        startIcon={<AddIcon />}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleOpenDialog('receptor')}
                                    >
                                        Crear Receptor
                                    </Button>
                                )}
                            </Box>
                            <Grid container spacing={1}>
                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">ID:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.ReceptorID || "No asignado"}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">RFC:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.ReceptorRFC}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Nombre:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.receptor.datos?.Nombre || facturaXML.Receptor?.Nombre || "N/A"}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Uso CFDI:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.receptor.datos?.UsoCFDI || facturaXML.UsoCFDI || "N/A"}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Forma Pago:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.receptor.datos?.FormaPago || facturaXML.FormaPago || "N/A"}
                                    </Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Método Pago:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">
                                        {validaciones.receptor.datos?.MetodoPago || facturaXML.MetodoPago || "N/A"}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Sección Información General */}
                    <Card>
                        <CardContent>
                            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                                <Typography variant="h6" color="primary">
                                    Información General
                                </Typography>
                                {!validaciones.serie.valido && !validaciones.serie.cargando && facturaXML.EmisorID && (
                                    <Button
                                        startIcon={<AddIcon />}
                                        size="small"
                                        variant="outlined"
                                        onClick={() => handleOpenDialog('serie')}
                                    >
                                        Crear Serie
                                    </Button>
                                )}
                            </Box>
                            <Grid container spacing={1}>
                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Serie:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.Serie || "N/A"}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Moneda:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.Moneda || "N/A"}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Tipo Cambio:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.TipoCambio || "N/A"}</Typography>
                                </Grid>

                                <Grid item xs={4}>
                                    <Typography variant="body2" color="textSecondary">Lugar Expedición:</Typography>
                                </Grid>
                                <Grid item xs={8}>
                                    <Typography variant="body2">{facturaXML.LugarExpedicion || "N/A"}</Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>
                </Grid>

                {/* Columna derecha - Conceptos y Totales */}
                <Grid item xs={12} md={6}>
                    {/* Sección Conceptos */}
                    <Card sx={{ mb: 2 }}>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                                Conceptos
                            </Typography>
                            <TableContainer component={Paper} variant="outlined">
                                <Table size="small">
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Descripción</TableCell>
                                            <TableCell align="right">Cantidad</TableCell>
                                            <TableCell align="right">P. Unitario</TableCell>
                                            <TableCell align="right">Importe</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {facturaXML.Conceptos?.ListaConceptos?.map((concepto, index) => (
                                            <TableRow key={index}>
                                                <TableCell>
                                                    <Typography variant="body2">
                                                        {concepto.Descripcion}
                                                    </Typography>
                                                    <Typography variant="caption" color="textSecondary">
                                                        Clave: {concepto.ClaveProdServ}
                                                    </Typography>
                                                </TableCell>
                                                <TableCell align="right">{concepto.Cantidad}</TableCell>
                                                <TableCell align="right">${concepto.ValorUnitario?.toFixed(2)}</TableCell>
                                                <TableCell align="right">${concepto.Importe?.toFixed(2)}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </CardContent>
                    </Card>

                    {/* Sección Totales */}
                    <Card>
                        <CardContent>
                            <Typography variant="h6" gutterBottom color="primary">
                                Totales
                            </Typography>
                            <Grid container spacing={1}>
                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Subtotal:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" align="right">
                                        ${facturaXML.SubTotal?.toFixed(2)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Impuestos Trasladados:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" align="right">
                                        ${facturaXML.Conceptos?.TotalImpuestosTrasladados?.toFixed(2)}
                                    </Typography>
                                </Grid>

                                <Grid item xs={6}>
                                    <Typography variant="body2" color="textSecondary">Impuestos Retenidos:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="body2" align="right">
                                        ${facturaXML.Conceptos?.TotalImpuestosRetenidos?.toFixed(2)}
                                    </Typography>
                                </Grid>

                                <Divider sx={{ my: 1, width: '100%' }} />

                                <Grid item xs={6}>
                                    <Typography variant="subtitle1" fontWeight="bold">Total:</Typography>
                                </Grid>
                                <Grid item xs={6}>
                                    <Typography variant="subtitle1" fontWeight="bold" align="right">
                                        ${facturaXML.Total?.toFixed(2)}
                                    </Typography>
                                </Grid>
                            </Grid>
                        </CardContent>
                    </Card>

                    {/* Sección Timbre (si está timbrado) */}
                    {facturaXML.estaTimbrado && facturaXML.infoTimbrado && (
                        <Card sx={{ mt: 2, backgroundColor: '#f8f9fa' }}>
                            <CardContent>
                                <Typography variant="h6" gutterBottom color="primary">
                                    Información de Timbre
                                </Typography>
                                <Grid container spacing={1}>
                                    <Grid item xs={4}>
                                        <Typography variant="body2" color="textSecondary">UUID:</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2" sx={{ wordBreak: 'break-all' }}>
                                            {facturaXML.timbre.UUID}
                                        </Typography>
                                    </Grid>

                                    <Grid item xs={4}>
                                        <Typography variant="body2" color="textSecondary">Fecha Timbrado:</Typography>
                                    </Grid>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">
                                            {new Date(facturaXML.timbre.FechaTimbrado).toLocaleString()}
                                        </Typography>
                                    </Grid>
                                </Grid>
                            </CardContent>
                        </Card>
                    )}
                </Grid>
            </Grid>

            {/* Diálogos para crear elementos faltantes */}
            <Dialog
                open={openDialog.emisor}
                onClose={() => handleCloseDialog('emisor')}
                fullWidth
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: '80%',
                        margin: 'auto',
                    }
                }}
            >
                <DialogContent>
                    <CertificadoCSD
                        onUpdateEmpresa={handleUpdateEmpresa}
                        editar={editar}
                        empresaIdEditar={empresaIdEditar}
                        token={token}
                    />
                    <Divider sx={{ marginY: 2 }} />
                    <AltaEmpresa
                        editar={editar}
                        empresa={empresa}
                        onClose={handleCloseModalEmpresa}
                        issuerName={facturaXML.Emisor?.Nombre || facturaXML.EmisorRFC}
                        issuerRfc={facturaXML.EmisorRFC}
                        token={token}
                        setActualizar={() => { }} // Ajusta según necesites
                        btnCancelar={true}
                    />
                </DialogContent>
            </Dialog>

            <Dialog
                open={openDialog.receptor}
                onClose={() => handleCloseDialog('receptor')}
                fullWidth
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: '80%',
                        margin: 'auto',
                    }
                }}
            >
                <DialogTitle>Alta de Cliente</DialogTitle>
                <DialogContent>
                    <AltaCliente
                        cliente={cliente}
                        onClose={handleCloseModalCliente}
                        setActualizar={setActualizar}
                        token={token}
                        // Puedes pasar datos del XML como props iniciales si tu componente lo soporta
                        datosIniciales={{
                            RFC: facturaXML.ReceptorRFC,
                            Nombre: facturaXML.Receptor?.Nombre || facturaXML.ReceptorRFC,
                            UsoCFDI: facturaXML.UsoCFDI || "G03",
                            FormaPago: facturaXML.FormaPago || "99",
                            MetodoPago: facturaXML.MetodoPago || "PUE"
                        }}
                    />
                </DialogContent>
            </Dialog>

            <Dialog open={openDialog.serie} onClose={() => handleCloseDialog('serie')} maxWidth="sm" fullWidth>
                <DialogTitle>Crear Nueva Serie</DialogTitle>
                <DialogContent>
                    <Typography variant="body1" gutterBottom>
                        ¿Desea crear una nueva serie con los siguientes datos?
                    </Typography>
                    <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Grid container spacing={1}>
                            <Grid item xs={4}>
                                <Typography variant="body2" fontWeight="bold">Clave (Serie):</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">{facturaXML.Serie}</Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" fontWeight="bold">Descripción:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">Serie {facturaXML.Serie}</Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" fontWeight="bold">Tipo Comprobante:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">
                                    {facturaXML.TipoDeComprobante || 'Ingreso'}
                                    ({facturaXML.TipoDeComprobante?.charAt(0) || 'I'})
                                </Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" fontWeight="bold">Folio Inicial:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">1</Typography>
                            </Grid>

                            <Grid item xs={4}>
                                <Typography variant="body2" fontWeight="bold">Emisor ID:</Typography>
                            </Grid>
                            <Grid item xs={8}>
                                <Typography variant="body2">{facturaXML.EmisorID}</Typography>
                            </Grid>
                        </Grid>
                    </Box>

                    {/* Información adicional */}
                    <Alert severity="info" sx={{ mt: 2 }}>
                        <Typography variant="body2">
                            <strong>Nota:</strong> La serie se creará con folio inicial 1 y 0 timbres disponibles.
                            Puede ajustar estos valores posteriormente en el módulo de series.
                        </Typography>
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => handleCloseDialog('serie')}>Cancelar</Button>
                    <Button
                        onClick={handleCrearSerie}
                        variant="contained"
                        startIcon={<AddIcon />}
                    >
                        Crear Serie
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default VistaXMLImportado;