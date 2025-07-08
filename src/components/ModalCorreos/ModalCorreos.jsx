import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Box, 
  Typography, 
  TextField, 
  Button, 
  Snackbar, 
  Alert,
  Autocomplete,
  Chip,
  CircularProgress
} from '@mui/material';
import { isAuthenticated } from '@/utils/authRedirect';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const ModalCorreos = ({ open, onClose, setOpen }) => {
    const [emailAddresses, setEmailAddresses] = useState('');
    const [selectedRole, setSelectedRole] = useState(null);
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(false);
    const [sendingInvitations, setSendingInvitations] = useState(false);
    const [invitationLinks, setInvitationLinks] = useState([]);
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [toast, setToast] = useState({
        open: false,
        message: '',
        severity: 'success',
    });

    const token = isAuthenticated();

    useEffect(() => {
        if (open) {
            fetchRoles();
        }
    }, [open]);

    const fetchRoles = async () => {
        setLoadingRoles(true);
        try {
            const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setRoles(data.map(role => ({
                    id: role.ID,
                    nombre: role.Descripcion || `Rol ${role.Clave}`,
                    rawData: role
                })));
            } else {
                console.error("Error al obtener roles");
                showToast('Error al cargar los roles disponibles', 'error');
            }
        } catch (error) {
            console.error("Error en la solicitud de roles:", error);
            showToast('No se pudo cargar la lista de roles', 'error');
        } finally {
            setLoadingRoles(false);
        }
    };

    const showToast = (message, severity) => {
        setToast({
            open: true,
            message: message,
            severity: severity,
        });
    };

    const handleCloseToast = () => {
        setToast({ ...toast, open: false });
    };

    const handleSendInvitations = async () => {
        if (!selectedRole) {
            showToast('Por favor selecciona un rol', 'error');
            return;
        }

        const emailsArray = emailAddresses.split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0);

        if (emailsArray.length === 0) {
            showToast('Ingresa al menos una dirección de correo', 'error');
            return;
        }

        setSendingInvitations(true);

        try {
            const invitationsPayload = {
                Direcciones: emailsArray.map(email => ({
                    Email: email,
                    RolID: selectedRole.id
                }))
            };

            const response = await fetch(`${apiUrl}/api/invitacioncolaboradores/Invitar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(invitationsPayload),
            });

            if (response.ok) {
                const data = await response.json();
                console.log("Invitaciones enviadas:", data);

                // Mostrar toast de éxito
                const emailCount = emailsArray.length;
                const message = emailCount === 1
                    ? `Invitación enviada correctamente (Rol: ${selectedRole.nombre})`
                    : `${emailCount} invitaciones enviadas correctamente (Rol: ${selectedRole.nombre})`;
                showToast(message, 'success');

                // Convertir el objeto en un array
                const invitationsArray = emailsArray.map(email => ({
                    email: email,
                    status: 'success', // Asumimos éxito si la respuesta fue OK
                    rol: selectedRole.nombre
                }));

                setInvitationLinks(invitationsArray);
                setResultModalOpen(true);
                setOpen(false);
                setEmailAddresses('');
                setSelectedRole(null);
            } else {
                const errorData = await response.json();
                console.error("Error al enviar invitaciones:", errorData);
                showToast('Hubo un error al enviar las invitaciones', 'error');
            }
        } catch (error) {
            console.error("Error en la solicitud:", error);
            showToast('No se pudo enviar la solicitud. Inténtalo de nuevo.', 'error');
        } finally {
            setSendingInvitations(false);
        }
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
                    
                    {/* Select Autocomplete para roles */}
                    <Autocomplete
                        options={roles}
                        loading={loadingRoles}
                        getOptionLabel={(option) => option.nombre}
                        value={selectedRole}
                        onChange={(event, newValue) => {
                            setSelectedRole(newValue);
                        }}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Selecciona un rol"
                                variant="outlined"
                                fullWidth
                                sx={{ mt: 2 }}
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loadingRoles ? <CircularProgress color="inherit" size={20} /> : null}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                        renderOption={(props, option) => (
                            <Box component="li" {...props} key={option.id}>
                                {option.nombre}
                            </Box>
                        )}
                        renderTags={(value, getTagProps) =>
                            value.map((option, index) => (
                                <Chip
                                    {...getTagProps({ index })}
                                    key={option.id}
                                    label={option.nombre}
                                />
                            ))
                        }
                        noOptionsText={loadingRoles ? "Cargando roles..." : "No hay roles disponibles"}
                    />
                    
                    <TextField
                        label="Direcciones de correo electrónico"
                        placeholder="ejemplo1@correo.com, ejemplo2@correo.com"
                        multiline
                        rows={3}
                        fullWidth
                        variant="outlined"
                        value={emailAddresses}
                        onChange={(e) => setEmailAddresses(e.target.value)}
                        sx={{ mt: 2, mb: 2 }}
                        helperText="Separa múltiples correos con comas"
                    />

                    <Button
                        variant="contained"
                        fullWidth
                        onClick={handleSendInvitations}
                        disabled={!selectedRole || !emailAddresses.trim() || sendingInvitations}
                        sx={{ 
                            backgroundColor: '#1b384a', 
                            '&:hover': { backgroundColor: '#10232f' },
                            '&:disabled': { opacity: 0.7 }
                        }}
                    >
                        {sendingInvitations ? (
                            <CircularProgress size={24} color="inherit" />
                        ) : (
                            'Enviar Invitaciones'
                        )}
                    </Button>
                </Box>
            </Modal>

            {/* Toast de notificación */}
            <Snackbar
                open={toast.open}
                autoHideDuration={6000}
                onClose={handleCloseToast}
                anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
            >
                <Alert 
                    onClose={handleCloseToast} 
                    severity={toast.severity} 
                    variant="filled" 
                    sx={{ width: '100%' }}
                >
                    {toast.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ModalCorreos;
