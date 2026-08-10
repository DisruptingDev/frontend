"use client"
import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import {
    Box, Button, Typography, Chip, CircularProgress,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Checkbox, LinearProgress, Tooltip, TextField, Alert,
    Divider, FormControlLabel, Accordion, AccordionSummary, AccordionDetails,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorIcon from "@mui/icons-material/Error";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;
const RECEPTORES_URL = `${apiUrl}/api/catalogos/Catalogos/ReceptorNomina`;
const GUARDAR_NOMINA_URL = `${apiUrl}/api/facturas/GuardarFacturaNomina`;

// ── Helpers de fecha ──────────────────────────────────────────
const hoy = () => new Date().toLocaleDateString("sv-SE");

const calcularDias = (fechaInicial, fechaFinal) => {
    if (!fechaInicial || !fechaFinal) return 0;
    const inicio = new Date(fechaInicial + "T00:00:00");
    const fin = new Date(fechaFinal + "T00:00:00");
    const diff = Math.round((fin - inicio) / (1000 * 60 * 60 * 24));
    return diff >= 0 ? diff + 1 : 0;
};

// ── Catálogos SAT ─────────────────────────────────────────────
const TIPOS_PERCEPCION = [
    { clave: "001", label: "Sueldos, Salarios Rayas y Jornales" },
    { clave: "002", label: "Gratificación Anual (Aguinaldo)" },
    { clave: "003", label: "Participación de los Trabajadores en las Utilidades PTU" },
    { clave: "004", label: "Reembolso de Gastos Médicos Dentales y Hospitalarios" },
    { clave: "005", label: "Fondo de Ahorro" },
    { clave: "006", label: "Caja de ahorro" },
    { clave: "009", label: "Contribuciones a Cargo del Trabajador Pagadas por el Patrón" },
    { clave: "010", label: "Premios por Puntualidad" },
    { clave: "011", label: "Prima de Seguro de vida" },
    { clave: "013", label: "Pagos por separación" },
    { clave: "014", label: "Premio por Antigüedad" },
    { clave: "019", label: "Horas extra" },
    { clave: "022", label: "Prima dominical" },
    { clave: "023", label: "Prima vacacional" },
    { clave: "024", label: "Tiempo extraordinario" },
    { clave: "025", label: "Indemnizaciones" },
    { clave: "044", label: "Jubilaciones, pensiones o haberes de retiro" },
    { clave: "046", label: "Ingresos en acciones o títulos" },
];

const TIPOS_DEDUCCION = [
    { clave: "001", label: "Seguridad Social" },
    { clave: "002", label: "ISR" },
    { clave: "003", label: "Aportaciones a retiro, cesantía en edad avanzada y vejez" },
    { clave: "004", label: "Otros" },
    { clave: "005", label: "Aportaciones a Fondo de vivienda" },
    { clave: "006", label: "Descuento por incapacidad" },
    { clave: "007", label: "Pensión alimenticia" },
    { clave: "008", label: "Renta" },
    { clave: "009", label: "Préstamos provenientes del Fondo Nacional de la Vivienda" },
    { clave: "010", label: "Pago por crédito de vivienda" },
    { clave: "011", label: "Pago de abonos INFONACOT" },
    { clave: "012", label: "Anticipo de salarios" },
    { clave: "013", label: "Pagos hechos con exceso al trabajador" },
    { clave: "014", label: "Errores" },
    { clave: "015", label: "Pérdidas" },
    { clave: "016", label: "Averías" },
    { clave: "017", label: "Adquisición de artículos producidos por la empresa" },
    { clave: "018", label: "Cuotas sindicales" },
    { clave: "019", label: "Devolución de pagos hechos por error al trabajador" },
    { clave: "020", label: "Prima de Seguro de vida" },
    { clave: "021", label: "Prima de Seguro de Gastos Médicos" },
    { clave: "022", label: "Impuesto local" },
];

const TIPOS_OTRO_PAGO = [
    { clave: "001", label: "Reintegro de ISR pagado en exceso" },
    { clave: "002", label: "Subsidio para el empleo" },
    { clave: "003", label: "Viáticos (entregados al trabajador)" },
    { clave: "004", label: "Aplicación de saldo a favor por compensación anual" },
    { clave: "005", label: "Reintegro de ISR retenido en exceso de ejercicio anterior" },
];

const TIPOS_IMPUESTO_RETENIDO = new Set(["001", "002"]);

const MENSAJES_CONOCIDOS = {
    "record not found": "No existe una serie configurada para este emisor. Verifica la configuración antes de continuar.",
};

// ── Helpers ────────────────────────────────────────────────────
const fmtCatalog = (item) => `${item.clave} - ${item.label}`;

// ── Selector de conceptos ──────────────────────────────────────
// selectedConceptos = { percepciones: ["001","002",...], deducciones: [...], otrosPagos: [...] }
const defaultConceptos = { percepciones: ["001"], deducciones: [], otrosPagos: [] };

function ConceptoSelector({ value, onChange }) {
    // Estado de expansión controlado manualmente por sección
    const [expanded, setExpanded] = useState({ percepciones: false, deducciones: false, otrosPagos: false });

    const toggle = (group, clave) => {
        const prev = value[group];
        const next = prev.includes(clave) ? prev.filter((c) => c !== clave) : [...prev, clave];
        onChange({ ...value, [group]: next });
    };

    const handleAccordionChange = (group) => (_event, isExpanded) => {
        setExpanded((prev) => ({ ...prev, [group]: isExpanded }));
    };

    const Section = ({ title, items, group, color }) => (
        <Accordion
            disableGutters
            elevation={0}
            expanded={expanded[group]}
            onChange={handleAccordionChange(group)}
            sx={{ border: "1px solid #e0e0e0", borderRadius: "8px !important", mb: 1, "&:before": { display: "none" } }}
        >
            <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ backgroundColor: "#fafafa", borderRadius: 2 }}>
                <Typography fontWeight="bold" color="#1b384a" fontSize={14}>{title}</Typography>
                {value[group].length > 0 && (
                    <Chip label={value[group].length} size="small"
                        sx={{ ml: 1, backgroundColor: color, color: "#fff", height: 18, fontSize: 11 }} />
                )}
            </AccordionSummary>
            <AccordionDetails sx={{ pt: 0 }} onClick={(e) => e.stopPropagation()}>
                <Box display="flex" flexWrap="wrap" gap={0.5}>
                    {items.map((item) => (
                        <FormControlLabel
                            key={item.clave}
                            control={
                                <Checkbox
                                    size="small"
                                    checked={value[group].includes(item.clave)}
                                    onChange={() => toggle(group, item.clave)}
                                    sx={{ py: 0.3 }}
                                />
                            }
                            label={
                                <Typography fontSize={12} color="text.primary">
                                    <strong>{item.clave}</strong> — {item.label}
                                </Typography>
                            }
                            sx={{ width: "100%", m: 0, pl: 1 }}
                        />
                    ))}
                </Box>
            </AccordionDetails>
        </Accordion>
    );

    return (
        <Box>
            <Section title="Percepciones" items={TIPOS_PERCEPCION} group="percepciones" color="#2e7d32" />
            <Section title="Deducciones" items={TIPOS_DEDUCCION} group="deducciones" color="#c62828" />
            <Section title="Otros pagos" items={TIPOS_OTRO_PAGO} group="otrosPagos" color="#1565c0" />
        </Box>
    );
}

