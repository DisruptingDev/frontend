"use client";

import React, { useState, useEffect } from "react";
import { Box, Grid, CircularProgress, Alert } from "@mui/material";
import MUIDataTable from "mui-datatables";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu.jsx";
import textLabels from "@/components/DataTables/datatablesTextLabels";
import { useRouter } from "next/navigation";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ValidarPPD() {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const router = useRouter();

    // Definimos fetchData primero para que esté disponible
    const fetchData = async (token) => {
        try {
            const response = await fetch(`${apiUrl}/api/facturas/ListarFacturas?ppd=true`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/IniciaSesion');
                    return;
                }
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const result = await response.json();
            console.log("Datos recibidos:", result);
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (!token) {
            router.push('/IniciaSesion');
            return;
        }
        fetchData(token); // Ahora fetchData está definida
    }, []);

    const columns = [
        {
            name: "Folio",
            label: "Folio",
            options: {
                filter: true,
                sort: true,
            }
        },
        {
            name: "Emisor",
            label: "Emisor",
            options: {
                filter: true,
                customBodyRender: (value) => value?.Nombre || "N/A",
            }
        },
        {
            name: "Receptor",
            label: "Receptor",
            options: {
                filter: true,
                customBodyRender: (value) => value?.Nombre || "N/A",
            }
        },
        {
            name: "Total",
            label: "Saldo Insoluto",
            options: {
                filter: true,
                customBodyRender: (value) =>
                    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value || 0),
            }
        },
        {
            name: "fechaTimbrado",
            label: "Fecha de Timbrado",
            options: {
                filter: true,
                customBodyRender: (value) => new Date(value).toLocaleDateString('es-MX', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
            }
        },
        {
            name: "ID",
            label: "Acciones",
            options: {
                filter: false,
                sort: false,
                customBodyRender: (value, tableMeta) => {
                    const rowData = tableMeta.rowData; // Acceso a todos los datos de la fila
                    console.log("Row data:", rowData); // Verifica los datos de la fila
                    const facturaID = tableMeta.rowData[5]; // Recuperar el ID de la factura
                    console.log("Factura ID:", facturaID); // Verifica el ID de la factura
                    return (
                        <button
                            onClick={() => handleGenerarCP(rowData, facturaID)}
                            style={{ cursor: "pointer", background: "none", border: "none", color: "#007bff" }}
                        >
                            Generar CP
                        </button>
                    );
                },
            }
        },
    ];



    // Función para manejar el click en "Generar CP"
    const handleGenerarCP = async (rowData, facturaID) => {
        console.log("ID de la factura:", facturaID);
        console.log("Generar CP para:", rowData);
        console.log("Emisor ID", rowData[1].ID);
        const token = localStorage.getItem('authToken');
        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${rowData[1].ID}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Datos recibidos de la API:', data);
                const opciones = data.filter(opcion => opcion.TipoComprobante === 'P')
                console.log('Opciones:', opciones);
                if (opciones.length > 0) {
                    router.push(`/FacturaPago/${facturaID}`); // Redirige a la página de edición con el ID de la factura
                }
                else {
                    setConfirmationMessage('No existe serie de pago, validar');
                    setOpenModalError(true);
                }
            }
        } catch (error) {
            console.error('Error obteniendo la serie:', error);
        }
    };

    const options = {
        filter: true,
        search: true,
        pagination: true,
        selectableRows: "none",
        responsive: "standard",
        textLabels: textLabels,
    };

    if (loading) {
        return (
            <div>
                <Header />
                <Grid container>
                    <Grid item>
                        <SideBarMenu />
                    </Grid>
                    <Grid item xs>
                        <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                            <CircularProgress />
                        </Box>
                    </Grid>
                </Grid>
            </div>
        );
    }

    if (error) {
        return (
            <div>
                <Header />
                <Grid container>
                    <Grid item>
                        <SideBarMenu />
                    </Grid>
                    <Grid item xs>
                        <Box m={3}>
                            <Alert severity="error">Error al cargar los datos: {error}</Alert>
                        </Box>
                    </Grid>
                </Grid>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item xs>
                    <Box
                        ml={10}
                        mr={1}
                        mt={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        <MUIDataTable
                            title={"Validación de Facturas PPD"}
                            data={data}
                            columns={columns}
                            options={options}
                        />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}