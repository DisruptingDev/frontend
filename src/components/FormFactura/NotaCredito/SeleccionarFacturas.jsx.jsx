'use client';
import { useState, useEffect, useCallback } from "react";
import { TextField, Button, Box, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import MUIDataTable from "mui-datatables";
import Emisor from "../Emisor/Emisor";

export default function SeleccionarFacturas({ receptor, token, onFacturasSeleccionadas, emisorID, receptorID }) {
    const [facturas, setFacturas] = useState([]);
    const [filteredFacturas, setFilteredFacturas] = useState([]);
    const [selectedFacturas, setSelectedFacturas] = useState([]);
    const [motivo, setMotivo] = useState("");
    const [loading, setLoading] = useState(true);
    const [motivosRelacion, setMotivosRelacion] = useState([]);
    const [loadingMotivos, setLoadingMotivos] = useState(true);

    //console.log(emisorID, receptorID, "EmisorID y ReceptorID");

    // Función para cargar los motivos de relación
    const fetchMotivosRelacion = useCallback(async () => {
        if (token) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/catalogos/Catalogos/TipoRelacion`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const data = await response.json();

                if (Array.isArray(data)) {
                    setMotivosRelacion(data);
                }
            } catch (error) {
                console.error('Error fetching motivos de relación:', error);
            } finally {
                setLoadingMotivos(false);
            }
        }
    }, [token]);

    // Función para cargar las facturas 
    const fetchData = useCallback(async () => {
        if (token && receptorID) {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/facturas/ListarFacturas`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    }
                });
                const responseData = await response.json();

                if (Array.isArray(responseData)) {
                    const normalizedData = responseData.map(item => ({
                        ...item,
                        Conceptos: item.Conceptos || {
                            TotalImpuestosTrasladados: 0,
                            TotalImpuestosRetenidos: 0
                        },
                        Emisor: item.Emisor || {
                            Nombre: 'Desconocido',
                            Rfc: '',
                            ID: 0
                        },
                        Receptor: item.Receptor || {
                            Nombre: 'Desconocido',
                            Rfc: '',
                            ID: 0
                        },
                        Fecha: item.Fecha ? new Date(item.Fecha).toLocaleDateString() : 'Fecha desconocida',
                        Total: item.Total || 0,
                        Serie: item.Serie || '',
                        Folio: item.Folio || ''
                    }));

                    setFacturas(normalizedData.sort((a, b) => b.ID - a.ID));

                    const filtered = normalizedData.filter(
                        factura =>
                            factura.Receptor?.ID === receptorID &&
                            factura.Emisor?.ID === emisorID &&
                            factura.TipoDeComprobante === "I" &&
                            factura.uuid !== ""
                    );

                    setFilteredFacturas(filtered.sort((a, b) => b.ID - a.ID));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [token, receptorID, emisorID]);

    useEffect(() => {
        fetchMotivosRelacion();
        fetchData();
    }, [fetchMotivosRelacion, fetchData]);

    const handleSubmit = () => {
        if (selectedFacturas.length === 0 || !motivo) {
            alert("Selecciona al menos una factura y especifica el motivo");
            return;
        }

        const CFDIRelacionados = {
            TipoRelacion: motivo,
            ListaCFDIRelacionados: selectedFacturas.map(factura => ({
                UUID: factura.uuid
            })),
            SaldoTotalFacturasRelacionadas: sumaTotales
        };

        onFacturasSeleccionadas({ CFDIRelacionados });
    };


    const columns = [
        {
            name: "ID",
            label: "ID",
            options: {
                display: false
            }
        },
        {
            name: "Serie",
            label: "Serie",
            options: {
                customBodyRender: (value) => value
            }
        },
        {
            name: "Folio",
            label: "Folio",
            options: {
                customBodyRender: (value) => value
            }
        },
        {
            name: "uuid",
            label: "UUID",
            options: {
                customBodyRender: (value) => value
            }
        },
        {
            name: "Fecha",
            label: "Fecha",
            options: {
                customBodyRender: (value) => value
            }
        },
        {
            name: "Total",
            label: "Total",
            options: {
                customBodyRender: (value) => `$${parseFloat(value).toFixed(2)}`
            }
        },
        {
            name: "Receptor.Nombre",
            label: "Receptor",
            options: {
                customBodyRender: (value, tableMeta) => {
                    const receptor = tableMeta.rowData[5];
                    return receptor?.Nombre || 'Desconocido';
                },
                display: false
            }
        },
    ];

    const options = {
        selectableRows: "multiple",
        selectableRowsOnClick: true,
        onRowsSelect: (currentRowsSelected, allRowsSelected) => {
            const selected = allRowsSelected.map(
                row => filteredFacturas[row.dataIndex]
            );
            setSelectedFacturas(selected);
        },
        print: false,
        download: false,
        viewColumns: false,
        pagination: true,
        responsive: "standard",
        rowsPerPage: 5,
        rowsPerPageOptions: [5, 10, 20],
    };

    // Calcular la suma de los totales de las facturas seleccionadas
    const sumaTotales = selectedFacturas.reduce((acc, factura) => acc + (parseFloat(factura.Total) || 0), 0);

    return (
        <Box sx={{ mt: 3, p: 2, mb: 3, border: '1px dashed grey', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Facturas Relacionadas</Typography>

            {loading ? (
                <Typography>Cargando facturas...</Typography>
            ) : (
                <Box sx={{ my: 3 }}>
                    <MUIDataTable
                        title={`Relación de facturas`}
                        data={filteredFacturas}
                        columns={columns}
                        options={options}
                    />
                </Box>
            )}

            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl sx={{ flex: 1 }}>
                    <InputLabel>Motivo</InputLabel>
                    <Select
                        value={motivo}
                        label="Motivo"
                        onChange={(e) => setMotivo(e.target.value)}
                        required
                        disabled={loadingMotivos}
                    >
                        {loadingMotivos ? (
                            <MenuItem value="">Cargando motivos...</MenuItem>
                        ) : (
                            motivosRelacion.map((motivo) => (
                                <MenuItem key={motivo.ID} value={motivo.Clave}>
                                    {motivo.Clave} - {motivo.Descripcion}
                                </MenuItem>
                            ))
                        )}
                    </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                    <TextField
                        label="Monto"
                        type="number"
                        inputProps={{ min: 0, step: "0.01", readOnly: true }}
                        variant="outlined"
                        value={sumaTotales.toFixed(2)}
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </FormControl>
            </Box>

            <Button
                variant="contained"
                onClick={handleSubmit}
                sx={{ mt: 2 }}
                disabled={loading || selectedFacturas.length === 0 || loadingMotivos}
            >
                Relacionar Facturas ({selectedFacturas.length})
            </Button>
        </Box>
    );
}