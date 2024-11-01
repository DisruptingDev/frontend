// components/InviteModal.js
import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, IconButton, InputAdornment } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const ModalCorreos = ({ open, onClose }) => {
    const [emailAddresses, setEmailAddresses] = useState('');
    const inviteLink = "https://yoursystem.com/invite/abc123";

    const handleCopyLink = () => {
        navigator.clipboard.writeText(inviteLink);
        // alert("Link copied to clipboard!");
    };

    return (
        <Modal open={open} onClose={onClose}>
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2
                }}
            >
                <Typography variant="h6" gutterBottom sx={{fontWeight:'500'}}>
                    Invitar Miembros del Equipo
                </Typography>
                <Typography variant="body2" color="textSecondary" gutterBottom>
                    Envía invitaciones a los miembros de tu equipo para que se unan al sistema.
                </Typography>
                <TextField
                    label="Direcciones de correo electrónico"
                    placeholder="Ingresa direcciones de correo, separadas por comas"
                    multiline
                    fullWidth
                    variant="outlined"
                    value={emailAddresses}
                    onChange={(e) => setEmailAddresses(e.target.value)}
                    sx={{ mt: 2, mb: 2 }}
                />
                {/* <TextField
                    label="O comparte este enlace de invitación"
                    fullWidth
                    variant="outlined"
                    value={inviteLink}
                    InputProps={{
                        readOnly: true,
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton onClick={handleCopyLink}>
                                    <ContentCopyIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ mb: 2 }}
                /> */}
                <Button
                    variant="contained"
                    
                    
                    fullWidth
                    onClick={() => alert("¡Invitaciones enviadas!")}
                    sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                >
                    Enviar Invitaciones
                </Button>
            </Box>
        </Modal>
    );
};
export default ModalCorreos;
