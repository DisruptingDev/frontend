import React from 'react';
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Tooltip,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  CircularProgress
} from '@mui/material';
import MUIDataTable from "mui-datatables";
import {
  Edit,
  Delete,
  AssignmentInd,
  MoreVert
} from '@mui/icons-material';

// Datos dummy de roles
const rolesDummy = [
  {
    id: 1,
    nombre: 'Administrador',
    permisos: ['enviar_correo', 'descargar_facturas', 'descargar_prefacturas', 'crear_facturas', 'eliminar_facturas', 'editar_facturas', 'cancelar_facturas', 'alta_cliente', 'editar_cliente', 'borrar_cliente'],
    usuariosAsignados: 3
  },
  {
    id: 2,
    nombre: 'Facturador',
    permisos: ['enviar_correo', 'descargar_facturas', 'crear_facturas'],
    usuariosAsignados: 5
  },
  {
    id: 3,
    nombre: 'Consultor',
    permisos: ['descargar_facturas', 'descargar_prefacturas'],
    usuariosAsignados: 2
  },
  {
    id: 4,
    nombre: 'Gestor de clientes',
    permisos: ['alta_cliente', 'editar_cliente'],
    usuariosAsignados: 1
  }
];

const VistaRoles = ({ setRolIdEditar, actualizar, handleOpenModal }) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [selectedRol, setSelectedRol] = React.useState(null);
  const open = Boolean(anchorEl);

  const handleClickMenu = (event, rol) => {
    setAnchorEl(event.currentTarget);
    setSelectedRol(rol);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedRol(null);
  };

  const handleEliminar = (id) => {
    console.log(`Eliminar rol con ID: ${id}`);
    alert(`Rol con ID ${id} eliminado (simulación)`);
    handleCloseMenu();
  };

  const iniciarAsignacion = (id) => {
    setRolIdEditar(id);
    handleOpenModal('asignar');
    handleCloseMenu();
  };

  const handleEditar = (id) => {
    setRolIdEditar(id);
    handleCloseMenu();
  };

  const columns = [
    {
      name: "nombre",
      label: "Nombre del Rol",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <Typography fontWeight="medium">{value}</Typography>
        )
      }
    },
    {
      name: "permisos",
      label: "Permisos",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (permisos) => (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {permisos.slice(0, 3).map(permiso => (
              <Chip
                key={permiso}
                label={permiso.replace(/_/g, ' ')}
                size="small"
              />
            ))}
            {permisos.length > 3 && (
              <Tooltip title={permisos.slice(3).join(', ').replace(/_/g, ' ')}>
                <Chip
                  label={`+${permisos.length - 3}`}
                  size="small"
                />
              </Tooltip>
            )}
          </Box>
        )
      }
    },
    {
      name: "usuariosAsignados",
      label: "Usuarios",
      options: {
        filter: true,
        sort: true,
        customBodyRender: (value) => (
          <Box display="flex" alignItems="center">
            <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
              {value}
            </Avatar>
            <Typography variant="body2">
              {value} usuario{value !== 1 ? 's' : ''}
            </Typography>
          </Box>
        )
      }
    },
    {
      name: "acciones",
      label: "Acciones",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (_, tableMeta) => {
          const rol = rolesDummy[tableMeta.rowIndex];
          return (
            <>
              <IconButton
                aria-label="more"
                aria-controls="long-menu"
                aria-haspopup="true"
                onClick={(e) => handleClickMenu(e, rol)}
              >
                <MoreVert />
              </IconButton>
              <Menu
                id="long-menu"
                anchorEl={anchorEl}
                keepMounted
                open={open && selectedRol?.id === rol.id}
                onClose={handleCloseMenu}
                PaperProps={{
                  style: {
                    width: '200px',
                  },
                }}
              >
                <MenuItem onClick={() => handleEditar(rol.id)}>
                  <ListItemIcon>
                    <Edit fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Editar</Typography>
                </MenuItem>
                <MenuItem onClick={() => iniciarAsignacion(rol.id)}>
                  <ListItemIcon>
                    <AssignmentInd fontSize="small" />
                  </ListItemIcon>
                  <Typography variant="body2">Asignar usuarios</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleEliminar(rol.id)}>
                  <ListItemIcon>
                    <Delete fontSize="small" color="error" />
                  </ListItemIcon>
                  <Typography variant="body2" color="error">
                    Eliminar
                  </Typography>
                </MenuItem>
              </Menu>
            </>
          );
        }
      }
    }
  ];

const options = {
    filterType: 'checkbox',
    responsive: 'standard',
    selectableRows: 'none',
    download: false,
    print: false,
    viewColumns: false,
    filter: false,
    search: false,
    customToolbar: () => (
        <Button
            variant="contained"
            startIcon={<AssignmentInd />} // Puedes usar <Add /> si prefieres el ícono de añadir
            sx={{
                mt: 2,
                backgroundColor: '#009688',
                color: '#fff',
                '&:hover': {
                    backgroundColor: '#00796b',
                },
            }}
            onClick={() => handleOpenModal('crear')}
        >
            Crear nuevo rol
        </Button>
    ),
    textLabels: {
        body: {
            noMatch: rolesDummy.length === 0 ? (
                <Box sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 200,
                    backgroundColor: '#fafafa',
                    borderRadius: 1
                }}>
                    <Typography variant="h6" color="textSecondary">
                        No hay roles creados
                    </Typography>
                    <Button
                        variant="contained"
                        startIcon={<AssignmentInd />} // Puedes usar <Add /> aquí también
                        sx={{
                            mt: 2,
                            backgroundColor: '#009688',
                            color: '#fff',
                            '&:hover': {
                                backgroundColor: '#00796b',
                            },
                        }}
                        onClick={() => handleOpenModal('crear')}
                    >
                        Crear primer rol
                    </Button>
                </Box>
            ) : 'Lo sentimos, no se encontraron registros',
        }
    }
};

  return (
    <Box>
      <MUIDataTable
        title="Administración de Roles y Permisos"
        data={rolesDummy}
        columns={columns}
        options={options}
      />
    </Box>
  );
};

export default VistaRoles;