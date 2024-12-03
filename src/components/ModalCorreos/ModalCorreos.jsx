// components/InviteModal.js
import React, { useState } from 'react';
import { Modal, Box, Typography, TextField, Button, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { isAuthenticated } from '@/utils/authRedirect';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalCorreos = ({ open, onClose, setOpen}) => {
    const [emailAddresses, setEmailAddresses] = useState('');
    const [invitationLinks, setInvitationLinks] = useState([]);
    const [resultModalOpen, setResultModalOpen] = useState(false);

    const token = isAuthenticated();

    const handleSendInvitations = async () => {
        const emailsArray = emailAddresses.split(',').map(email => email.trim());
        try {
            const response = await fetch(`${apiUrl}/api/invitacioncolaboradores/InvitacionColaboradores/Invitar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ correos: emailsArray }),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Invitaciones enviadas:", data);
                setInvitationLinks(data);
                setResultModalOpen(true);
                setOpen(false);
            } else {
                const errorData = await response.json();
                console.error("Error al enviar invitaciones:", errorData);
                alert("Hubo un error al enviar las invitaciones.");
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            alert("No se pudo enviar la solicitud. Inténtalo de nuevo.");
        }
    };

    const handleCopyLink = (link) => {
        navigator.clipboard.writeText(link);
        alert("Enlace copiado al portapapeles");
    };

    return (
        <>
            {/* Modal principal para enviar invitaciones */}
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
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: '500' }}>
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

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSendInvitations}
                        sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                    >
                        Enviar Invitaciones
                    </Button>
                </Box>
            </Modal>

            {/* Modal para mostrar los resultados */}
            <Modal open={resultModalOpen} onClose={() => setResultModalOpen(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '50%',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        borderRadius: 2,
                        maxHeight: '80vh',
                        overflowY: 'auto'
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Enlaces de Invitación Generados
                    </Typography>
                    <List>
                        {invitationLinks.map((link, index) => (
                            <ListItem
                                key={index}
                                sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    overflow: 'hidden',
                                    whiteSpace: 'nowrap',
                                    textOverflow: 'ellipsis',
                                    bgcolor: 'background.default',
                                    borderRadius: 1,
                                    p: 1,
                                    mb: 1,
                                }}
                            >
                                <Tooltip title={link}>
                                    <ListItemText
                                        primary={link}
                                        primaryTypographyProps={{
                                            sx: { maxWidth: '95%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                                        }}
                                    />
                                </Tooltip>
                                <IconButton onClick={() => handleCopyLink(link)} sx={{ ml: 1 }}>
                                    <ContentCopyIcon />
                                </IconButton>
                            </ListItem>
                        ))}
                    </List>
                    <Button
                        variant="contained"
                        onClick={() => setResultModalOpen(false)}
                        sx={{ mt: 2, backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                        fullWidth
                    >
                        Cerrar
                    </Button>
                </Box>
            </Modal>
        </>
    );
};

export default ModalCorreos;
