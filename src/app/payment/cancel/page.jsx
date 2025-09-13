'use client';

import { Container, Alert, Button, Typography, Box } from '@mui/material';
import CancelIcon from '@mui/icons-material/Cancel';
import { useRouter } from 'next/navigation';

export default function PaymentCancelPage() {
  const router = useRouter();

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Box textAlign="center">
        <CancelIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
        <Typography variant="h4" gutterBottom color="error">
          Pago Cancelado
        </Typography>
        <Typography variant="body1" gutterBottom>
          Has cancelado el proceso de pago. No se ha realizado ningún cargo.
        </Typography>
        <Button 
          variant="outlined" 
          onClick={() => router.push('/Home')}
          sx={{ mt: 2, mr: 2 }}
        >
          Volver al inicio
        </Button>
        <Button 
          variant="contained" 
          onClick={() => router.back()}
          sx={{ mt: 2 }}
        >
          Intentar nuevamente
        </Button>
      </Box>
    </Container>
  );
}