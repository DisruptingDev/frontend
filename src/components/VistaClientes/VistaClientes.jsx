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
    Menu,
    MenuItem,
    CircularProgress,
    Typography,
    Drawer,
    Button,
    TextField,
    Tooltip,
    useTheme,
    useMediaQuery,
    Chip
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    FilterList as FilterListIcon,
    Cancel as CancelIcon,
} from '@mui/icons-material';
import { WithPermission } from '@/components/WithPermission';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaClientes = ({ setClienteIdEditar, actualizar, token }) => {
    const [receptores, setReceptores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [openFilterDrawer, setOpenFilterDrawer] = useState(false);

    // Fetch Data
    const fetchReceptores = useCallback(async () => {
        if (token) {
            setLoading(true);
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
                    setReceptores([]);
                }
            } catch (error) {
                console.error('Error fetching receptores:', error);
                setReceptores([]);
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

    // Menu Handlers
    const handleMenuClick = (event, rowOriginal) => {
        setAnchorEl(event.currentTarget);
        setMenuRow(rowOriginal);
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

    // Columns
    const columns = useMemo(() => [
        {
            id: 'MobileSummary',
            header: 'Resumen',
            enableColumnFilter: false,
            enableSorting: false,
            Cell: ({ row }) => (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="subtitle2" fontWeight="bold">
                            {row.original.Nombre || 'Sin Nombre'}
                        </Typography>
                        <Chip label={`ID: ${row.original.ID}`} size="small" variant="outlined" />
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                        RFC: {row.original.Rfc}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                        {row.original.RegimenFiscalReceptor}
                    </Typography>
                </Box>
            ),
        },
        {
            accessorKey: 'ID',
            header: 'ID',
            size: 80,
            enableColumnFilter: true,
        },
        {
            accessorKey: 'Rfc',
            header: 'RFC',
            size: 150,
            enableColumnFilter: true,
        },
        {
            accessorKey: 'Nombre',
            header: 'Nombre',
            size: 250,
            enableColumnFilter: true,
        },
        {
            accessorKey: 'RegimenFiscalReceptor',
            header: 'Régimen Fiscal',
            size: 200,
            enableColumnFilter: true,
        },
        {
            accessorKey: 'DomicilioFiscalReceptor',
            header: 'Domicilio Fiscal',
            size: 250,
            enableColumnFilter: true,
        },
    ], []);

    // Responsive Logic
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const table = useMaterialReactTable({
        columns,
        data: receptores,
        enableColumnActions: false,
        enableRowSelection: false,
        enableColumnFiltering: false, // Hide inline filters
        enableGlobalFilter: true,
        enableSorting: true,
        enableRowVirtualization: true,
        localization: MRT_Localization_ES,
        initialState: { density: 'comfortable' },
        muiTableBodyCellProps: {
            sx: { fontSize: '12px' },
        },
        muiTableHeadCellProps: {
            sx: {
                backgroundColor: '#1b384a',
                color: 'white',
                fontWeight: 'bold',
                fontSize: '12px',
            },
        },
        state: {
            isLoading: loading,
            showProgressBars: loading,
            columnVisibility: isMobile ? {
                MobileSummary: true,
                ID: false,
                Rfc: false,
                Nombre: false,
                RegimenFiscalReceptor: false,
                DomicilioFiscalReceptor: false,
            } : {
                MobileSummary: false,
            },
        },
        enableTableHead: !isMobile,
        enableRowActions: true,
        positionActionsColumn: 'last',
        displayColumnDefOptions: {
            'mrt-row-actions': {
                header: 'Acciones',
                size: 80,
            },
        },
        renderRowActions: ({ row }) => {
            if (row.original.Rfc === 'XAXX010101000') return null;
            return (
                <IconButton onClick={(e) => handleMenuClick(e, row.original)}>
                    <MoreVertIcon />
                </IconButton>
            );
        },
        renderDetailPanel: isMobile ? ({ row }) => (
            <Box sx={{
                display: 'grid',
                gap: '0.5rem',
                p: 2,
                backgroundColor: '#f5f5f5'
            }}>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Régimen Fiscal:</Typography>
                    <Typography variant="body2">{row.original.RegimenFiscalReceptor || '-'}</Typography>
                </Box>
                <Box>
                    <Typography variant="subtitle2" color="textSecondary">Domicilio Fiscal:</Typography>
                    <Typography variant="body2">{row.original.DomicilioFiscalReceptor || '-'}</Typography>
                </Box>
            </Box>
        ) : undefined,
        renderTopToolbarCustomActions: () => {
            // Show button on both mobile and desktop
            return (
                <Button
                    color="primary"
                    startIcon={<FilterListIcon />}
                    onClick={() => setOpenFilterDrawer(true)}
                    variant="contained"
                    size="small"
                    // fullWidth // Only full width on mobile if needed
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                    Filtros
                </Button>
            );
        }
    });

    return (
        <Box sx={{ width: '100%' }}>
            <WithPermission permission="ver_facturas"> {/* Assuming same permission or verified usage */}
                <MaterialReactTable table={table} />

                {/* --- MOBILE FILTER DRAWER --- */}
                <Drawer
                    anchor="right"
                    open={openFilterDrawer}
                    onClose={() => setOpenFilterDrawer(false)}
                >
                    <Box sx={{ width: 300, p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="h6">Filtros</Typography>
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
                        <TextField
                            label="ID"
                            variant="outlined"
                            size="small"
                            value={table.getColumn('ID')?.getFilterValue() || ''}
                            onChange={(e) => table.getColumn('ID').setFilterValue(e.target.value)}
                        />

                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => {
                                table.resetColumnFilters();
                                setOpenFilterDrawer(false);
                            }}
                        >
                            Limpiar Filtros
                        </Button>
                    </Box>
                </Drawer>

                {/* --- MENUS --- */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <WithPermission permission="editar_receptores">
                        <MenuItem onClick={handleEditar}>
                            <EditIcon fontSize="small" sx={{ mr: 1 }} /> Editar
                        </MenuItem>
                    </WithPermission>
                </Menu>
            </WithPermission>
        </Box>
    );
};

export default VistaClientes;