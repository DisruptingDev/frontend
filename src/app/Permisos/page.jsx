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
  Container,
  TextField,
  Avatar,
  Tooltip,
  CircularProgress,
  Chip,
  Snackbar,
  Alert
} from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { AssignmentInd, Close, Save } from "@mui/icons-material";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function AdministraRoles() {
  const [rolIdEditar, setRolIdEditar] = useState('');
  const [rol, setRol] = useState(null);
  const [editar, setEditar] = useState(false);
  const [actualizar, setActualizar] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [claveRol, setClaveRol] = useState('');
  const [descripcionRol, setDescripcionRol] = useState('');
  const [permisosSeleccionados, setPermisosSeleccionados] = useState({});
  const [modoAsignacion, setModoAsignacion] = useState(false);
  const [usuarios, setUsuarios] = useState([]);
  const [usuariosSeleccionados, setUsuariosSeleccionados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [permisos, setPermisos] = useState([]);
  const [secciones, setSecciones] = useState({});
  const [roles, setRoles] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const router = useRouter();
  const [token, setToken] = useState("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJJRCI6MiwiZW1haWwiOiJkZW1vQGRlbW8uY29tIiwiZXhwIjoxNzUxODUwNTI0fQ.HA-5JGdOVy6tOHHm-dJcgjM0fSh89ssaHmj2V5TbxUs");

  // console.log("token", token);

  // Mostrar notificación
  const showToast = (message, severity = 'success') => {
    setToast({
      open: true,
      message,
      severity
    });
  };

  // Obtener permisos desde la API
  const fetchPermisos = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Permiso`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPermisos(data);

        // Organizar permisos por sección
        const seccionesOrganizadas = {};
        data.forEach(permiso => {
          if (!seccionesOrganizadas[permiso.Seccion.Clave]) {
            seccionesOrganizadas[permiso.Seccion.Clave] = {
              nombre: permiso.Seccion.Descripcion,
              permisos: []
            };
          }
          seccionesOrganizadas[permiso.Seccion.Clave].permisos.push({
            id: permiso.ID, // Usamos el ID del permiso
            clave: permiso.Clave,
            descripcion: permiso.Descripcion
          });
        });

        setSecciones(seccionesOrganizadas);
      }
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      showToast('Error al cargar los permisos', 'error');
    }
  };

  // Obtener roles desde la API
  const fetchRoles = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setRoles(data);
      }
    } catch (error) {
      console.error("Error al cargar roles:", error);
      showToast('Error al cargar los roles', 'error');
    }
  };

  // Obtener usuarios desde la API
  const fetchUsuarios = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Usuario`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsuarios(data.map(usuario => ({
          id: usuario.ID,
          nombre: usuario.Nombre,
          email: usuario.Email,
          avatar: usuario.Nombre.charAt(0) + (usuario.Nombre.split(' ')[1]?.charAt(0) || '')
        })));
      }
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      showToast('Error al cargar los usuarios', 'error');
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const authToken = isAuthenticated();
      if (!authToken) {
        router.push("/IniciaSesion");
        return;
      }

      setToken(authToken);
      setLoading(true);

      try {
        await Promise.all([
          fetchPermisos(authToken),
          fetchRoles(authToken),
          fetchUsuarios(authToken)
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
        showToast('Error al cargar datos', 'error');
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [router, actualizar]);

  const handleOpenModal = (modo = 'crear', id = null) => {
    setOpenModal(true);
    setModoAsignacion(modo === 'asignar');
    setRol(null);
    if (id) setRolIdEditar(id);

    if (modo === 'crear') {
      setEditar(false);
      setClaveRol('');
      setDescripcionRol('');
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
    if (rolIdEditar && !modoAsignacion && openModal) { // Añade openModal a las dependencias
      const fetchRol = async () => {
        try {
          setLoading(true);
          const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol/${rolIdEditar}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          console.log("Fetching rol with ID:", rolIdEditar);

          if (response.ok) {
            const rolData = await response.json();
            setRol(rolData);
            setClaveRol(rolData.Clave);
            setDescripcionRol(rolData.Descripcion);

            // Convertir permisos del rol a formato {permisoId: true}
            const permisosRol = rolData.Permisos.reduce((acc, permiso) => {
              acc[permiso.ID] = true;
              return acc;
            }, {});

            setPermisosSeleccionados(permisosRol);
            setEditar(true);
          }
        } catch (error) {
          console.error("Error al cargar el rol:", error);
          showToast('Error al cargar el rol', 'error');
        } finally {
          setLoading(false);
        }
      };
      fetchRol();
    }
  }, [rolIdEditar, modoAsignacion, token, openModal]);

  const handleTogglePermiso = (permisoId) => {
    setPermisosSeleccionados(prev => ({
      ...prev,
      [permisoId]: !prev[permisoId]
    }));
  };

  const handleGuardarRol = async () => {
    try {
      setLoading(true);
      const permisosIDs = Object.keys(permisosSeleccionados)
        .filter(key => permisosSeleccionados[key])
        .map(id => parseInt(id));

      const payload = {
        Clave: claveRol,
        Descripcion: descripcionRol,
        PermisosID: permisosIDs
      };

      let url, method;
      if (editar) {
        url = `${apiUrl}/api/gestionusuarios/Rol/${rolIdEditar}`;
        method = 'PATCH';
      } else {
        url = `${apiUrl}/api/gestionusuarios/Rol`;
        method = 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        showToast(`Rol ${editar ? 'actualizado' : 'creado'} correctamente`, 'success');
        setActualizar(prev => !prev);
        handleCloseModal();
      } else {
        const errorData = await response.json();
        console.error("Error al guardar el rol:", errorData);
        showToast(`Error al ${editar ? 'actualizar' : 'crear'} el rol`, 'error');
      }
    } catch (error) {
      console.error("Error al guardar el rol:", error);
      showToast('Error en la conexión', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarRol = async (id) => {
    try {
      setLoading(true);
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        showToast('Rol eliminado correctamente', 'success');
        setActualizar(prev => !prev);
      } else {
        const errorData = await response.json();
        console.error("Error al eliminar el rol:", errorData);
        showToast('Error al eliminar el rol', 'error');
      }
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      showToast('Error en la conexión', 'error');
    } finally {
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

  const handleAsignarUsuarios = async () => {
    try {
      setLoading(true);

      // Asignar rol a cada usuario seleccionado
      const promises = usuariosSeleccionados.map(usuarioId =>
        fetch(`${apiUrl}/api/gestionusuarios/Usuario/${usuarioId}/Rol`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            RolID: rolIdEditar
          }),
        })
      );

      const results = await Promise.all(promises);
      const allSuccess = results.every(res => res.ok);

      if (allSuccess) {
        showToast(`${usuariosSeleccionados.length} usuario(s) asignado(s) correctamente`, 'success');
        setActualizar(prev => !prev);
        handleCloseModal();
      } else {
        showToast('Error al asignar algunos usuarios', 'error');
      }
    } catch (error) {
      console.error("Error al asignar usuarios:", error);
      showToast('Error en la conexión', 'error');
    } finally {
      setLoading(false);
    }
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
            sx={{
              backgroundColor: '#fff', // Color de fondo gris claro
              borderRadius: 2,
              boxShadow: 3,
              p: 2,
              minHeight: 'auto', // Permite que el contenido crezca según sea necesario
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">
                Administración de Roles y Permisos
              </Typography>
              <Button
                variant="contained"
                startIcon={<AssignmentInd />}
                sx={{
                  backgroundColor: '#009688', // Verde agua oscuro
                  '&:hover': { backgroundColor: '#00695f' } // Más oscuro al pasar el mouse
                }}
                onClick={() => handleOpenModal('crear')}
              >
                Crear Nuevo Rol
              </Button>
            </Box>

            <VistaRoles
              roles={roles}
              setRolIdEditar={setRolIdEditar}
              handleOpenModal={handleOpenModal}
              handleEliminarRol={handleEliminarRol}
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
                      Asignar usuarios al rol: {rol?.Descripcion}
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
                        sx={{
                          backgroundColor: '#009688',
                          '&:hover': { backgroundColor: '#00695f' }
                        }}
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
                      label="Clave del Rol"
                      value={claveRol}
                      onChange={(e) => setClaveRol(e.target.value)}
                      sx={{ mb: 2 }}
                      variant="outlined"
                    />

                    <TextField
                      fullWidth
                      label="Descripción del Rol"
                      value={descripcionRol}
                      onChange={(e) => setDescripcionRol(e.target.value)}
                      sx={{ mb: 4 }}
                      variant="outlined"
                      multiline
                      rows={2}
                    />

                    <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                      Permisos
                    </Typography>

                    {Object.entries(secciones).map(([seccionClave, seccionData]) => (
                      <Box key={seccionClave} mb={4}>
                        <Typography variant="subtitle1" sx={{
                          fontWeight: 'bold',
                          mb: 2,
                          p: 1,
                          backgroundColor: 'grey.100',
                          borderRadius: 1
                        }}>
                          {seccionData.nombre}
                        </Typography>
                        <Grid container spacing={2}>
                          {seccionData.permisos.map(permiso => (
                            <Grid item xs={12} sm={6} md={4} key={permiso.id}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={!!permisosSeleccionados[permiso.id]}
                                    onChange={() => handleTogglePermiso(permiso.id)}
                                    color="primary"
                                  />
                                }
                                label={
                                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                    <Typography>{permiso.descripcion}</Typography>
                                    <Chip
                                      label={permiso.clave}
                                      size="small"
                                      sx={{ mt: 0.5, alignSelf: 'flex-start' }}
                                      variant="outlined"
                                    />
                                  </Box>
                                }
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
                        disabled={!claveRol.trim() || !descripcionRol.trim() || loading}
                        sx={{
                          backgroundColor: '#009688',
                          '&:hover': { backgroundColor: '#00695f' }
                        }}
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

      {/* Notificación Toast */}
      <Snackbar
        open={toast.open}
        autoHideDuration={6000}
        onClose={() => setToast({ ...toast, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast({ ...toast, open: false })}
          severity={toast.severity}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </div>
  );
}
