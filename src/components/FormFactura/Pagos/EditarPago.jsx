"use client";
import React, { useState, useEffect, useMemo, use } from "react";
import { TextField, Box, Typography, FormControl, InputLabel, MenuItem, Button, Select as MuiSelect } from "@mui/material";
import { useForm } from "react-hook-form";
import { format } from "date-fns";
import ImpuestoPago from "./ImpuestosPago";
import ReactDatePicker from "./DatePickerComponent";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function EditarPago({ factura, token, onSave, onCancel }) {
    const { register, handleSubmit, setValue, getValues, watch, formState: { errors } } = useForm({
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
    const [impuestos, setImpuestos] = useState(factura.Complemento.Pagos.Pagos[0].Impuestos?.Traslados || []);
    const monto = watch("Monto");

    // Función para recalcular impuestos correctamente
    const recalcularImpuestos = (nuevoMonto) => {
        if (!impuestos.length || !nuevoMonto) return;

        const montoNumerico = parseFloat(nuevoMonto) || 0;

        // Calculamos la base gravable (monto sin IVA)
        // Para IVA del 16%: base = monto / 1.16
        const baseGravable = montoNumerico / 1.16;
        const importeIVA = montoNumerico - baseGravable;

        const nuevosImpuestos = impuestos.map(impuesto => {
            // Solo aplicamos el cálculo para IVA (002)
            if (impuesto.ImpuestoClave === "002") {
                return {
                    ...impuesto,
                    Base: baseGravable.toFixed(2),
                    Importe: importeIVA.toFixed(2)
                };
            }
            return impuesto;
        });

        setImpuestos(nuevosImpuestos);
    };

    // Efecto que se dispara cuando cambia el monto
    useEffect(() => {
        recalcularImpuestos(monto);
        // Añadimos impuestos como dependencia para evitar warnings
    }, [monto, impuestos.length]); // Solo se ejecuta cuando monto o la longitud de impuestos cambia

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
                console.log("Formas de pago:", data);
                setOpcionesFormaPago(data);
            } catch (error) {
                console.error('Error fetching formas de pago:', error);
            }
        };
        fetchFormasPago();
    }, [token]);

    const onSubmit = (data) => {
        const payload = {
            ...data,
            Impuestos: impuestos,
            DoctoRelacionado: {
                ...factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0],
                ImpPagado: data.Monto,
                ImpSaldoInsoluto: data.ImpSaldoInsoluto
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
                        lg: 'repeat(6, 2fr)'
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
                        label="Saldo Anterior"
                        value={factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoAnt}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        label="Saldo Pagado"
                        value={factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpPagado}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />

                    <TextField
                        {...register("ImpSaldoInsoluto")}
                        label="Nuevo Saldo Insoluto"
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                </Box>
                <Box mt={4}>
                    <Typography variant="h6">Impuestos</Typography>
                    {impuestos.map((impuesto) => (
                        <Box
                            key={impuesto.NombreImpuesto}
                            display="grid"
                            gridTemplateColumns="repeat(4, 1fr)"
                            gap={2}
                            alignItems="center"
                            my={2}
                        >
                            <TextField
                                label="Impuesto"
                                value={impuesto.ImpuestoClave === "002" ? "IVA" : impuesto.ImpuestoClave} // Asigna visualmente "IVA" si cumple la condición
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