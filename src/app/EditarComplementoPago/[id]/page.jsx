"use client"
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert, Box, Button } from '@mui/material';
import Pagos from "@/components/FormFactura/Pagos/Pagos";
import { isAuthenticated } from "@/utils/authRedirect";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function EditarComplementoPago() {
    const { id } = useParams();
    const { register, handleSubmit, setValue, getValues, formState: { errors } } = useForm();
    const [pagoData, setPagoData] = useState(null);
    const [facturaMadre, setFacturaMadre] = useState(null);
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
                
                if (!data.factura) throw new Error('Pago no encontrado');
                
                setFacturaMadre(data.factura);
                const pago = data.factura.Complemento?.Pagos?.Pagos[0];
                setPagoData(pago);
                
                // Setear valores iniciales
                setValue("fechaPago", pago?.FechaPago?.split('T')[0] || '');
                setValue("formaPago", pago?.FormaDePagoP || "01");
                setValue("montoPago", pago?.Monto || 0);
                setValue("numOperacion", pago?.DoctoRelacionados[0]?.NumParcialidad || 1);
                setValue("saldoPendiente", pago?.DoctoRelacionados[0]?.ImpSaldoInsoluto || 0);

            } catch (error) {
                console.error("Error cargando pago:", error);
                setSnackbarMessage("Error al cargar el pago");
                setOpenSnackbar(true);
            }
        };

        cargarDatos();
    }, [id, token, setValue]);

    const onSubmit = async (data) => {
        try {
            const pagoActualizado = {
                FechaPago: `${data.fechaPago}T00:00:00`,
                FormaDePagoP: data.formaPago,
                MonedaP: "MXN",
                Monto: parseFloat(data.montoPago),
                DoctoRelacionados: [{
                    ...pagoData.DoctoRelacionados[0],
                    NumParcialidad: parseInt(data.numOperacion),
                    ImpPagado: parseFloat(data.montoPago),
                    ImpSaldoInsoluto: facturaMadre.Total - (parseFloat(data.montoPago) + (facturaMadre.Total - getValues("saldoPendiente")))
                }]
            };

            const response = await fetch(`${apiUrl}/api/facturas/ActualizarComplementoPago/${id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(pagoActualizado)
            });

            if (!response.ok) throw new Error('Error al actualizar');
            
            setSnackbarMessage('Pago actualizado correctamente');
            setTimeout(() => router.push("/Home"), 1500);

        } catch (error) {
            setSnackbarMessage(error.message);
        } finally {
            setOpenSnackbar(true);
        }
    };

    if (!pagoData || !facturaMadre) {
        return <div className="p-4">Cargando datos del pago...</div>;
    }

    return (
        <div className="p-4">
            <h1 className="text-2xl font-bold mb-6">Editar Complemento de Pago</h1>
            
            <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 600 }}>
                <Pagos
                    emisorID={facturaMadre.Emisor.ID}
                    facturaMadre={facturaMadre}
                    register={register}
                    errors={errors}
                    getValues={getValues}
                    setValue={setValue}
                    isEditing={true}
                >
                    <div className="flex justify-end space-x-3 mt-6">
                        <Button 
                            variant="outlined" 
                            color="error"
                            onClick={() => router.push("/Home")}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            variant="contained" 
                            type="submit"
                        >
                            Guardar Cambios
                        </Button>
                    </div>
                </Pagos>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
            >
                <Alert severity={snackbarMessage.includes('Error') ? 'error' : 'success'}>
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}