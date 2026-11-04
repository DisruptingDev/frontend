"use client"
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert, Box, Button, Grid, CircularProgress, Typography } from '@mui/material';
import { isAuthenticated } from "@/utils/authRedirect";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import EditarPago from "@/components/FormFactura/Pagos/EditarPago.jsx";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

// Función para normalizar cualquier estructura devuelta por el servicio de Go o XML
function normalizarFacturaPago(data) {
    if (!data) return null;
    const f = data.factura || data.comprobante || data;
    if (!f || typeof f !== 'object') return null;

    // 1. Buscar Complemento en todas sus variantes
    let complemento = f.Complemento || f.complemento || 
                      (Array.isArray(f.Complementos) ? f.Complementos[0] : null) ||
                      (Array.isArray(f.complementos) ? f.complementos[0] : null) ||
                      {};

    // 2. Buscar Pagos en todas sus variantes
    let pagosNode = complemento?.Pagos || complemento?.pagos || f.Pagos || f.pagos;

    let listaPagos = [];
    let totales = complemento?.Pagos?.Totales || complemento?.pagos?.totales || complemento?.Totales || f.Totales || {};

    if (Array.isArray(pagosNode)) {
        listaPagos = pagosNode;
    } else if (pagosNode && typeof pagosNode === 'object') {
        const arr = pagosNode.Pagos || pagosNode.pagos || pagosNode.Pago || pagosNode.pago;
        if (Array.isArray(arr)) {
            listaPagos = arr;
        } else if (pagosNode.FechaPago || pagosNode.Monto || pagosNode.DoctoRelacionados) {
            // Es un solo pago como objeto
            listaPagos = [pagosNode];
        }
        if (pagosNode.Totales) totales = pagosNode.Totales;
        else if (pagosNode.totales) totales = pagosNode.totales;
    }

    // 3. Fallback: Parsear XML timbrado si la estructura JSON no trajo Pagos
    if ((!listaPagos || listaPagos.length === 0) && (f.xml_timbrado || f.xml || f.XML)) {
        const xml = f.xml_timbrado || f.xml || f.XML;
        try {
            const getAttr = (str, attr) => {
                const m = str.match(new RegExp(`${attr}=["']([^"']*)["']`, 'i'));
                return m ? m[1] : '';
            };

            const totalesMatch = xml.match(/<pago20:Totales\s+([^>]+)\/?>/i);
            if (totalesMatch) {
                const tAttrs = totalesMatch[1];
                totales = {
                    TotalTrasladosBaseIVA16: getAttr(tAttrs, 'TotalTrasladosBaseIVA16') || '0.00',
                    TotalTrasladosImpuestoIVA16: getAttr(tAttrs, 'TotalTrasladosImpuestoIVA16') || '0.00',
                    TotalRetencionesISR: getAttr(tAttrs, 'TotalRetencionesISR') || '0.00',
                    TotalRetencionesIVA: getAttr(tAttrs, 'TotalRetencionesIVA') || '0.00',
                    MontoTotalPagos: getAttr(tAttrs, 'MontoTotalPagos') || '0.00'
                };
            }

            const pagoMatches = xml.match(/<pago[12]0:Pago\b[\s\S]*?<\/pago[12]0:Pago>/gi) || 
                                xml.match(/<pago[12]0:Pago\b[^>]*\/>/gi) || [];

            for (const pMatch of pagoMatches) {
                const fechaPago = getAttr(pMatch, 'FechaPago');
                const formaPago = getAttr(pMatch, 'FormaDePagoP') || getAttr(pMatch, 'FormaPago') || '03';
                const monedaP = getAttr(pMatch, 'MonedaP') || 'MXN';
                const monto = parseFloat(getAttr(pMatch, 'Monto') || '0');

                const doctoMatches = pMatch.match(/<pago[12]0:DoctoRelacionado\b[^>]*\/?>/gi) || [];
                const doctosRel = doctoMatches.map(dStr => ({
                    IdDocumento: getAttr(dStr, 'IdDocumento'),
                    Serie: getAttr(dStr, 'Serie'),
                    Folio: getAttr(dStr, 'Folio'),
                    MonedaDR: getAttr(dStr, 'MonedaDR') || 'MXN',
                    NumParcialidad: parseInt(getAttr(dStr, 'NumParcialidad') || '1'),
                    ImpSaldoAnt: parseFloat(getAttr(dStr, 'ImpSaldoAnt') || '0'),
                    ImpPagado: parseFloat(getAttr(dStr, 'ImpPagado') || monto.toString()),
                    ImpSaldoInsoluto: parseFloat(getAttr(dStr, 'ImpSaldoInsoluto') || '0')
                }));

                const traslados = [];
                const retenciones = [];
                const trasMatches = pMatch.match(/<pago20:TrasladoP\b[^>]*\/?>/gi) || [];
                trasMatches.forEach(tStr => {
                    traslados.push({
                        Base: getAttr(tStr, 'BaseP') || '0',
                        ImpuestoClave: getAttr(tStr, 'ImpuestoP') || '002',
                        TipoFactor: getAttr(tStr, 'TipoFactorP') || 'Tasa',
                        TasaOCuota: getAttr(tStr, 'TasaOCuotaP') || '0.160000',
                        Importe: getAttr(tStr, 'ImporteP') || '0'
                    });
                });

                const retMatches = pMatch.match(/<pago20:RetencionP\b[^>]*\/?>/gi) || [];
                retMatches.forEach(rStr => {
                    retenciones.push({
                        ImpuestoClave: getAttr(rStr, 'ImpuestoP') || '001',
                        Importe: getAttr(rStr, 'ImporteP') || '0'
                    });
                });

                listaPagos.push({
                    FechaPago: fechaPago,
                    FormaDePagoP: formaPago,
                    MonedaP: monedaP,
                    Monto: monto,
                    MontoString: monto.toFixed(2),
                    DoctoRelacionados: doctosRel,
                    Impuestos: {
                        Traslados: traslados,
                        Retenciones: retenciones
                    }
                });
            }
        } catch (xmlErr) {
            console.warn('Error parseando XML timbrado para pago:', xmlErr);
        }
    }

    if (!listaPagos || listaPagos.length === 0) {
        return null;
    }

    return {
        ...f,
        Complemento: {
            ...complemento,
            Pagos: {
                Version: pagosNode?.Version || '2.0',
                Totales: totales,
                Pagos: listaPagos
            }
        }
    };
}

