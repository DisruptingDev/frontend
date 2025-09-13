'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Container, Alert, Button, Typography, Box } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState('processing');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      capturePayment(token);
    }
  }, [token]);

  const capturePayment = async (paymentToken) => {
    try {
      setStatus('processing');
      
      const response = await fetch('/api/CapturarOrdenPayPal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: paymentToken })
      });
      
      if (response.ok) {
        setStatus('success');
        setTimeout(() => {
          router.push('/Home');
        }, 3000);
      } else {
        setStatus('error');
      }
    } catch (error) {
      console.error('Error capturando pago:', error);
      setStatus('error');
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      {status === 'processing' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Procesando tu pago...
        </Alert>
      )}
      
      {status === 'success' && (
        <Box textAlign="center">
          <CheckCircleIcon color="success" sx={{ fontSize: 60, mb: 2 }} />
          <Typography variant="h4" gutterBottom>
            ¡Pago Exitoso!
          </Typography>
          <Typography variant="body1" gutterBottom>
            Tu pago se ha procesado correctamente.
          </Typography>
          <Button 
            variant="contained" 
            onClick={() => router.push('/mis-ordenes')}
            sx={{ mt: 2 }}
          >
            Ver mis órdenes
          </Button>
        </Box>
      )}
      
      {status === 'error' && (
        <Alert severity="error">
          Error al procesar el pago. Contacta a soporte.
        </Alert>
      )}
    </Container>
  );
}