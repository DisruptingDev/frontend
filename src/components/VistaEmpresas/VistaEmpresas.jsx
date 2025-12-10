import React, { useState, useEffect, useCallback } from 'react';
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme, Box, CircularProgress, IconButton, Menu, MenuItem } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import textLabels from "@/components/DataTables/datatablesTextLabels";
import { WithPermission } from '@/components/WithPermission';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaEmpresas = ({ setEmpresaIdEditar, actualizar, token }) => {
    const [emisores, setEmisores] = useState([]);
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
                            overflowX: "auto",
                            width: "100%"
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
                            whiteSpace: "nowrap",
                            padding: "12px"
                        },
                    },
                },
                MUIDataTableBodyCell: {
                    styleOverrides: {
                        root: {
                            padding: "12px",
                            textAlign: "center",
                            whiteSpace: "nowrap"
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
            setEmpresaIdEditar(menuRow.ID);
            handleMenuClose();
        }
    };

    const fetchEmisores = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Emisor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    const sortedData = data.sort((a, b) => b.ID - a.ID);
                    setEmisores(sortedData);
                } else {
                    console.error('Expected an array but received:', typeof data);
                }
            } catch (error) {
                console.error('Error fetching emisores:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchEmisores();
    }, [fetchEmisores, token]);

    useEffect(() => {
        if (actualizar) {
            fetchEmisores();
        }
    }, [actualizar, fetchEmisores]);

    // Columnas de la tabla
    const columns = [
        {
            name: "ID",
            label: "ID",
            options: {
                filter: true,
                sort: true,
                setCellProps: () => ({ style: { textAlign: 'center' } })
            }
        },
        {
            name: "Nombre",
            label: "Nombre",
            options: {
                filter: true,
                sort: true,
                setCellProps: () => ({ style: { textAlign: 'center' } })
            }
        },
        {
            name: "Rfc",
            label: "RFC",
            options: {
                filter: true,
                sort: true,
                setCellProps: () => ({ style: { textAlign: 'center' } })
            }
        },
        {
            name: "Timbres",
            label: "Timbres Disponibles",
            options: {
                filter: true,
                sort: true,
                setCellProps: () => ({ style: { textAlign: 'center' } })
            }
        },
        {
            name: "Estatus",
            label: "Estatus",
            options: {
                filter: true,
                sort: true,
                setCellProps: () => ({ style: { textAlign: 'center' } }),
                customBodyRender: () => "Activa"
            }
        },
        {
            name: "Acciones",
            label: "Acción",
            options: {
                filter: false,
                sort: false,
                setCellProps: () => ({ style: { textAlign: 'center' } }),
                customBodyRender: (value, tableMeta) => {
                    const emisor = emisores[tableMeta.rowIndex];
                    return (
                        <div>

                            <IconButton onClick={(event) => handleMenuClick(event, emisor)}>
                                <MoreVertIcon />
                            </IconButton>
                            <WithPermission permission="editar_emisores">
                                <Menu
                                    anchorEl={anchorEl}
                                    open={Boolean(anchorEl) && menuRow?.ID === emisor.ID}
                                    onClose={handleMenuClose}
                                >
                                    <MenuItem onClick={handleEditar}>Editar</MenuItem>
                                </Menu>
                            </WithPermission>
                        </div>
                    );
                }
            }
        }
    ];

    // Preparación de datos para la tabla
    const tableData = emisores.map(emisor => [
        emisor.ID,
        emisor.Nombre,
        emisor.Rfc,
        emisor.Grupo?.TimbresDisponiblesPaquetes || 0,
        "Activa", // Estatus fijo
        null // Acciones (se renderiza con customBodyRender)
    ]);

    // Opciones de la tabla
    const options = {
        filterType: 'dropdown',
        fixedHeader: true,
        fixedSelectColumn: false,
        responsive: 'standard',
        selectableRows: 'none',
        download: false,
        print: false,
        viewColumns: false,
        rowsPerPage: 10,
        rowsPerPageOptions: [10, 25, 50],
        textLabels: textLabels,
        setTableProps: () => ({
            style: {
                tableLayout: 'fixed',
                width: '100%'
            }
        }),
        onTableInit: (action, state) => {
            console.log('Tabla inicializada:', state);
        }
    };

    return (
        <Box sx={{ width: '100%', overflow: 'hidden', p: 2 }}>
            <ThemeProvider theme={getMuiTheme()}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                        <CircularProgress />
                    </Box>
                ) : (
                    <MUIDataTable
                        title={"Lista de Empresas"}
                        data={tableData}
                        columns={columns}
                        options={options}
                    />
                )}
            </ThemeProvider>
        </Box>
    );
};

export default VistaEmpresas;