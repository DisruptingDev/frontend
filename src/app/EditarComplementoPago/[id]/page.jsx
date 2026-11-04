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

export default function EditarComplementoPago() {
    const { id } = useParams();
    const { handleSubmit, setValue } = useForm();
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

                const data = await response.json();

                if (!data?.factura?.Complemento?.Pagos) {
                    throw new Error('No se encontró el complemento de pago en la factura');
                }
                console.log("Datos del pago cargados desde Go API:", data);
                setFacturaData(data);
                return data;

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

            const response = await fetch(`${apiUrl}/api/facturas/EditarFactura`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFactura)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || 'Error al actualizar el pago en Go API');
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
