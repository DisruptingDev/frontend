"use client";

import React, { useState, forwardRef, useEffect } from "react";
import { TextField, Box, Typography, FormControl, Select as MuiSelect, InputLabel, MenuItem, } from "@mui/material";
import "react-datepicker/dist/react-datepicker.css";
import Select from "@/components/Select/Select.jsx";
import ReactDatePicker from "./DatePickerComponent";
import { format, parse, set } from "date-fns";
const apiUrl = process.env.NEXT_PUBLIC_API_URL;


export default function Pagos({ emisorID, children, register, conceptos, pagos, total, errors, getValues, setValue, token }) {

  const [pago, setPago] = useState({});
  const [fechaPago, setFechaPago] = useState(new Date());
  const [desglose, setDesglose] = useState([]);
  const [totalesImpuestos, setTotalesImpuestos] = useState([]);
  const [serieUrl, setSerieUrl] = useState('');
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
              }))
            setOpcionesSerie(opciones);
          }
        } catch (error) {
          console.error('Error fetching serie:', error);

        }
      }
    }
    fetchData();
  }, [emisorID, token]);



  useEffect(() => {
    const today = new Date();
    setFechaPago(today); // Inicializa como una instancia válida de Date
    setValue("FechaPago", format(today, "yyyy-MM-dd'T'HH:mm:ss"));
  }, [setValue]);



  // Selección por defecto en un useEffect:
  useEffect(() => {
    if (!getValues("SeriePagos") && opcionesSerie.length > 0) {
      setValue("SeriePagos", opcionesSerie[0].Clave, { shouldValidate: true });
    }
  }, [opcionesSerie, setValue, getValues]);


  const calcularDesglose = (monto) => {
    const montoNumero = parseFloat(monto) || 0;
    if (!conceptos || conceptos.length === 0 || montoNumero <= 0) return;

    // Total real de la factura: Subtotal + Traslados - Retenciones
    const totalFactura = conceptos.reduce((total, concepto) => {
      const subtotal = parseFloat(concepto.Subtotal) || 0;
      const totalTraslados = parseFloat(concepto.TotalTraslados) || 0;
      const totalRetenciones = parseFloat(concepto.TotalRetenciones) || 0;
      return total + subtotal + totalTraslados - totalRetenciones;
    }, 0);

    if (totalFactura <= 0) return;

    const proporcion = montoNumero / totalFactura;

    const nuevoDesglose = conceptos.map((concepto) => {
      const subtotal = parseFloat(concepto.Subtotal) || 0;
      const pagoParcial = subtotal * proporcion;

      const traslados = (concepto.Traslados || []).map((imp) => ({
        ImpuestoCatalogoID: imp.Impuesto || 0,
        TipoImpuesto: "Traslado",
        NombreImpuesto: imp.NombreImpuesto,
        ImpuestoClave: imp.ImpuestoClave || "",
        TasaOCuota: parseFloat(imp.TasaOCuota) || 0,
        BaseProporcional: (parseFloat(imp.BaseImpuesto) || 0) * proporcion,
        MontoProporcional: (parseFloat(imp.Monto) || 0) * proporcion,
        TipoFactor: imp.Tipo,
      }));

      const retenciones = (concepto.Retenciones || []).map((imp) => ({
        ImpuestoCatalogoID: imp.Impuesto || 0,
        TipoImpuesto: "Retencion",
        NombreImpuesto: imp.NombreImpuesto,
        ImpuestoClave: imp.ImpuestoClave || "",
        TasaOCuota: parseFloat(imp.TasaOCuota) || 0,
        BaseProporcional: (parseFloat(imp.BaseImpuesto) || 0) * proporcion,
        MontoProporcional: (parseFloat(imp.Monto) || 0) * proporcion,
        TipoFactor: imp.Tipo,
      }));

      return {
        Descripcion: concepto.Descripcion,
        PagoProporcional: pagoParcial,
        SubtotalProporcional: pagoParcial,
        ImpuestosProporcionales: [...traslados, ...retenciones],
      };
    });

    // Consolidar totales de impuestos (misma lógica que ya tenías)
    const nuevosTotalesImpuestos = [];
    nuevoDesglose.forEach((concepto) => {
      concepto.ImpuestosProporcionales.forEach((impuesto) => {
        const index = nuevosTotalesImpuestos.findIndex(
          (item) => item.NombreImpuesto === impuesto.NombreImpuesto
            && item.TasaOCuota === impuesto.TasaOCuota
            && item.TipoImpuesto === impuesto.TipoImpuesto
        );
        if (index !== -1) {
          nuevosTotalesImpuestos[index].Base += impuesto.BaseProporcional;
          nuevosTotalesImpuestos[index].Importe += impuesto.MontoProporcional;
        } else {
          nuevosTotalesImpuestos.push({
            ImpuestoCatalogoID: impuesto.ImpuestoCatalogoID,
            TipoImpuesto: impuesto.TipoImpuesto,
            NombreImpuesto: impuesto.NombreImpuesto,
            ImpuestoClave: impuesto.ImpuestoClave,
            TasaOCuota: impuesto.TasaOCuota,
            Base: impuesto.BaseProporcional,
            Importe: impuesto.MontoProporcional,
            TipoFactor: impuesto.TipoFactor,
          });
        }
      });
    });

    const nuevosTotales = nuevosTotalesImpuestos.reduce((acc, impuesto) => {
      const key = `Total${impuesto.TipoImpuesto}sImpuesto${impuesto.NombreImpuesto}${impuesto.TasaOCuota * 100}`;
      acc[key] = (acc[key] || 0) + impuesto.Importe;
      return acc;
    }, {});

    setTotales(nuevosTotales);
    setValue("Totales", nuevosTotales);
    setDesglose(nuevoDesglose);
    setTotalesImpuestos(nuevosTotalesImpuestos);
    setValue("ImpuestosPagos", nuevosTotalesImpuestos);
  };


  // DESPUÉS
  useEffect(() => {
    if (pagos) {
      console.log("Pagos:", pagos);
      setValue("NumeroOperacion", Math.floor(pagos.numOperacion));
      setValue("SaldoAnterior", pagos.saldoAnterior);
      setValue("SaldoPagado", pagos.totalPagado);
    }
  }, [pagos, setValue]);

  const handleMontoChange = (e) => {
    let nuevoMonto = e.target.value;
    nuevoMonto = nuevoMonto.replace(/[^0-9.]/g, "");
    if ((nuevoMonto.match(/\./g) || []).length > 1) {
      nuevoMonto = nuevoMonto.replace(/\.+$/, '');
    }

    setPago({ ...pago, monto: nuevoMonto });
    setValue("Monto", nuevoMonto);

    const montoNumerico = parseFloat(nuevoMonto) || 0;
    calcularDesglose(montoNumerico);
    setValue("NumeroOperacion", Math.floor(pagos.numOperacion));

    // Leer saldoAnterior desde el form, no desde pagos.saldo
    const saldoAnterior = parseFloat(getValues("SaldoAnterior")) || 0;
    const saldoInsoluto = (saldoAnterior - montoNumerico).toFixed(2);
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
            lg: '0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr '
          }
        }}>
        <ReactDatePicker
          selectedDate={fechaPago} // Pasa el estado al componente hijo
          onChange={(date) => {
            setFechaPago(date); // Actualiza el estado
            setValue("FechaPago", format(date, "yyyy-MM-dd'T'HH:mm:ss")); // Actualiza el formulario
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
              const monto = parseFloat(value);
              const saldoDisponible = pagos.saldo;

              if (monto <= 0) {
                return "El monto debe ser mayor a 0";
              }
              if (monto > saldoDisponible) {
                return "El monto no puede ser mayor al saldo restante de pago";
              }
              return true; // Si pasa la validación
            },
          })}
          label="Monto"
          name="monto"
          onChange={handleMontoChange} // Función para manejar cambios en el monto
          fullWidth
          error={!!errors.Monto} // Muestra el error si existe
          helperText={errors.Monto?.message} // Muestra el mensaje de error
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
            lg: '0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr '
          }
        }}
      >
        <TextField
          label="Número de operación"
          name="numeroOperacion"
          value={Math.floor(pagos.numOperacion) || "Sin pagos aún"} // Asegurar entero aquí
          disabled
          fullWidth
        />
        <TextField
          label="Importe del saldo anterior"
          name="saldoAnterior"
          value={pagos.saldoAnterior || "0.00"} // Usa saldoAnterior, si no hay pagos usa totalPago
          disabled
          fullWidth
        />
        <TextField
          label="Importe del saldo Pagado"
          name="saldoPagado"
          value={pagos.totalPagado || "0.00"} // Usa el saldo pagado
          disabled
          fullWidth
        />
        <TextField
          label="Importe del saldo insoluto"
          name="saldoInsoluto"
          value={getValues("ImpSaldoInsoluto") || ""} // Muestra el saldo insoluto calculado
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
        ) : (
          ""
        )}
      </Box>

      {children}

    </Box>
  );
}
