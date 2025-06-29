"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import VistaRoles from "@/components/VistaRoles/VistaRoles";
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Divider,
    Grid,
    Checkbox,
    FormControlLabel,
    Typography,
    TextField,
    Avatar,
    CircularProgress
} from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { AssignmentInd, Close, Save } from "@mui/icons-material";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const PERMISOS = {
    facturacion: [
        { id: "enviar_correo", label: "Enviar por correo" },
        { id: "descargar_facturas", label: "Descargar facturas" },
        { id: "descargar_prefacturas", label: "Descargar prefacturas" },
        { id: "crear_facturas", label: "Crear facturas" },
        { id: "eliminar_facturas", label: "Eliminar facturas" },
        { id: "editar_facturas", label: "Editar facturas" },
        { id: "cancelar_facturas", label: "Cancelar facturas" }
    ],
    clientes: [
        { id: "alta_cliente", label: "Alta de cliente" },
        { id: "editar_cliente", label: "Editar cliente" },
        { id: "borrar_cliente", label: "Borrar cliente" }
    ]
};

export default function AdministraRoles() {
    const [rolIdEditar, setRolIdEditar] = useState('');
    const [rol, setRol] = useState(null);
    const [editar, setEditar] = useState(false);
    const [actualizar, setActualizar] = useState(false);
    const [openModal, setOpenModal] = useState(false);
    const [nombreRol, setNombreRol] = useState('');
    const [permisosSeleccionados, setPermisosSeleccionados] = useState({});
    const [modoAsignacion, setModoAsignacion] = useState(false);
    const [usuarios, setUsuarios] = useState([]);
    const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const [token, setToken] = useState("");

    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
            // Simular carga de usuarios
            setLoading(true);
            setTimeout(() => {
                setUsuarios([
                    { id: 1, nombre: "Ana Pérez", email: "ana@example.com", avatar: "AP" },
                    { id: 2, nombre: "Carlos Ruiz", email: "carlos@example.com", avatar: "CR" },
                    { id: 3, nombre: "María Gómez", email: "maria@example.com", avatar: "MG" },
                ]);
                setLoading(false);
            }, 1000);
        }
    }, [router]);

    const handleOpenModal = (modo = 'crear', id = null) => {
        setOpenModal(true);
        setModoAsignacion(modo === 'asignar');
        if (id) setRolIdEditar(id);

        if (modo === 'crear') {
            setEditar(false);
            setNombreRol('');
            setPermisosSeleccionados({});
        }
    };

    const handleCloseModal = () => {
        setRol(null);
        setRolIdEditar('');
        setEditar(false);
        setOpenModal(false);
        setModoAsignacion(false);
        setUsuariosSeleccionados([]);
    };

    useEffect(() => {
        if (rolIdEditar && !modoAsignacion) {
            async function fetchData() {
                try {
                    setLoading(true);
                    // Simular llamada a API
                    setTimeout(() => {
                        const dummyRol = {
                            id: rolIdEditar,
                            nombre: `Rol ${rolIdEditar}`,
                            permisos: ['enviar_correo', 'descargar_facturas']
                        };
                        setRol(dummyRol);
                        setNombreRol(dummyRol.nombre);
                        setPermisosSeleccionados(
                            dummyRol.permisos.reduce((acc, permiso) => {
                                acc[permiso] = true;
                                return acc;
                            }, {})
                        );
                        setEditar(true);
                        setLoading(false);
                    }, 500);
                } catch (error) {
                    console.error("Error al cargar el rol:", error);
                    setLoading(false);
                }
            }
            fetchData();
        }
    }, [rolIdEditar, modoAsignacion]);

    const handleTogglePermiso = (permisoId) => {
        setPermisosSeleccionados(prev => ({
            ...prev,
            [permisoId]: !prev[permisoId]
        }));
    };

    const handleGuardarRol = async () => {
        try {
            setLoading(true);
            const permisos = Object.keys(permisosSeleccionados).filter(key => permisosSeleccionados[key]);

            // Simular llamada a API
            setTimeout(() => {
                console.log({
                    nombre: nombreRol,
                    permisos,
                    id: editar ? rolIdEditar : null
                });
                setActualizar(prev => !prev);
                setLoading(false);
                handleCloseModal();
            }, 800);
        } catch (error) {
            console.error("Error al guardar el rol:", error);
            setLoading(false);
        }
    };

    const toggleUsuarioSeleccionado = (usuarioId) => {
        setUsuariosSeleccionados(prev =>
            prev.includes(usuarioId)
                ? prev.filter(id => id !== usuarioId)
                : [...prev, usuarioId]
        );
    };

    const handleAsignarUsuarios = () => {
        setLoading(true);
        // Simular llamada a API
        setTimeout(() => {
            console.log(`Asignando rol ${rolIdEditar} a usuarios:`, usuariosSeleccionados);
            setLoading(false);
            handleCloseModal();
            setActualizar(prev => !prev);
        }, 800);
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid >
                    <SideBarMenu />
                </Grid>
                <Grid>
                    <Box
                        ml={10}
                        mb={1}
                        width='93vw'
                    >
                        <VistaRoles
                            setRolIdEditar={setRolIdEditar}
                            actualizar={actualizar}
                            handleOpenModal={handleOpenModal}
                            loading={loading}
                        />

                        <Dialog
                            open={openModal}
                            onClose={handleCloseModal}
                            fullWidth
                            maxWidth="md"
                            PaperProps={{
                                sx: {
                                    borderRadius: 3
                                }
                            }}
                        >
                            <DialogContent sx={{ p: 4 }}>
                                {loading ? (
                                    <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
                                        <CircularProgress />
                                    </Box>
                                ) : modoAsignacion ? (
                                    <Box>
                                        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                            Asignar usuarios al rol
                                        </Typography>

                                        <Box sx={{
                                            maxHeight: '400px',
                                            overflowY: 'auto',
                                            mb: 3,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 1
                                        }}>
                                            {usuarios.map(usuario => (
                                                <Box
                                                    key={usuario.id}
                                                    sx={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        p: 2,
                                                        cursor: 'pointer',
                                                        backgroundColor: usuariosSeleccionados.includes(usuario.id)
                                                            ? 'primary.light'
                                                            : 'background.paper',
                                                        '&:hover': {
                                                            backgroundColor: 'action.hover'
                                                        }
                                                    }}
                                                    onClick={() => toggleUsuarioSeleccionado(usuario.id)}
                                                >
                                                    <Checkbox
                                                        checked={usuariosSeleccionados.includes(usuario.id)}
                                                        onChange={() => toggleUsuarioSeleccionado(usuario.id)}
                                                        onClick={(e) => e.stopPropagation()}
                                                        color="primary"
                                                    />
                                                    <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
                                                        {usuario.avatar}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography fontWeight="medium">{usuario.nombre}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            {usuario.email}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            ))}
                                        </Box>

                                        <Box display="flex" justifyContent="flex-end" gap={2}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Close />}
                                                onClick={handleCloseModal}
                                                disabled={loading}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="contained"
                                                startIcon={<Save />}
                                                onClick={handleAsignarUsuarios}
                                                disabled={usuariosSeleccionados.length === 0 || loading}
                                            >
                                                {loading ? 'Asignando...' : 'Guardar Asignación'}
                                            </Button>
                                        </Box>
                                    </Box>
                                ) : (
                                    <Box>
                                        <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
                                            {editar ? 'Editar Rol' : 'Crear Nuevo Rol'}
                                        </Typography>

                                        <TextField
                                            fullWidth
                                            label="Nombre del Rol"
                                            value={nombreRol}
                                            onChange={(e) => setNombreRol(e.target.value)}
                                            sx={{ mb: 4 }}
                                            variant="outlined"
                                        />

                                        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                                            Permisos
                                        </Typography>

                                        {Object.entries(PERMISOS).map(([categoria, permisos]) => (
                                            <Box key={categoria} mb={4}>
                                                <Typography variant="subtitle1" sx={{
                                                    fontWeight: 'bold',
                                                    mb: 2,
                                                    p: 1,
                                                    backgroundColor: 'grey.100',
                                                    borderRadius: 1
                                                }}>
                                                    {categoria.charAt(0).toUpperCase() + categoria.slice(1)}
                                                </Typography>
                                                <Grid container spacing={2}>
                                                    {permisos.map(permiso => (
                                                        <Grid item xs={12} sm={6} md={4} key={permiso.id}>
                                                            <FormControlLabel
                                                                control={
                                                                    <Checkbox
                                                                        checked={!!permisosSeleccionados[permiso.id]}
                                                                        onChange={() => handleTogglePermiso(permiso.id)}
                                                                        color="primary"
                                                                    />
                                                                }
                                                                label={permiso.label}
                                                            />
                                                        </Grid>
                                                    ))}
                                                </Grid>
                                            </Box>
                                        ))}

                                        <Divider sx={{ my: 3 }} />

                                        <Box display="flex" justifyContent="flex-end" gap={2}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Close />}
                                                onClick={handleCloseModal}
                                                disabled={loading}
                                            >
                                                Cancelar
                                            </Button>
                                            <Button
                                                variant="contained"
                                                startIcon={<Save />}
                                                onClick={handleGuardarRol}
                                                disabled={!nombreRol.trim() || loading}
                                            >
                                                {loading ? 'Guardando...' : 'Guardar Rol'}
                                            </Button>
                                        </Box>
                                    </Box>
                                )}
                            </DialogContent>
                        </Dialog>
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}
