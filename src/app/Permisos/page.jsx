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
  CircularProgress,
  Chip,
  Snackbar,
  Alert,
  IconButton,
  Tooltip
} from "@mui/material";
import { isAuthenticated } from "@/utils/authRedirect";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { AssignmentInd, Close, Save, CheckBox, CheckBoxOutlineBlank } from "@mui/icons-material";

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
  const [loading, setLoading] = useState({
    page: true,
    modal: false,
    usuarios: false,
    roles: false,
    permisos: false
  });
  const [permisos, setPermisos] = useState([]);
  const [secciones, setSecciones] = useState({});
  const [roles, setRoles] = useState([]);
  const [toast, setToast] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const router = useRouter();
  const [token, setToken] = useState("");

  // Mostrar notificación
  const showToast = (message, severity = 'success') => {
    setToast({
      open: true,
      message,
      severity
    });
  };

  // Obtener permisos desde la API (incluyendo Módulo de Cobranza)
  const fetchPermisos = async () => {
    try {
      setLoading(prev => ({ ...prev, permisos: true }));
      let data = [];

      try {
        const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Permiso`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
          const resData = await response.json();
          if (Array.isArray(resData)) data = resData;
        }
      } catch (e) {
        console.warn('Error fetching main catalog permissions:', e.message);
      }

      // Obtener y unificar permisos del módulo de cobranza
      try {
        const resCob = await fetch('/api/cobranza/permisos').then(r => r.json()).catch(() => []);
        if (Array.isArray(resCob) && resCob.length > 0) {
          const clavesExistentes = new Set(data.map(p => (p.Clave || p.clave)));
          resCob.forEach(p => {
            if (!clavesExistentes.has(p.Clave || p.clave)) {
              data.push(p);
            }
          });
        }
      } catch (e) {
        console.warn('Error fetching local cobranza permissions:', e.message);
      }

      setPermisos(data);

      // Organizar permisos por sección
      const seccionesOrganizadas = {};
      data.forEach(permiso => {
        const secClave = permiso.Seccion?.Clave || permiso.seccion?.clave || 'GENERAL';
        const secNombre = permiso.Seccion?.Descripcion || permiso.seccion?.descripcion || secClave;

        if (!seccionesOrganizadas[secClave]) {
          seccionesOrganizadas[secClave] = {
            nombre: secNombre,
            permisos: []
          };
        }
        seccionesOrganizadas[secClave].permisos.push({
          id: permiso.ID || permiso.id,
          clave: permiso.Clave || permiso.clave,
          descripcion: permiso.Descripcion || permiso.descripcion
        });
      });

      setSecciones(seccionesOrganizadas);
    } catch (error) {
      console.error("Error al cargar permisos:", error);
      showToast('Error al cargar los permisos', 'error');
    } finally {
      setLoading(prev => ({ ...prev, permisos: false }));
    }
  };

  // Obtener roles desde la API
  const fetchRoles = async () => {
    try {
      setLoading(prev => ({ ...prev, roles: true }));
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRoles(data);
    } catch (error) {
      console.error("Error al cargar roles:", error);
      showToast('Error al cargar los roles', 'error');
    } finally {
      setLoading(prev => ({ ...prev, roles: false }));
    }
  };

  // Obtener usuarios desde la API
  const fetchUsuarios = async () => {
    try {
      setLoading(prev => ({ ...prev, usuarios: true }));
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Usuario`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsuarios(data.map(usuario => ({
        id: usuario.ID,
        nombre: usuario.Nombre,
        email: usuario.Email,
        avatar: usuario.Nombre.charAt(0) + (usuario.Nombre.split(' ')[1]?.charAt(0) || '')
      })));
    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      // No mostramos el toast aquí para evitar el mensaje inicial
      showToast('Error al cargar los usuarios', 'error');
    } finally {
      setLoading(prev => ({ ...prev, usuarios: false, page: false }));
    }
  };

  // Efecto para verificar autenticación y cargar datos iniciales
  useEffect(() => {
    const authToken = isAuthenticated();
    if (!authToken) {
      router.push("/IniciaSesion");
      return;
    }
    setToken(authToken);
  }, [router]);

  // Efecto para cargar datos cuando el token cambia
  useEffect(() => {
    if (!token) return;

    const loadData = async () => {
      try {
        await Promise.all([
          fetchPermisos(),
          fetchRoles(),
          fetchUsuarios()
        ]);
      } catch (error) {
        console.error("Error loading data:", error);
        showToast('Error al cargar datos', 'error');
      }
    };

    loadData();
  }, [token, actualizar]);

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
    setLoading(prev => ({ ...prev, modal: false }));
  };

  // Efecto para cargar datos del rol cuando se edita
  useEffect(() => {
    if (!rolIdEditar || modoAsignacion || !openModal || !token) return;

    const fetchRol = async () => {
      try {
        setLoading(prev => ({ ...prev, modal: true }));
        const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol/${rolIdEditar}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const rolData = await response.json();
        setRol(rolData);
        setClaveRol(rolData.Clave);
        setDescripcionRol(rolData.Descripcion);

        const permisosRol = rolData.Permisos.reduce((acc, permiso) => {
          acc[permiso.ID] = true;
          return acc;
        }, {});

        setPermisosSeleccionados(permisosRol);
        setEditar(true);
      } catch (error) {
        console.error("Error al cargar el rol:", error);
        showToast('Error al cargar el rol', 'error');
      } finally {
        setLoading(prev => ({ ...prev, modal: false }));
      }
    };

    fetchRol();
  }, [rolIdEditar, modoAsignacion, token, openModal]);

  const handleTogglePermiso = (permisoId) => {
    setPermisosSeleccionados(prev => ({
      ...prev,
      [permisoId]: !prev[permisoId]
    }));
  };

  // Función para marcar/desmarcar todos los permisos de una sección
  const toggleAllPermisos = (seccionClave) => {
    const seccion = secciones[seccionClave];
    if (!seccion) return;

    const allSelected = seccion.permisos.every(permiso => permisosSeleccionados[permiso.id]);
    
    const nuevosPermisos = { ...permisosSeleccionados };
    
    seccion.permisos.forEach(permiso => {
      nuevosPermisos[permiso.id] = !allSelected;
    });

    setPermisosSeleccionados(nuevosPermisos);
  };

  const handleGuardarRol = async () => {
    try {
      setLoading(prev => ({ ...prev, modal: true }));
      const permisosIDs = Object.keys(permisosSeleccionados)
        .filter(key => permisosSeleccionados[key])
        .map(id => parseInt(id));

      const payload = {
        Clave: claveRol,
        Descripcion: descripcionRol,
        PermisosID: permisosIDs
      };

      const url = editar 
        ? `${apiUrl}/api/gestionusuarios/Rol/${rolIdEditar}`
        : `${apiUrl}/api/gestionusuarios/Rol`;
      
      const method = editar ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en la respuesta del servidor');
      }

      showToast(`Rol ${editar ? 'actualizado' : 'creado'} correctamente`, 'success');
      setActualizar(prev => !prev);
      handleCloseModal();
    } catch (error) {
      console.error("Error al guardar el rol:", error);
      showToast(error.message || `Error al ${editar ? 'actualizar' : 'crear'} el rol`, 'error');
    } finally {
      setLoading(prev => ({ ...prev, modal: false }));
    }
  };

  const handleEliminarRol = async (id) => {
    try {
      setLoading(prev => ({ ...prev, modal: true }));
      const response = await fetch(`${apiUrl}/api/gestionusuarios/Rol/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      showToast('Rol eliminado correctamente', 'success');
      setActualizar(prev => !prev);
    } catch (error) {
      console.error("Error al eliminar el rol:", error);
      showToast('Error al eliminar el rol', 'error');
    } finally {
      setLoading(prev => ({ ...prev, modal: false }));
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
      setLoading(prev => ({ ...prev, modal: true }));

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

      if (!allSuccess) {
        throw new Error('Error al asignar algunos usuarios');
      }

      showToast(`${usuariosSeleccionados.length} usuario(s) asignado(s) correctamente`, 'success');
      setActualizar(prev => !prev);
      handleCloseModal();
    } catch (error) {
      console.error("Error al asignar usuarios:", error);
      showToast(error.message || 'Error en la conexión', 'error');
    } finally {
      setLoading(prev => ({ ...prev, modal: false }));
    }
  };

  // Verificar si todos los permisos de una sección están seleccionados
  const isAllSelected = (seccionClave) => {
    const seccion = secciones[seccionClave];
    if (!seccion || seccion.permisos.length === 0) return false;
    return seccion.permisos.every(permiso => permisosSeleccionados[permiso.id]);
  };

  return (
    <div>
      <Header />
      <Grid container>
        <Grid>
          <SideBarMenu />
        </Grid>
        <Grid>
          <Box
            ml={10}
            mb={1}
            width='93vw'
            sx={{
              backgroundColor: '#fff',
              borderRadius: 2,
              boxShadow: 3,
              p: 2,
              minHeight: 'auto',
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
                  backgroundColor: '#009688',
                  '&:hover': { backgroundColor: '#00695f' }
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
              loading={loading.page || loading.roles}
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
                {loading.modal ? (
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
                        disabled={loading.modal}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleAsignarUsuarios}
                        disabled={usuariosSeleccionados.length === 0 || loading.modal}
                        sx={{
                          backgroundColor: '#009688',
                          '&:hover': { backgroundColor: '#00695f' }
                        }}
                      >
                        {loading.modal ? 'Asignando...' : 'Guardar Asignación'}
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
                        <Box display="flex" alignItems="center" sx={{
                          p: 1,
                          backgroundColor: 'grey.100',
                          borderRadius: 1
                        }}>
                          <Typography variant="subtitle1" sx={{
                            fontWeight: 'bold',
                            flexGrow: 1
                          }}>
                            {seccionData.nombre}
                          </Typography>
                          <Tooltip title={isAllSelected(seccionClave) ? "Desmarcar todos" : "Marcar todos"}>
                            <IconButton 
                              onClick={() => toggleAllPermisos(seccionClave)}
                              size="small"
                            >
                              {isAllSelected(seccionClave) ? <CheckBox /> : <CheckBoxOutlineBlank />}
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Grid container spacing={2} sx={{ mt: 1 }}>
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
                        disabled={loading.modal}
                      >
                        Cancelar
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={<Save />}
                        onClick={handleGuardarRol}
                        disabled={!claveRol.trim() || !descripcionRol.trim() || loading.modal}
                        sx={{
                          backgroundColor: '#009688',
                          '&:hover': { backgroundColor: '#00695f' }
                        }}
                      >
                        {loading.modal ? 'Guardando...' : 'Guardar Rol'}
                      </Button>
                    </Box>
                  </Box>
                )}
              </DialogContent>
            </Dialog>
          </Box>
        </Grid>
      </Grid>

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
