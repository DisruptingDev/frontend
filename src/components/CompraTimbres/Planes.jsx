import { Button, Box, Typography, Card, CardContent, Grid } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import PagoModal from './PagoModal';
import { useState, useEffect, useCallback } from 'react';
export default function Planes({ token }) {

    const [openModal, setOpenModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [planes, setPlanes] = useState([]);

    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
          style: 'currency',
          currency: 'MXN',
          minimumFractionDigits: 2,
        }).format(value);
      }
    // const planes = [
    //     {
    //         titulo: "Plan Básico",
    //         timbres: "50 timbres mensuales",
    //         precio: "$249.00",
    //         beneficios: ["50 timbres mensuales", "Reinicio mensual a 50 timbres", "Pago Anual"],
    //     },
    //     {
    //         titulo: "Plan Estándar",
    //         timbres: "100 timbres mensuales",
    //         precio: "$399.00",
    //         beneficios: ["100 timbres mensuales", "Reinicio mensual a 100 timbres", "Pago Anual"],
    //     },
    //     {
    //         titulo: "Plan Premium",
    //         timbres: "250 timbres mensuales",
    //         precio: "$899.00",
    //         beneficios: ["250 timbres mensuales", "Reinicio mensual a 250 timbres", "Pago Anual"],
    //     }
    // ];

    const fetchPlanes = useCallback(async () => {
        if (token != '') {
            console.log('Fetching plan', token);
            try {
                console.log('Token:', token);
                const response = await fetch('https://facturacioncfditotal.com/api/catalogos/Catalogos/Planes', {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                console.log('Data:', data);
                if (response.ok) {
                    console.log('plan:', data);
                    setPlanes(data);
                } else {
                    console.error('Error fetching plan:', data);
                }
            } catch (error) {
                console.error('Error fetching plan:', error);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchPlanes();
    }, [fetchPlanes, token]);

    const handleOpenModal = (paquete) => {
        setSelectedPlan(paquete);
        setOpenModal(true);
    };

    const handleCloseModal = () => {
        setOpenModal(false);
        setSelectedPlan(null);
    };


    return (
        <Box my={4} >
            {/* Títulos centrados */}
            <Typography variant="h4" textAlign="center" gutterBottom sx={{ fontWeight: '600' }}>
                Planes de Suscripción
            </Typography>
            <Typography variant="subtitle1" textAlign="center" gutterBottom sx={{ marginBottom: 4 }}>
                Los planes se renuevan mensualmente y tus timbres se reinician cada mes.
            </Typography>

            <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '1200px', mx: 'auto' }}>
                {planes.map((plan, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: 2 }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                {/* Contenido del plan */}
                                <Box>
                                    <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: '600' }}>
                                        {plan.Nombre || 'Plan'}
                                    </Typography>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        {plan.CantidadTimbres} timbres mensuales
                                    </Typography>
                                    <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: '600' }}>
                                        {formatCurrency(plan.Costo)} <Typography variant="subtitle1" component="span">MXN / mes</Typography>
                                    </Typography>
                                </Box>

                                {/* Beneficios */}
                                <Box flexGrow={1} mb={2}>

                                    <Box display="flex" alignItems="center" mb={1}>
                                        <DoneIcon color="success" sx={{ mr: 1 }} />
                                        <Typography variant="body2">Reinicio mensual</Typography>
                                    </Box>

                                </Box>

                                {/* Botón y leyenda */}
                                <Box mt="auto">
                                    <Button sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }} variant="contained" fullWidth onClick={() => handleOpenModal(plan)}>
                                        Comprar Ahora
                                    </Button>
                                    <Typography variant="caption" display="block" align="center" mt={2}>
                                        Renovación mensual automática
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {/* Modal de Pago */}
            {selectedPlan && (
                <PagoModal open={openModal} onClose={handleCloseModal} opcion={selectedPlan} token={token}/>
            )}
        </Box>
    );
}
