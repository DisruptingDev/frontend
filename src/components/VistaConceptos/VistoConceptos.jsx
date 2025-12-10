import { useState, useEffect, useCallback } from "react";
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme, Box, CircularProgress } from "@mui/material";
import textLabels from "@/components/DataTables/datatablesTextLabels";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaConceptos = ({ token, actualizar, setActualizar }) => {
    const [conceptos, setConceptos] = useState([]);
    const [loading, setLoading] = useState(true);

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

    const fetchConceptos = useCallback(async () => {
        if (token) {
            setLoading(true);
            try {
                const response = await fetch(`${apiUrl}/api/conceptos/ListarConceptos`, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    const sortedData = data.sort((a, b) => b.ID - a.ID);
                    setConceptos(sortedData);
                } else {
                    console.error("Expected an array but received:", typeof data);
                }
            } catch (error) {
                console.error("Error fetching conceptos:", error);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchConceptos();
    }, [fetchConceptos, token]);

    useEffect(() => {
        if (actualizar) {
            fetchConceptos();
            setActualizar(false);
        }
    }, [actualizar, setActualizar, fetchConceptos]);

    // Preparar los datos para la tabla
    const prepareData = () => {
        return conceptos.map((concepto) => ({
            ID: concepto.ID,
            ClaveProdServ: concepto.ClaveProdServ,
            ClaveUnidad: concepto.ClaveUnidad,
            Nombre: concepto.Nombre,
            Descripcion: concepto.Descripcion,
            Traslados: concepto.Impuestos?.Traslados?.map(t => t.ImpuestoCatalogo?.Descripcion).join(", ") || "",
            Retenciones: concepto.Impuestos?.Retenciones?.map(r => r.ImpuestoCatalogo?.Descripcion).join(", ") || ""
        }));
    };

    // Columnas de la tabla
    const columns = [
        {
            name: "ID",
            label: "ID",
            options: {
                filter: true,
                sort: true,
            },
        },
        {
            name: "ClaveProdServ",
            label: "ClaveProdServ",
            options: {
                filter: true,
                sort: true,
            },
        },
        {
            name: "ClaveUnidad",
            label: "ClaveUnidad",
            options: {
                filter: true,
                sort: true,
            },
        },
        {
            name: "Nombre",
            label: "Nombre",
            options: {
                filter: true,
                sort: true,
            },
        },
        {
            name: "Descripcion",
            label: "Descripción",
            options: {
                filter: true,
                sort: true,
            },
        },
        {
            name: "Traslados",
            label: "Traslados",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) => (
                    <div style={{ whiteSpace: "normal" }}>{value}</div>
                ),
            },
        },
        {
            name: "Retenciones",
            label: "Retenciones",
            options: {
                filter: true,
                sort: true,
                customBodyRender: (value) => (
                    <div style={{ whiteSpace: "normal" }}>{value}</div>
                ),
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
        textLabels: textLabels,
        setTableProps: () => ({
            style: {
                tableLayout: "fixed",
            },
        }),
    };

    return (
        <Box sx={{ width: "100%", overflow: "hidden", p: 2 }}>
            <ThemeProvider theme={getMuiTheme()}>
                {loading ? (
                    <Box display="flex" justifyContent="center" alignItems="center" height="200px">
                        <CircularProgress />
                    </Box>
                ) : (
                    <MUIDataTable
                        title={"Lista de Conceptos"}
                        data={prepareData()}
                        columns={columns}
                        options={options}
                    />
                )}
            </ThemeProvider>
        </Box>
    );
};

export default VistaConceptos;