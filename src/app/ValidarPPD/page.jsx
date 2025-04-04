"use client";

import React from "react";
import { Box, Typography, Grid } from "@mui/material";
import MUIDataTable from "mui-datatables";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu.jsx";
import textLabels from "@/components/DataTables/datatablesTextLabels";

export default function ValidarPPD() {
    const columns = [
        { name: "folio", label: "Folio" },
        { name: "emisor", label: "Emisor" },
        { name: "receptor", label: "Receptor" },
        {
            name: "saldoInsoluto",
            label: "Saldo Insoluto",
            options: {
                customBodyRender: (value) => `$${value.toFixed(2)}`, // Formatea como moneda
            },
        },
        { name: "fechaTimbrado", label: "Fecha de Timbrado" },
        {
            name: "acciones",
            label: "Acciones",
            options: {
                customBodyRender: () => (
                    <button style={{ cursor: "pointer", background: "none", border: "none", color: "#007bff" }}>
                        Generar CP
                        {/* Aquí puedes agregar la lógica para abrir un modal o redirigir a otra página */}
                    </button>
                ),
            },
        },
    ];

    const data = [
        { folio: "F001", emisor: "Empresa A", receptor: "Cliente X", saldoInsoluto: 1500.00, fechaTimbrado: "2023-10-01" },
        { folio: "F002", emisor: "Empresa B", receptor: "Cliente Y", saldoInsoluto: 2500.50, fechaTimbrado: "2023-10-02" },
        { folio: "F003", emisor: "Empresa C", receptor: "Cliente Z", saldoInsoluto: 0.00, fechaTimbrado: "2023-10-03" },
        { folio: "F004", emisor: "Empresa D", receptor: "Cliente W", saldoInsoluto: 980.75, fechaTimbrado: "2023-10-04" },
        { folio: "F005", emisor: "Empresa E", receptor: "Cliente V", saldoInsoluto: 1250.00, fechaTimbrado: "2023-10-05" },
        { folio: "F006", emisor: "Empresa F", receptor: "Cliente U", saldoInsoluto: 3200.90, fechaTimbrado: "2023-10-06" },
        { folio: "F007", emisor: "Empresa G", receptor: "Cliente T", saldoInsoluto: 150.00, fechaTimbrado: "2023-10-07" },
        { folio: "F008", emisor: "Empresa H", receptor: "Cliente S", saldoInsoluto: 800.45, fechaTimbrado: "2023-10-08" },
        { folio: "F009", emisor: "Empresa I", receptor: "Cliente R", saldoInsoluto: 1000.00, fechaTimbrado: "2023-10-09" },
        { folio: "F010", emisor: "Empresa J", receptor: "Cliente Q", saldoInsoluto: 4000.00, fechaTimbrado: "2023-10-10" },
        { folio: "F011", emisor: "Empresa K", receptor: "Cliente P", saldoInsoluto: 650.50, fechaTimbrado: "2023-10-11" },
        { folio: "F012", emisor: "Empresa L", receptor: "Cliente O", saldoInsoluto: 2250.75, fechaTimbrado: "2023-10-12" },
        { folio: "F013", emisor: "Empresa M", receptor: "Cliente N", saldoInsoluto: 1750.00, fechaTimbrado: "2023-10-13" },
        { folio: "F014", emisor: "Empresa N", receptor: "Cliente M", saldoInsoluto: 500.00, fechaTimbrado: "2023-10-14" },
        { folio: "F015", emisor: "Empresa O", receptor: "Cliente L", saldoInsoluto: 3000.00, fechaTimbrado: "2023-10-15" },
        { folio: "F016", emisor: "Empresa P", receptor: "Cliente K", saldoInsoluto: 400.75, fechaTimbrado: "2023-10-16" },
        { folio: "F017", emisor: "Empresa Q", receptor: "Cliente J", saldoInsoluto: 1150.00, fechaTimbrado: "2023-10-17" },
        { folio: "F018", emisor: "Empresa R", receptor: "Cliente I", saldoInsoluto: 2500.00, fechaTimbrado: "2023-10-18" },
        { folio: "F019", emisor: "Empresa S", receptor: "Cliente H", saldoInsoluto: 950.00, fechaTimbrado: "2023-10-19" },
        { folio: "F020", emisor: "Empresa T", receptor: "Cliente G", saldoInsoluto: 3100.00, fechaTimbrado: "2023-10-20" },
    ];

    const options = {
        filter: true,
        search: true,
        pagination: true,
        selectableRows: "none", // Deshabilita selección de filas
        responsive: "standard",
        textLabels: textLabels, // Importa la configuración global de etiquetas
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid item sx={{ flexGrow: 1 }}>
                    <Box sx={{ padding: "20px" }}>
                        <MUIDataTable
                            title={"Validación de Facturas PPD"}
                            data={data}
                            columns={columns}
                            options={options}
                        />
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}