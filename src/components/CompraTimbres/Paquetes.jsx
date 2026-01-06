import { Button, Box, Typography, Card, CardContent, Grid } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import PagoModal from './PagoModal';
import { useState, useEffect, useCallback } from 'react';
import { set } from 'date-fns';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Paquetes({ token, setCompra }) {
    const [openModal, setOpenModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [paquetes, setPaquetes] = useState([]);


    // Función para formatear como moneda
    const formatCurrency = (value) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
        }).format(value);
    }

    const fetchPaquetes = useCallback(async () => {
        if (token != '') {
            //console.log('Fetching paquetes', token);
            try {
                //console.log('Token:', token);
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Paquetes`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                //console.log('Data:', data);
                if (response.ok) {
                    //console.log('Paquetes:', data);
                    console.log('Paquetes fetch result:', data);
                    setPaquetes(data);
                } else {
                    console.error('Error fetching paquetes:', data);
                }
            } catch (error) {
                console.error('Error fetching paquetes:', error);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchPaquetes();
    }, [fetchPaquetes, token]);



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
                Paquetes de Timbres
            </Typography>
            <Typography variant="subtitle1" textAlign="center" gutterBottom sx={{ marginBottom: 4 }}>
                Los paquetes son compras únicas y los timbres no caducan.
            </Typography>

            <Grid container spacing={3} justifyContent="center" sx={{ maxWidth: '1200px', mx: 'auto' }}>
                {paquetes.map((paquete, index) => {
                    const costoPromocional = Number(paquete.CostoPromocional || paquete.costo_promocional || paquete.costoPromocional || 0);
                    const timbresPromocional = Number(paquete.CantidadTimbresPromocional || paquete.cantidad_timbres_promocional || paquete.cantidadTimbresPromocional || 0);

                    const priceDisplay = costoPromocional > 0 ? (
                        <>
                            <Typography component="span" sx={{ textDecoration: 'line-through', color: 'text.secondary', mr: 2, fontSize: '0.5em' }}>
                                {formatCurrency(paquete.Costo)}
                            </Typography>
                            {formatCurrency(costoPromocional)}
                        </>
                    ) : (
                        formatCurrency(paquete.Costo)
                    );

                    return (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: 2 }}>
                                <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    {/* Contenido del plan */}
                                    <Box>
                                        <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: '600' }}>
                                            {paquete.Nombre || 'Paquete'}
                                        </Typography>
                                        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                            {timbresPromocional > 0 ? (
                                                <>
                                                    <span style={{ textDecoration: 'line-through', marginRight: '8px' }}>
                                                        {paquete.CantidadTimbres}
                                                    </span>
                                                    <span style={{ fontWeight: 'bold', color: '#10968a' }}>
                                                        {timbresPromocional} Timbres
                                                    </span>
                                                </>
                                            ) : (
                                                <>{paquete.CantidadTimbres} Timbres</>
                                            )}
                                        </Typography>
                                        <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: '600', display: 'flex', alignItems: 'baseline' }}>
                                            {priceDisplay}
                                            <Typography variant="subtitle1" component="span" sx={{ ml: 1 }}>MXN</Typography>
                                        </Typography>
                                    </Box>

                                    {/* Beneficios */}
                                    <Box flexGrow={1} mb={2}>

                                        <Box display="flex" alignItems="center" mb={1}>
                                            <DoneIcon color="success" sx={{ mr: 1 }} />
                                            <Typography variant="body2">Sin caducidad</Typography>

                                        </Box>
                                        <Box display="flex" alignItems="center" mb={1}>
                                            <DoneIcon color="success" sx={{ mr: 1 }} />
                                            <Typography variant="body2">Pago único</Typography>
                                        </Box>

                                    </Box>

                                    {/* Botón y leyenda */}
                                    <Box mt="auto">
                                        <Button sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }} variant="contained" fullWidth onClick={() => handleOpenModal(paquete)}>
                                            Comprar Ahora
                                        </Button>
                                        <Typography variant="caption" display="block" align="center" mt={2}>
                                            Sin expiración
                                        </Typography>
                                    </Box>
                                </CardContent>
                            </Card>
                        </Grid>
                    )
                })}
            </Grid>
            {/* Modal de Pago */}
            {selectedPlan && (
                <PagoModal open={openModal} onClose={handleCloseModal} opcion={selectedPlan} token={token} setCompra={setCompra} />
            )}
        </Box>
    );
}
