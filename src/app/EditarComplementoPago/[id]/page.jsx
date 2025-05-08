"use client"
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert, Box, Button, Grid } from '@mui/material';
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
    const [token, setToken] = useState("");
    const router = useRouter();

    // Autenticación
    useEffect(() => {
        const token = isAuthenticated();
        if (!token) router.push("/IniciaSesion");
        else setToken(token);
    }, [router]);

    // Cargar datos
    useEffect(() => {
        if (!id || !token) return;

        const cargarDatos = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/facturas/ObtenerFactura/${id}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (!data?.factura?.Complemento?.Pagos) {
                    throw new Error('No se encontró el complemento de pago');
                }

                setFacturaData(data);
                return data;

            } catch (error) {
                console.error("Error cargando pago:", error);
                setSnackbarMessage("Error al cargar el pago: " + error.message);
                setOpenSnackbar(true);
                router.push("/Home");
            }
        };

        cargarDatos();
    }, [id, token]);

    const handleSave = async (editedPago) => {
        try {
            const payload = {
                ...editedPago,
                // Asegurar los tipos de datos correctos
                Monto: parseFloat(editedPago.Monto),
                FechaPago: new Date(editedPago.FechaPago).toISOString(),
                DoctoRelacionados: [{
                    ...facturaData.factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0],
                    ImpPagado: parseFloat(editedPago.Monto),
                    ImpSaldoInsoluto: parseFloat(editedPago.ImpSaldoInsoluto)
                }]
            };

            console.log("Payload a enviar:", payload);

            const response = await fetch(`${apiUrl}/api/facturas/ActualizarComplementoPago/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error al actualizar el pago');
            }

            setSnackbarMessage('Pago actualizado correctamente');
            setOpenSnackbar(true);
            setTimeout(() => router.push("/Home"), 1500);

        } catch (error) {
            console.error("Error al guardar:", error);
            setSnackbarMessage(error.message);
            setOpenSnackbar(true);
        }
    };

    if (!facturaData) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-xl">Cargando datos del pago...</div>
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
                <Grid>
                    <Box
                        bgcolor="white"
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        <EditarPago
                            factura={facturaData.factura}
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