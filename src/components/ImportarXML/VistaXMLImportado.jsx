"use client";
import React, { useState, useEffect } from "react";
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { IconButton, Menu, MenuItem, Box, Chip, Typography } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";

const VistaXMLImportado = ({
    facturaXML,
    token,
    actualizarFacturas,
}) => {
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [facturas, setFacturas] = useState([]);

    // Convertir la factura XML al formato esperado por la tabla
    useEffect(() => {
        if (facturaXML) {
            const facturaFormateada = formatearFacturaParaTabla(facturaXML);
            setFacturas([facturaFormateada]);
        }
    }, [facturaXML]);

    // Función para formatear la factura XML para mostrar en tabla
    const formatearFacturaParaTabla = (factura) => {
        if (!factura) return null;

        return {
            // Información básica desde factura_completa
            Folio: factura.Folio || "",
            Serie: factura.Serie || "",
            Fecha: factura.Fecha || "",
            Total: factura.Total || 0,
            SubTotal: factura.SubTotal || 0,
            Moneda: factura.Moneda || "",

            // Emisor desde factura_completa
            Emisor: {
                RFC: factura.Emisor?.Rfc || factura.RFCEmisor || "",
                Nombre: factura.Emisor?.Nombre || factura.NombreEmisor || "",
                RegimenFiscal: factura.Emisor?.RegimenFiscal || "",
                Error: factura.validaciones?.emisor_valido ? "" : "record not found"
            },

            // Receptor desde factura_completa
            Receptor: {
                RFC: factura.Receptor?.Rfc || factura.RFCReceptor || "",
                Nombre: factura.Receptor?.Nombre || factura.NombreReceptor || "",
                UsoCFDI: factura.UsoCFDI || factura.Receptor?.UsoCFDI || "",
                Error: factura.validaciones?.receptor_valido ? "" : "record not found"
            },

            // Concepto (tomamos el primer concepto)
            Concepto: factura.Conceptos?.ListaConceptos?.[0] || {
                Descripcion: "",
                ClaveProdServ: "",
                Cantidad: 0,
                ValorUnitario: 0,
                Importe: 0
            },

            // Validaciones
            Validaciones: factura.validaciones || {},

            // ✅ Mantener la factura original completa para edición/guardado
            FacturaCompleta: factura
        };
    };

    // Tema personalizado para la tabla
    const getMuiTheme = () =>
        createTheme({
            components: {
                MUIDataTable: {
                    styleOverrides: {
                        root: {
                            backgroundColor: "#f5f5f5",
                        },
                        paper: {
                            boxShadow: "none",
                        },
                    },
                },
                MUIDataTableHeadCell: {
                    styleOverrides: {
                        root: {
                            backgroundColor: "#1b384a",
                            color: "white",
                            fontWeight: "bold",
                            textAlign: "center",
                        },
                    },
                },
                MUIDataTableBodyCell: {
                    styleOverrides: {
                        root: {
                            padding: "8px",
                            textAlign: "center",
                        },
                    },
                },
            },
        });

    // Manejo del menú de acciones
    const handleMenuClick = (event, rowData, rowIndex) => {
        setAnchorEl(event.currentTarget);
        setMenuRow({ rowData, rowIndex });
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    const handleEliminar = () => {
        setFacturas([]);
        if (actualizarFacturas) {
            actualizarFacturas([]);
        }
        handleMenuClose();
    };

    // Función para mostrar estado de validación
    const renderEstadoValidacion = (validaciones) => {
        if (!validaciones) return null;

        const todasValidas = validaciones.emisor_valido &&
            validaciones.receptor_valido &&
            validaciones.serie_valida &&
            !validaciones.duplicado;

        return (
            <Chip
                label={todasValidas ? "Válida" : "Con errores"}
                color={todasValidas ? "success" : "warning"}
                size="small"
            />
        );
    };

    // Función para formatear celdas con errores
    const renderCellWithError = (value, hasError) => {
        return (
            <span style={{ color: hasError ? "red" : "inherit" }}>
                {hasError ? `${value} no encontrado` : value}
            </span>
        );
    };

    // Columnas de la tabla optimizadas para XML
    const columns = [
        {
            name: "Folio",
            label: "Folio",
            options: {
                customBodyRender: (value) => value || "N/A",
            },
        },
        {
            name: "Serie",
            label: "Serie",
            options: {
                customBodyRender: (value) => value || "N/A",
            },
        },
        {
            name: "Fecha",
            label: "Fecha",
            options: {
                customBodyRender: (value) => {
                    if (!value) return "N/A";
                    try {
                        return new Date(value).toLocaleDateString('es-MX');
                    } catch {
                        return value;
                    }
                },
            },
        },
        {
            name: "Emisor",
            label: "Emisor",
            options: {
                customBodyRender: (value) =>
                    renderCellWithError(
                        value.Nombre || value.RFC,
                        value.Error === "record not found"
                    ),
            },
        },
        {
            name: "Receptor",
            label: "Receptor",
            options: {
                customBodyRender: (value) =>
                    renderCellWithError(
                        value.Nombre || value.RFC,
                        value.Error === "record not found"
                    ),
            },
        },
        {
            name: "Concepto",
            label: "Descripción",
            options: {
                customBodyRender: (value) => value.Descripcion || "N/A",
            },
        },
        {
            name: "Total",
            label: "Total",
            options: {
                customBodyRender: (value) =>
                    Number(value).toLocaleString("es-MX", {
                        style: "currency",
                        currency: "MXN",
                    }),
            },
        },
        {
            name: "Validaciones",
            label: "Estado",
            options: {
                customBodyRender: (value) => renderEstadoValidacion(value),
            },
        },
        {
            name: "estaTimbrado",
            label: "Estado",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const factura = facturas[tableMeta.rowIndex];
                    const estaTimbrado = factura.estaTimbrado;
                    const uuid = factura.infoTimbrado?.UUID;

                    if (estaTimbrado) {
                        return (
                            <Box>
                                <Chip
                                    label="✅ TIMBRADO"
                                    color="success"
                                    size="small"
                                />
                                <Typography variant="caption" display="block">
                                    UUID: {uuid ? `${uuid.substring(0, 8)}...` : 'N/A'}
                                </Typography>
                            </Box>
                        );
                    } else {
                        return (
                            <Chip
                                label="⏳ POR TIMBRAR"
                                color="warning"
                                size="small"
                            />
                        );
                    }
                },
            },
        },
        {
            name: "actions",
            label: "Acción",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    return (
                        <>
                            <IconButton
                                onClick={(event) =>
                                    handleMenuClick(event, facturas[tableMeta.rowIndex], tableMeta.rowIndex)
                                }
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl) && menuRow?.rowIndex === tableMeta.rowIndex}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={handleEliminar}>Eliminar</MenuItem>
                            </Menu>
                        </>
                    );
                },
            },
        },
    ];

    // Opciones de la tabla
    const options = {
        filterType: "dropdown",
        responsive: "standard",
        selectableRows: "none",
        download: false,
        print: false,
        viewColumns: false,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 25, 50],
        textLabels: {
            body: {
                noMatch: facturas.length === 0 ? "No hay facturas XML importadas" : "Cargando...",
            },
        },
        setTableProps: () => ({
            style: {
                minWidth: '100%',
                tableLayout: 'fixed'
            }
        }),
        setCellHeaderProps: () => ({
            style: {
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '150px'
            }
        })
    };

    return (
        <Box sx={{ marginTop: 2 }}>
            <Typography variant="h6" gutterBottom>
                Factura Importada desde XML
            </Typography>

            <ThemeProvider theme={getMuiTheme()}>
                <MUIDataTable
                    title={""}
                    data={facturas}
                    columns={columns}
                    options={options}
                />
            </ThemeProvider>
        </Box>
    );
};

export default VistaXMLImportado;