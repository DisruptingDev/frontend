"use client";
import React, { useState, useEffect } from "react";
import MUIDataTable from "mui-datatables";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { IconButton, Menu, MenuItem, Box } from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ModalEdicion from "./ModalEdicion";

const VistaFacturasImportadas = ({
  facturasRecuperadas,
  token,
  actualizarFacturas,
}) => {
  const [facturas, setFacturas] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [indexFacturaEditar, setIndexFacturaEditar] = useState(null);
  const [facturaEditar, setFacturaEditar] = useState(null);

  useEffect(() => {
    setFacturas(facturasRecuperadas);
  }, [facturasRecuperadas]);

  // Tema personalizado para la tabla
  const getMuiTheme = () =>
    createTheme({
      components: {
        MUIDataTable: {
          styleOverrides: {
            root: {
              backgroundColor: "#f5f5f5",
            },
            paper: {
              boxShadow: "none",
            },
          },
        },
        MUIDataTableHeadCell: {
          styleOverrides: {
            root: {
              backgroundColor: "#1b384a",
              color: "white",
              fontWeight: "bold",
              textAlign: "center",
            },
          },
        },
        MUIDataTableBodyCell: {
          styleOverrides: {
            root: {
              padding: "8px",
              textAlign: "center",
            },
          },
        },
      },
    });

  // Manejo del menú de acciones
  const handleMenuClick = (event, rowData, rowIndex) => {
    setAnchorEl(event.currentTarget);
    setMenuRow({ rowData, rowIndex });
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setMenuRow(null);
  };

  const handleEditar = () => {
    if (menuRow) {
      setFacturaEditar(menuRow.rowData);
      setIndexFacturaEditar(menuRow.rowIndex);
      setOpenModal(true);
      handleMenuClose();
    }
  };

  const handleEliminar = () => {
    if (menuRow) {
      const nuevasFacturas = facturas.filter((_, i) => i !== menuRow.rowIndex);
      setFacturas(nuevasFacturas);
      actualizarFacturas(nuevasFacturas);
      handleMenuClose();
    }
  };

  const ActualizarFactura = (factura) => {
    if (indexFacturaEditar !== null) {
      const nuevasFacturas = facturas.map((f, i) =>
        i === indexFacturaEditar ? factura : f
      );
      setFacturas(nuevasFacturas);
      actualizarFacturas(nuevasFacturas);
      setOpenModal(false);
    }
  };

  // Función para formatear celdas con errores
  const renderCellWithError = (value, hasError) => {
    return (
      <span style={{ color: hasError ? "red" : "inherit" }}>
        {hasError ? `${value} no encontrado` : value}
      </span>
    );
  };

  // Columnas de la tabla
  const columns = [
    {
      name: "index",
      label: "Número",
      options: {
        customBodyRender: (value, tableMeta) => {
          return tableMeta.rowIndex + 1;
        },
      },
    },
    {
      name: "Emisor",
      label: "Emisor",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.Nombre || value.RFC,
            value.Error === "record not found"
          ),
      },
    },
    {
      name: "Receptor",
      label: "Receptor",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.Nombre || value.RFC,
            value.Error === "record not found"
          ),
      },
    },
    {
      name: "Emisor",
      label: "Serie",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.Serie || value.RFC,
            value.Error === "record not found"
          ),
      },
    },
    {
      name: "Receptor",
      label: "Uso CFDI",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.UsoCFDI || value.RFC,
            value.Error === "record not found"
          ),
      },
    },
    {
      name: "Concepto",
      label: "Concepto",
      options: {
        customBodyRender: (value) => value.Descripcion,
      },
    },
    {
      name: "Concepto",
      label: "ClaveProdServ",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.ClaveProductoServicio,
            value["Error-ClaveProductoServicio"] === "record not found"
          ),
      },
    },
    {
      name: "Impuesto",
      label: "ObjetoImpuesto",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.ObjetoImpuesto,
            value["Error-ObjetoImpuesto"] === "record not found"
          ),
      },
    },
    {
      name: "Impuesto",
      label: "ClaveImpuesto",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.ClaveImpuesto,
            value["Error-ClaveImpuesto"] === "record not found"
          ),
      },
    },
    {
      name: "Impuesto",
      label: "TasaOCuota",
      options: {
        customBodyRender: (value) =>
          renderCellWithError(
            value.TasaOCuota,
            value["Error-TasaOCuota"] === "record not found"
          ),
      },
    },
    {
      name: "Impuesto",
      label: "Impuestos $",
      options: {
        customBodyRender: (value) =>
          Number(value.Monto).toLocaleString("es-MX", {
            style: "currency",
            currency: "MXN",
          }),
      },
    },
    {
      name: "Impuesto",
      label: "Total",
      options: {
        customBodyRender: (value) =>
          (Number(value.Monto) + Number(value.BaseImpuesto)).toLocaleString(
            "es-MX",
            { style: "currency", currency: "MXN" }
          ),
      },
    },
    {
      name: "actions",
      label: "Acción",
      options: {
        filter: false,
        sort: false,
        customBodyRender: (value, tableMeta) => {
          return (
            <>
              <IconButton
                onClick={(event) =>
                  handleMenuClick(event, facturas[tableMeta.rowIndex], tableMeta.rowIndex)
                }
              >
                <MoreVertIcon />
              </IconButton>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl) && menuRow?.rowIndex === tableMeta.rowIndex}
                onClose={handleMenuClose}
              >
                <MenuItem onClick={handleEditar}>Editar</MenuItem>
                <MenuItem onClick={handleEliminar}>Eliminar</MenuItem>
              </Menu>
            </>
          );
        },
      },
    },
  ];

  // Opciones de la tabla
  const options = {
    filterType: "dropdown",
    responsive: "standard",
    selectableRows: "none",
    download: false,
    print: false,
    viewColumns: false,
    rowsPerPage: 10,
    rowsPerPageOptions: [10, 25, 50],
    textLabels: {
      body: {
        noMatch: facturas.length === 0 ? "No hay facturas importadas" : "Cargando...",
      },
    },
    setTableProps: () => ({
        style: {
          minWidth: '100%', // Asegura que la tabla use todo el espacio disponible
          tableLayout: 'fixed' // Fija el layout para mejor control
        }
      }),
      setCellHeaderProps: () => ({
        style: {
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          maxWidth: '50px' // Ajusta según necesites
        }
      })
  };

  return (
    <Box sx={{ marginTop: 2 }}>
      <ThemeProvider theme={getMuiTheme()}>
        <MUIDataTable
          title={"Facturas Importadas"}
          data={facturas}
          columns={columns}
          options={options}
        />
      </ThemeProvider>

      <ModalEdicion
        open={openModal}
        handleClose={() => setOpenModal(false)}
        facturaEditar={facturaEditar}
        actualizarFactura={ActualizarFactura}
        token={token}
      />
    </Box>
  );
};

export default VistaFacturasImportadas;