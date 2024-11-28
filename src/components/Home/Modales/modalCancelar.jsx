import {
    Modal,
    Box,
    Typography,
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
    Button,
} from "@mui/material";
import Select from "@/components/Select/Select";
import React, { useState } from "react";

const formatCurrency = (value) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(value);
  }

export default function ModalCancelar({
    openModalCancelar,
    handleCloseModal,
    facturasRemplazo,
    IDFacturaCancelada,
    token,
    setResultadoCancelar,
}) {
    const [motivo, setMotivo] = useState("");
    const [selectedRow, setSelectedRow] = useState(null); // Estado para almacenar la fila seleccionada

    const handleCheckboxChange = (row) => {
        console.log("row", row);
        setSelectedRow(selectedRow?.ID === row.ID ? null : row); // Alternar selección de fila
    };
    const handleCancelar = async () => {
        console.log("Factura cancelada");
        try {
            const body={
                ID: IDFacturaCancelada,
                Motivo: motivo,
                FolioReemplazo: motivo === "01" ? selectedRow.uuid : null,
            }
            console.log("body", body);
            const response = await fetch("https://facturacioncfditotal.com/api/cancelacionfacturas/Cancelar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify(body),
            });
            const data = await response.json();
            console.log("data", data);
            if (data.error) {
                
               setResultadoCancelar("error");
               handleCloseModal();
            } else {
                setResultadoCancelar("success");
                handleCloseModal();
            }
        } catch (error) {
            console.error("Error:", error);
        }
    }

    const handleClose = () => {
        handleCloseModal();
        setSelectedRow(null);
    }


    return (
        <Modal open={openModalCancelar} onClose={handleClose}>
            <Box
                sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    width: "auto",
                    minWidth: "600px",
                    bgcolor: "white",
                    minHeight: "200px",
                    boxShadow: 24,
                    p: 2,
                    borderRadius: "8px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "space-between",
                }}
            >
                <Typography sx={{ mb: 2, textAlign: 'center', fontSize: '1.2em' }}>Cancelar Factura</Typography>
                <FormControl variant="outlined" fullWidth>
                    <InputLabel id="motivo-label">Motivo</InputLabel>
                    <MuiSelect
                        labelId="motivo-label"
                        id="motivo-select"
                        label="Motivo"
                        value={motivo}
                        onChange={(e) => { setMotivo(e.target.value); setSelectedRow(null); }}
                    >
                        <MenuItem value="01">
                           01 - Comprobantes emitidos con errores con relación.
                        </MenuItem>
                        <MenuItem value="02">
                            02 -Comprobantes emitidos con errores sin relación
                        </MenuItem>
                        <MenuItem value="03"> 03 - No se llevó a cabo la operación</MenuItem>
                        <MenuItem value="04">
                            04 - Operación nominativa relacionada en una factura global
                        </MenuItem>
                    </MuiSelect>
                </FormControl>

                {/* <Select
                    nombre="Motivo"
                    url="208.109.245.251/api/catalogos/Catalogos/MotivosCancelacion"
                    clave="Clave"
                    descripcion="Descripcion"
                    fullWidth
                    value={motivo}
                    onChange={(e) => { setMotivo(e.target.value); setSelectedRow(null); }}
                /> */}
                {motivo === "01" && (
                    <Paper>
                        <TableContainer component={Paper}>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>No. Factura</TableCell>
                                        <TableCell>Emisor</TableCell>
                                        <TableCell>Receptor</TableCell>
                                        <TableCell>Total</TableCell>
                                        <TableCell>Seleccionar</TableCell>
                                    
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {facturasRemplazo.map((row) => (
                                        <TableRow key={row.ID}>
                                            <TableCell>{row.ID}</TableCell>
                                            <TableCell>{row.Emisor.Nombre}</TableCell>
                                            <TableCell>{row.Receptor.Nombre}</TableCell>
                                            <TableCell>{formatCurrency(row.Total)}</TableCell>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedRow?.ID === row.ID}
                                                    onChange={() => handleCheckboxChange(row)}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                )}
                <Button
                onClick={handleCancelar}
         variant="contained" sx={{
            mt: 2,
            
          }}>
                    Cancelar
                </Button>
                
            </Box>
            {/* <pre>{JSON.stringify(selectedRow,null,2)}</pre> */}
        </Modal>
        
    );
}
