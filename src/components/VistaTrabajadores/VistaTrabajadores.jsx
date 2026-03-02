'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
    MRT_Localization_ES,
} from 'material-react-table';
import {
    Box,
    IconButton,
    CircularProgress,
    Typography,
    Drawer,
    Button,
    TextField,
    useTheme,
    useMediaQuery,
    Chip
} from '@mui/material';
import {
    FilterList as FilterListIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { WithPermission } from '@/components/WithPermission';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaTrabajadores = ({ token }) => {
    const [trabajadores, setTrabajadores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

    const fetchTrabajadores = useCallback(async () => {
        if (token) {
            setLoading(true);
            try {
                // Por ahora usamos el catálogo de receptores ya que los trabajadores se registran ahí
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor`, {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                    },
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    // Si el catálogo de receptores tiene algún campo que identifique trabajadores, 
                    // podríamos filtrar aquí. Por ahora mostramos todos los receptores.
                    const sortedData = data.sort((a, b) => b.ID - a.ID);
                    setTrabajadores(sortedData);
                } else {
                    setTrabajadores([]);
                }
            } catch (error) {
                console.error('Error fetching trabajadores:', error);
                setTrabajadores([]);
            } finally {
                setLoading(false);
            }
        }
    }, [token]);

    useEffect(() => {
        fetchTrabajadores();
    }, [fetchTrabajadores, token]);

    const columns = useMemo(() => [
        {
            accessorKey: 'ID',
            header: 'ID',
            size: 80,
        },
        {
            accessorKey: 'Rfc',
            header: 'RFC',
            size: 150,
        },
        {
            accessorKey: 'Nombre',
            header: 'Nombre',
            size: 250,
        },
        {
            accessorKey: 'Curp', // Asumimos que viene el CURP si se registró vía nómina
            header: 'CURP',
            size: 200,
            Cell: ({ cell }) => cell.getValue() || '-',
        },
        {
            accessorKey: 'DomicilioFiscalReceptor',
            header: 'CP / Domicilio',
            size: 150,
        }
    ], []);

    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const table = useMaterialReactTable({
        columns,
        data: trabajadores,
        enableColumnActions: false,
        enableRowSelection: false,
        enableColumnFiltering: false,
        enableGlobalFilter: true,
        enableSorting: true,
        localization: MRT_Localization_ES,
        initialState: { density: 'compact' },
        muiTableBodyCellProps: {
            sx: { fontSize: '13px' },
        },
        muiTableHeadCellProps: {
            sx: {
                backgroundColor: '#1b384a',
                color: 'white',
                fontWeight: 'bold',
            },
        },
        state: {
            isLoading: loading,
        },
        renderTopToolbarCustomActions: () => (
            <Box display="flex" gap={1}>
                <Button
                    color="primary"
                    startIcon={<FilterListIcon />}
                    onClick={() => setOpenFilterDrawer(true)}
                    variant="contained"
                    size="small"
                >
                    Filtros
                </Button>
            </Box>
        )
    });

    return (
        <Box sx={{ width: '100%', p: 2 }}>
            <WithPermission permission="ver_receptores">
                <MaterialReactTable table={table} />

                <Drawer
                    anchor="right"
                    open={openFilterDrawer}
                    onClose={() => setOpenFilterDrawer(false)}
                >
                    <Box sx={{ width: 300, p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h6">Filtrar Personal</Typography>
                            <IconButton onClick={() => setOpenFilterDrawer(false)}>
                                <CancelIcon />
                            </IconButton>
                        </Box>

                        <TextField
                            label="Nombre"
                            variant="outlined"
                            size="small"
                            value={table.getColumn('Nombre')?.getFilterValue() || ''}
                            onChange={(e) => table.getColumn('Nombre').setFilterValue(e.target.value)}
                        />

                        <TextField
                            label="RFC"
                            variant="outlined"
                            size="small"
                            value={table.getColumn('Rfc')?.getFilterValue() || ''}
                            onChange={(e) => table.getColumn('Rfc').setFilterValue(e.target.value)}
                        />

                        <Button
                            variant="outlined"
                            color="secondary"
                            sx={{ mt: 2 }}
                            onClick={() => {
                                table.resetColumnFilters();
                                setOpenFilterDrawer(false);
                            }}
                        >
                            Limpiar Filtros
                        </Button>
                    </Box>
                </Drawer>
            </WithPermission>
        </Box>
    );
};

export default VistaTrabajadores;
