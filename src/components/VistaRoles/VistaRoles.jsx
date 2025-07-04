import React from 'react';
import { 
  Box,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Avatar,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon
} from '@mui/material';
import { Edit, Delete, AssignmentInd, MoreVert } from '@mui/icons-material';

const VistaRoles = ({ roles, setRolIdEditar, handleOpenModal, handleEliminarRol, loading }) => {
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

  if (loading && roles.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (roles.length === 0) {
    return (
      <Box sx={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center', 
        height: 200,
        backgroundColor: '#fafafa',
        borderRadius: 1,
        mt: 2
      }}>
        <Typography variant="h6" color="textSecondary">
          No hay roles creados
        </Typography>
      </Box>
    );
  }

  return (
    <TableContainer >
      <Table>
        <TableHead sx={{ backgroundColor: '#f5f5f5' }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 'bold' }}>Clave</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Descripción</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }}>Permisos</TableCell>
            <TableCell sx={{ fontWeight: 'bold' }} align="center">Acciones</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {roles.map((rol) => (
            <TableRow key={rol.ID} hover>
              <TableCell>
                <Typography fontWeight="medium">{rol.Clave}</Typography>
              </TableCell>
              <TableCell>{rol.Descripcion}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {rol.Permisos.slice(0, 5).map(permiso => (
                    <Tooltip key={permiso.ID} title={permiso.Descripcion}>
                      <Chip 
                        label={permiso.Clave}
                        size="small"
                      />
                    </Tooltip>
                  ))}
                  {rol.Permisos.length > 5 && (
                    <Tooltip title={rol.Permisos.slice(5).map(p => p.Descripcion).join(', ')}>
                      <Chip 
                        label={`+${rol.Permisos.length - 5}`} 
                        size="small"
                      />
                    </Tooltip>
                  )}
                </Box>
              </TableCell>
              <TableCell align="center">
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
                  open={open && selectedRol?.ID === rol.ID}
                  onClose={handleCloseMenu}
                >
                  <MenuItem onClick={() => {
                    setRolIdEditar(rol.ID);
                    handleOpenModal('editar');
                    handleCloseMenu();
                  }}>
                    <ListItemIcon>
                      <Edit fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">Editar</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    setRolIdEditar(rol.ID);
                    handleOpenModal('asignar');
                    handleCloseMenu();
                  }}>
                    <ListItemIcon>
                      <AssignmentInd fontSize="small" />
                    </ListItemIcon>
                    <Typography variant="body2">Asignar usuarios</Typography>
                  </MenuItem>
                  <MenuItem onClick={() => {
                    handleEliminarRol(rol.ID);
                    handleCloseMenu();
                  }}>
                    <ListItemIcon>
                      <Delete fontSize="small" color="error" />
                    </ListItemIcon>
                    <Typography variant="body2" color="error">
                      Eliminar
                    </Typography>
                  </MenuItem>
                </Menu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default VistaRoles;