import React from 'react';
import { Modal, Box, Typography, TextField, Button, Divider } from '@mui/material';
import Emisor from './ComponentesEdicion/Emisor';
import Receptor from './ComponentesEdicion/Receptor';
import Concepto from './ComponentesEdicion/Concepto';
import { useForm } from 'react-hook-form';



const ModalEdicion = ({ open, handleClose, emisor, receptor, concepto, impuesto, handleChange, handleSave, token}) => {
      const { register, watch, handleSubmit, setValue, getValues, trigger, reset, formState: { errors } } = useForm();
    const onSubmit = (data) => {
        console.log("Datos del formulario", data);
        // handleSave(data);
        // handleClose();
    };
    const onClose = () => {
        handleClose();
        reset();
    
    };

      return (
        <Modal
            open={open}
            onClose={onClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
        >
            <Box sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '90%',
                // minWidth: '400px',
                // maxWidth: '80%',
                maxHeight: '80vh', // Limita la altura máxima del modal
                overflowY: 'auto', // Hace que el modal sea scrollable
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: '16px',
          
            }}>
                <Typography id="modal-modal-title" variant="h5" component="h2">
                    Editar Factura
                </Typography>
                <form onSubmit={handleSubmit(onSubmit)} methid="post">

                <Emisor datosEmisor={emisor} register={register} getValues={getValues}  setValue={setValue} trigger={trigger} />
             
                <Receptor datosReceptor={receptor} register={register} trigger={trigger} setValue={setValue} getValues={getValues} />
                <Concepto setValue={setValue} register={register} getValues={getValues} token={token} datosConcepto={concepto} datosImpuesto={impuesto} />
                </form>
                <pre>{JSON.stringify(watch("Emisor") || "No hay valor", null, 2)}</pre>
                <pre>{JSON.stringify(watch("Serie") || "No hay valor", null, 2)}</pre>
            </Box>
        </Modal>
    );
};

export default ModalEdicion;