"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
    MaterialReactTable,
    useMaterialReactTable,
    MRT_Localization_ES
} from "material-react-table";
import {
    Box,
    IconButton,
    Menu,
    MenuItem,
    Chip
} from "@mui/material";
import { MoreVert as MoreVertIcon, Delete as DeleteIcon } from "@mui/icons-material";

const fmtNum = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? "—" : `$${n.toLocaleString("es-MX", { minimumFractionDigits: 2 })}`;
};

// Flexible key getter
const g = (row, ...keys) => {
    for (const key of keys) {
        const variants = [
            key,
            key.toUpperCase(),
            key.toLowerCase(),
            key.replace(/ /g, "_").toLowerCase(),
            key.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, ""),
        ];
        for (const v of variants) {
            if (row[v] !== undefined && row[v] !== null && row[v] !== "") return row[v];
        }
    }
    return "—";
};

const VistaNominasImportadas = ({ facturasRecuperadas, actualizarFacturas }) => {
    const [nominas, setNominas] = useState([]);
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuRowIndex, setMenuRowIndex] = useState(null);

    useEffect(() => {
        setNominas(facturasRecuperadas || []);
    }, [facturasRecuperadas]);

    const handleMenuOpen = (event, rowIndex) => {
        setAnchorEl(event.currentTarget);
        setMenuRowIndex(rowIndex);
    };
    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuRowIndex(null);
    };
    const handleEliminar = () => {
        if (menuRowIndex !== null) {
            const updated = nominas.filter((_, i) => i !== menuRowIndex);
            setNominas(updated);
            actualizarFacturas(updated);
        }
        handleMenuClose();
    };

    const columns = useMemo(() => [
        {
            accessorFn: (row) => g(row, "ReceptorID", "receptor_id", "ID Receptor"),
            id: "ReceptorID",
            header: "Receptor ID",
            size: 130,
        },
        {
            accessorFn: (row) => g(row, "No. Empleado", "NumEmpleado", "num_empleado"),
            id: "NumEmpleado",
            header: "No. Empleado",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "Nombre", "nombre", "Nombre del Empleado", "Nombre Completo"),
            id: "Nombre",
            header: "Nombre",
            size: 280,
        },
        {
            accessorFn: (row) => g(row, "RFC", "rfc_empleado", "Rfc", "rfc"),
            id: "RFC",
            header: "RFC",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "CURP", "Curp"),
            id: "CURP",
            header: "CURP",
            size: 180,
        },
        {
            accessorFn: (row) => g(row, "NSS", "NoSeguroSocial", "NumSeguridadSocial"),
            id: "NSS",
            header: "NSS",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "Departamento"),
            id: "Departamento",
            header: "Departamento",
            size: 180,
        },
        {
            accessorFn: (row) => g(row, "Puesto"),
            id: "Puesto",
            header: "Puesto",
            size: 180,
        },
        {
            accessorFn: (row) => g(row, "TipoContrato", "Tipo Contrato"),
            id: "TipoContrato",
            header: "Tipo Contrato",
            size: 160,
        },
        {
            accessorFn: (row) => g(row, "TipoRegimen", "Tipo Regimen"),
            id: "TipoRegimen",
            header: "Tipo Régimen",
            size: 180,
        },
        {
            accessorFn: (row) => g(row, "PeriodicidadPago", "Periodicidad Pago"),
            id: "Periodicidad",
            header: "Periodicidad",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "Fecha Pago", "FechaPago"),
            id: "FechaPago",
            header: "Fecha Pago",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "Fecha Inicial Pago", "FechaInicialPago", "Fecha Inicial"),
            id: "FechaInicial",
            header: "Fecha Inicial",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "Fecha Final Pago", "FechaFinalPago", "Fecha Final"),
            id: "FechaFinal",
            header: "Fecha Final",
            size: 150,
        },
        {
            accessorFn: (row) => g(row, "Dias Pagados", "NumDiasPagados", "Días Pagados"),
            id: "DiasPagados",
            header: "Días Pagados",
            size: 140,
        },
        {
            accessorFn: (row) => g(row, "Total Percepciones", "TotalPercepciones"),
            id: "TotalPercepciones",
            header: "Total Percepciones",
            size: 180,
            Cell: ({ cell }) => {
                const v = cell.getValue();
                return v === "—" ? "—" : fmtNum(v);
            },
        },
        {
            accessorFn: (row) => g(row, "Total Deducciones", "TotalDeducciones"),
            id: "TotalDeducciones",
            header: "Total Deducciones",
            size: 180,
            Cell: ({ cell }) => {
                const v = cell.getValue();
                return v === "—" ? "—" : fmtNum(v);
            },
        },
        {
            accessorFn: (row) => g(row, "ISR", "Importe ISR", "ImporteISR", "Deduccion ISR"),
            id: "ISR",
            header: "ISR",
            size: 120,
            Cell: ({ cell }) => {
                const v = cell.getValue();
                return v === "—" ? "—" : fmtNum(v);
            },
        },
    ], []);

    const table = useMaterialReactTable({
        columns,
        data: nominas,
        localization: MRT_Localization_ES,
        enableRowActions: true,
        positionActionsColumn: "last",
        renderRowActions: ({ row }) => (
            <>
                <IconButton
                    size="small"
                    onClick={(e) => handleMenuOpen(e, row.index)}
                >
                    <MoreVertIcon fontSize="small" />
                </IconButton>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && menuRowIndex === row.index}
                    onClose={handleMenuClose}
                >
                    <MenuItem onClick={handleEliminar} sx={{ color: "error.main" }}>
                        <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
                        Eliminar
                    </MenuItem>
                </Menu>
            </>
        ),
        muiTablePaperProps: {
            elevation: 0,
            sx: { border: "1px solid #e0e0e0", borderRadius: 2, maxWidth: "100%", overflow: "hidden" },
        },
        muiTableHeadCellProps: {
            sx: {
                backgroundColor: "#1b384a",
                color: "white",
                fontWeight: "bold",
                fontSize: "12px",
                verticalAlign: "bottom",
                whiteSpace: "normal",
                lineHeight: "1.2",
                "& .MuiTableSortLabel-root": { color: "white" },
                "& .MuiTableSortLabel-root:hover": { color: "#cfe8f3" },
                "& .Mui-TableHeadCell-Content": {
                    justifyContent: "space-between",
                    minHeight: "3rem",
                },
                "& svg": { color: "white !important" },
                "& .MuiIconButton-root": { color: "white" },
            },
        },
        muiTableBodyCellProps: {
            sx: {
                fontSize: "12px",
            },
        },
        muiTableBodyRowProps: {
            hover: true,
        },
        initialState: {
            density: "comfortable",
            pagination: { pageSize: 10 },
        },
        enableColumnResizing: true,
        enableGlobalFilter: true,
        enableDensityToggle: false,
        renderEmptyRowsFallback: () => (
            <Box sx={{ p: 4, textAlign: "center", color: "text.secondary" }}>
                No hay nóminas cargadas. Importa un archivo Excel para comenzar.
            </Box>
        ),
    });

    return (
        <Box sx={{ mt: 2, width: "100%", maxWidth: "100%", overflowX: "auto" }}>
            <MaterialReactTable table={table} />
        </Box>
    );
};

export default VistaNominasImportadas;
