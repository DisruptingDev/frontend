"use client";
import React, { useState } from 'react';
import { Container, Box, Button, Typography, TextField, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const AltaUsuarios = () => {

    const [showPassword, setShowPassword] = useState(false);
const [showConfirmPassword, setShowConfirmPassword] = useState(false);

const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
};

const handleClickShowConfirmPassword = () => {
    setShowConfirmPassword(!showConfirmPassword);
};
    const [formData, setFormData] = useState({
        nombre: '',
        correo: '',
        contraseña: '',
        confirmacionContraseña: ''
    });

    const handleSubmit = (event) => {
        event.preventDefault();
        // Handle form submission logic here
        console.log(formData);
    };
    
    const handleChange = (event) => {
        const { name, value } = event.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value,
        }));
    };
    

    return (
        <Container maxWidth="sm">
            <Box sx={{ mt: 5 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Registrar Usuario
                </Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        label="Nombre"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Correo"
                        name="correo"
                        type="email"
                        value={formData.correo}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                    />
                    <TextField
                        label="Contraseña"
                        name="contraseña"
                        type={showPassword ? 'text' : 'password'}
                        value={formData.contraseña}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle password visibility"
                                        onClick={handleClickShowPassword}
                                        edge="end"
                                    >
                                        {showPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <TextField
                        label="Confirmación de Contraseña"
                        name="confirmacionContraseña"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={formData.confirmacionContraseña}
                        onChange={handleChange}
                        fullWidth
                        margin="normal"
                        required
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton
                                        aria-label="toggle confirm password visibility"
                                        onClick={handleClickShowConfirmPassword}
                                        edge="end"
                                    >
                                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                                    </IconButton>
                                </InputAdornment>
                            ),
                        }}
                    />
                    <Button type="submit" variant="contained" color="primary" fullWidth>
                        Registrar
                    </Button>
                </form>
            </Box>
        </Container>
    );
};

export default AltaUsuarios;