// ── Generar columnas dinámicas según conceptos elegidos ────────
// Retorna array de { key, header, group, clave, subfield }
//   group: "perc" | "ded" | "otro"
//   subfield: "Tipo" | "Clave" | "Concepto" | "ImporteGravado" | "ImporteExento" | "Importe"
function buildColumnDefs(conceptos) {
    const cols = [
        { key: "receptor_nomina_id", header: "receptor_nomina_id", fixed: true },
        { key: "Nombre", header: "Nombre", fixed: true },
        { key: "RFC", header: "RFC", fixed: true },
        { key: "SalarioDiario", header: "SalarioDiario", fixed: true },
        { key: "DiasLaborados", header: "DiasLaborados", fixed: true },
        { key: "TipoNomina", header: "TipoNomina", fixed: true },
        { key: "FechaPago", header: "FechaPago", fixed: true },
        { key: "FechaInicialPago", header: "FechaInicialPago", fixed: true },
        { key: "FechaFinalPago", header: "FechaFinalPago", fixed: true },
    ];

    conceptos.percepciones.forEach((clave, idx) => {
        const n = idx + 1;
        const item = TIPOS_PERCEPCION.find((t) => t.clave === clave);
        cols.push(
            { key: `Percepcion_Tipo_${n}`, header: `Percepcion_Tipo_${n}`, group: "perc", clave, n, subfield: "Tipo", readOnly: true },
            { key: `Percepcion_Clave_${n}`, header: `Percepcion_Clave_${n}`, group: "perc", clave, n, subfield: "Clave", readOnly: true },
            { key: `Percepcion_Concepto_${n}`, header: `Percepcion_Concepto_${n}`, group: "perc", clave, n, subfield: "Concepto", readOnly: false },
            {
                key: `Percepcion_ImporteGravado_${n}`, header: `Percepcion_ImporteGravado_${n}`, group: "perc", clave, n, subfield: "ImporteGravado", readOnly: false,
                autoCalc: clave === "001"
            }, // se calcula para sueldo
            { key: `Percepcion_ImporteExento_${n}`, header: `Percepcion_ImporteExento_${n}`, group: "perc", clave, n, subfield: "ImporteExento", readOnly: false },
        );
    });

    conceptos.deducciones.forEach((clave, idx) => {
        const n = idx + 1;
        cols.push(
            { key: `Deduccion_Tipo_${n}`, header: `Deduccion_Tipo_${n}`, group: "ded", clave, n, subfield: "Tipo", readOnly: true },
            { key: `Deduccion_Clave_${n}`, header: `Deduccion_Clave_${n}`, group: "ded", clave, n, subfield: "Clave", readOnly: true },
            { key: `Deduccion_Concepto_${n}`, header: `Deduccion_Concepto_${n}`, group: "ded", clave, n, subfield: "Concepto", readOnly: false },
            { key: `Deduccion_Importe_${n}`, header: `Deduccion_Importe_${n}`, group: "ded", clave, n, subfield: "Importe", readOnly: false },
        );
    });

    conceptos.otrosPagos.forEach((clave, idx) => {
        const n = idx + 1;
        cols.push(
            { key: `OtroPago_Tipo_${n}`, header: `OtroPago_Tipo_${n}`, group: "otro", clave, n, subfield: "Tipo", readOnly: true },
            { key: `OtroPago_Clave_${n}`, header: `OtroPago_Clave_${n}`, group: "otro", clave, n, subfield: "Clave", readOnly: true },
            { key: `OtroPago_Concepto_${n}`, header: `OtroPago_Concepto_${n}`, group: "otro", clave, n, subfield: "Concepto", readOnly: false },
            { key: `OtroPago_Importe_${n}`, header: `OtroPago_Importe_${n}`, group: "otro", clave, n, subfield: "Importe", readOnly: false },
        );
    });

    return cols;
}

