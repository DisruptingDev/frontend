"use client";
import { useState, useEffect } from "react";
import {
    Box, Button, Typography, TextField, Table, TableBody, TableCell,
    TableContainer, TableHead, TableRow, Paper, Dialog, DialogTitle,
    DialogContent, DialogActions, IconButton, Chip, Divider, Accordion,
    AccordionSummary, AccordionDetails, Tooltip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SendIcon from "@mui/icons-material/Send";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

const conceptoVacio = () => ({ TipoPercepcion: "", Clave: "", Concepto: "", ImporteGravado: "0", ImporteExento: "0" });
const deduccionVacia = () => ({ TipoDeduccion: "", Clave: "", Concepto: "", Importe: "0" });
const otroPagoVacio = () => ({ TipoOtroPago: "", Clave: "", Concepto: "", Importe: "0", SubsidioAlEmpleo: null });

// Función para obtener fecha actual en formato YYYY-MM-DD
const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

// Función para calcular días entre dos fechas
const calculateDaysBetween = (startDate, endDate) => {
    if (!startDate || !endDate) return "";

    const start = new Date(startDate);
    const end = new Date(endDate);

    // Calcular la diferencia en milisegundos y convertir a días
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 para incluir ambos días

    return diffDays.toString();
};

export default function GenerarNominas({ token, selectedEmisor, onMessage }) {
    const [loading, setLoading] = useState(false);
    const [trabajadores, setTrabajadores] = useState([]);

    // Inicializar periodo con fecha actual
    const [periodo, setPeriodo] = useState({
        FechaPago: getTodayDate(),
        FechaInicialPago: "",
        FechaFinalPago: "",
        NumDiasPagados: ""
    });

    // Modal
    const [modalOpen, setModalOpen] = useState(false);
    const [trabajadorActivo, setTrabajadorActivo] = useState(null);
    const [conceptos, setConceptos] = useState({
        Percepciones: [],
        TotalSueldos: "0", TotalGravado: "0", TotalExento: "0",
        Deducciones: [],
        TotalOtrasDeducciones: "0", TotalImpuestosRetenidos: "0",
        OtrosPagos: [],
    });

    // Mapa de conceptos guardados por trabajador { [id]: conceptos }
    const [conceptosPorTrabajador, setConceptosPorTrabajador] = useState({});

    // ── Efecto para calcular días pagados automáticamente ──
    useEffect(() => {
        if (periodo.FechaInicialPago && periodo.FechaFinalPago) {
            const dias = calculateDaysBetween(periodo.FechaInicialPago, periodo.FechaFinalPago);
            setPeriodo(prev => ({ ...prev, NumDiasPagados: dias }));
        }
    }, [periodo.FechaInicialPago, periodo.FechaFinalPago]);

    // ── Cargar trabajadores del emisor ──
    useEffect(() => {
        if (!selectedEmisor) return;
        fetch(`${apiUrl}/api/catalogos/Catalogos/ReceptorNomina?EmisorNominaID=${selectedEmisor.ID}`, {
            headers: { "Authorization": `Bearer ${token}` }
        })
            .then(r => r.json())
            .then(data => setTrabajadores(Array.isArray(data) ? data : []))
            .catch(() => setTrabajadores([]));
    }, [selectedEmisor]);

    // ── Abrir modal ──
    const handleAbrirModal = (trabajador) => {
        setTrabajadorActivo(trabajador);
        // Si ya tenía conceptos guardados, cargarlos
        setConceptos(conceptosPorTrabajador[trabajador.ID] || {
            Percepciones: [], TotalSueldos: "0", TotalGravado: "0", TotalExento: "0",
            Deducciones: [], TotalOtrasDeducciones: "0", TotalImpuestosRetenidos: "0",
            OtrosPagos: [],
        });
        setModalOpen(true);
    };

    const handleGuardarConceptos = () => {
        setConceptosPorTrabajador(prev => ({
            ...prev,
            [trabajadorActivo.ID]: conceptos
        }));
        setModalOpen(false);
    };

    // ── Helpers para listas dinámicas ──
    const agregarItem = (lista) => setConceptos(p => ({ ...p, [lista]: [...p[lista], lista === "Percepciones" ? conceptoVacio() : lista === "Deducciones" ? deduccionVacia() : otroPagoVacio()] }));
    const eliminarItem = (lista, idx) => setConceptos(p => ({ ...p, [lista]: p[lista].filter((_, i) => i !== idx) }));
    const actualizarItem = (lista, idx, campo, valor) => setConceptos(p => ({
        ...p,
        [lista]: p[lista].map((item, i) => i === idx ? { ...item, [campo]: valor } : item)
    }));

    // ── Validar periodo completo ──
    const periodoCompleto = periodo.FechaPago && periodo.FechaInicialPago &&
        periodo.FechaFinalPago && periodo.NumDiasPagados;

    const trabajadoresListos = trabajadores.filter(t => conceptosPorTrabajador[t.ID]);

    // ── Generar y enviar nóminas ──
    const handleGenerarNominas = async () => {
        if (!periodoCompleto || trabajadoresListos.length === 0) return;
        setLoading(true);

        let exito = 0;
        const errores = [];

        for (const trabajador of trabajadoresListos) {
            const c = conceptosPorTrabajador[trabajador.ID];

            console.log("Emisor", selectedEmisor);

            const payload = {
                // Comprobante
                Version: "4.0",
                Serie: "N",
                Fecha: new Date().toISOString().replace('Z', '').split('.')[0],
                FormaPago: "99",
                CondicionesDePago: "Contado",
                SubTotal: parseFloat(c.TotalSueldos),
                Descuento: parseFloat(c.TotalOtrasDeducciones),
                Moneda: "MXN",
                TipoCambio: "1",
                Total: parseFloat(
                    (parseFloat(c.TotalSueldos) - parseFloat(c.TotalOtrasDeducciones) +
                        c.OtrosPagos.reduce((s, o) => s + parseFloat(o.Importe || 0), 0)).toFixed(2)
                ),
                TipoDeComprobante: "N",
                Exportacion: "01",
                MetodoPago: "PUE",
                LugarExpedicion: selectedEmisor.Emisor?.LugarExpedicion || "00000",
                EmisorID: selectedEmisor.EmisorID,   // ID de Gestores.Emisor
                ReceptorNominaID: trabajador.ID,             // ID de ReceptorNomina
                UsoCFDI: "N01",

                Conceptos: {
                    ListaConceptos: [{
                        ClaveProdServ: "84111505",
                        NoIdentificacion: "",
                        Cantidad: 1,
                        ClaveUnidad: "ACT",
                        Unidad: "Actividad",
                        Descripcion: "Pago de nómina",
                        ValorUnitario: parseFloat(c.TotalSueldos),
                        Importe: parseFloat(c.TotalSueldos),
                        Descuento: parseFloat(c.TotalOtrasDeducciones),
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
                        TipoNomina: "O",
                        FechaPago: periodo.FechaPago,
                        FechaInicialPago: periodo.FechaInicialPago,
                        FechaFinalPago: periodo.FechaFinalPago,
                        NumDiasPagados: parseInt(periodo.NumDiasPagados),
                        TotalPercepciones: parseFloat(c.TotalSueldos),
                        TotalDeducciones: parseFloat(c.TotalOtrasDeducciones),
                        TotalOtrosPagos: parseFloat(
                            c.OtrosPagos.reduce((s, o) => s + parseFloat(o.Importe || 0), 0).toFixed(2)
                        ),
                        EmisorNominaID: selectedEmisor.ID,  // ID de EmisorNomina
                        ReceptorNominaID: trabajador.ID,       // ID de ReceptorNomina

                        Percepciones: {
                            TotalSueldos: parseFloat(c.TotalSueldos),
                            TotalGravado: parseFloat(c.TotalGravado),
                            TotalExento: parseFloat(c.TotalExento),
                            Percepciones: c.Percepciones,
                        },
                        Deducciones: c.Deducciones.length > 0 ? {
                            TotalOtrasDeducciones: parseFloat(c.TotalOtrasDeducciones),
                            TotalImpuestosRetenidos: parseFloat(c.TotalImpuestosRetenidos),
                            Deducciones: c.Deducciones,
                        } : null,
                        OtrosPagos: c.OtrosPagos.length > 0 ? {
                            OtrosPagos: c.OtrosPagos,
                        } : null,
                    }
                }
            };

            try {
                const res = await fetch(`${apiUrl}/api/facturas/GuardarFacturaNomina`, {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(payload),
                });

                if (res.ok) exito++;
                else {
                    const text = await res.text();
                    errores.push(`${trabajador.Curp}: ${text.substring(0, 100)}`);
                }
            } catch {
                errores.push(`${trabajador.Curp}: Error de conexión`);
            }
        }

        let msg = `${exito} de ${trabajadoresListos.length} nómina(s) generada(s).`;
        if (errores.length > 0) msg += ` Errores:\n${errores.join("\n")}`;
        onMessage(msg);
        setLoading(false);
    };

    return (
        <Box>
            {/* ── Periodo ── */}
            <Box p={2} mb={2} borderRadius={2} sx={{ border: "1px solid #e0e0e0", backgroundColor: "#f7fbfd" }}>
                <Typography variant="subtitle2" fontWeight="bold" color="#1b384a" mb={1}>
                    Periodo de pago
                </Typography>
                <Box display="flex" gap={2} flexWrap="wrap" alignItems="center">
                    {[
                        { label: "Fecha de pago", key: "FechaPago" },
                        { label: "Fecha inicial", key: "FechaInicialPago" },
                        { label: "Fecha final", key: "FechaFinalPago" },
                    ].map(({ label, key }) => (
                        <TextField
                            key={key}
                            label={label}
                            type="date"
                            size="small"
                            InputLabelProps={{ shrink: true }}
                            value={periodo[key]}
                            onChange={e => setPeriodo(p => ({ ...p, [key]: e.target.value }))}
                            sx={{ minWidth: 180 }}
                        />
                    ))}
                    <TextField
                        label="Núm. días pagados"
                        type="number"
                        size="small"
                        value={periodo.NumDiasPagados}
                        onChange={e => setPeriodo(p => ({ ...p, NumDiasPagados: e.target.value }))}
                        sx={{ minWidth: 150 }}
                        InputProps={{
                            readOnly: true, // Hacer el campo de solo lectura
                        }}
                    />
                </Box>
            </Box>

            {/* ── Tabla trabajadores ── */}
            <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                    <TableHead sx={{ backgroundColor: "#1b384a" }}>
                        <TableRow>
                            {["CURP", "NSS", "Empleado", "Puesto", "Departamento", "Conceptos"].map(h => (
                                <TableCell key={h} sx={{ color: "white", fontWeight: "bold" }}>{h}</TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {trabajadores.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ color: "#999", py: 3 }}>
                                    No hay trabajadores registrados para este emisor
                                </TableCell>
                            </TableRow>
                        ) : (
                            trabajadores.map((t, i) => (
                                <TableRow key={t.ID} sx={{ backgroundColor: i % 2 === 0 ? "#f9f9f9" : "white" }}>
                                    <TableCell sx={{ fontSize: 12 }}>{t.Curp}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{t.NumSeguridadSocial}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{t.NumEmpleado}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{t.Puesto}</TableCell>
                                    <TableCell sx={{ fontSize: 12 }}>{t.Departamento}</TableCell>
                                    <TableCell>
                                        {conceptosPorTrabajador[t.ID] ? (
                                            <Chip
                                                icon={<CheckCircleIcon />}
                                                label="Listo"
                                                size="small"
                                                sx={{ backgroundColor: "#e6f4ea", color: "#2e7d32", mr: 1, cursor: "pointer" }}
                                                onClick={() => handleAbrirModal(t)}
                                            />
                                        ) : (
                                            <Button
                                                size="small"
                                                variant="outlined"
                                                startIcon={<EditIcon />}
                                                disabled={!periodoCompleto}
                                                onClick={() => handleAbrirModal(t)}
                                                sx={{ borderColor: "#1b384a", color: "#1b384a", fontSize: 11 }}
                                            >
                                                Capturar
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* ── Botón generar ── */}
            {trabajadoresListos.length > 0 && (
                <Box display="flex" justifyContent="center" mt={3}>
                    <Button
                        variant="contained"
                        disabled={loading || !periodoCompleto}
                        startIcon={<SendIcon />}
                        onClick={handleGenerarNominas}
                        sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" }, px: 4 }}
                    >
                        {loading ? "Generando..." : `Generar ${trabajadoresListos.length} nómina(s)`}
                    </Button>
                </Box>
            )}

            {/* ── Modal conceptos ── */}
            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle sx={{ backgroundColor: "#1b384a", color: "white" }}>
                    Conceptos — {trabajadorActivo?.Curp} · {trabajadorActivo?.Puesto}
                </DialogTitle>
                <DialogContent dividers>

                    {/* Percepciones */}
                    <Accordion defaultExpanded>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography fontWeight="bold" color="#1b384a">Percepciones</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                                {[["TotalSueldos", "Total sueldos"], ["TotalGravado", "Total gravado"], ["TotalExento", "Total exento"]].map(([key, label]) => (
                                    <TextField key={key} label={label} size="small" type="number"
                                        value={conceptos[key]}
                                        onChange={e => setConceptos(p => ({ ...p, [key]: e.target.value }))}
                                        sx={{ minWidth: 150 }} />
                                ))}
                            </Box>
                            {conceptos.Percepciones.map((p, i) => (
                                <Box key={i} display="flex" gap={1} mb={1} alignItems="center" flexWrap="wrap">
                                    <TextField label="Tipo" size="small" value={p.TipoPercepcion} sx={{ width: 80 }}
                                        onChange={e => actualizarItem("Percepciones", i, "TipoPercepcion", e.target.value)} />
                                    <TextField label="Clave" size="small" value={p.Clave} sx={{ width: 80 }}
                                        onChange={e => actualizarItem("Percepciones", i, "Clave", e.target.value)} />
                                    <TextField label="Concepto" size="small" value={p.Concepto} sx={{ width: 180 }}
                                        onChange={e => actualizarItem("Percepciones", i, "Concepto", e.target.value)} />
                                    <TextField label="Gravado" size="small" type="number" value={p.ImporteGravado} sx={{ width: 110 }}
                                        onChange={e => actualizarItem("Percepciones", i, "ImporteGravado", e.target.value)} />
                                    <TextField label="Exento" size="small" type="number" value={p.ImporteExento} sx={{ width: 110 }}
                                        onChange={e => actualizarItem("Percepciones", i, "ImporteExento", e.target.value)} />
                                    <IconButton size="small" onClick={() => eliminarItem("Percepciones", i)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button size="small" startIcon={<AddIcon />} onClick={() => agregarItem("Percepciones")}
                                sx={{ color: "#1b384a", mt: 1 }}>
                                Agregar percepción
                            </Button>
                        </AccordionDetails>
                    </Accordion>

                    {/* Deducciones */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography fontWeight="bold" color="#1b384a">Deducciones</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            <Box display="flex" gap={2} mb={2} flexWrap="wrap">
                                {[["TotalOtrasDeducciones", "Total otras ded."], ["TotalImpuestosRetenidos", "Total imp. retenidos"]].map(([key, label]) => (
                                    <TextField key={key} label={label} size="small" type="number"
                                        value={conceptos[key]}
                                        onChange={e => setConceptos(p => ({ ...p, [key]: e.target.value }))}
                                        sx={{ minWidth: 170 }} />
                                ))}
                            </Box>
                            {conceptos.Deducciones.map((d, i) => (
                                <Box key={i} display="flex" gap={1} mb={1} alignItems="center" flexWrap="wrap">
                                    <TextField label="Tipo" size="small" value={d.TipoDeduccion} sx={{ width: 80 }}
                                        onChange={e => actualizarItem("Deducciones", i, "TipoDeduccion", e.target.value)} />
                                    <TextField label="Clave" size="small" value={d.Clave} sx={{ width: 80 }}
                                        onChange={e => actualizarItem("Deducciones", i, "Clave", e.target.value)} />
                                    <TextField label="Concepto" size="small" value={d.Concepto} sx={{ width: 180 }}
                                        onChange={e => actualizarItem("Deducciones", i, "Concepto", e.target.value)} />
                                    <TextField label="Importe" size="small" type="number" value={d.Importe} sx={{ width: 110 }}
                                        onChange={e => actualizarItem("Deducciones", i, "Importe", e.target.value)} />
                                    <IconButton size="small" onClick={() => eliminarItem("Deducciones", i)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button size="small" startIcon={<AddIcon />} onClick={() => agregarItem("Deducciones")}
                                sx={{ color: "#1b384a", mt: 1 }}>
                                Agregar deducción
                            </Button>
                        </AccordionDetails>
                    </Accordion>

                    {/* Otros Pagos */}
                    <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                            <Typography fontWeight="bold" color="#1b384a">Otros pagos</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                            {conceptos.OtrosPagos.map((o, i) => (
                                <Box key={i} display="flex" gap={1} mb={1} alignItems="center" flexWrap="wrap">
                                    <TextField label="Tipo" size="small" value={o.TipoOtroPago} sx={{ width: 80 }}
                                        onChange={e => actualizarItem("OtrosPagos", i, "TipoOtroPago", e.target.value)} />
                                    <TextField label="Clave" size="small" value={o.Clave} sx={{ width: 80 }}
                                        onChange={e => actualizarItem("OtrosPagos", i, "Clave", e.target.value)} />
                                    <TextField label="Concepto" size="small" value={o.Concepto} sx={{ width: 180 }}
                                        onChange={e => actualizarItem("OtrosPagos", i, "Concepto", e.target.value)} />
                                    <TextField label="Importe" size="small" type="number" value={o.Importe} sx={{ width: 110 }}
                                        onChange={e => actualizarItem("OtrosPagos", i, "Importe", e.target.value)} />
                                    <TextField label="Subsidio causado" size="small" type="number"
                                        value={o.SubsidioAlEmpleo?.SubsidioCausado || ""}
                                        sx={{ width: 140 }}
                                        onChange={e => actualizarItem("OtrosPagos", i, "SubsidioAlEmpleo",
                                            e.target.value ? { SubsidioCausado: e.target.value } : null)} />
                                    <IconButton size="small" onClick={() => eliminarItem("OtrosPagos", i)}>
                                        <DeleteIcon fontSize="small" />
                                    </IconButton>
                                </Box>
                            ))}
                            <Button size="small" startIcon={<AddIcon />} onClick={() => agregarItem("OtrosPagos")}
                                sx={{ color: "#1b384a", mt: 1 }}>
                                Agregar otro pago
                            </Button>
                        </AccordionDetails>
                    </Accordion>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)} sx={{ color: "#999" }}>Cancelar</Button>
                    <Button
                        variant="contained"
                        onClick={handleGuardarConceptos}
                        sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                    >
                        Guardar conceptos
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
}