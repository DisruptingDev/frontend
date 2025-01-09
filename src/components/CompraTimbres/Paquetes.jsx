import { Button, Box, Typography, Card, CardContent, Grid } from '@mui/material';
import DoneIcon from '@mui/icons-material/Done';
import PagoModal from './PagoModal';
import { useState, useEffect, useCallback} from 'react';
import { set } from 'date-fns';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Paquetes({token, setCompra}) {
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


    // const paquetes = [
    //     {
    //         titulo: "Paquete Pequeño",
    //         timbres: "50 timbres",
    //         precio: "$299.00",
    //         beneficios: ["50 timbres ", "Sin caducidad", "Pago único"],
    //     },
    //     {
    //         titulo: "Paquete Mediano",
    //         timbres: "100 timbres",
    //         precio: "$349.00",
    //         beneficios: ["100 timbres ", "Sin caducidad", "Pago único"],
    //     },
    //     {
    //         titulo: "Paquete Grande",
    //         timbres: "250 timbres",
    //         precio: "$949.00",
    //         beneficios: ["250 timbres ", "Sin caducidad", "Pago único"],
    //     }
    // ];

        const fetchPaquetes = useCallback(async () => {
            if (token!='') {
                console.log('Fetching paquetes', token);
                try {
                    console.log('Token:', token);   
                    const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Paquetes`, {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                        },
                    });
                    const data = await response.json();
                    console.log('Data:', data);
                    if(response.ok){
                        console.log('Paquetes:', data);
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
                {paquetes.map((paquete, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card sx={{ maxWidth: 345, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3, borderRadius: 2 }}>
                            <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                {/* Contenido del plan */}
                                <Box>
                                    <Typography variant="h5" component="div" gutterBottom sx={{ fontWeight: '600' }}>
                                        {paquete.Nombre || 'Paquete'}
                                    </Typography>
                                    <Typography variant="subtitle1" color="text.secondary" gutterBottom>
                                        {paquete.CantidadTimbres} Timbres
                                    </Typography>
                                    <Typography variant="h4" component="div" gutterBottom sx={{ fontWeight: '600' }}>
                                    {formatCurrency(paquete.Costo)} <Typography variant="subtitle1" component="span">MXN</Typography>
                                    </Typography>
                                </Box>

                                {/* Beneficios */}
                                <Box flexGrow={1} mb={2}>
                                    
                                        <Box  display="flex" alignItems="center" mb={1}>
                                            <DoneIcon color="success" sx={{ mr: 1 }} />
                                            <Typography variant="body2">Sin caducidad</Typography>

                                        </Box>
                                        <Box  display="flex" alignItems="center" mb={1}>
                                            <DoneIcon color="success" sx={{ mr: 1 }} />
                                            <Typography variant="body2">Pago único</Typography>
                                        </Box>
                                 
                                </Box>

                                {/* Botón y leyenda */}
                                <Box mt="auto">
                                    <Button  sx={{backgroundColor: '#1b384a', '&:hover': {   backgroundColor: '#10232f'} }} variant="contained" fullWidth onClick={() => handleOpenModal(paquete)}>
                                        Comprar Ahora
                                    </Button>
                                    <Typography variant="caption" display="block" align="center" mt={2}>
                                        Sin expiración
                                    </Typography>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
            {/* Modal de Pago */}
            {selectedPlan && (
                <PagoModal open={openModal} onClose={handleCloseModal} opcion={selectedPlan} token={token} setCompra={setCompra} />
            )}
        </Box>
    );
}