// ── Valor por defecto para un campo ────────────────────────────
function defaultCellValue(colDef, receptor, diasCalculados) {
    if (colDef.fixed) return undefined; // handled separately in row builder

    const { group, clave, subfield, autoCalc } = colDef;

    if (group === "perc") {
        const item = TIPOS_PERCEPCION.find((t) => t.clave === clave);
        if (subfield === "Tipo") return fmtCatalog(item);
        if (subfield === "Clave") return clave;
        if (subfield === "Concepto") return item?.label ?? "";
        if (subfield === "ImporteGravado") {
            // Auto-calculate sueldo: SalarioDiario * DiasLaborados
            if (autoCalc && receptor?.SalarioDiarioIntegrado && diasCalculados > 0) {
                return parseFloat((receptor.SalarioDiarioIntegrado * diasCalculados).toFixed(2));
            }
            return "";
        }
        if (subfield === "ImporteExento") return 0;
    }

    if (group === "ded") {
        const item = TIPOS_DEDUCCION.find((t) => t.clave === clave);
        if (subfield === "Tipo") return fmtCatalog(item);
        if (subfield === "Clave") return clave;
        if (subfield === "Concepto") return item?.label ?? "";
        if (subfield === "Importe") return "";
    }

    if (group === "otro") {
        const item = TIPOS_OTRO_PAGO.find((t) => t.clave === clave);
        if (subfield === "Tipo") return fmtCatalog(item);
        if (subfield === "Clave") return clave;
        if (subfield === "Concepto") return item?.label ?? "";
        if (subfield === "Importe") return "";
    }

    return "";
}

