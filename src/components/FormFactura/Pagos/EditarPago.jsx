"use client";
import React, { useState, useEffect, useMemo, use } from "react";
import { TextField, Box, Typography, FormControl, InputLabel, MenuItem, Button, Select as MuiSelect } from "@mui/material";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import ReactDatePicker from "./DatePickerComponent";
import { ConstructionOutlined } from "@mui/icons-material";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function EditarPago({ factura, token, onSave, onCancel }) {
    const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
        defaultValues: {
            FechaPago: format(new Date(factura.Complemento.Pagos.Pagos[0].FechaPago), "yyyy-MM-dd'T'HH:mm:ss"),
            FormaPagoComprobante: factura.Complemento.Pagos.Pagos[0].FormaDePagoP,
            Monto: factura.Complemento.Pagos.Pagos[0].Monto,
            SeriePagos: factura.Serie,
            ImpSaldoInsoluto: factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoInsoluto
        }
    });

    const [fechaPago, setFechaPago] = useState(new Date(factura.Complemento.Pagos.Pagos[0].FechaPago));
    const [opcionesSerie, setOpcionesSerie] = useState([]);
    const [opcionesFormaPago, setOpcionesFormaPago] = useState([]);
    // const [impuestos, setImpuestos] = useState(factura.Complemento.Pagos.Pagos[0].Impuestos?.Traslados || []);
    const monto = watch("Monto");

    const [impuestos, setImpuestos] = useState(() => {
        const traslados = (factura.Complemento.Pagos.Pagos[0].Impuestos?.Traslados || [])
            .map(imp => ({ ...imp, TipoImpuesto: "Traslado" }));
        const retenciones = (factura.Complemento.Pagos.Pagos[0].Impuestos?.Retenciones || [])
            .map(imp => ({ ...imp, TipoImpuesto: "Retencion" }));
        return [...traslados, ...retenciones];
    });

    // Función para recalcular impuestos correctamente
    const recalcularImpuestos = (nuevoMonto) => {
        const montoOriginal = parseFloat(factura.Complemento.Pagos.Pagos[0].Monto) || 0;
        const nuevoMontoNum = parseFloat(nuevoMonto) || 0;
        if (montoOriginal <= 0) return;

        const proporcion = nuevoMontoNum / montoOriginal;

        const escalar = (imp, tipo) => {
            const nuevaBase = (parseFloat(imp.Base) * proporcion).toFixed(2);
            const nuevoImporte = (parseFloat(imp.Importe) * proporcion).toFixed(2);
            return {
                ...imp,
                TipoImpuesto: tipo,
                Base: nuevaBase,
                BaseString: nuevaBase,
                Importe: nuevoImporte,
                ImporteString: nuevoImporte,
            };
        };

        const traslados = (factura.Complemento.Pagos.Pagos[0].Impuestos?.Traslados || [])
            .map(imp => escalar(imp, "Traslado"));
        const retenciones = (factura.Complemento.Pagos.Pagos[0].Impuestos?.Retenciones || [])
            .map(imp => escalar(imp, "Retencion"));

        setImpuestos([...traslados, ...retenciones]);
    };

    // Efecto que se dispara cuando cambia el monto
    useEffect(() => {
        recalcularImpuestos(monto);
        // Añadimos imonSubmitpuestos como dependencia para evitar warnings
    }, [monto]); // Solo se ejecuta cuando monto o la longitud de impuestos cambia

    const handleMontoChange = (e) => {
        const value = e.target.value.replace(/[^0-9.]/g, "");
        if ((value.match(/\./g) || []).length <= 1) {
            setValue("Monto", value);
            const nuevoSaldo = (parseFloat(factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoAnt) - parseFloat(value || 0)).toFixed(2);
            setValue("ImpSaldoInsoluto", nuevoSaldo);
        }
    };

    useEffect(() => {
        const fetchSeries = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${factura.Emisor.ID}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setOpcionesSerie(data.filter(opcion => opcion.TipoComprobante === 'P'));
            } catch (error) {
                console.error('Error fetching series:', error);
            }
        };
        fetchSeries();
    }, [factura.Emisor.ID, token]);

    useEffect(() => {
        const fetchFormasPago = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/FormaPago`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                setOpcionesFormaPago(data);
            } catch (error) {
                console.error('Error fetching formas de pago:', error);
            }
        };
        fetchFormasPago();
    }, [token]);

    useEffect(() => {
        const fetchDoctosRelacionados = async () => {
            try {
                const response = await fetch(`${apiUrl}/api/doctosrelacionados/ObtenerDoctosRelacionados?FacturaMadreID=${factura.ID}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();
                console.log('Documentos relacionados fetched:', data);
                if (data.length > 0) {
                    const docRelacionado = data[0];
                    const nuevoSaldoInsoluto = (parseFloat(docRelacionado.ImpSaldoAnt) - parseFloat(watch("Monto") || 0)).toFixed(2);
                    setValue("ImpSaldoInsoluto", nuevoSaldoInsoluto);
                }
            } catch (error) {
                console.error('Error fetching documentos relacionados:', error);
            }
        };
        fetchDoctosRelacionados();
    }, [factura.ID, token, watch("Monto"), setValue]);

    const onSubmit = (data) => {
        const traslados = impuestos.filter(i => i.TipoImpuesto === "Traslado");
        const retenciones = impuestos.filter(i => i.TipoImpuesto === "Retencion");

        const totalTrasladoIVA16 = traslados
            .filter(i => i.ImpuestoClave === "002" && parseFloat(i.TasaOCuota) === 0.16)
            .reduce((sum, i) => sum + parseFloat(i.Importe), 0);
        const baseTrasladoIVA16 = traslados
            .filter(i => i.ImpuestoClave === "002" && parseFloat(i.TasaOCuota) === 0.16)
            .reduce((sum, i) => sum + parseFloat(i.Base), 0);
        const totalRetencionISR = retenciones
            .filter(i => i.ImpuestoClave === "001")
            .reduce((sum, i) => sum + parseFloat(i.Importe), 0);
        const totalRetencionIVA = retenciones
            .filter(i => i.ImpuestoClave === "002")
            .reduce((sum, i) => sum + parseFloat(i.Importe), 0);

        const payload = {
            ...data,
            FechaPago: format(fechaPago, "yyyy-MM-dd'T'HH:mm:ss"),
            Impuestos: { Traslados: traslados, Retenciones: retenciones },
            Totales: {
                TotalTrasladosBaseIVA16: baseTrasladoIVA16.toFixed(2),
                TotalTrasladosImpuestoIVA16: totalTrasladoIVA16.toFixed(2),
                TotalRetencionesISR: totalRetencionISR.toFixed(2),
                TotalRetencionesIVA: totalRetencionIVA.toFixed(2),
                MontoTotalPagos: data.Monto
            }
        };

        onSave(payload);
    };

    return (
        <Box p={2} borderRadius={2}>
            <Typography variant="h6" mb={4}>Editar Pago</Typography>

            <form onSubmit={handleSubmit(onSubmit)}>
                <Box display="grid" gap={3} mt={2} sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: 'repeat(3, 1fr)',
                        lg: 'repeat(6, 1fr)'
                    }
                }}>
                    <ReactDatePicker
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
                            value={watch("SeriePagos")}  // Usar watch en lugar de getValues
                            onChange={(e) => {
                                setValue("SeriePagos", e.target.value, { shouldValidate: true });
                            }}
                        >
                            {opcionesSerie.map((opcion) => (
                                <MenuItem key={opcion.ID} value={opcion.Clave}>{opcion.Clave}</MenuItem>
                            ))}
                        </MuiSelect>
                    </FormControl>

                    <FormControl fullWidth>
                        <InputLabel>Forma de Pago</InputLabel>
                        <MuiSelect
                            {...register("FormaPagoComprobante")}
                            label="Forma de Pago"
                            value={watch("FormaPagoComprobante")}  // Usar watch
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
                                const monto = parseFloat(value);
                                const max = parseFloat(factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoAnt);
                                return monto <= max || "Monto excede el saldo pendiente";
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
                        value={factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].NumParcialidad}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                    <TextField
                        label="Saldo Anterior"
                        value={Number(factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoAnt).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        label="Saldo Pagado"
                        value={Number(factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpPagado).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        {...register("ImpSaldoInsoluto")}
                        label="Nuevo Saldo Insoluto"
                        value={Number(watch("ImpSaldoInsoluto")).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                </Box>
                <Box mt={4}>
                    <Typography variant="h6">Impuestos</Typography>
                    {impuestos.map((impuesto) => (
                        <Box
                            key={`${impuesto.TipoImpuesto}-${impuesto.ImpuestoClave}-${impuesto.TasaOCuota}`}
                            display="grid"
                            gridTemplateColumns="repeat(4, 1fr)"
                            gap={2}
                            alignItems="center"
                            my={2}
                        >
                            <TextField
                                label="Impuesto"
                                value={impuesto.ImpuestoCatalogo?.Impuesto || impuesto.ImpuestoClave}
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
                                value={impuesto.Base}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                disabled
                            />
                            <TextField
                                label="Importe"
                                value={impuesto.Importe}
                                fullWidth
                                InputProps={{ readOnly: true }}
                                disabled
                            />
                        </Box>
                    ))}
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