export default function EditarComplementoPago() {
    const { id } = useParams();
    const [facturaData, setFacturaData] = useState(null);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [loadingError, setLoadingError] = useState('');
    const [token, setToken] = useState("");
    const router = useRouter();

    // Autenticación
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) router.push("/IniciaSesion");
        else setToken(token);
    }, [router]);

    // Cargar datos utilizando directamente el servicio de Go
    useEffect(() => {
        if (!id || !token) return;

        const cargarDatos = async () => {
            try {
                setLoadingError('');
                const targetUrl = apiUrl 
                    ? `${apiUrl}/api/facturas/ObtenerFactura/${id}`
                    : `/api/facturas/ObtenerFactura/${id}`;

                console.log("Obteniendo complemento de pago desde servicio Go:", targetUrl);

                let response = await fetch(targetUrl, {
                    headers: { 
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                // Si por alguna razón la URL de Go falla (por ejemplo si apiUrl no está configurado), intentar fallback
                if (!response.ok && !apiUrl) {
                    response = await fetch(`/api/facturas/ObtenerFactura/${id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                }

                if (!response.ok) {
                    const errorText = await response.text();
                    throw new Error(`Error en el servicio (${response.status}): ${errorText}`);
                }

                const rawData = await response.json();
                console.log("Datos brutos recibidos desde Go API:", rawData);

                const facturaNormalizada = normalizarFacturaPago(rawData);

                if (!facturaNormalizada?.Complemento?.Pagos?.Pagos?.length) {
                    console.error("Estructura de factura no válida para pagos:", rawData);
                    throw new Error('No se encontró el complemento de pago en la factura');
                }

                console.log("Factura normalizada para edición:", facturaNormalizada);
                setFacturaData({ factura: facturaNormalizada });
                return facturaNormalizada;

            } catch (error) {
                console.error("Error cargando pago:", error);
                setLoadingError(error.message || 'Error al cargar el pago');
                setSnackbarMessage("Error al cargar el pago: " + (error.message || ''));
                setOpenSnackbar(true);
            }
        };

        cargarDatos();
    }, [id, token]);

    const handleSave = async (editedPago) => {
        try {
            const facturaObj = facturaData?.factura || facturaData;
            const primerPago = facturaObj?.Complemento?.Pagos?.Pagos?.[0] || {};
            const primerDocto = primerPago?.DoctoRelacionados?.[0] || {};

            const updatedFactura = {
                ...facturaObj,
                Fecha: editedPago.FechaPago,
                Complemento: {
                    ...facturaObj.Complemento,
                    Pagos: {
                        ...facturaObj.Complemento?.Pagos,
                        Pagos: [{
                            ...primerPago,
                            FechaPago: editedPago.FechaPago,
                            FormaDePagoP: editedPago.FormaPagoComprobante,
                            Monto: parseFloat(editedPago.Monto),
                            MontoString: String(editedPago.Monto),
                            DoctoRelacionados: [{
                                ...primerDocto,
                                ImpPagado: parseFloat(editedPago.Monto),
                                ImpPagadoString: String(editedPago.Monto),
                                ImpSaldoInsoluto: parseFloat(editedPago.ImpSaldoInsoluto),
                                ImpSaldoInsolutoString: String(editedPago.ImpSaldoInsoluto),
                            }],
                            Impuestos: editedPago.Impuestos // {Traslados, Retenciones} ya viene listo de onSubmit
                        }],
                        Totales: {
                            ...facturaObj.Complemento?.Pagos?.Totales,
                            TotalTrasladosBaseIVA16: editedPago.Totales.TotalTrasladosBaseIVA16,
                            TotalTrasladosBaseIVA16String: editedPago.Totales.TotalTrasladosBaseIVA16,
                            TotalTrasladosImpuestoIVA16: editedPago.Totales.TotalTrasladosImpuestoIVA16,
                            TotalTrasladosImpuestoIVA16String: editedPago.Totales.TotalTrasladosImpuestoIVA16,
                            TotalRetencionesISR: editedPago.Totales.TotalRetencionesISR,
                            TotalRetencionesISRString: editedPago.Totales.TotalRetencionesISR,
                            TotalRetencionesIVA: editedPago.Totales.TotalRetencionesIVA,
                            TotalRetencionesIVAString: editedPago.Totales.TotalRetencionesIVA,
                            MontoTotalPagos: editedPago.Monto,
                            MontoTotalPagosString: String(editedPago.Monto),
                        }
                    }
                }
            };

            console.log("Factura actualizada enviando a Go API:", updatedFactura);

            const targetUrl = `${apiUrl || ''}/api/facturas/EditarFactura`;
            const response = await fetch(targetUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFactura)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || errorData.Error || 'Error al actualizar el pago en Go API');
            }

            setSnackbarMessage('Pago actualizado correctamente');
            setOpenSnackbar(true);
            setTimeout(() => router.push("/Home"), 1500);

        } catch (error) {
            console.error("Error al guardar:", error);
            setSnackbarMessage(error.message || 'Error al actualizar el pago');
            setOpenSnackbar(true);
        }
    };

    if (!facturaData) {
        return (
            <div>
                <Header />
                <Grid container>
                    <Grid>
                        <SideBarMenu />
                    </Grid>
                    <Grid sx={{ flex: 1 }}>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            minHeight="70vh"
                            p={3}
                        >
                            {loadingError ? (
                                <Box textAlign="center" maxWidth={500}>
                                    <Alert severity="error" sx={{ mb: 3 }}>
                                        {loadingError}
                                    </Alert>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => router.push("/Home")}
                                    >
                                        Volver al listado de facturas
                                    </Button>
                                </Box>
                            ) : (
                                <Box textAlign="center">
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="h6">Cargando datos del complemento de pago...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6000}
                    onClose={() => setOpenSnackbar(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        severity={snackbarMessage.includes('Error') ? 'error' : 'success'}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Grid container>
                <Grid>
                    <SideBarMenu />
                </Grid>
                <Grid sx={{ flex: 1 }}>
                    <Box
                        bgcolor="white"
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        <EditarPago
                            factura={facturaData.factura || facturaData}
                            token={token}
                            onSave={handleSave}
                            onCancel={() => router.push("/Home")}
                        />
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbarMessage.includes('Error') ? 'error' : 'success'}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}
