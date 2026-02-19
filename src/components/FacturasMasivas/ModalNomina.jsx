"use client"
import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, Box, Typography } from '@mui/material';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

import * as XLSX from 'xlsx';

const ModalNomina = ({ token, open, handleClose, handleUpload, additionalData, uploadUrl }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                // Map Excel data to the structure expected by VistaNominasImportadas and Backend
                const mappedData = jsonData.map((row, index) => {
                    // Try to be flexible with column names (case insensitive or common variations) if possible, 
                    // but for now, we'll assume standard headers based on the previous analysis or standard templates.
                    // If the user has a specific template, we should match those headers.
                    // Based on "VistaNominasImportadas", we need fields like:
                    // Rfc, Nombre, Curp, NumEmpleado, TipoContrato, TipoRegimen, PeriodicidadPago, etc.

                    // Helper to get value ignoring case if needed, or just direct access
                    const getVal = (key) => row[key] || row[key.toUpperCase()] || row[key.toLowerCase()] || "";

                    // Construct the object structure:
                    // { Receptor: { ... }, Nomina: { ... } }
                    return {
                        Receptor: {
                            Rfc: getVal('rfc_empleado') || getVal('rfc_empleado'),
                            Nombre: getVal('nombre'),
                            Curp: getVal('CURP') || getVal('Curp'),
                            NumEmpleado: getVal('No. Empleado') || getVal('NumEmpleado') || getVal('num_empleado'),
                            NoSeguroSocial: getVal('nss'),
                            TipoContrato: getVal('tipo_contrato') || getVal('TipoContrato'),
                            TipoRegimen: getVal('tipo_regimen') || getVal('TipoRegimen'),
                            TipoJornada: getVal('tipo_jornada') || getVal('TipoJornada'),
                            PeriodicidadPago: getVal('Periodicidad Pago') || getVal('PeriodicidadPago') || getVal('periodicidad_pago'),
                            // Add other fields as necessary from the excel
                        },
                        Nomina: {
                            FechaPago: getVal('Fecha Pago') || getVal('FechaPago') || getVal('fecha_pago'),
                            FechaInicialPago: getVal('Fecha Inicial Pago') || getVal('FechaInicialPago') || getVal('fecha_inicial_pago'),
                            FechaFinalPago: getVal('Fecha Final Pago') || getVal('FechaFinalPago') || getVal('fecha_final_pago'),
                            NumDiasPagados: getVal('Días Pagados') || getVal('NumDiasPagados') || getVal('num_dias_pagados'),
                        }
                    };
                });

                console.log("Datos de nómina parseados:", mappedData);
                handleUpload(mappedData);
                handleClose();
                setFile(null);
            } catch (error) {
                console.error("Error parsing Excel file:", error);
                alert("Error al procesar el archivo. Asegúrate de que es un Excel válido.");
            } finally {
                setLoading(false);
            }
        };

        reader.onerror = (error) => {
            console.error("Error reading file:", error);
            alert("Error al leer el archivo.");
            setLoading(false);
        };

        reader.readAsBinaryString(file);
    };

    return (
        <Dialog open={open} onClose={handleClose}>
            <DialogTitle>Subir Nómina</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ borderBlockColor: '#1b384a', color: '#1b384a' }}
                    >
                        Seleccionar archivo de Nómina
                        <input
                            type="file"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>
                    {file && (
                        <Box mt={1}>
                            <Typography mt={1} sx={{ fontWeight: '500', fontSize: '1rem', padding: '0.5em' }}>
                                Archivo seleccionado: <span style={{ fontWeight: 'bold' }}>{file.name}</span>
                            </Typography>
                        </Box>
                    )}
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} color="primary" disabled={!file}>
                    Subir Nómina
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalNomina;