// ── Construir fila de plantilla para un receptor ───────────────
function buildTemplateRow(receptor, colDefs, fechaInicial, fechaFinal, fechaPago, diasCalculados) {
    const row = {};
    colDefs.forEach((col) => {
        if (col.fixed) {
            switch (col.key) {
                case "receptor_nomina_id": row[col.header] = receptor.ID; break;
                case "Nombre": row[col.header] = receptor.Nombre; break;
                case "RFC": row[col.header] = receptor.Rfc; break;
                case "SalarioDiario": row[col.header] = receptor.SalarioDiarioIntegrado; break;
                case "DiasLaborados": row[col.header] = diasCalculados; break;
                case "TipoNomina": row[col.header] = "O"; break;
                case "FechaPago": row[col.header] = fechaPago; break;
                case "FechaInicialPago": row[col.header] = fechaInicial; break;
                case "FechaFinalPago": row[col.header] = fechaFinal; break;
                default: row[col.header] = "";
            }
        } else {
            row[col.header] = defaultCellValue(col, receptor, diasCalculados);
        }
    });
    return row;
}

// ── Parser: xlsx → array de filas normalizadas ─────────────────
// Lee columnas indexadas _1, _2, … y reconstruye arrays de percepciones, etc.
function parseXlsxRows(ws, colDefs) {
    const raw = XLSX.utils.sheet_to_json(ws);
    return raw.map((row) => {
        const out = { ...row };

        // Contar cuántos grupos hay por tipo
        const countGroup = (prefix) => {
            let n = 1;
            while (row[`${prefix}_${n}`] !== undefined) n++;
            return n - 1;
        };

        out.__percepciones_count = countGroup("Percepcion_Tipo");
        out.__deducciones_count = countGroup("Deduccion_Tipo");
        out.__otros_count = countGroup("OtroPago_Tipo");

        return out;
    });
}

