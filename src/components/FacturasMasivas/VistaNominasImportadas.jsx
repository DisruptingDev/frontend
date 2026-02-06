"use client";
import React, { useState, useEffect } from "react";
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { IconButton, Menu, MenuItem, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
// import ModalEdicion from "./ModalEdicion"; // Reusing or creating new modal? Leaving out for now or reusing if compatible.

const VistaNominasImportadas = ({
    facturasRecuperadas, // Keeping prop name generic or changing? Let's use generic "data" internally if possible, but prop from page is likely "facturasRecuperadas" or needs change in page. Let's keep consistency for now.
    token,
    actualizarFacturas,
}) => {
    const [nominas, setNominas] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    //   const [openModal, setOpenModal] = useState(false);
    //   const [indexNominaEditar, setIndexNominaEditar] = useState(null);
    //   const [nominaEditar, setNominaEditar] = useState(null);

    useEffect(() => {
        console.log("VistaNominasImportadas received data:", facturasRecuperadas);
        setNominas(facturasRecuperadas);
    }, [facturasRecuperadas]);

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

    const handleEditar = () => {
        // if (menuRow) {
        //   setNominaEditar(menuRow.rowData);
        //   setIndexNominaEditar(menuRow.rowIndex);
        //   setOpenModal(true);
        //   handleMenuClose();
        // }
        handleMenuClose(); // Placeholder
    };

    const handleEliminar = () => {
        if (menuRow) {
            const nuevasNominas = nominas.filter((_, i) => i !== menuRow.rowIndex);
            setNominas(nuevasNominas);
            actualizarFacturas(nuevasNominas); // Prop name still actualizarFacturas for compatibility
            handleMenuClose();
        }
    };

    // Función para formatear celdas con errores
    const renderCellWithError = (value, hasError) => {
        return (
            <span style={{ color: hasError ? "red" : "inherit" }}>
                {hasError ? `${value} no encontrado` : value}
            </span>
        );
    };

    // Columnas de la tabla
    const columns = [
        {
            name: "index",
            label: "Número",
            options: {
                customBodyRender: (value, tableMeta) => {
                    return tableMeta.rowIndex + 1;
                },
            },
        },
        {
            name: "RfcEmpleado", // Semantic name, key doesn't matter as we use customBodyRender with rowIndex for robust access
            label: "RFC Empleado",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    const rfc = row?.Receptor?.Rfc || row?.Rfc || row?.Nomina?.Receptor?.Rfc || "N/A";
                    const hasError = row?.Receptor?.Error === "record not found"; // Check error on Receptor if exists
                    return renderCellWithError(rfc, hasError);
                },
            },
        },
        {
            name: "Curp",
            label: "CURP",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Receptor?.Curp || row?.Curp || row?.Nomina?.Receptor?.Curp || "N/A";
                }
            },
        },
        {
            name: "NumEmpleado",
            label: "No. Empleado",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Receptor?.NumEmpleado || row?.NumEmpleado || row?.Nomina?.Receptor?.NumEmpleado || "N/A";
                }
            },
        },
        {
            name: "Nombre",
            label: "Nombre",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    const nombre = row?.Receptor?.Nombre || row?.Nombre || row?.Nomina?.Receptor?.Nombre || "Desconocido";
                    const hasError = row?.Receptor?.Error === "record not found";
                    return renderCellWithError(nombre, hasError);
                },
            },
        },
        {
            name: "TipoContrato",
            label: "Tipo Contrato",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Receptor?.TipoContrato || row?.TipoContrato || row?.Nomina?.Receptor?.TipoContrato || "N/A";
                }
            },
        },
        {
            name: "TipoRegimen",
            label: "Tipo Régimen",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Receptor?.TipoRegimen || row?.TipoRegimen || row?.Nomina?.Receptor?.TipoRegimen || "N/A";
                }
            },
        },
        {
            name: "PeriodicidadPago",
            label: "Periodicidad Pago",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Receptor?.PeriodicidadPago || row?.PeriodicidadPago || row?.Nomina?.Receptor?.PeriodicidadPago || "N/A";
                }
            },
        },
        {
            name: "FechaPago",
            label: "Fecha Pago",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Nomina?.FechaPago || row?.FechaPago || "N/A";
                }
            },
        },
        {
            name: "FechaInicialPago",
            label: "Fecha Inicial Pago",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Nomina?.FechaInicialPago || row?.FechaInicialPago || "N/A";
                }
            },
        },
        {
            name: "FechaFinalPago",
            label: "Fecha Final Pago",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Nomina?.FechaFinalPago || row?.FechaFinalPago || "N/A";
                }
            },
        },
        {
            name: "NumDiasPagados",
            label: "Días Pagados",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const row = nominas[tableMeta.rowIndex];
                    return row?.Nomina?.NumDiasPagados || row?.NumDiasPagados || "N/A";
                }
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
                                    handleMenuClick(event, nominas[tableMeta.rowIndex], tableMeta.rowIndex)
                                }
                            >
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl) && menuRow?.rowIndex === tableMeta.rowIndex}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={handleEditar}>Editar</MenuItem>
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
                noMatch: nominas.length === 0 ? "No hay nóminas importadas" : "Cargando...",
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
            <ThemeProvider theme={getMuiTheme()}>
                <MUIDataTable
                    title={"Nóminas Importadas"}
                    data={nominas}
                    columns={columns}
                    options={options}
                />
            </ThemeProvider>
        </Box>
    );
};

export default VistaNominasImportadas;
