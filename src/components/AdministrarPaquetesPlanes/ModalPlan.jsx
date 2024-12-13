import React, { useState } from 'react';
import { Modal, Box, TextField, Button, Typography } from '@mui/material';

const style = {
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
};

const ModalPlan = ({ open, handleClose, handleSave, initialData }) => {
    const [formData, setFormData] = useState(initialData || {});

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleSubmit = () => {
        handleSave(formData);
        handleClose();
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-title"
            aria-describedby="modal-description"
        >
            <Box sx={style}>
                <Typography id="modal-title" variant="h6" component="h2">
                    {initialData ? 'Editar Plan' : 'Agregar Plan'}
                </Typography>
                <TextField
                    margin="normal"
                    fullWidth
                    label="Nombre"
                    name="nombre"
                    value={formData.nombre || ''}
                    onChange={handleChange}
                />
                <TextField
                    margin="normal"
                    fullWidth
                    label="Timbres"
                    name="timbres"
                    value={formData.timbres || ''}
                    onChange={handleChange}
                />
                <TextField
                    margin="normal"
                    fullWidth
                    label="Precio"
                    name="precio"
                    type="number"
                    value={formData.precio || ''}
                    onChange={handleChange}
                />
                <Button variant="contained" color="primary" onClick={handleSubmit}>
                    Guardar
                </Button>
            </Box>
        </Modal>
    );
};

export default ModalPlan;