import React, { useState } from "react";
import { Box, Button, TextField, Select, MenuItem, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton } from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

export default function VistaGrupos() {
  const [nuevoGrupo, setNuevoGrupo] = useState("");
  const [usuario, setUsuario] = useState("");
  const [grupoSeleccionado, setGrupoSeleccionado] = useState("Gasolinera Oil");
  const [grupos, setGrupos] = useState([
    { nombre: "Gasolineras VIP", usuarios: ["Estación 1", "Estación 2"] },
    { nombre: "Gasolinera Oil", usuarios: ["La Paz"] },
  ]);

  const handleAgregarGrupo = () => {
    if (nuevoGrupo) {
      setGrupos([...grupos, { nombre: nuevoGrupo, usuarios: [] }]);
      setNuevoGrupo("");
    }
  };

  const handleAgregarUsuario = () => {
    setGrupos(
      grupos.map((grupo) =>
        grupo.nombre === grupoSeleccionado
          ? { ...grupo, usuarios: [...grupo.usuarios, usuario] }
          : grupo
      )
    );
    setUsuario("");
  };

  return (
    <Box sx={{ padding: 4 }}>
      {/* <Typography variant="h4" gutterBottom>
        Administración de Grupos y Usuarios
      </Typography> */}

<Box display="flex" justifyContent="space-between" gap={4} mb={4}>
  {/* Crear Nuevo Grupo */}
  <Box flex={1}>
    <Typography variant="h6" gutterBottom>
      Crear Nuevo Grupo
    </Typography>
    <Box
      display="grid"
      gap={2}
      sx={{
        gridTemplateColumns: "1fr auto", // Input y botón en la misma fila
        alignItems: "center", // Alinea los elementos verticalmente
      }}
    >
      <TextField
        fullWidth
        label="Nombre del grupo"
        value={nuevoGrupo}
        onChange={(e) => setNuevoGrupo(e.target.value)}
        sx={{
          height: "40px", // Ajusta la altura para que coincida con el botón
        }}
        InputProps={{
          sx: { height: "40px" }, // Asegura la altura interna del input
        }}
      />
      <Button
        variant="contained"
        onClick={handleAgregarGrupo}
        sx={{ height: "40px", whiteSpace: "nowrap",backgroundColor: 'rgba(29, 57, 77, 1)','&:hover': {
          backgroundColor: 'rgba(19, 47, 67, 1)',},display: 'flex', }}
      >
        Agregar Grupo
      </Button>
    </Box>
  </Box>

  {/* Agregar Usuario a Grupo */}
  <Box flex={1}>
    <Typography variant="h6" gutterBottom>
      Agregar Usuario a Grupo
    </Typography>
    <Box
      display="grid"
      gap={2}
      sx={{
        gridTemplateColumns: "1fr 1fr auto", // Select, input, y botón en una fila
        alignItems: "center", // Alinea los elementos verticalmente
      }}
    >
      <Select
        fullWidth
        value={grupoSeleccionado}
        onChange={(e) => setGrupoSeleccionado(e.target.value)}
        sx={{
          height: "40px",
        }}
        MenuProps={{
          PaperProps: { style: { maxHeight: 200 } }, // Controla la altura del menú desplegable
        }}
      >
        {grupos.map((grupo) => (
          <MenuItem key={grupo.nombre} value={grupo.nombre}>
            {grupo.nombre}
          </MenuItem>
        ))}
      </Select>
      <TextField
        fullWidth
        label="Nombre del usuario"
        value={usuario}
        onChange={(e) => setUsuario(e.target.value)}
        sx={{
          height: "40px",
        }}
        InputProps={{
          sx: { height: "40px" },
        }}
      />
      <Button
        variant="contained"
        onClick={handleAgregarUsuario}
        sx={{ height: "40px", whiteSpace: "nowrap",backgroundColor: 'rgba(29, 57, 77, 1)','&:hover': {
              backgroundColor: 'rgba(19, 47, 67, 1)',},display: 'flex', }}
      >
        Agregar Usuario
      </Button>
    </Box>
  </Box>
</Box>


      {/* Tabla de Grupos y Usuarios */}
      <Typography variant="h6">Grupos y Usuarios</Typography>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Grupo</TableCell>
              <TableCell>Usuario</TableCell>
              <TableCell>Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {grupos.map((grupo) => (
              <React.Fragment key={grupo.nombre}>
                <TableRow>
                  <TableCell rowSpan={grupo.usuarios.length + 1} sx={{fontWeight:'600'}}>
                    {grupo.nombre}
                  </TableCell>
                </TableRow>
                {grupo.usuarios.map((usuario, index) => (
                  <TableRow key={index}>
                    <TableCell>{usuario}</TableCell>
                    <TableCell>
                      <IconButton>
                        <EditIcon />
                      </IconButton>
                      <IconButton>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