// ── buildPayload ── (reescrito para columnas indexadas) ─────────
const buildPayload = (row, emisor) => {
    const percepciones = [];
    const deducciones = [];
    const otrosPagos = [];

    const countGroup = (prefix) => {
        let n = 1;
        while (row[`${prefix}_Tipo_${n}`] !== undefined) n++;
        return n - 1;
    };

    const numPerc = countGroup("Percepcion");
    const numDed = countGroup("Deduccion");
    const numOtros = countGroup("OtroPago");

    const parsearClave = (str) => (str ?? "").split(" - ")[0].trim();
    const num = (v) => parseFloat(v ?? 0) || 0;

    for (let i = 1; i <= numPerc; i++) {
        const gravado = num(row[`Percepcion_ImporteGravado_${i}`]);
        const exento = num(row[`Percepcion_ImporteExento_${i}`]);
        percepciones.push({
            TipoPercepcion: parsearClave(row[`Percepcion_Tipo_${i}`]),
            Clave: row[`Percepcion_Clave_${i}`] ?? "001",
            Concepto: row[`Percepcion_Concepto_${i}`] ?? "",
            ImporteGravado: gravado,
            ImporteExento: exento,
        });
    }

    for (let i = 1; i <= numDed; i++) {
        deducciones.push({
            TipoDeduccion: parsearClave(row[`Deduccion_Tipo_${i}`]),
            Clave: row[`Deduccion_Clave_${i}`] ?? "001",
            Concepto: row[`Deduccion_Concepto_${i}`] ?? "",
            Importe: num(row[`Deduccion_Importe_${i}`]),
        });
    }

    for (let i = 1; i <= numOtros; i++) {
        otrosPagos.push({
            TipoOtroPago: parsearClave(row[`OtroPago_Tipo_${i}`]),
            Clave: row[`OtroPago_Clave_${i}`] ?? "001",
            Concepto: row[`OtroPago_Concepto_${i}`] ?? "",
            Importe: num(row[`OtroPago_Importe_${i}`]),
        });
    }

    const totalPercepciones = percepciones.reduce((s, p) => s + p.ImporteGravado + p.ImporteExento, 0);
    const totalDeducciones = deducciones.reduce((s, d) => s + d.Importe, 0);
    const totalOtros = otrosPagos.reduce((s, o) => s + o.Importe, 0);
    const totalGravado = percepciones.reduce((s, p) => s + p.ImporteGravado, 0);
    const totalExento = percepciones.reduce((s, p) => s + p.ImporteExento, 0);

    const totalImpuestosRetenidos = Math.round(
        deducciones.filter(d => TIPOS_IMPUESTO_RETENIDO.has(d.TipoDeduccion))
            .reduce((s, d) => s + d.Importe, 0) * 100) / 100;
    const totalOtrasDeducciones = Math.round(
        deducciones.filter(d => !TIPOS_IMPUESTO_RETENIDO.has(d.TipoDeduccion))
            .reduce((s, d) => s + d.Importe, 0) * 100) / 100;

    const r2 = (n) => Math.round(n * 100) / 100;

    const now = new Date();
    const formatter = new Intl.DateTimeFormat("sv-SE", {
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        year: "numeric", month: "2-digit", day: "2-digit",
        hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
    });
    const Fecha = formatter.format(now).replace(" ", "T");

    return {
        Version: "4.0",
        Serie: emisor?.Serie ?? "N",
        Fecha,
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
        Descuento: totalDeducciones > 0 ? r2(totalDeducciones) : undefined,
        DescuentoString: totalDeducciones > 0 ? r2(totalDeducciones).toFixed(2) : undefined,
        SubTotal: r2(totalPercepciones),
        SubTotalString: r2(totalPercepciones).toFixed(2),
        Total: r2(totalPercepciones - totalDeducciones + totalOtros),
        TotalString: r2(totalPercepciones - totalDeducciones + totalOtros).toFixed(2),
        Conceptos: {
            ListaConceptos: [{
                ClaveProdServ: "84111505",
                Cantidad: 1,
                ClaveUnidad: "ACT",
                Descripcion: "Pago de nómina",
                ValorUnitario: r2(totalPercepciones),
                Importe: r2(totalPercepciones),
                Descuento: totalDeducciones > 0 ? r2(totalDeducciones) : undefined,
                ObjetoImp: "01",
                Impuestos: { Traslados: [], Retenciones: [] },
            }],
            TotalImpuestosTrasladados: 0,
            TotalImpuestosRetenidos: 0,
        },
        Complemento: {
            Nomina: {
                Version: "1.2",
                TipoNomina: row["TipoNomina"] ?? "O",
                FechaPago: String(row["FechaPago"]),
                FechaInicialPago: String(row["FechaInicialPago"]),
                FechaFinalPago: String(row["FechaFinalPago"]),
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
                    Percepciones: percepciones,
                },
                Deducciones: deducciones.length > 0 ? {
                    TotalImpuestosRetenidos: totalImpuestosRetenidos,
                    TotalOtrasDeducciones: totalOtrasDeducciones,
                    Deducciones: deducciones,
                } : undefined,
                OtrosPagos: otrosPagos.length ? { OtrosPagos: otrosPagos } : undefined,
            },
        },
    };
};

// ── Etiquetas de color por grupo de columna ────────────────────
const colGroupStyle = (header) => {
    if (header.startsWith("Percepcion_")) return { backgroundColor: "#e6f4ea" };
    if (header.startsWith("Deduccion_")) return { backgroundColor: "#fce4e4" };
    if (header.startsWith("OtroPago_")) return { backgroundColor: "#e3f2fd" };
    return {};
};

