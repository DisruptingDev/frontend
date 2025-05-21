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

    // console.log('Emisor', emisorID);
    // console.log('Receptor', receptorID);

    const fetchData = useCallback(async () => {
        if (token && receptorID) {  // Asegurarse que tenemos receptorID
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

                    // Filtrar por ID del receptor
                    const filtered = normalizedData.filter(
                        factura => factura.Receptor?.ID === receptorID &&
                        factura.Emisor?.ID === emisorID
                    );

                    setFilteredFacturas(filtered.sort((a, b) => b.ID - a.ID));
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        }
    }, [token, receptorID]);  // Dependencia de receptorID en lugar de receptor

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSubmit = () => {
        if (selectedFacturas.length === 0 || !motivo) {
            alert("Selecciona al menos una factura y especifica el motivo");
            return;
        }
        onFacturasSeleccionadas({
            facturas: selectedFacturas,
            motivo
        });
    };

    const columns = [
        {
            name: "ID",
            label: "ID",
            options: {
                display: false // Ocultamos el ID ya que es interno
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

    return (
        <Box sx={{ mt: 3, p: 2, mb: 3, border: '1px dashed grey', borderRadius: 2 }}>
            <Typography variant="h6" gutterBottom>Facturas Relacionadas</Typography>

            {loading ? (
                <Typography>Cargando facturas...</Typography>
            ) : (
                <Box sx={{ my: 3 }}>
                    <MUIDataTable
                        title={`Facturas para ${receptor?.Nombre || 'Receptor'}`}
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
                    >
                        <MenuItem value="01">01 - Devolución de mercancía</MenuItem>
                        <MenuItem value="02">02 - Descuento aplicado</MenuItem>
                        <MenuItem value="03">03 - Rebaja o bonificación</MenuItem>
                        <MenuItem value="04">04 - Ajuste de precio</MenuItem>
                        <MenuItem value="05">05 - Ajuste por inflación</MenuItem>
                        <MenuItem value="06">06 - Otros</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={{ flex: 1 }}>
                    <TextField
                        label="Monto"
                        type="number"
                        inputProps={{ min: 0, step: "0.01" }}
                        variant="outlined"
                        value={selectedFacturas.reduce((sum, factura) => sum + (factura.Total || 0), 0).toFixed(2)}
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
                disabled={loading || selectedFacturas.length === 0}
            >
                Relacionar Facturas ({selectedFacturas.length})
            </Button>
        </Box>
    );
}