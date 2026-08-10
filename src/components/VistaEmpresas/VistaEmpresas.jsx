import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
    MaterialReactTable,
    useMaterialReactTable,
} from 'material-react-table';
import { MRT_Localization_ES } from 'material-react-table/locales/es';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Box,
    IconButton,
    Menu,
    MenuItem,
    Typography,
    Drawer,
    Button,
    TextField,
    useTheme,
    useMediaQuery,
    Chip
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Edit as EditIcon,
    FilterList as FilterListIcon,
    Cancel as CancelIcon,
    CheckCircle as CheckCircleIcon,
    Draw,
    Download as DownloadIcon
} from '@mui/icons-material';
import { WithPermission } from '@/components/WithPermission';
import ModalExito from "@/components/Home/Modales/modalExito";
import ModalError from '@/components/Home/Modales/modalError';

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const VistaEmpresas = ({ setEmpresaIdEditar, actualizar, token }) => {
    const [emisores, setEmisores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRow, setMenuRow] = useState(null);
    const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
    const [openFirmarDialog, setOpenFirmarDialog] = useState(false);
    const [certFile, setCertFile] = useState(null);
    const [keyFile, setKeyFile] = useState(null);
    const [password, setPassword] = useState("");
    const [correo, setCorreo] = useState("");
    const [emisorSeleccionado, setEmisorSeleccionado] = useState(null);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');

    // Fetch Data
    const fetchEmisores = useCallback(async () => {
        if (token) {
            setLoading(true);
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
                    setEmisores([]);
                }
            } catch (error) {
                console.error('Error fetching emisores:', error);
                setEmisores([]);
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
            setEmpresaIdEditar(menuRow.ID);
            handleMenuClose();
        }
    };

    const handleFirmarManifiesto = () => {
        if (!menuRow) return;
        setEmisorSeleccionado(menuRow.ID);
        setCorreo(menuRow.Email || "");
        setPassword("");
        setCertFile(null);
        setKeyFile(null);

        setOpenFirmarDialog(true);
        handleMenuClose();
    };

    const handleEnviarManifiesto = async () => {

        if (!certFile || !keyFile) {
            alert("Debe seleccionar el certificado y la llave.");
            return;
        }

        if (!password) {
            alert("Debe capturar la contraseña.");
            return;
        }

        setLoading(true);

        try {

            const formData = new FormData();

            formData.append("cert", certFile);
            formData.append("key", keyFile);
            formData.append("password", password);
            formData.append("correo", correo);

            const response = await fetch(
                `${apiUrl}/api/gestores/FirmarManifiesto/${emisorSeleccionado}`,
                {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    body: formData,
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }

            setConfirmationMessage("Carta manifiesto firmada correctamente.");
            setOpenModalExito(true);
            setOpenFirmarDialog(false);

            fetchEmisores();

        } catch (error) {

            setConfirmationMessage(error.message || "Ocurrió un error.");
            setOpenModalError(true);

        } finally {

            setLoading(false);

        }

    };

    const handleDescargarManifiesto = () => {
        if (!menuRow?.CartaManifiestoPDF) {
            setConfirmationMessage("No existe el PDF del manifiesto.");
            setOpenModalError(true);
            return;
        }
        const link = document.createElement("a");
        link.href = `data:application/pdf;base64,${menuRow.CartaManifiestoPDF}`;
        link.download = `Carta_Manifiesto_${menuRow.Rfc}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        handleMenuClose();
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
                    <Box display="flex" alignItems="center" gap={1}>
                        <CheckCircleIcon color="success" fontSize="small" />
                        <Typography variant="caption" color="textSecondary">
                            Activa
                        </Typography>
                    </Box>
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
            accessorKey: 'Nombre',
            header: 'Nombre',
            size: 250,
            enableColumnFilter: true,
        },
        {
            accessorKey: 'Rfc',
            header: 'RFC',
            size: 150,
            enableColumnFilter: true,
        },
        {
            id: 'Estatus',
            header: 'Estatus',
            size: 120,
            enableColumnFilter: true,
            Cell: () => "Activa" // Estatus fijo por ahora, igual que en el original
        },
    ], []);

    // Responsive Logic
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    const table = useMaterialReactTable({
        columns,
        data: emisores,
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
                Nombre: false,
                Rfc: false,
                Timbres: false,
                Estatus: false,
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
                    <Typography variant="subtitle2" color="textSecondary">Timbres Disponibles:</Typography>
                    <Typography variant="body2">{row.original.Grupo?.TimbresDisponiblesPaquetes || 0}</Typography>
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
                    // fullWidth // Only full width on mobile if needed, or adjust via sx
                    sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                    Filtros
                </Button>
            );
        }
    });

    return (
        <Box sx={{ width: '100%' }}>
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
                <WithPermission permission="editar_emisores">

                    <MenuItem onClick={handleEditar}>
                        <EditIcon fontSize="small" sx={{ mr: 1 }} />
                        Editar
                    </MenuItem>

                    {!menuRow?.CartaManifiestoXML ? (

                        <MenuItem onClick={handleFirmarManifiesto}>
                            <Draw fontSize="small" sx={{ mr: 1 }} />
                            Firmar Manifiesto
                        </MenuItem>

                    ) : (

                        <MenuItem onClick={handleDescargarManifiesto}>
                            <DownloadIcon fontSize="small" sx={{ mr: 1 }} />
                            Descargar Manifiesto
                        </MenuItem>

                    )}

                </WithPermission>
            </Menu>
            <Dialog
                open={openFirmarDialog}
                onClose={() => setOpenFirmarDialog(false)}
                maxWidth="sm"
                fullWidth
            >

                <DialogTitle>
                    Firmar Carta Manifiesto
                </DialogTitle>

                <DialogContent>

                    <TextField
                        margin="normal"
                        fullWidth
                        label="Correo"
                        value={correo}
                        onChange={(e) => setCorreo(e.target.value)}
                    />

                    <TextField
                        margin="normal"
                        fullWidth
                        label="Contraseña de la FIEL"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />

                    <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        {certFile ? certFile.name : "Seleccionar certificado (.cer)"}

                        <input
                            hidden
                            type="file"
                            accept=".cer"
                            onChange={(e) => setCertFile(e.target.files[0])}
                        />

                    </Button>

                    <Button
                        component="label"
                        variant="outlined"
                        fullWidth
                        sx={{ mt: 2 }}
                    >
                        {keyFile ? keyFile.name : "Seleccionar llave (.key)"}

                        <input
                            hidden
                            type="file"
                            accept=".key"
                            onChange={(e) => setKeyFile(e.target.files[0])}
                        />

                    </Button>

                </DialogContent>

                <DialogActions>

                    <Button
                        onClick={() => setOpenFirmarDialog(false)}
                    >
                        Cancelar
                    </Button>

                    <Button
                        variant="contained"
                        onClick={handleEnviarManifiesto}
                        disabled={loading}
                    >
                        Firmar
                    </Button>

                </DialogActions>

            </Dialog>
            <ModalExito openModalSuccess={openModalExito} handleCloseModal={() => setOpenModalExito(false)} confirmationMessage={confirmationMessage} />
            <ModalError openModalError={openModalError} handleCloseModal={() => setOpenModalError(false)} confirmationMessage={confirmationMessage} />
        </Box>
    );
};

export default VistaEmpresas;