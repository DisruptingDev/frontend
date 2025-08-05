"use client";

import React, { useState, forwardRef, useEffect } from "react";
import { TextField, Box, Typography, FormControl, Select as MuiSelect, InputLabel, MenuItem } from "@mui/material";
import { styled } from "@mui/material/styles";
import "react-datepicker/dist/react-datepicker.css";
import Select from "@/components/Select/Select.jsx";
import ReactDatePicker from "./DatePickerComponent";
import { get } from "react-hook-form";
import Impuesto from "../Impuesto/Impuesto";
import { format, parse, set } from "date-fns";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Pagos({ emisorID, children, register, conceptos, pagos, total, errors, getValues, setValue, token }) {
  const [pago, setPago] = useState({});
  const [fechaPago, setFechaPago] = useState(new Date());
  const [desglose, setDesglose] = useState([]);
  const [totalesImpuestos, setTotalesImpuestos] = useState([]);
  const [opcionesSerie, setOpcionesSerie] = useState([]);
  const [totales, setTotales] = useState({
    TotalRetencionesIVA: 0,
    TotalRetencionesISR: 0,
    TotalRetencionesIEPS: 0,
    TotalTrasladosBaseIVA16: 0,
    TotalTrasladosImpuestoIVA16: 0,
    TotalTrasladosBaseIVA8: 0,
    TotalTrasladosImpuestoIVA8: 0,
    TotalTrasladosBaseIVA0: 0,
    TotalTrasladosImpuestoIVA0: 0,
    TotalTrasladosBaseIVAExento: 0,
  });

  // Obtener series disponibles
  useEffect(() => {
    async function fetchData() {
      if (emisorID) {
        try {
          const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Serie?emisorID=${emisorID}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });
          if (response.ok) {
            const data = await response.json();
            const opciones = data.filter(opcion => opcion.TipoComprobante === 'P')
              .map(opcion => ({
                ID: opcion.ID,
                Clave: opcion.Clave,
              }));
            setOpcionesSerie(opciones);
          }
        } catch (error) {
          console.error('Error fetching serie:', error);
        }
      }
    }
    fetchData();
  }, [emisorID, token]);

  // Inicializar fecha de pago
  useEffect(() => {
    const today = new Date();
    setFechaPago(today);
    setValue("FechaPago", format(today, "yyyy-MM-dd'T'HH:mm:ss"));
  }, [setValue]);

  // Selección por defecto de serie
  useEffect(() => {
    if (!getValues("SeriePagos") && opcionesSerie.length > 0) {
      setValue("SeriePagos", opcionesSerie[0].Clave, { shouldValidate: true });
    }
  }, [opcionesSerie, setValue, getValues]);

  // Inicializar valores de pagos
  useEffect(() => {
    if (pagos) {
      console.log("Pagos recibidos:", pagos);
      const numeroOperacionEntero = Math.floor(pagos.numOperacion);
      setValue("NumeroOperacion", numeroOperacionEntero);
      setValue("SaldoAnterior", pagos.saldo);
      setValue("SaldoPagado", pagos.totalPagado);
      
      // Calcular saldo insoluto inicial
      const saldoInsolutoInicial = pagos.saldo;
      setValue("ImpSaldoInsoluto", saldoInsolutoInicial);
    }
  }, [pagos, setValue]);

  const calcularDesglose = (monto) => {
    if (!conceptos || conceptos.length === 0 || monto <= 0) return;

    const totalFactura = conceptos.reduce(
      (total, concepto) => total + concepto.Subtotal + concepto.TotalTraslados,
      0
    );

    const nuevoDesglose = conceptos.map((concepto) => {
      const totalConcepto = concepto.Subtotal + concepto.TotalTraslados;
      const proporcion = totalConcepto / totalFactura;
      const pagoParcial = monto * proporcion;

      const impuestosProporcionales = concepto.Impuestos.map((impuesto) => {
        const baseProporcional = pagoParcial / (1 + impuesto.TasaOCuota);
        const montoProporcional = baseProporcional * impuesto.TasaOCuota;

        return {
          ImpuestoCatalogoID: impuesto.Impuesto || 0,
          TipoImpuesto: impuesto.TipoImpuesto,
          NombreImpuesto: impuesto.NombreImpuesto,
          ImpuestoClave: impuesto.ImpuestoClave || "",
          TasaOCuota: impuesto.TasaOCuota,
          BaseProporcional: baseProporcional.toFixed(2),
          MontoProporcional: montoProporcional.toFixed(2),
          TipoFactor: impuesto.TipoF,
        };
      });

      return {
        Descripcion: concepto.Descripcion,
        PagoProporcional: pagoParcial.toFixed(2),
        SubtotalProporcional: ((concepto.Subtotal / totalConcepto) * pagoParcial).toFixed(2),
        ImpuestosProporcionales: impuestosProporcionales,
      };
    });

    // Consolidar totales de impuestos
    const nuevosTotalesImpuestos = [];
    nuevoDesglose.forEach((concepto) => {
      concepto.ImpuestosProporcionales.forEach((impuesto) => {
        const index = nuevosTotalesImpuestos.findIndex(
          (item) => item.NombreImpuesto === impuesto.NombreImpuesto && item.TasaOCuota === impuesto.TasaOCuota
        );
        if (index !== -1) {
          nuevosTotalesImpuestos[index].Base += parseFloat(impuesto.BaseProporcional);
          nuevosTotalesImpuestos[index].Importe += parseFloat(impuesto.MontoProporcional);
        } else {
          nuevosTotalesImpuestos.push({
            ImpuestoCatalogoID: impuesto.ImpuestoCatalogoID || 0,
            TipoImpuesto: impuesto.TipoImpuesto,
            NombreImpuesto: impuesto.NombreImpuesto,
            ImpuestoClave: impuesto.ImpuestoClave || "",
            TasaOCuota: impuesto.TasaOCuota,
            Base: parseFloat(impuesto.BaseProporcional),
            Importe: parseFloat(impuesto.MontoProporcional),
            TipoFactor: impuesto.TipoFactor,
          });
        }
      });
    });

    const nuevosTotales = nuevosTotalesImpuestos.reduce((acc, impuesto) => {
      const key = `Total${impuesto.TipoImpuesto}sImpuesto${impuesto.NombreImpuesto}${impuesto.TasaOCuota * 100}`;
      acc[key] = (acc[key] || 0) + parseFloat(impuesto.Importe);
      return acc;
    }, {});

    setTotales(nuevosTotales);
    setValue("Totales", nuevosTotales);
    setDesglose(nuevoDesglose);
    setTotalesImpuestos(nuevosTotalesImpuestos);
    setValue("ImpuestosPagos", nuevosTotalesImpuestos);
  };

  const handleMontoChange = (e) => {
    let nuevoMonto = e.target.value;
    nuevoMonto = nuevoMonto.replace(/[^0-9.]/g, "");
    if ((nuevoMonto.match(/\./g) || []).length > 1) {
      nuevoMonto = nuevoMonto.replace(/\.+$/, '');
    }

    setPago({ ...pago, monto: nuevoMonto });
    calcularDesglose(nuevoMonto);
    setValue("Monto", nuevoMonto);

    // Calcular el saldo insoluto usando el saldo anterior del padre
    const saldoAnterior = parseFloat(pagos.saldo);
    const saldoInsoluto = (saldoAnterior - parseFloat(nuevoMonto || 0)).toFixed(2);
    setValue("ImpSaldoInsoluto", saldoInsoluto);
  };

  return (
    <Box bgcolor="white" my={2} p={2} boxShadow={3} borderRadius={2}>
      <Typography variant="h6" mb={4}>
        Pagos
      </Typography>
      <Box display="grid"
        gap={3}
        mt={2}
        sx={{
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: '0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr'
          }
        }}>
        <ReactDatePicker
          selectedDate={fechaPago}
          onChange={(date) => {
            setFechaPago(date);
            setValue("FechaPago", format(date, "yyyy-MM-dd'T'HH:mm:ss"));
          }}
        />
        
        <FormControl variant="outlined" fullWidth>
          <InputLabel id="serie-label">Serie</InputLabel>
          <MuiSelect
            labelId="serie-label"
            id="serie-select"
            {...register("SeriePagos", { required: "Este campo es obligatorio" })}
            value={getValues("SeriePagos") || ""}
            onChange={(e) => {
              setValue("SeriePagos", e.target.value, { shouldValidate: true });
            }}
            label="Serie"
          >
            {opcionesSerie.map((opcion) => (
              <MenuItem key={opcion.ID} value={opcion.Clave}>
                {opcion.Clave}
              </MenuItem>
            ))}
          </MuiSelect>
        </FormControl>

        <Select
          register={register}
          nombre="FormaPagoComprobante"
          label={"Forma de Pago"}
          url={`${apiUrl}/api/catalogos/Catalogos/FormaPago`}
          clave="Clave"
          value={getValues("FormaPagoComprobante") || ""}
          descripcion="Descripcion"
          error={!!errors.FormaPagoComprobante}
          helperText={errors.FormaPagoComprobante ? "Este campo es obligatorio" : ""}
        />
        
        <TextField
          {...register("Monto", {
            required: "Este campo es obligatorio",
            validate: (value) => {
              const monto = parseFloat(value || 0);
              const saldoDisponible = parseFloat(pagos.saldo || 0);

              if (monto <= 0) {
                return "El monto debe ser mayor a 0";
              }
              if (monto > saldoDisponible) {
                return `El monto no puede ser mayor al saldo restante (${saldoDisponible.toFixed(2)})`;
              }
              return true;
            },
          })}
          label="Monto"
          name="monto"
          onChange={handleMontoChange}
          fullWidth
          error={!!errors.Monto}
          helperText={errors.Monto?.message}
        />
        
        <TextField
          label="Moneda"
          name="moneda"
          value={"MXN"}
          fullWidth
          disabled
        />
        
        <TextField
          label="Tipo de Cambio"
          name="tipoCambio"
          value={"1"}
          fullWidth
          disabled
        />
      </Box>
      
      <Box display="grid"
        gap={2}
        mt={4}
        sx={{
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: '0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr'
          }
        }}
      >
        <TextField
          label="Número de operación"
          name="numeroOperacion"
          value={Math.floor(pagos?.numOperacion || 0)}
          disabled
          fullWidth
        />
        
        <TextField
          label="Importe del saldo anterior"
          name="saldoAnterior"
          value={pagos?.saldo ? parseFloat(pagos.saldo).toFixed(2) : "0.00"}
          disabled
          fullWidth
        />
        
        <TextField
          label="Importe del saldo Pagado"
          name="saldoPagado"
          value={pagos?.totalPagado ? parseFloat(pagos.totalPagado).toFixed(2) : "0.00"}
          disabled
          fullWidth
        />
        
        <TextField
          label="Importe del saldo insoluto"
          name="saldoInsoluto"
          value={getValues("ImpSaldoInsoluto") ? parseFloat(getValues("ImpSaldoInsoluto")).toFixed(2) : pagos?.saldo ? parseFloat(pagos.saldo).toFixed(2) : "0.00"}
          disabled
          fullWidth
        />
      </Box>
      
      <Box mt={4}>
        {totalesImpuestos.length > 0 ? (
          totalesImpuestos.map((impuesto, index) => (
            <Box key={index}>
              <Typography variant="h6">Impuestos</Typography>
              <Box
                display="grid"
                gridTemplateColumns="repeat(4, 1fr)"
                gap={2}
                alignItems="center"
                my={2}
              >
                <TextField
                  label="Impuesto"
                  value={impuesto.NombreImpuesto}
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
                  value={impuesto.Base.toFixed(2)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  disabled
                />
                <TextField
                  label="Importe"
                  value={impuesto.Importe.toFixed(2)}
                  fullWidth
                  InputProps={{ readOnly: true }}
                  disabled
                />
              </Box>
            </Box>
          ))
        ) : null}
      </Box>

      {children}
    </Box>
  );
}
