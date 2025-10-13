'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogActions,
    DialogContent,
    Stepper,
    Step,
    StepLabel,
    Tabs,
    Tab,
    Divider,
    Typography,
    Button,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import BusinessIcon from '@mui/icons-material/Business';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

import CertificadoCSD from "@/components/AltaEmpresa/CertificadoCSD";
import AltaEmpresa from "@/components/AltaEmpresa/AltaEmpresa";
import Paquetes from '@/components/CompraTimbres/Paquetes';
import Planes from '@/components/CompraTimbres/Planes';
import { WithPermission } from '@/components/WithPermission'; // Ajusta esta ruta según tu estructura
import { PayPalScriptProvider } from '@paypal/react-paypal-js';


const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: "MXN",
    intent: "capture",
    locale: "es_MX",
};

const steps = [
    { label: 'Registrar Empresa', icon: <BusinessIcon /> },
    { label: 'Compra de Timbres', icon: <ShoppingCartIcon /> },
    { label: 'Confirmación', icon: <CheckCircleIcon /> },
];

const StyledStepIcon = styled('div')(({ theme, active, completed }) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: '50%',
    backgroundColor: active
        ? 'rgba(29, 57, 77, 1)'
        : completed
            ? 'rgba(29, 57, 77, 1)'
            : theme.palette.grey[300],
    color: theme.palette.common.white,
    transition: 'background-color 0.3s ease-in-out',
}));

const CustomStepIcon = ({ icon, active, completed }) => {
    return <StyledStepIcon active={active} completed={completed}>{icon}</StyledStepIcon>;
};

const ModalWizard = ({ open, handleClose, token }) => {
    const [activeStep, setActiveStep] = useState(0);
    const [issuerName, setIssuerName] = useState('');
    const [issuerRfc, setIssuerRfc] = useState('');
    const [registroEmpresa, setRegistroEmpresa] = useState(false);
    const [compra, setCompra] = useState(false);
    const [valorTab, setValorTab] = useState(0);

    const handleNext = () => {
        setActiveStep((prev) => prev + 1);
    };

    const handleUpdateEmpresa = (name, rfc) => {
        setIssuerName(name);
        setIssuerRfc(rfc);
    };

    useEffect(() => {
        if (registroEmpresa && activeStep === 0) {
            handleNext();
        }
    }, [registroEmpresa, activeStep]);

    useEffect(() => {
        if (compra && activeStep === 1) {
            handleNext();
        }
    }, [compra, activeStep]);

    const getStepContent = (step) => {
        switch (step) {
            case 0:
                return (
                    <div>
                        <CertificadoCSD token={token} onUpdateEmpresa={handleUpdateEmpresa} />
                        <Divider sx={{ marginY: 2 }} />
                        <AltaEmpresa
                            issuerName={issuerName}
                            issuerRfc={issuerRfc}
                            token={token}
                            setRegistroEmpresa={setRegistroEmpresa}
                            btnCancelar={false}
                        />
                    </div>
                );
            case 1:
                return (
                    <PayPalScriptProvider options={initialOptions}>
                        <div>
                            <Tabs
                                value={valorTab}
                                onChange={(e, newValue) => setValorTab(newValue)}
                                textColor="primary"
                                centered
                                sx={{
                                    '& .MuiTabs-indicator': {
                                        backgroundColor: '#1b384a',
                                    },
                                }}
                            >
                                <Tab label="Paquetes" />
                                <Tab label="Planes" />
                            </Tabs>
                            {valorTab === 0 ? (
                                <Paquetes token={token} setCompra={setCompra} />
                            ) : (
                                <Planes token={token} setCompra={setCompra} />
                            )}
                        </div>
                    </PayPalScriptProvider>
                );
            case 2:
                return (
                    <div style={{ textAlign: 'center', marginTop: '20px' }}>
                        <Typography variant="h5" gutterBottom>
                            ¡Confirmación Exitosa!
                        </Typography>
                        <Typography variant="body1" sx={{ marginY: 2 }}>
                            Realiza tu pago y empieza a timbrar facturas de manera inmediata.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            sx={{
                                marginTop: 2,
                                backgroundColor: 'rgba(29, 57, 77, 1)',
                                '&:hover': { backgroundColor: 'rgba(29, 57, 77, 0.9)' },
                            }}
                            onClick={handleClose}
                        >
                            Cerrar
                        </Button>
                    </div>
                );
            default:
                return 'Paso desconocido';
        }
    };

    return (
        <WithPermission
            permission="crear_emisores"
            fallback={
                <Dialog open={open} onClose={handleClose}>
                    <DialogContent>
                        <Typography variant="h5" align="center">
                            Bienvenido(a)
                        </Typography>
                        <Typography variant="body1" align="center">
                            ¡Hola! Que gusto poder tenerte con nosotros por primera vez.
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleClose} color="primary">
                            Cerrar
                        </Button>
                    </DialogActions>
                </Dialog>
            }
        >
            <Dialog
                open={open}
                onClose={handleClose}
                fullWidth
                maxWidth={false}
                PaperProps={{
                    sx: {
                        width: '80%',
                        margin: 'auto',
                    },
                }}
            >
                <DialogContent>
                    <Stepper activeStep={activeStep} alternativeLabel>
                        {steps.map((step, index) => (
                            <Step key={index}>
                                <StepLabel
                                    StepIconComponent={() => (
                                        <CustomStepIcon
                                            icon={step.icon}
                                            active={activeStep === index}
                                            completed={activeStep > index}
                                        />
                                    )}
                                >
                                    <Typography
                                        variant="caption"
                                        sx={{
                                            fontWeight: activeStep === index ? 'bold' : 'normal',
                                            color: activeStep === index
                                                ? 'rgba(29, 57, 77, 1)'
                                                : 'text.secondary',
                                            transition: 'color 0.3s ease-in-out',
                                        }}
                                    >
                                        {step.label}
                                    </Typography>
                                </StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    <div>{getStepContent(activeStep)}</div>
                </DialogContent>
            </Dialog>
        </WithPermission>
    );
};

export default ModalWizard;
