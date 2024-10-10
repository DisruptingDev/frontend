import { Modal, Box, Typography, LinearProgress, Button } from '@mui/material';

export default function ModalDescarga({ isModalOpen, handleCloseModal, loading, facturaActual, progress }) {
return(
    <Modal open={isModalOpen} onClose={handleCloseModal}>
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'auto',
          minWidth: '400px',
          maxWidth: '40%',
          bgcolor: 'background.paper',
          boxShadow: 24,
          p: 4,
          borderRadius: '8px',
          textAlign: 'center',
        }}>
          <Typography variant="h6" gutterBottom>
            {loading ? "Descargando Facturas" : 'Facturas Descargadas'}
          </Typography>
          <Typography variant="h6" gutterBottom>
            {loading ? facturaActual : ''}
          </Typography>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 10, // Altura de la barra de progreso
              borderRadius: 5, // Bordes redondeados
              // bgcolor: '#e0e0e0', // Color de fondo
              // '& .MuiLinearProgress-bar': {
              //   backgroundColor: progress >= 100 ? '#4caf50' : '#1a90ff', // Cambia el color cuando llegue al 100%
              // },
            }}
          />

          {!loading && (
            // Si no está cargando, muestra el botón de OK
            <>
              <Typography>Revise su carpeta de descargas </Typography>
              <Button onClick={handleCloseModal} variant="contained" sx={{
                mt: 2,
              }}>
                OK
              </Button>
            </>
          )}

        </Box>
      </Modal>
);
}