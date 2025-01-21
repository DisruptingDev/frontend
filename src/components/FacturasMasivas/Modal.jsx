import { Modal, Box, Typography, Button } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

export default function ModalFacturasError({ openModalError, handleCloseModal, confirmationMessage }) {
return(
    <Modal open={openModalError} onClose={handleCloseModal}>
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'auto',
      minWidth: '400px',
      maxWidth: '40%',
      bgcolor: 'white',
      boxShadow: 24,
      p: 2,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <ErrorOutline sx={{ fontSize: 80, color: 'red' }} />
      <Typography sx={{ mb: 2, textAlign: 'center', fontSize: '1.2em' }} dangerouslySetInnerHTML={{ __html: confirmationMessage }} />
      
      <Button onClick={handleCloseModal} variant="contained" sx={{
        mt: 2,
      }}>
        Cancelar y volver a la lista
      </Button>
      <Button onClick={handleCloseModal} variant="contained" sx={{
        mt: 2,
      }}>
        Aceptar y continuar
      </Button>
    </Box>
  </Modal>

);
}