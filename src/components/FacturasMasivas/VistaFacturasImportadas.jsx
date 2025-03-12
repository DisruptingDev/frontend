"use client" // Indica que es un componente del lado del cliente
import React, { useState, useEffect } from 'react'; // Importa React y los hooks useState y useEffect
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
} from "@mui/material"; // Importa componentes de Material-UI para la tabla y la interfaz
import MoreVertIcon from "@mui/icons-material/MoreVert"; // Importa el icono para las acciones de la tabla
import ModalEdicion from "./ModalEdicion"; // Importa el modal para editar facturas

const VistaFacturasImportadas = ({
    facturasRecuperadas, // Lista de facturas recuperadas del Excel
    token,  // Token de autenticación
    actualizarFacturas // Función para actualizar las facturas
}) => {
    const [facturas, setFacturas] = useState([]); // Estado para almacenar las facturas
    const [loading, setLoading] = useState(true); // Estado de carga inicial
    const [anchorEl, setAnchorEl] = useState(null); // Estado para manejar el menú de opciones
    const [menuRow, setMenuRow] = useState(null); // Estado para identificar la fila seleccionada en el menú
    const [openModal, setOpenModal] = useState(false); // Estado para controlar la apertura del modal
    const [indexFacturaEditar, setIndexFacturaEditar] = useState(null); // Estado para almacenar el índice de la factura a editar
    const [facturaEditar, setFacturaEditar] = useState(null); // Estado para almacenar la factura a editar


    // Efecto para actualizar las facturas cuando cambia facturasRecuperadas
    useEffect(() => {
        setFacturas(facturasRecuperadas); // Actualiza las facturas
        setLoading(false);
    }, [facturasRecuperadas]);

    // Maneja la apertura del modal de edición
    const handleOpenModal = () => {
        setOpenModal(true);
    };
    
    // Maneja el cierre del modal de edición
    const handleCloseModal = () => {
        setOpenModal(false);
    };

    // Maneja la apertura del menú de opciones en una fila específica
    const handleMenuClick = (event, row, index) => {
        setAnchorEl(event.currentTarget);
        setMenuRow({ row, index });
    };

    // Cierra el menú de opciones
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    // Maneja la acción de editar una factura
    const handleEditar = () => {
        setFacturaEditar(menuRow.row); // Guarda la factura a editar
        setIndexFacturaEditar(menuRow.index); // Guarda el índice de la factura a editar
        handleOpenModal(); // Abre el modal de edición
        setMenuRow(null); // Resetea la fila seleccionada
        setAnchorEl(null); // Cierra el menú de opciones
    };

    // Actualiza la factura editada en la lista
    const ActualizarFactura = (factura) => {
        const nuevasFacturas = facturas.map((f, i) => i === indexFacturaEditar ? factura : f); // Reemplaza la factura editada
        setFacturas(nuevasFacturas); // Actualiza la lista de facturas
        actualizarFacturas(nuevasFacturas); // Actualiza las facturas en el componente padre
    };

    // Maneja la acción de eliminar una factura
    const handleEliminar = () => {
        const nuevasFacturas = facturas.filter((_, i) => i !== menuRow.index); // Filtra las facturas excluyendo la seleccionada
        setFacturas(nuevasFacturas); // Actualiza la lista de facturas
        actualizarFacturas(nuevasFacturas); // Actualiza las facturas en el componente padre
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
                        {/*Mapea las facturas, mostrando los errores*/}
                        {facturas.map((factura, index) => (
                            <TableRow key={index}>
                                <TableCell sx={{ textAlign: "center" }}>{index + 1}</TableCell>
                                {factura.Emisor.Error === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color: "red" }}>Emisor no encontrado</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Emisor.Nombre || factura.Emisor.RFC}
                                </TableCell>)}
                                {factura.Receptor.Error === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color: "red" }}>Receptor no encontrado</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Receptor.Nombre || factura.Receptor.RFC}
                                </TableCell>)}


                                <TableCell sx={{ textAlign: "center" }}>
                                    {factura.Concepto.Descripcion}
                                </TableCell>
                                {factura.Concepto['Error-ClaveProductoServicio'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color: "red" }}>Clave incorrecta</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Concepto.ClaveProductoServicio}
                                </TableCell>
                                )}
                                {factura.Impuesto['Error-ObjetoImpuesto'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color: "red" }}>ObjetoImpuesto incorrecto</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.ObjetoImpuesto}
                                </TableCell>
                                )}
                                {factura.Impuesto['Error-ClaveImpuesto'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color: "red" }}>ClaveImpuesto incorrecto</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.ClaveImpuesto}
                                </TableCell>
                                )}
                                {factura.Impuesto['Error-TasaOCuota'] === 'record not found' ? (
                                    <TableCell sx={{ textAlign: "center", color: "red" }}>TasaOCuota incorrecta</TableCell>
                                ) : (<TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.TasaOCuota}
                                </TableCell>
                                )}
                                <TableCell sx={{ textAlign: "center" }}>{factura.Impuesto.Monto}</TableCell>
                                <TableCell sx={{ textAlign: "center" }}>
                                    {factura.Impuesto.Monto + factura.Impuesto.BaseImpuesto}
                                </TableCell>
                                <TableCell sx={{ textAlign: "center" }}>
                                    <IconButton onClick={(event) => handleMenuClick(event, factura, index)}>
                                        <MoreVertIcon />
                                    </IconButton>
                                    <Menu
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleMenuClose}
                                    >

                                        <MenuItem onClick={handleEditar}>Editar</MenuItem>
                                        <MenuItem onClick={handleEliminar}>Eliminar</MenuItem>
                                    </Menu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
            {/*Modal de edición de facturas*/}
            <ModalEdicion open={openModal} handleClose={handleCloseModal} facturaEditar={facturaEditar} actualizarFactura={ActualizarFactura} token={token} />
        </div>
    );
};

export default VistaFacturasImportadas;
