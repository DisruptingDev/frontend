"use client";
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    IconButton,
    Menu,
    MenuItem,
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useState, useEffect } from "react";
import ModalEdicion from "./ModalEdicion";

const VistaFacturasImportadas = ({ facturasRecuperadas, token }) => {
    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [openModal, setOpenModal] = useState(false);
    const [emisor, setEmisor] = useState({});
    const [receptor, setReceptor] = useState({});

    useEffect(() => {
        setFacturas(facturasRecuperadas);
        setLoading(false);
    }, [facturasRecuperadas]);
    const handleOpenModal = () => {
        setOpenModal(true);
    };
    const handleCloseModal = () => {
        setOpenModal(false);
    };
    

    const handleMenuClick = (event, row) => {
        setAnchorEl(event.currentTarget);
        setMenuRow(row);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    const handleEditar = () => {
        console.log("Editar factura:", menuRow);
        const emisor = menuRow.Emisor;
        console.log("Emisor:", emisor); 
        const receptor = menuRow.Receptor;
        console.log("Receptor:", receptor);
        setReceptor(receptor);
        setEmisor(emisor);
        // setMenuRow(null);
        handleOpenModal(true);
    };

    const handleEliminar = (index) => {
        console.log("Eliminar factura en índice:", index);
        setMenuRow(null);

        // Lógica para eliminar factura del estado
        const nuevasFacturas = facturas.filter((_, i) => i !== index);
        setFacturas(nuevasFacturas);
    };

    return (
        <div>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ backgroundColor: "#04b2ca" }}>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Número
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Emisor
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Receptor
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Concepto
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                ClaveProdServ
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                ObjetoImpuesto
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                ClaveImpuesto
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                TasaOCuota
                            </TableCell>

                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Impuestos $
                            </TableCell>

                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Total
                            </TableCell>
                            <TableCell
                                sx={{
                                    fontSize: "1rem",
                                    fontWeight: "bold",
                                    color: "white",
                                    textAlign: "center",
                                }}
                            >
                                Acción
                            </TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {facturas.map((factura, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ textAlign: "center" }}>{index + 1}</TableCell>
                                {factura.Emisor.Error === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color:"red"}}>Emisor no encontrado</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Emisor.Nombre || factura.Emisor.RFC}
                                </TableCell>)}
                                {factura.Receptor.Error === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color:"red"}}>Receptor no encontrado</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Receptor.Nombre || factura.Receptor.RFC}
                                </TableCell>)}
                                
                              
                                <TableCell sx={{ textAlign: "center" }}>
                                    {factura.Concepto.Descripcion}
                                </TableCell>
                                {factura.Concepto['Error-ClaveProductoServicio'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color:"red"}}>Clave incorrecta</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Concepto.ClaveProductoServicio}
                                </TableCell>
                                )}
                                {factura.Impuesto['Error-ObjetoImpuesto'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color:"red"}}>ObjetoImpuesto incorrecto</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.ObjetoImpuesto}
                                </TableCell>
                                )}
                               {factura.Impuesto['Error-ClaveImpuesto'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color:"red"}}>ClaveImpuesto incorrecto</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.ClaveImpuesto}
                                </TableCell>
                                )}
                                {factura.Impuesto['Error-TasaOCuota'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color:"red"}}>TasaOCuota incorrecta</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.TasaOCuota}
                                </TableCell>
                                )}
                                <TableCell sx={{ textAlign: "center" }}>{factura.Impuesto.Monto}</TableCell>
                                <TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.Monto + factura.Impuesto.BaseImpuesto}
                                </TableCell>
                                <TableCell sx={{ textAlign: "center" }}>
                                    <IconButton onClick={(event) => handleMenuClick(event, factura)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                    >
                                        <MenuItem onClick={handleEditar}>Editar</MenuItem>
                                        <MenuItem onClick={() => handleEliminar(index)}>Eliminar</MenuItem>
                                    </Menu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            <ModalEdicion  open={openModal} handleClose={handleCloseModal} emisor={emisor} receptor={receptor} token={token} />
        </div>
    );
};

export default VistaFacturasImportadas;
