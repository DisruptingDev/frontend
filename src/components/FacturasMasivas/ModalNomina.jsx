"use client"
import React, { useState } from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Box, Typography } from '@mui/material';
import * as XLSX from 'xlsx';

import { formatSATDate } from '@/utils/formatDates';

const ModalNomina = ({ token, open, handleClose, handleUpload, selectedEmisor }) => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleFileChange = (event) => {
        setFile(event.target.files[0]);
    };

    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    const handleSubmit = async () => {
        if (!file) return;
        setLoading(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = e.target.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const sheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

                console.log("📂 Excel crudo:", jsonData);

                // --- Validación y Registro de Receptores/Trabajadores ---
                console.log("🔍 Iniciando validación masiva de receptores...");

                // 1. Obtener catálogo actual de receptores
                const catRes = await fetch(`${apiUrl}/api/catalogos/Catalogos/Receptor`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const catalogoReceptores = await catRes.json();
                console.log(`📊 Catálogo cargado: ${catalogoReceptores?.length || 0} receptores.`);

                const updatedData = [];
                for (let i = 0; i < jsonData.length; i++) {
                    const row = jsonData[i];
                    const rfc = String(row["rfc_empleado"] || row["RFC_EMPLEADO"] || row["RFC"] || row["Rfc"] || "").trim().toUpperCase();
                    const curp = String(row["CURP"] || row["Curp"] || "").trim().toUpperCase();
                    const nombre = String(row["Nombre"] || row["NOMBRE"] || row["nombre"] || row["Nombre del Empleado"] || row["NOMBRE DEL EMPLEADO"] || row["nombre_empleado"] || row["Nombre Completo"] || "").trim();

                    if (!rfc) {
                        console.warn(`⚠️ Fila ${i + 1} no tiene RFC, se salta validación.`);
                        updatedData.push(row);
                        continue;
                    }

                    // Buscar si ya existe en base al RFC
                    let receptorExistente = Array.isArray(catalogoReceptores)
                        ? catalogoReceptores.find(r => r.Rfc?.toUpperCase() === rfc)
                        : null;

                    if (!receptorExistente) {
                        console.log(`🆕 [${rfc}] No encontrado. Registrando receptor y trabajador...`);

                        try {
                            // Registro de Receptor
                            const regReceptorRes = await fetch(`${apiUrl}/api/gestores/RegistroReceptor`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${token}`,
                                },
                                body: JSON.stringify({
                                    Receptor: {
                                        Rfc: rfc,
                                        Nombre: nombre || "Personal Nómina",
                                        RegimenFiscalReceptor: "605",
                                        DomicilioFiscalReceptor: String(row["Domicilio Fiscal"] || row["DomicilioFiscal"] || row["CP"] || "55450"),
                                        Calle: String(row["Calle"] || "S/N"),
                                        NumeroExterior: String(row["No. Exterior"] || row["NumeroExterior"] || ""),
                                        NumeroInterior: String(row["No. Interior"] || row["NumeroInterior"] || ""),
                                        Colonia: String(row["Colonia"] || ""),
                                        Municipio: String(row["Municipio"] || ""),
                                        Estado: String(row["Estado"] || ""),
                                        Email: String(row["Email"] || "notengo@mail.com")
                                    }
                                }),
                            });

                            if (regReceptorRes.ok) {
                                const receptorData = await regReceptorRes.json();
                                // Algunos endpoints usan ID, otros Id, otros retornan el objeto directo o envuelto
                                const newID = receptorData.ID || receptorData.Id || (receptorData.Receptor && (receptorData.Receptor.ID || receptorData.Receptor.Id));

                                if (newID) {
                                    console.log(`✅ Receptor creado con ID: ${newID}. Registrando trabajador...`);

                                    // Registro de Trabajador
                                    const regTrabRes = await fetch(`${apiUrl}/api/gestores/RegistroTrabajadores`, {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                            'Authorization': `Bearer ${token}`,
                                        },
                                        body: JSON.stringify({
                                            TrabajadoresNomina: {
                                                Curp: curp,
                                                NumSeguridadSocial: String(row["NSS"] || row["NoSeguroSocial"] || ""),
                                                FechaInicioRelLaboral: formatSATDate(row["Fecha Inicio Laboral"] || row["FechaInicioRelLaboral"] || "2024-01-01"),
                                                TipoContrato: String(row["Tipo Contrato"] || row["TipoContrato"] || "01"),
                                                TipoJornada: String(row["Tipo Jornada"] || row["TipoJornada"] || "01"),
                                                TipoRegimen: String(row["Tipo Régimen"] || row["TipoRegimen"] || "02"),
                                                NumEmpleado: String(row["No. Empleado"] || row["NumEmpleado"] || ""),
                                                Departamento: String(row["Departamento"] || ""),
                                                Puesto: String(row["Puesto"] || ""),
                                                RiesgoPuesto: String(row["Riesgo Puesto"] || row["RiesgoPuesto"] || "1"),
                                                PeriodicidadPago: String(row["Periodicidad Pago"] || row["PeriodicidadPago"] || "04"),
                                                CuentaBancaria: String(row["Cuenta Bancaria"] || row["CuentaBancaria"] || ""),
                                                Banco: String(row["Banco"] || "002"),
                                                SalarioBaseCotApor: Number(row["Salario Base"] || row["SalarioBaseCotApor"] || 0),
                                                SalarioDiarioIntegrado: Number(row["Salario Diario"] || row["SalarioDiarioIntegrado"] || 0),
                                                ClaveEntFed: String(row["ClaveEntFed"] || row["Estado"] || "NL"),
                                                EmisorID: selectedEmisor?.ID || 0
                                            }
                                        }),
                                    });


                                    if (!regTrabRes.ok) {
                                        console.error(`❌ Falló registro de trabajador para ${rfc}`);
                                    }

                                    row["ReceptorID"] = newID;
                                } else {
                                    console.error(`❌ No se obtuvo ID para el nuevo receptor ${rfc}`, receptorData);
                                }
                            } else {
                                const errText = await regReceptorRes.text();
                                console.error(`❌ Error al registrar receptor ${rfc}:`, errText);
                            }
                        } catch (err) {
                            console.error(`❌ Excepción al procesar ${rfc}:`, err);
                        }
                    } else {
                        const existingID = receptorExistente.ID || receptorExistente.Id;
                        console.log(`✔️ [${rfc}] Ya existe con ID: ${existingID}`);
                        row["ReceptorID"] = existingID;
                    }
                    updatedData.push(row);
                }

                console.log("✨ Validación terminada. Cargando a la tabla...");
                handleUpload(updatedData);
                handleClose();
                setFile(null);
            } catch (error) {
                console.error("Error processing nomina upload:", error);
                alert("Error al procesar el archivo. Revisa la consola para más detalles.");
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
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Subir Nómina</DialogTitle>
            <DialogContent>
                <Box sx={{ mt: 2, border: '1px solid #ccc', borderRadius: '4px' }}>
                    <Button
                        variant="outlined"
                        component="label"
                        fullWidth
                        sx={{ borderBlockColor: '#1b384a', color: '#1b384a' }}
                    >
                        Seleccionar archivo de Nómina (.xlsx / .xls)
                        <input
                            type="file"
                            hidden
                            accept=".xlsx,.xls"
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

                <Box mt={2}>
                    <Typography variant="caption" color="text.secondary">
                        El archivo debe contener una hoja con las columnas:<br />
                        <strong>ReceptorID, CURP, NSS, No. Empleado, Nombre, Departamento, Puesto,
                            TipoContrato, TipoJornada, TipoRegimen, PeriodicidadPago, ClaveEntFed,
                            Salario Base, Salario Diario, Cuenta Bancaria, Banco,
                            Fecha Pago, Fecha Inicial Pago, Fecha Final Pago, Dias Pagados,
                            Total Percepciones, Total Deducciones, Importe Gravado, Importe Exento, ISR</strong>
                    </Typography>
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} color="primary">
                    Cancelar
                </Button>
                <Button onClick={handleSubmit} color="primary" disabled={!file || loading}>
                    {loading ? "Procesando..." : "Cargar Nóminas"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ModalNomina;
