"use client"
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    Box, Button, Typography, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, LinearProgress, Tooltip, TextField, Alert
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const RECEPTORES_URL = `${apiUrl}/api/catalogos/Catalogos/ReceptorNomina`;
const GUARDAR_NOMINA_URL = `${apiUrl}/api/facturas/GuardarFacturaNomina`;

// ── Helpers de fecha ──────────────────────────────────────────
const hoyISO = () => new Date().toISOString().slice(0, 10);

const calcularDias = (fechaInicial, fechaFinal) => {
    if (!fechaInicial || !fechaFinal) return 0;
    const inicio = new Date(fechaInicial + "T00:00:00");
    const fin = new Date(fechaFinal + "T00:00:00");
    const diff = Math.round((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 0; // +1 para incluir ambos extremos
};

// ── Catálogos SAT ──────────────────────────────────────────
const TIPOS_PERCEPCION = [
    "001 - Sueldos, Salarios Rayas y Jornales",
    "002 - Gratificación Anual (Aguinaldo)",
    "003 - Participación de los Trabajadores en las Utilidades PTU",
    "004 - Reembolso de Gastos Médicos Dentales y Hospitalarios",
    "005 - Fondo de Ahorro",
    "006 - Caja de ahorro",
    "009 - Contribuciones a Cargo del Trabajador Pagadas por el Patrón",
    "010 - Premios por Puntualidad",
    "011 - Prima de Seguro de vida",
    "013 - Pagos por separación",
    "014 - Premio por Antigüedad",
    "019 - Horas extra",
    "022 - Prima dominical",
    "023 - Prima vacacional",
    "024 - Tiempo extraordinario",
    "025 - Indemnizaciones",
    "044 - Jubilaciones, pensiones o haberes de retiro",
    "046 - Ingresos en acciones o títulos",
];

const TIPOS_DEDUCCION = [
    "001 - Seguridad Social",
    "002 - ISR",
    "003 - Aportaciones a retiro, cesantía en edad avanzada y vejez",
    "004 - Otros",
    "005 - Aportaciones a Fondo de vivienda",
    "006 - Descuento por incapacidad",
    "007 - Pensión alimenticia",
    "008 - Renta",
    "009 - Préstamos provenientes del Fondo Nacional de la Vivienda",
    "010 - Pago por crédito de vivienda",
    "011 - Pago de abonos INFONACOT",
    "012 - Anticipo de salarios",
    "013 - Pagos hechos con exceso al trabajador",
    "014 - Errores",
    "015 - Pérdidas",
    "016 - Averías",
    "017 - Adquisición de artículos producidos por la empresa o establecimiento",
    "018 - Cuotas sindicales",
    "019 - Devolución de pagos hechos por error al trabajador",
    "020 - Prima de Seguro de vida",
    "021 - Prima de Seguro de Gastos Médicos",
    "022 - Impuesto local",
];

const TIPOS_OTRO_PAGO = [
    "001 - Reintegro de ISR pagado en exceso (siempre que no haya sido enterado al SAT)",
    "002 - Subsidio para el empleo",
    "003 - Viáticos (entregados al trabajador)",
    "004 - Aplicación de saldo a favor por compensación anual",
    "005 - Reintegro de ISR retenido en exceso de ejercicio anterior (ISR anual)",
];

// ── Columnas de percepciones/deducciones/otros en la plantilla ──
const COLS_PERCEPCIONES = [
    { key: "perc_tipo", label: "Percepcion_Tipo", catalog: TIPOS_PERCEPCION },
    { key: "perc_clave", label: "Percepcion_Clave" },
    { key: "perc_concepto", label: "Percepcion_Concepto" },
    { key: "perc_gravado", label: "Percepcion_ImporteGravado" },
    { key: "perc_exento", label: "Percepcion_ImporteExento" },
];

const COLS_DEDUCCIONES = [
    { key: "ded_tipo", label: "Deduccion_Tipo", catalog: TIPOS_DEDUCCION },
    { key: "ded_clave", label: "Deduccion_Clave" },
    { key: "ded_concepto", label: "Deduccion_Concepto" },
    { key: "ded_importe", label: "Deduccion_Importe" },
];

const COLS_OTROS = [
    { key: "otro_tipo", label: "OtroPago_Tipo", catalog: TIPOS_OTRO_PAGO },
    { key: "otro_clave", label: "OtroPago_Clave" },
    { key: "otro_concepto", label: "OtroPago_Concepto" },
    { key: "otro_importe", label: "OtroPago_Importe" },
];

const TIPOS_IMPUESTO_RETENIDO = new Set(["001", "002"]);

// ── Helper: parsear clave SAT del string "001 - Descripción" ──
const parsearClave = (str) => (str ?? "").split(" - ")[0].trim();

// ── Helper: construir payload completo por fila ──────────────
const buildPayload = (row, emisor) => {
    const percepciones = [];
    const deducciones = [];
    const otrosPagos = [];

    // Puede haber múltiples filas de percepciones/deducciones separadas por "|"
    const splitCol = (val) =>
        val ? String(val).split("|").map((s) => s.trim()).filter(Boolean) : [];

    const percTipos = splitCol(row["Percepcion_Tipo"]);
    percTipos.forEach((_, i) => {
        const gravado = parseFloat(splitCol(row["Percepcion_ImporteGravado"])[i] ?? 0);
        const exento = parseFloat(splitCol(row["Percepcion_ImporteExento"])[i] ?? 0);
        percepciones.push({
            TipoPercepcion: parsearClave(splitCol(row["Percepcion_Tipo"])[i]),
            Clave: splitCol(row["Percepcion_Clave"])[i] ?? "001",
            Concepto: splitCol(row["Percepcion_Concepto"])[i] ?? "",
            ImporteGravado: gravado,
            ImporteExento: exento,
        });
    });

    const dedTipos = splitCol(row["Deduccion_Tipo"]);
    dedTipos.forEach((_, i) => {
        deducciones.push({
            TipoDeduccion: parsearClave(splitCol(row["Deduccion_Tipo"])[i]),
            Clave: splitCol(row["Deduccion_Clave"])[i] ?? "001",
            Concepto: splitCol(row["Deduccion_Concepto"])[i] ?? "",
            Importe: parseFloat(splitCol(row["Deduccion_Importe"])[i] ?? 0),
        });
    });

    const otroTipos = splitCol(row["OtroPago_Tipo"]);
    otroTipos.forEach((_, i) => {
        otrosPagos.push({
            TipoOtroPago: parsearClave(splitCol(row["OtroPago_Tipo"])[i]),
            Clave: splitCol(row["OtroPago_Clave"])[i] ?? "001",
            Concepto: splitCol(row["OtroPago_Concepto"])[i] ?? "",
            Importe: parseFloat(splitCol(row["OtroPago_Importe"])[i] ?? 0),
        });
    });

    const totalPercepciones =
        percepciones.reduce((s, p) => s + p.ImporteGravado + p.ImporteExento, 0);
    const totalDeducciones =
        deducciones.reduce((s, d) => s + d.Importe, 0);
    const totalOtros =
        otrosPagos.reduce((s, o) => s + o.Importe, 0);
    const total = totalPercepciones - totalDeducciones + totalOtros;

    const totalGravado = percepciones.reduce((s, p) => s + p.ImporteGravado, 0);
    const totalExento = percepciones.reduce((s, p) => s + p.ImporteExento, 0);

    const totalImpuestosRetenidos = Math.round(
        deducciones
            .filter(d => TIPOS_IMPUESTO_RETENIDO.has(d.TipoDeduccion))
            .reduce((s, d) => s + d.Importe, 0) * 100
    ) / 100;

    const totalOtrasDeducciones = Math.round(
        deducciones
            .filter(d => !TIPOS_IMPUESTO_RETENIDO.has(d.TipoDeduccion))
            .reduce((s, d) => s + d.Importe, 0) * 100
    ) / 100;

    const r2 = (n) => Math.round(n * 100) / 100;

    return {
        Version: "4.0",
        Serie: emisor?.Serie ?? "N",
        Fecha: new Date().toISOString().slice(0, 19),
        FormaPago: "99",
        Moneda: "MXN",
        TipoCambio: "1",
        TipoDeComprobante: "N",
        Exportacion: "01",
        MetodoPago: "PUE",
        LugarExpedicion: emisor?.Emisor.LugarExpedicion,
        EmisorID: emisor?.EmisorID,
        ReceptorNominaID: row["receptor_nomina_id"],
        UsoCFDI: "CN01",
        SubTotal: r2(totalPercepciones),
        Total: r2(totalPercepciones - totalDeducciones + totalOtros),
        Conceptos: {
            ListaConceptos: [{
                ClaveProdServ: "84111505",
                Cantidad: 1,
                ClaveUnidad: "ACT",
                Descripcion: "Pago de nómina",
                ValorUnitario: r2(totalPercepciones),
                Importe: r2(totalPercepciones),
                Descuento: r2(totalDeducciones),
                ObjetoImp: "01",
                Impuestos: {
                    Traslados: [],
                    Retenciones: [],
                }
            }],
            TotalImpuestosTrasladados: 0,
            TotalImpuestosRetenidos: 0,
        },
        Complemento: {
            Nomina: {
                Version: "1.2",
                TipoNomina: row["TipoNomina"] ?? "O",
                FechaPago: String(row["FechaPago"]) ?? new Date().toISOString().slice(0, 10),
                FechaInicialPago: String(row["FechaInicialPago"]) ?? "",
                FechaFinalPago: String(row["FechaFinalPago"]) ?? "",
                NumDiasPagados: parseFloat(row["DiasLaborados"] ?? 0),
                TotalPercepciones: r2(totalPercepciones),
                TotalDeducciones: r2(totalDeducciones),
                TotalOtrosPagos: r2(totalOtros),
                EmisorNominaID: emisor.ID,
                ReceptorNominaID: parseInt(row["receptor_nomina_id"], 10),
                Percepciones: {
                    TotalSueldos: r2(totalGravado + totalExento),
                    TotalGravado: r2(totalGravado),
                    TotalExento: r2(totalExento),
                    Percepciones: percepciones
                },
                Deducciones: {
                    TotalImpuestosRetenidos: totalImpuestosRetenidos,
                    TotalOtrasDeducciones: totalOtrasDeducciones,
                    Deducciones: deducciones
                },
                OtrosPagos: otrosPagos.length ? { OtrosPagos: otrosPagos } : undefined,
            },
        },
    };
};

// ────────────────────────────────────────────────────────────
export default function GenerarNominas({ token, selectedEmisor, onMessage }) {
    const [loadingTabla, setLoadingTabla] = useState(false);
    const [receptores, setReceptores] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);   // IDs seleccionados
    const [nominasPreview, setNominasPreview] = useState([]); // filas parseadas del xlsx
    const [resultados, setResultados] = useState([]);          // {id, nombre, ok, msg}
    const [enviando, setEnviando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [fechaInicial, setFechaInicial] = useState("");
    const [fechaFinal, setFechaFinal] = useState("");
    const [fechaPago, setFechaPago] = useState(hoyISO());

    const diasCalculados = calcularDias(fechaInicial, fechaFinal);
    const periodoValido = fechaInicial && fechaFinal && fechaPago && diasCalculados > 0;

    // ── Cargar receptores al montar o cambiar emisor ──
    useEffect(() => {
        if (!selectedEmisor) return;
        fetchReceptores();
    }, [selectedEmisor]);

    const fetchReceptores = async () => {
        setLoadingTabla(true);
        try {
            const res = await fetch(
                `${RECEPTORES_URL}?EmisorNominaID=${selectedEmisor.ID}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            if (res.ok) setReceptores((await res.json()) ?? []);
        } finally {
            setLoadingTabla(false);
        }
    };

    // ── Selección en tabla ──
    const toggleSeleccion = (id) =>
        setSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const toggleTodos = () =>
        setSeleccionados(
            seleccionados.length === receptores.length ? [] : receptores.map((r) => r.ID)
        );

    // ── Generar plantilla .xlsx ──────────────────────────────
    const handleDescargarPlantilla = () => {
        const trabajadores = receptores.filter((r) => seleccionados.includes(r.ID));

        const headers = [
            "receptor_nomina_id", "Nombre", "RFC", "SalarioDiario",
            "DiasLaborados", "TipoNomina", "FechaPago", "FechaInicialPago", "FechaFinalPago",
            "Percepcion_Tipo", "Percepcion_Clave", "Percepcion_Concepto",
            "Percepcion_ImporteGravado", "Percepcion_ImporteExento",
            "Deduccion_Tipo", "Deduccion_Clave", "Deduccion_Concepto", "Deduccion_Importe",
            "OtroPago_Tipo", "OtroPago_Clave", "OtroPago_Concepto", "OtroPago_Importe",
        ];

        const rows = trabajadores.map((r) => ({
            receptor_nomina_id: r.ID,
            Nombre: r.Nombre,
            RFC: r.Rfc,
            SalarioDiario: r.SalarioDiarioIntegrado,
            // ── Pre-llenado desde el panel de fechas ──
            DiasLaborados: diasCalculados,
            TipoNomina: "O",
            FechaPago: fechaPago,
            FechaInicialPago: fechaInicial,
            FechaFinalPago: fechaFinal,
            // Percepción por defecto
            Percepcion_Tipo: "001 - Sueldos, Salarios Rayas y Jornales",
            Percepcion_Clave: "001",
            Percepcion_Concepto: "Sueldo",
            Percepcion_ImporteGravado: "",
            Percepcion_ImporteExento: "0",
            Deduccion_Tipo: "",
            Deduccion_Clave: "",
            Deduccion_Concepto: "",
            Deduccion_Importe: "",
            OtroPago_Tipo: "",
            OtroPago_Clave: "",
            OtroPago_Concepto: "",
            OtroPago_Importe: "",
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
        ws["!cols"] = headers.map((h) =>
            h === "Nombre" || h.includes("Concepto") || h.includes("Tipo")
                ? { wch: 45 } : { wch: 18 }
        );

        // ── Hoja de catálogos (para dropdowns) ──
        const maxRows = Math.max(
            TIPOS_PERCEPCION.length,
            TIPOS_DEDUCCION.length,
            TIPOS_OTRO_PAGO.length
        );
        const catalogData = Array.from({ length: maxRows }, (_, i) => ({
            "Tipo Percepcion": TIPOS_PERCEPCION[i] ?? "",
            "Tipo Deduccion": TIPOS_DEDUCCION[i] ?? "",
            "Tipo Otro Pago": TIPOS_OTRO_PAGO[i] ?? "",
        }));
        const wsCatalogos = XLSX.utils.json_to_sheet(catalogData);
        wsCatalogos["!cols"] = [{ wch: 70 }, { wch: 70 }, { wch: 70 }];

        // ── DataValidation dropdowns ──
        const numRows = rows.length;
        const colPercTipo = XLSX.utils.encode_col(headers.indexOf("Percepcion_Tipo"));
        const colDedTipo = XLSX.utils.encode_col(headers.indexOf("Deduccion_Tipo"));
        const colOtroTipo = XLSX.utils.encode_col(headers.indexOf("OtroPago_Tipo"));

        const makeDropdown = (col, sheetCol, count) => ({
            type: "list",
            sqref: `${col}2:${col}${numRows + 1}`,
            formula1: `Catalogos!$${sheetCol}$2:$${sheetCol}$${count + 1}`,
        });

        ws["!dataValidations"] = [
            makeDropdown(colPercTipo, "A", TIPOS_PERCEPCION.length),
            makeDropdown(colDedTipo, "B", TIPOS_DEDUCCION.length),
            makeDropdown(colOtroTipo, "C", TIPOS_OTRO_PAGO.length),
        ];

        // Proteger columnas de referencia (A-D) — solo lectura visual via estilo
        const refCols = ["receptor_nomina_id", "Nombre", "RFC", "SalarioDiario"];
        refCols.forEach((col) => {
            const colIdx = headers.indexOf(col);
            const colLetter = XLSX.utils.encode_col(colIdx);
            for (let r = 1; r <= numRows + 1; r++) {
                const cellAddr = `${colLetter}${r}`;
                if (ws[cellAddr]) {
                    ws[cellAddr].s = {
                        fill: { fgColor: { rgb: "E8F4F8" } },
                        font: { color: { rgb: "1b384a" } },
                    };
                }
            }
        });

        XLSX.utils.book_append_sheet(wb, ws, "Nominas");
        XLSX.utils.book_append_sheet(wb, wsCatalogos, "Catalogos");
        XLSX.writeFile(wb, `plantilla_nomina_${selectedEmisor?.ID}.xlsx`);
    };

    // ── Parsear .xlsx llenado ────────────────────────────────
    const handleUploadPlantilla = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: "array" });
            const ws = wb.Sheets["Nominas"];
            const rows = XLSX.utils.sheet_to_json(ws);
            setNominasPreview(rows);
            setResultados([]);
        };
        reader.readAsArrayBuffer(file);
    };

    // ── Enviar nóminas ───────────────────────────────────────
    const handleEnviar = async () => {
        if (!nominasPreview.length) return;
        setEnviando(true);
        setProgreso(0);
        const res = [];

        for (let i = 0; i < nominasPreview.length; i++) {
            const row = nominasPreview[i];
            const payload = buildPayload(row, selectedEmisor);

            console.log("Payload:", payload);

            try {
                const r = await fetch(GUARDAR_NOMINA_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                res.push({
                    id: row["receptor_nomina_id"],
                    nombre: row["Nombre"],
                    ok: r.ok,
                    msg: r.ok ? "OK" : await r.text(),
                });
            } catch {
                res.push({ id: row["receptor_nomina_id"], nombre: row["Nombre"], ok: false, msg: "Error de conexión" });
            }

            setProgreso(Math.round(((i + 1) / nominasPreview.length) * 100));
        }

        setResultados(res);
        setEnviando(false);

        const exitosos = res.filter((r) => r.ok).length;
        onMessage?.(`Se generaron ${exitosos} de ${nominasPreview.length} nómina(s) correctamente.`);
    };

    // ────────────────────────────────────────────────────────
    return (
        <Box>
            {/* ── Paso 1: Tabla de trabajadores ── */}
            <Typography variant="subtitle1" fontWeight="bold" color="#1b384a" mb={1}>
                1. Selecciona los trabajadores
                {seleccionados.length > 0 && (
                    <Chip
                        label={`${seleccionados.length} seleccionado(s)`}
                        size="small"
                        sx={{ ml: 1, backgroundColor: "#e8f4f8", color: "#1b384a" }}
                    />
                )}
            </Typography>

            {loadingTabla ? (
                <CircularProgress size={24} sx={{ color: "#1b384a", mb: 2 }} />
            ) : (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: "1px solid #e0e0e0", borderRadius: 2, mb: 3 }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: "#f0f4f7" }}>
                            <TableRow>
                                <TableCell padding="checkbox">
                                    <Checkbox
                                        checked={seleccionados.length === receptores.length && receptores.length > 0}
                                        indeterminate={seleccionados.length > 0 && seleccionados.length < receptores.length}
                                        onChange={toggleTodos}
                                    />
                                </TableCell>
                                <TableCell><strong>RFC</strong></TableCell>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell><strong>Puesto</strong></TableCell>
                                <TableCell><strong>Salario Diario Integrado</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {receptores.map((r) => (
                                <TableRow key={r.ID} hover
                                    selected={seleccionados.includes(r.ID)}
                                    onClick={() => toggleSeleccion(r.ID)}
                                    sx={{ cursor: "pointer" }}
                                >
                                    <TableCell padding="checkbox">
                                        <Checkbox checked={seleccionados.includes(r.ID)} />
                                    </TableCell>
                                    <TableCell>{r.Rfc}</TableCell>
                                    <TableCell>{r.Nombre}</TableCell>
                                    <TableCell>{r.Puesto}</TableCell>
                                    <TableCell>{r.SalarioDiarioIntegrado}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ── Paso 2 (NUEVO): Periodo de pago ── */}
            {seleccionados.length > 0 && (
                <>
                    <Typography variant="subtitle1" fontWeight="bold" color="#1b384a" mb={1}>
                        2. Periodo de pago
                    </Typography>

                    <Box
                        display="grid"
                        gridTemplateColumns={{ xs: "1fr 1fr", sm: "1fr 1fr 1fr auto" }}
                        gap={2}
                        alignItems="flex-end"
                        mb={1}
                        sx={{
                            p: 2,
                            border: "1px solid #e0e0e0",
                            borderRadius: 2,
                            backgroundColor: "#fafafa",
                        }}
                    >
                        <TextField
                            label="Fecha inicial de pago"
                            type="date"
                            size="small"
                            value={fechaInicial}
                            onChange={(e) => setFechaInicial(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Fecha final de pago"
                            type="date"
                            size="small"
                            value={fechaFinal}
                            onChange={(e) => setFechaFinal(e.target.value)}
                            inputProps={{ min: fechaInicial }}
                            InputLabelProps={{ shrink: true }}
                        />
                        <TextField
                            label="Fecha de pago"
                            type="date"
                            size="small"
                            value={fechaPago}
                            onChange={(e) => setFechaPago(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                        />
                        {/* Días calculados (solo lectura) */}
                        <Box
                            sx={{
                                height: 40,
                                px: 2,
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                border: "1px solid #e0e0e0",
                                borderRadius: 1,
                                backgroundColor: "#e8f4f8",
                                minWidth: 110,
                            }}
                        >
                            <Typography variant="h6" color="#1b384a" fontWeight="bold" lineHeight={1}>
                                {diasCalculados}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                días
                            </Typography>
                        </Box>
                    </Box>

                    {fechaInicial && fechaFinal && diasCalculados === 0 && (
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            La fecha final debe ser igual o posterior a la fecha inicial.
                        </Alert>
                    )}

                    {periodoValido && (
                        <Chip
                            label={`Periodo: ${fechaInicial} → ${fechaFinal} · ${diasCalculados} día(s) · Pago: ${fechaPago}`}
                            size="small"
                            sx={{ mb: 3, backgroundColor: "#e6f4ea", color: "#2e7d32" }}
                        />
                    )}
                </>
            )}

            {/* ── Paso 3: Descargar plantilla ── */}
            <Typography variant="subtitle1" fontWeight="bold" color="#1b384a" mb={1}>
                {seleccionados.length > 0 ? "3." : "2."} Descarga y llena la plantilla
            </Typography>
            <Box display="flex" gap={2} alignItems="center" mb={3}>
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    disabled={seleccionados.length === 0 || !periodoValido}
                    onClick={handleDescargarPlantilla}
                    sx={{ borderColor: "#1b384a", color: "#1b384a" }}
                >
                    Descargar plantilla .xlsx
                </Button>
                <Typography variant="caption" color="text.secondary">
                    Las fechas y días se pre-llenan automáticamente. Para múltiples percepciones/deducciones separa los valores con <strong>|</strong>
                </Typography>
            </Box>

            {/* ── Paso 4: Subir plantilla llenada ── */}
            <Typography variant="subtitle1" fontWeight="bold" color="#1b384a" mb={1}>
                {seleccionados.length > 0 ? "4." : "3."} Sube la plantilla llenada
            </Typography>
            <Box display="flex" gap={2} alignItems="center" mb={3}>
                <Button variant="outlined" component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ borderColor: "#1b384a", color: "#1b384a" }}>
                    Seleccionar archivo
                    <input type="file" accept=".xlsx" hidden onChange={handleUploadPlantilla} />
                </Button>
                {nominasPreview.length > 0 && (
                    <Chip
                        label={`${nominasPreview.length} nómina(s) listas para enviar`}
                        size="small"
                        sx={{ backgroundColor: "#e6f4ea", color: "#2e7d32" }}
                    />
                )}
            </Box>

            {/* ── Preview ── */}
            {nominasPreview.length > 0 && (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: "1px solid #e0e0e0", borderRadius: 2, mb: 3, maxHeight: 300, overflow: "auto" }}>
                    <Table size="small" stickyHeader>
                        <TableHead sx={{ backgroundColor: "#f0f4f7" }}>
                            <TableRow>
                                <TableCell><strong>Nombre</strong></TableCell>
                                <TableCell><strong>RFC</strong></TableCell>
                                <TableCell><strong>Días</strong></TableCell>
                                <TableCell><strong>Percepción Tipo</strong></TableCell>
                                <TableCell><strong>Gravado</strong></TableCell>
                                <TableCell><strong>Deducción Tipo</strong></TableCell>
                                <TableCell><strong>Deducción</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {nominasPreview.map((row, i) => (
                                <TableRow key={i}>
                                    <TableCell>{row["Nombre"]}</TableCell>
                                    <TableCell>{row["RFC"]}</TableCell>
                                    <TableCell>{row["DiasLaborados"]}</TableCell>
                                    <TableCell>{row["Percepcion_Tipo"]}</TableCell>
                                    <TableCell>{row["Percepcion_ImporteGravado"]}</TableCell>
                                    <TableCell>{row["Deduccion_Tipo"] || "—"}</TableCell>
                                    <TableCell>{row["Deduccion_Importe"] || "—"}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}

            {/* ── Enviar ── */}
            {nominasPreview.length > 0 && (
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                    <Button
                        variant="contained"
                        startIcon={<SendIcon />}
                        disabled={enviando}
                        onClick={handleEnviar}
                        sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                    >
                        {enviando ? `Enviando... ${progreso}%` : `Generar ${nominasPreview.length} nómina(s)`}
                    </Button>
                    {enviando && (
                        <Box sx={{ width: 200 }}>
                            <LinearProgress variant="determinate" value={progreso}
                                sx={{ "& .MuiLinearProgress-bar": { backgroundColor: "#1b384a" } }} />
                        </Box>
                    )}
                </Box>
            )}

            {/* ── Resultados ── */}
            {resultados.length > 0 && (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: "1px solid #e0e0e0", borderRadius: 2 }}>
                    <Table size="small">
                        <TableHead sx={{ backgroundColor: "#f0f4f7" }}>
                            <TableRow>
                                <TableCell><strong>Trabajador</strong></TableCell>
                                <TableCell><strong>Estado</strong></TableCell>
                                <TableCell><strong>Detalle</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {resultados.map((r, i) => (
                                <TableRow key={i}>
                                    <TableCell>{r.nombre}</TableCell>
                                    <TableCell>
                                        {r.ok
                                            ? <CheckCircleIcon sx={{ color: "#2e7d32", fontSize: 18 }} />
                                            : <ErrorIcon sx={{ color: "#c62828", fontSize: 18 }} />
                                        }
                                    </TableCell>
                                    <TableCell>
                                        <Tooltip title={r.msg}>
                                            <Typography variant="caption" noWrap sx={{ maxWidth: 300, display: "block" }}>
                                                {r.msg}
                                            </Typography>
                                        </Tooltip>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}