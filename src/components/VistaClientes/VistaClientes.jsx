"use client"
import React, { useState, useEffect, useCallback } from 'react';
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme, Box, CircularProgress, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import textLabels from "@/components/DataTables/datatablesTextLabels";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaClientes = ({ setClienteIdEditar, actualizar, token }) => {
    const [receptores, setReceptores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);

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
                            overflowX: "auto"
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
                            whiteSpace: "nowrap"
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

    const handleMenuClick = (event, rowData) => {
        setAnchorEl(event.currentTarget);
        setMenuRow(rowData);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRow(null);
    };

    const handleEditar = () => {
        if (menuRow) {
            setClienteIdEditar(menuRow.ID);
            handleMenuClose();
        }
    };

    const fetchReceptores = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    const sortedData = data.sort((a, b) => b.ID - a.ID);
                    setReceptores(sortedData);
                } else {
                    console.error('Expected an array but received:', typeof data);
                }
            } catch (error) {
                console.error('Error fetching receptores:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchReceptores();
    }, [fetchReceptores, token]);

    useEffect(() => {
        if (actualizar) {
            fetchReceptores();
        }
    }, [actualizar, fetchReceptores]);

    // Columnas de la tabla
    const columns = [
        {
            name: "ID",
            label: "ID",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "Rfc",
            label: "RFC",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "Nombre",
            label: "Nombre",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "RegimenFiscalReceptor",
            label: "Régimen Fiscal",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "DomicilioFiscalReceptor",
            label: "Domicilio Fiscal",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "Acciones",
            label: "Acción",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const receptor = receptores[tableMeta.rowIndex];
                    if (receptor.Rfc === 'XAXX010101000') return null;
                    
                    return (
                        <>
                            <IconButton onClick={(event) => handleMenuClick(event, receptor)}>
                                <MoreVertIcon />
                            </IconButton>
                            <Menu
                                anchorEl={anchorEl}
                                open={Boolean(anchorEl) && menuRow?.ID === receptor.ID}
                                onClose={handleMenuClose}
                            >
                                <MenuItem onClick={handleEditar}>Editar</MenuItem>
                            </Menu>
                        </>
                    );
                }
            }
        }
    ];

    // Opciones de la tabla
    const options = {
        filterType: 'dropdown',
        responsive: 'standard',
        selectableRows: 'none',
        download: false,
        print: false,
        viewColumns: false,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 25, 50],
        textLabels: textLabels,
        customBodyRender: {
            noMatch: loading ? <CircularProgress /> : 'No hay clientes registrados'
        },
        setTableProps: () => ({
            style: {
                tableLayout: 'fixed'
            }
        })
    };

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <ThemeProvider theme={getMuiTheme()}>
                <MUIDataTable
                    title={"Lista de Clientes"}
                    data={receptores}
                    columns={columns}
                    options={options}
                />
            </ThemeProvider>
        </Box>
    );
};

export default VistaClientes;