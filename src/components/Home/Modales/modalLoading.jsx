import { Modal, Box, Typography, CircularProgress } from '@mui/material';
export default function ModalLoading({ openModal, handleCloseModal, loading, loadingMessage }) {
    return (<Modal open={openModal} onClose={handleCloseModal}>
        <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 'auto',
            minWidth: '300px',
            minHeight: '175px',

            bgcolor: 'white',
            boxShadow: 24,
            p: 2,
            borderRadius: '8px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
        }}>
            {loading &&
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    <Typography variant="h6" sx={{ mb: 2 }}>{loadingMessage}</Typography>
                    <CircularProgress />
                </Box>}

        </Box>
    </Modal>);

}