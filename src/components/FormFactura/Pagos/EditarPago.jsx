"use client";
import React, { useState, useEffect, useMemo } from "react";
import { TextField, Box, Typography, FormControl, InputLabel, MenuItem, Button, Select as MuiSelect } from "@mui/material";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import ReactDatePicker from "./DatePickerComponent";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function EditarPago({ factura, token, onSave, onCancel, defaultFechaEmision }) {
    const primerPago = factura?.Complemento?.Pagos?.Pagos?.[0] || {};
    const primerDocto = primerPago.DoctoRelacionados?.[0] || primerPago.DoctosRelacionados?.[0] || {};

    const parseFechaSegura = (f) => {
        if (!f) return new Date();
        const d = new Date(f);
        return isNaN(d.getTime()) ? new Date() : d;
    };

    const initialDatePago = parseFechaSegura(primerPago.FechaPago);
    const initialDateEmision = parseFechaSegura(defaultFechaEmision || factura?.Fecha || factura?.fecha);

    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            FechaEmision: format(initialDateEmision, "yyyy-MM-dd'T'HH:mm:ss"),
            FechaPago: format(initialDatePago, "yyyy-MM-dd'T'HH:mm:ss"),
            FormaPagoComprobante: primerPago.FormaDePagoP || "03",
            Monto: primerPago.Monto ?? 0,
            SeriePagos: factura?.Serie || "",
            ImpSaldoInsoluto: primerDocto.ImpSaldoInsoluto ?? 0
        }
    });

    const [fechaEmision, setFechaEmision] = useState(initialDateEmision);
    const [fechaPago, setFechaPago] = useState(initialDatePago);
    const [opcionesSerie, setOpcionesSerie] = useState([]);
    const [opcionesFormaPago, setOpcionesFormaPago] = useState([]);
    const monto = watch("Monto");

    useEffect(() => {
        if (defaultFechaEmision) {
            const d = parseFechaSegura(defaultFechaEmision);
            setFechaEmision(d);
            setValue("FechaEmision", format(d, "yyyy-MM-dd'T'HH:mm:ss"));
        } else if (factura?.Fecha || factura?.fecha) {
            const d = parseFechaSegura(factura.Fecha || factura.fecha);
            setFechaEmision(d);
            setValue("FechaEmision", format(d, "yyyy-MM-dd'T'HH:mm:ss"));
        }
    }, [defaultFechaEmision, factura?.Fecha, factura?.fecha, setValue]);

    // Inicializar desglose de impuestos
    const inicializarImpuestos = () => {
        let traslados = (primerPago.Impuestos?.Traslados || [])
            .map(imp => ({ ...imp, TipoImpuesto: "Traslado" }));
        let retenciones = (primerPago.Impuestos?.Retenciones || [])
            .map(imp => ({ ...imp, TipoImpuesto: "Retencion" }));

        const totalesObj = factura?.Complemento?.Pagos?.Totales || {};
        const baseIVA = parseFloat(totalesObj.TotalTrasladosBaseIVA16 || 0);
        const impIVA = parseFloat(totalesObj.TotalTrasladosImpuestoIVA16 || 0);

        if (traslados.length === 0 && (baseIVA > 0 || impIVA > 0)) {
            traslados.push({
                TipoImpuesto: "Traslado",
                ImpuestoClave: "002",
                NombreImpuesto: "IVA",
                TasaOCuota: "0.160000",
                TipoFactor: "Tasa",
                Base: baseIVA > 0 ? baseIVA.toFixed(2) : (parseFloat(primerPago.Monto || 0) / 1.16).toFixed(2),
                BaseString: baseIVA > 0 ? baseIVA.toFixed(2) : (parseFloat(primerPago.Monto || 0) / 1.16).toFixed(2),
                Importe: impIVA > 0 ? impIVA.toFixed(2) : (parseFloat(primerPago.Monto || 0) - (parseFloat(primerPago.Monto || 0) / 1.16)).toFixed(2),
                ImporteString: impIVA > 0 ? impIVA.toFixed(2) : (parseFloat(primerPago.Monto || 0) - (parseFloat(primerPago.Monto || 0) / 1.16)).toFixed(2),
            });
        }

        const retISR = parseFloat(totalesObj.TotalRetencionesISR || 0);
        if (retenciones.length === 0 && retISR > 0) {
            retenciones.push({
                TipoImpuesto: "Retencion",
                ImpuestoClave: "001",
                NombreImpuesto: "ISR",
                TasaOCuota: "0.000000",
                TipoFactor: "Tasa",
                Base: (parseFloat(primerPago.Monto || 0) / 1.16).toFixed(2),
                Importe: retISR.toFixed(2),
                ImporteString: retISR.toFixed(2),
            });
        }

        const retIVA = parseFloat(totalesObj.TotalRetencionesIVA || 0);
        if (retenciones.filter(r => r.ImpuestoClave === "002").length === 0 && retIVA > 0) {
            retenciones.push({
                TipoImpuesto: "Retencion",
                ImpuestoClave: "002",
                NombreImpuesto: "IVA Retenido",
                TasaOCuota: "0.000000",
                TipoFactor: "Tasa",
                Base: (parseFloat(primerPago.Monto || 0) / 1.16).toFixed(2),
                Importe: retIVA.toFixed(2),
                ImporteString: retIVA.toFixed(2),
            });
        }

        // Si todavía está vacío y el monto > 0, desglosar IVA al 16% por defecto
        const montoNum = parseFloat(primerPago.Monto || 0);
        if (traslados.length === 0 && retenciones.length === 0 && montoNum > 0) {
            const baseCalc = (montoNum / 1.16).toFixed(2);
            const impCalc = (montoNum - parseFloat(baseCalc)).toFixed(2);
            traslados.push({
                TipoImpuesto: "Traslado",
                ImpuestoClave: "002",
                NombreImpuesto: "IVA",
                TasaOCuota: "0.160000",
                TipoFactor: "Tasa",
                Base: baseCalc,
                BaseString: baseCalc,
                Importe: impCalc,
                ImporteString: impCalc,
            });
        }

        return [...traslados, ...retenciones];
    };

    const [impuestos, setImpuestos] = useState(inicializarImpuestos);

    // Función para recalcular impuestos correctamente cuando cambia el monto
    const recalcularImpuestos = (nuevoMonto) => {
        const nuevoMontoNum = parseFloat(nuevoMonto) || 0;
        if (nuevoMontoNum <= 0) return;

        setImpuestos(prevImpuestos => {
            if (!prevImpuestos || prevImpuestos.length === 0) {
                const baseCalc = (nuevoMontoNum / 1.16).toFixed(2);
                const impCalc = (nuevoMontoNum - parseFloat(baseCalc)).toFixed(2);
                return [{
                    TipoImpuesto: "Traslado",
                    ImpuestoClave: "002",
                    NombreImpuesto: "IVA",
                    TasaOCuota: "0.160000",
                    TipoFactor: "Tasa",
                    Base: baseCalc,
                    BaseString: baseCalc,
                    Importe: impCalc,
                    ImporteString: impCalc,
                }];
            }

            const montoOriginal = parseFloat(primerPago.Monto) || nuevoMontoNum;
            const proporcion = montoOriginal > 0 ? (nuevoMontoNum / montoOriginal) : 1;

            return prevImpuestos.map(imp => {
                if (imp.ImpuestoClave === "002" && imp.TipoImpuesto === "Traslado") {
                    const baseIVA = (nuevoMontoNum / 1.16).toFixed(2);
                    const impIVA = (nuevoMontoNum - parseFloat(baseIVA)).toFixed(2);
                    return {
                        ...imp,
                        Base: baseIVA,
                        BaseString: baseIVA,
                        Importe: impIVA,
                        ImporteString: impIVA,
                    };
                }

                const baseEsc = (parseFloat(imp.Base || 0) * proporcion).toFixed(2);
                const impEsc = (parseFloat(imp.Importe || 0) * proporcion).toFixed(2);
                return {
                    ...imp,
                    Base: baseEsc,
                    BaseString: baseEsc,
                    Importe: impEsc,
                    ImporteString: impEsc,
                };
            });
        });
    };

    // Efecto que se dispara cuando cambia el monto
    useEffect(() => {
        recalcularImpuestos(monto);
    }, [monto]);

    const handleMontoChange = (e) => {
        const value = e.target.value.replace(/[^0-9.]/g, "");
        if ((value.match(/\./g) || []).length <= 1) {
            setValue("Monto", value);
            const saldoAnt = parseFloat(primerDocto.ImpSaldoAnt ?? 0);
            const nuevoSaldo = (saldoAnt - parseFloat(value || 0)).toFixed(2);
            setValue("ImpSaldoInsoluto", nuevoSaldo);
        }
    };

    useEffect(() => {
        const emisorId = factura?.Emisor?.ID || factura?.Emisor?.id || factura?.EmisorID;
        if (!emisorId) return;

        const fetchSeries = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisorId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    let seriesP = data.filter(opcion => opcion.TipoComprobante === 'P');
                    if (factura?.Serie && !seriesP.some(s => s.Clave === factura.Serie)) {
                        seriesP.unshift({ ID: 'actual', Clave: factura.Serie });
                    }
                    setOpcionesSerie(seriesP);
                }
            } catch (error) {
                console.error('Error fetching series:', error);
                if (factura?.Serie) {
                    setOpcionesSerie([{ ID: 'actual', Clave: factura.Serie }]);
                }
            }
        };
        fetchSeries();
    }, [factura?.Emisor?.ID, factura?.Emisor?.id, factura?.EmisorID, factura?.Serie, token]);

    useEffect(() => {
        const fetchFormasPago = async () => {
            const fallbackFormas = [
                { Clave: "01", Descripcion: "01 - Efectivo" },
                { Clave: "02", Descripcion: "02 - Cheque nominativo" },
                { Clave: "03", Descripcion: "03 - Transferencia electrónica de fondos" },
                { Clave: "04", Descripcion: "04 - Tarjeta de crédito" },
                { Clave: "28", Descripcion: "28 - Tarjeta de débito" },
                { Clave: "99", Descripcion: "99 - Por definir" }
            ];

            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/FormaPago`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                if (Array.isArray(data) && data.length > 0) {
                    setOpcionesFormaPago(data);
                } else {
                    setOpcionesFormaPago(fallbackFormas);
                }
            } catch (error) {
                console.error('Error fetching formas de pago:', error);
                setOpcionesFormaPago(fallbackFormas);
            }
        };
        fetchFormasPago();
    }, [token]);

    useEffect(() => {
        const facturaId = factura?.ID || factura?.id;
        if (!facturaId) return;

        const fetchDoctosRelacionados = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/doctosrelacionados/ObtenerDoctosRelacionados?FacturaMadreID=${facturaId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                console.log('Documentos relacionados fetched:', data);
                if (Array.isArray(data) && data.length > 0) {
                    const docRelacionado = data[0];
                    const saldoAnt = parseFloat(docRelacionado.ImpSaldoAnt ?? primerDocto?.ImpSaldoAnt ?? 0);
                    const nuevoSaldoInsoluto = (saldoAnt - parseFloat(monto || 0)).toFixed(2);
                    setValue("ImpSaldoInsoluto", nuevoSaldoInsoluto);
                }
            } catch (error) {
                console.error('Error fetching documentos relacionados:', error);
            }
        };
        fetchDoctosRelacionados();
    }, [factura?.ID, factura?.id, token, monto, primerDocto?.ImpSaldoAnt, setValue]);

    const onSubmit = (data) => {
        const traslados = impuestos.filter(i => i.TipoImpuesto === "Traslado");
        const retenciones = impuestos.filter(i => i.TipoImpuesto === "Retencion");

        const totalTrasladoIVA16 = traslados
            .filter(i => i.ImpuestoClave === "002" && parseFloat(i.TasaOCuota) === 0.16)
            .reduce((sum, i) => sum + parseFloat(i.Importe || 0), 0);
        const baseTrasladoIVA16 = traslados
            .filter(i => i.ImpuestoClave === "002" && parseFloat(i.TasaOCuota) === 0.16)
            .reduce((sum, i) => sum + parseFloat(i.Base || 0), 0);
        const totalRetencionISR = retenciones
            .filter(i => i.ImpuestoClave === "001")
            .reduce((sum, i) => sum + parseFloat(i.Importe || 0), 0);
        const totalRetencionIVA = retenciones
            .filter(i => i.ImpuestoClave === "002")
            .reduce((sum, i) => sum + parseFloat(i.Importe || 0), 0);

        const payload = {
            ...data,
            FechaEmision: format(fechaEmision, "yyyy-MM-dd'T'HH:mm:ss"),
            FechaPago: format(fechaPago, "yyyy-MM-dd'T'HH:mm:ss"),
            Impuestos: { Traslados: traslados, Retenciones: retenciones },
            Totales: {
                TotalTrasladosBaseIVA16: baseTrasladoIVA16.toFixed(2),
                TotalTrasladosBaseIVA16String: baseTrasladoIVA16.toFixed(2),
                TotalTrasladosImpuestoIVA16: totalTrasladoIVA16.toFixed(2),
                TotalTrasladosImpuestoIVA16String: totalTrasladoIVA16.toFixed(2),
                TotalRetencionesISR: totalRetencionISR.toFixed(2),
                TotalRetencionesISRString: totalRetencionISR.toFixed(2),
                TotalRetencionesIVA: totalRetencionIVA.toFixed(2),
                TotalRetencionesIVAString: totalRetencionIVA.toFixed(2),
                MontoTotalPagos: data.Monto,
                MontoTotalPagosString: String(data.Monto)
            }
        };

        onSave(payload);
    };

    return (
        <Box p={2} borderRadius={2}>
            <Typography variant="h6" mb={3} color="primary" fontWeight="bold">
                Detalles del Pago
            </Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Box display="grid" gap={2} mt={2} sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)',
                        xl: 'repeat(7, 1fr)'
                    }
                }}>
                    <ReactDatePicker
                        label="Fecha emisión comprobante"
                        selectedDate={fechaEmision}
                        onChange={(date) => {
                            setFechaEmision(date);
                            setValue("FechaEmision", format(date, "yyyy-MM-dd'T'HH:mm:ss"));
                        }}
                    />

                    <ReactDatePicker
                        label="Fecha y hora de pago"
                        selectedDate={fechaPago}
                        onChange={(date) => {
                            setFechaPago(date);
                            setValue("FechaPago", format(date, "yyyy-MM-dd'T'HH:mm:ss"));
                        }}
                    />

                    <FormControl fullWidth>
                        <InputLabel>Serie</InputLabel>
                        <MuiSelect
                            {...register("SeriePagos")}
                            label="Serie"
                            value={watch("SeriePagos") || ""}
                            onChange={(e) => {
                                setValue("SeriePagos", e.target.value, { shouldValidate: true });
                            }}
                        >
                            {opcionesSerie.map((opcion) => (
                                <MenuItem key={opcion.ID || opcion.Clave} value={opcion.Clave}>{opcion.Clave}</MenuItem>
                            ))}
                        </MuiSelect>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Forma de Pago</InputLabel>
                        <MuiSelect
                            {...register("FormaPagoComprobante")}
                            label="Forma de Pago"
                            value={watch("FormaPagoComprobante") || "03"}
                            onChange={(e) => {
                                setValue("FormaPagoComprobante", e.target.value, { shouldValidate: true });
                            }}
                        >
                            {opcionesFormaPago.map((data) => (
                                <MenuItem key={data.Clave} value={data.Clave}>{data.Descripcion}</MenuItem>
                            ))}
                        </MuiSelect>
                    </FormControl>

                    <TextField
                        {...register("Monto", {
                            required: "Campo obligatorio",
                            validate: value => {
                                const montoNum = parseFloat(value);
                                const max = parseFloat(primerDocto.ImpSaldoAnt ?? 999999999);
                                return montoNum <= max || "Monto excede el saldo pendiente";
                            }
                        })}
                        label="Monto"
                        fullWidth
                        onChange={handleMontoChange}
                        error={!!errors.Monto}
                        helperText={errors.Monto?.message}
                    />

                    <TextField
                        label="Moneda"
                        value="MXN"
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        label="Tipo Cambio"
                        value="1"
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                </Box>

                {/* Campos de saldos */}
                <Box display="grid" gap={2} my={4} sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(4, 1fr)'
                    }
                }}>
                    <TextField
                        label="Numero de Operacion"
                        value={primerDocto.NumParcialidad ?? 1}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                    <TextField
                        label="Saldo Anterior"
                        value={Number(primerDocto.ImpSaldoAnt ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        label="Saldo Pagado"
                        value={Number(primerDocto.ImpPagado ?? primerPago.Monto ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        {...register("ImpSaldoInsoluto")}
                        label="Nuevo Saldo Insoluto"
                        value={Number(watch("ImpSaldoInsoluto") || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                </Box>

                {/* Desglose de impuestos */}
                <Box mt={4}>
                    <Typography variant="h6" mb={1} color="primary" fontWeight="bold">
                        Desglose de Impuestos
                    </Typography>
                    {impuestos && impuestos.length > 0 ? (
                        impuestos.map((impuesto, idx) => (
                            <Box
                                key={`${impuesto.TipoImpuesto}-${impuesto.ImpuestoClave}-${impuesto.TasaOCuota}-${idx}`}
                                display="grid"
                                gridTemplateColumns="repeat(4, 1fr)"
                                gap={2}
                                alignItems="center"
                                my={2}
                                p={2}
                                bgcolor="#f8fafc"
                                borderRadius={1}
                                border="1px solid #e2e8f0"
                            >
                                <TextField
                                    label="Impuesto"
                                    value={impuesto.NombreImpuesto || impuesto.ImpuestoCatalogo?.Impuesto || (impuesto.ImpuestoClave === "002" ? "IVA (002)" : (impuesto.ImpuestoClave === "001" ? "ISR (001)" : impuesto.ImpuestoClave))}
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    disabled
                                />
                                <TextField
                                    label="Tasa o Cuota"
                                    value={impuesto.TasaOCuota}
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    disabled
                                />
                                <TextField
                                    label="Base Gravada"
                                    value={Number(impuesto.Base || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    disabled
                                />
                                <TextField
                                    label="Importe"
                                    value={Number(impuesto.Importe || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                                    fullWidth
                                    InputProps={{ readOnly: true }}
                                    disabled
                                />
                            </Box>
                        ))
                    ) : (
                        <Typography variant="body2" color="textSecondary">
                            No hay impuestos registrados para este pago.
                        </Typography>
                    )}
                </Box>

                <Box display="flex" justifyContent="flex-end" gap={2} mt={4}>
                    <Button variant="outlined" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Guardar Cambios
                    </Button>
                </Box>
            </form>
        </Box>
    );
}