// ────────────────────────────────────────────────────────────────
export default function GenerarNominas({ token, selectedEmisor, onMessage, onSuccess }) {
    const [loadingTabla, setLoadingTabla] = useState(false);
    const [receptores, setReceptores] = useState([]);
    const [seleccionados, setSeleccionados] = useState([]);
    const [nominasPreview, setNominasPreview] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [enviando, setEnviando] = useState(false);
    const [progreso, setProgreso] = useState(0);
    const [fechaInicial, setFechaInicial] = useState("");
    const [fechaFinal, setFechaFinal] = useState("");
    const [fechaPago, setFechaPago] = useState(hoy());
    const [conceptos, setConceptos] = useState(defaultConceptos);
    // Guarda las columnas usadas al generar la plantilla, para parsear el xlsx con la misma definición
    const [colDefsUsadas, setColDefsUsadas] = useState([]);

    const diasCalculados = calcularDias(fechaInicial, fechaFinal);
    const periodoValido = fechaInicial && fechaFinal && fechaPago && diasCalculados > 0;
    const totalConceptos =
        conceptos.percepciones.length + conceptos.deducciones.length + conceptos.otrosPagos.length;

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

    const toggleSeleccion = (id) =>
        setSeleccionados((prev) =>
            prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
        );

    const toggleTodos = () =>
        setSeleccionados(
            seleccionados.length === receptores.length ? [] : receptores.map((r) => r.ID)
        );

    // ── Generar plantilla xlsx ────────────────────────────────
    const handleDescargarPlantilla = () => {
        const trabajadores = receptores.filter((r) => seleccionados.includes(r.ID));
        const colDefs = buildColumnDefs(conceptos);
        setColDefsUsadas(colDefs); // guardar para parseo posterior

        const headers = colDefs.map((c) => c.header);

        const rows = trabajadores.map((r) =>
            buildTemplateRow(r, colDefs, fechaInicial, fechaFinal, fechaPago, diasCalculados)
        );

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

        // Anchos de columna
        ws["!cols"] = headers.map((h) =>
            h.includes("Concepto") || h.includes("Tipo") || h === "Nombre"
                ? { wch: 42 } : { wch: 22 }
        );

        // Estilos — columnas de solo lectura con fondo azulado
        const readOnlyCols = colDefs
            .filter((c) => c.fixed || c.readOnly)
            .map((c) => headers.indexOf(c.header));

        const numRows = rows.length;
        readOnlyCols.forEach((colIdx) => {
            const colLetter = XLSX.utils.encode_col(colIdx);
            for (let r = 1; r <= numRows + 1; r++) {
                const addr = `${colLetter}${r}`;
                if (ws[addr]) {
                    ws[addr].s = {
                        fill: { fgColor: { rgb: "E8F4F8" } },
                        font: { color: { rgb: "1b384a" } },
                    };
                }
            }
        });

        XLSX.utils.book_append_sheet(wb, ws, "Nominas");

        // Hoja de metadatos — guarda la definición de columnas para parseo seguro
        const meta = [{ colDefs: JSON.stringify(colDefs) }];
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(meta), "_meta");

        XLSX.writeFile(wb, `plantilla_nomina_${selectedEmisor?.ID}.xlsx`);
    };

    // ── Parsear xlsx llenado ──────────────────────────────────
    const handleUploadPlantilla = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const wb = XLSX.read(evt.target.result, { type: "array" });
            const ws = wb.Sheets["Nominas"];
            const rows = XLSX.utils.sheet_to_json(ws);

            // Recuperar colDefs desde hoja _meta si existe
            let savedColDefs = colDefsUsadas;
            if (wb.Sheets["_meta"]) {
                try {
                    const metaRows = XLSX.utils.sheet_to_json(wb.Sheets["_meta"]);
                    if (metaRows[0]?.colDefs) {
                        savedColDefs = JSON.parse(metaRows[0].colDefs);
                    }
                } catch { /* usa las guardadas en estado */ }
            }

            setNominasPreview(rows);
            setResultados([]);
        };
        reader.readAsArrayBuffer(file);
    };

    // ── Enviar nóminas ────────────────────────────────────────
    const handleEnviar = async () => {
        if (!nominasPreview.length) return;
        setEnviando(true);
        setProgreso(0);
        const res = [];

        for (let i = 0; i < nominasPreview.length; i++) {
            const row = nominasPreview[i];
            const payload = buildPayload(row, selectedEmisor);

            console.log("Payload a enviar:", payload);

            try {
                const r = await fetch(GUARDAR_NOMINA_URL, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });
                
                let errorMsg = "Falta un campo requerido o formato incorrecto";
                if (!r.ok) {
                    const errorText = await r.text();
                    try {
                        const errorData = JSON.parse(errorText);
                        // Extraemos el error. Tratamos de hacerlo muy legible.
                        errorMsg = errorData.error || errorData.message || JSON.stringify(errorData);
                    } catch (e) {
                        errorMsg = errorText || errorMsg;
                    }
                    // Forzar mostrarlo en un alert temporal para que el usuario lo vea SÍ o SÍ
                    alert("El servidor rechazó la nómina por: " + errorMsg);
                }

                res.push({
                    id: row["receptor_nomina_id"],
                    nombre: row["Nombre"],
                    ok: r.ok,
                    msg: r.ok ? "OK" : errorMsg,
                });
            } catch (err) {
                console.error("Error de red:", err);
                res.push({ id: row["receptor_nomina_id"], nombre: row["Nombre"], ok: false, msg: "Error de conexión" });
            }

            setProgreso(Math.round(((i + 1) / nominasPreview.length) * 100));
        }

        setResultados(res);
        setEnviando(false);

        const exitosos = res.filter((r) => r.ok).length;
        if (exitosos > 0) {
            onMessage?.(`Se generaron ${exitosos} de ${nominasPreview.length} nómina(s) correctamente.`);
        } else {
            onMessage?.("No se pudo generar ninguna nómina. Revisa los errores e intenta de nuevo.", true);
        }

        if (exitosos === nominasPreview.length) {
            onMessage?.("Todas las nóminas se generaron correctamente");
            setTimeout(() => { onSuccess?.(); }, 1500);
        }
    };

    const step = (n, label) => (
        <Typography variant="subtitle1" fontWeight="bold" color="#1b384a" mb={1}>
            {n}. {label}
        </Typography>
    );

    // ────────────────────────────────────────────────────────
    return (
        <Box>

            {/* ── Paso 1: Trabajadores ── */}
            {step(1, <>
                Selecciona los trabajadores{" "}
                {seleccionados.length > 0 && (
                    <Chip label={`${seleccionados.length} seleccionado(s)`} size="small"
                        sx={{ ml: 1, backgroundColor: "#e8f4f8", color: "#1b384a" }} />
                )}
            </>)}

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

            {/* ── Paso 2: Periodo ── */}
            {seleccionados.length > 0 && (
                <>
                    {step(2, "Periodo de pago")}
                    <Box
                        display="grid"
                        gridTemplateColumns={{ xs: "1fr 1fr", sm: "1fr 1fr 1fr auto" }}
                        gap={2}
                        alignItems="flex-end"
                        mb={1}
                        sx={{ p: 2, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fafafa" }}
                    >
                        <TextField label="Fecha inicial de pago" type="date" size="small"
                            value={fechaInicial} onChange={(e) => setFechaInicial(e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                        <TextField label="Fecha final de pago" type="date" size="small"
                            value={fechaFinal} onChange={(e) => setFechaFinal(e.target.value)}
                            inputProps={{ min: fechaInicial }} InputLabelProps={{ shrink: true }} />
                        <TextField label="Fecha de pago" type="date" size="small"
                            value={fechaPago} onChange={(e) => setFechaPago(e.target.value)}
                            InputLabelProps={{ shrink: true }} />
                        <Box sx={{
                            height: 40, px: 2, display: "flex", alignItems: "center", gap: 1,
                            border: "1px solid #e0e0e0", borderRadius: 1,
                            backgroundColor: "#e8f4f8", minWidth: 110,
                        }}>
                            <Typography variant="h6" color="#1b384a" fontWeight="bold" lineHeight={1}>
                                {diasCalculados}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">días</Typography>
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

            {/* ── Paso 3: Conceptos a registrar ── */}
            {seleccionados.length > 0 && periodoValido && (
                <>
                    {step(3, <>
                        Elige los conceptos a registrar{" "}
                        {totalConceptos > 0 && (
                            <Chip label={`${totalConceptos} concepto(s)`} size="small"
                                sx={{ ml: 1, backgroundColor: "#fff3e0", color: "#e65100" }} />
                        )}
                    </>)}

                    <Box mb={3} sx={{
                        p: 2, border: "1px solid #e0e0e0", borderRadius: 2, backgroundColor: "#fafafa"
                    }}>
                        <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
                            Cada concepto seleccionado generará sus propias columnas en la plantilla.
                            El importe gravado de <strong>Sueldo (001)</strong> se calcula automáticamente
                            como <em>Salario Diario × Días Laborados</em>.
                        </Typography>
                        <ConceptoSelector value={conceptos} onChange={setConceptos} />

                        {totalConceptos === 0 && (
                            <Alert severity="info" sx={{ mt: 1 }}>
                                Selecciona al menos una percepción para continuar.
                            </Alert>
                        )}
                    </Box>
                </>
            )}

            {/* ── Paso 4: Descargar plantilla ── */}
            {step(
                seleccionados.length > 0 && periodoValido && totalConceptos > 0 ? 4 : 3,
                "Descarga y llena la plantilla"
            )}
            <Box display="flex" gap={2} alignItems="center" mb={3} flexWrap="wrap">
                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    disabled={seleccionados.length === 0 || !periodoValido || totalConceptos === 0}
                    onClick={handleDescargarPlantilla}
                    sx={{ borderColor: "#1b384a", color: "#1b384a" }}
                >
                    Descargar plantilla .xlsx
                </Button>
                <Typography variant="caption" color="text.secondary">
                    Las columnas se generan según los conceptos elegidos arriba.
                    Las celdas azuladas son de sólo referencia (no las modifiques).
                </Typography>
            </Box>

            {/* ── Paso 5: Subir plantilla ── */}
            {step(
                seleccionados.length > 0 && periodoValido && totalConceptos > 0 ? 5 : 4,
                "Sube la plantilla llenada"
            )}
            <Box display="flex" gap={2} alignItems="center" mb={3}>
                <Button variant="outlined" component="label"
                    startIcon={<CloudUploadIcon />}
                    sx={{ borderColor: "#1b384a", color: "#1b384a" }}>
                    Seleccionar archivo
                    <input type="file" accept=".xlsx" hidden onChange={handleUploadPlantilla} />
                </Button>
                {nominasPreview.length > 0 && (
                    <Chip label={`${nominasPreview.length} nómina(s) listas para enviar`}
                        size="small"
                        sx={{ backgroundColor: "#e6f4ea", color: "#2e7d32" }} />
                )}
            </Box>

            {/* ── Preview dinámico ── */}
            {nominasPreview.length > 0 && (
                <TableContainer component={Paper} elevation={0}
                    sx={{ border: "1px solid #e0e0e0", borderRadius: 2, mb: 3, maxHeight: 320, overflow: "auto" }}>
                    <Table size="small" stickyHeader>
                        <TableHead>
                            <TableRow>
                                {Object.keys(nominasPreview[0])
                                    .filter((k) => !k.startsWith("__"))
                                    .map((col) => (
                                        <TableCell key={col}
                                            sx={{ ...colGroupStyle(col), fontWeight: "bold", fontSize: 11, whiteSpace: "nowrap" }}>
                                            {col}
                                        </TableCell>
                                    ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {nominasPreview.map((row, i) => (
                                <TableRow key={i}>
                                    {Object.keys(row)
                                        .filter((k) => !k.startsWith("__"))
                                        .map((col) => (
                                            <TableCell key={col} sx={{ fontSize: 11, whiteSpace: "nowrap" }}>
                                                {row[col] ?? "—"}
                                            </TableCell>
                                        ))}
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
                                            : <ErrorIcon sx={{ color: "#c62828", fontSize: 18 }} />}
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
