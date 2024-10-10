import { Modal, Box, Typography, Button } from '@mui/material';
import { CheckCircleOutline } from '@mui/icons-material';

export default function ModalExito({ openModalSuccess, handleCloseModal, confirmationMessage }) {
return(
    <Modal open={openModalSuccess} onClose={handleCloseModal}>
    <Box sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: 'auto',
      minWidth: '400px',

      bgcolor: 'white',
      boxShadow: 24,
      p: 2,
      borderRadius: '8px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}>
      <CheckCircleOutline sx={{ fontSize: 80, color: 'green', mb: 2 }} />
      <Typography sx={{ mb: 2, textAlign: 'center', fontSize: '1.2em' }} dangerouslySetInnerHTML={{ __html: confirmationMessage }} />
      <Button onClick={handleCloseModal} variant="contained" sx={{
        mt: 2,
      }}>
        Cerrar
      </Button>
    </Box>
  </Modal>
);
}