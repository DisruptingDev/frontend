import { 
    Modal, 
    Box, 
    Typography, 
    Button, 
    FormControl, 
    Select as MuiSelect, 
    InputLabel, 
    MenuItem, 
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Checkbox,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
export default function ModalCancelar({openModalCancelar,handleCloseModal, facturasRemplazo}) {
    const [motivo, setMotivo] = useState("");   
    return (
        <Modal open={openModalCancelar} onClose={handleCloseModal}>
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
                <Typography>
                    Cancelar Factura
                </Typography>
                <FormControl variant="outlined" fullWidth>
                    <InputLabel id="motivo-label">Motivo</InputLabel>
                    <MuiSelect
                        labelId="motivo-label"
                        id="motivo-select"
                        label="Motivo"
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        
                    >
                        <MenuItem value="01">Comprobantes emitidos con errores con relación.</MenuItem>
                        <MenuItem value="02">Comprobantes emitidos con errores sin relación</MenuItem>
                        <MenuItem value="03"> No se llevó a cabo la operación</MenuItem>
                        <MenuItem value="04">Operación nominativa relacionada en una factura global</MenuItem>
                    </MuiSelect>
                </FormControl>
                {motivo === '01' && 
                   <Paper>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>No. Factura</TableCell>
                                    <TableCell>Motivo</TableCell>
                                    <TableCell>Estatus</TableCell>
                                    <TableCell>Cancelar</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {facturasRemplazo.map((row) => (
                                    <TableRow key={row.ID}>
                                        <TableCell>{row.ID}</TableCell>
                                        <TableCell>{row.Emisor.Nombre}</TableCell>
                                        <TableCell>{row.Receptor.Nombre}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                   </Paper>
                }




            </Box>
        </Modal>
    )
}
