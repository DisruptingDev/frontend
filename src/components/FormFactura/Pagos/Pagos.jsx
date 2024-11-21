"use client";

import React, { useState, useEffect, forwardRef } from "react";
import { TextField, Box, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Select from "@/components/Select/Select.jsx";

// Estilo personalizado para ReactDatePicker
const StyledReactDatePicker = styled("div")(({ theme }) => ({
  "& .react-datepicker-wrapper": { width: "100%" },
  "& .react-datepicker-popper": { zIndex: 20, paddingTop: `${theme.spacing(0.5)} !important` },
  "& .react-datepicker": {
    fontFamily: theme.typography.fontFamily,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    border: "none",
    "& .react-datepicker__header": { backgroundColor: theme.palette.background.paper },
    "& .react-datepicker__day--selected": { backgroundColor: theme.palette.primary.light, color: theme.palette.common.white },
  },
}));

const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
  <TextField
    fullWidth
    variant="outlined"
    label="Fecha y hora de pago"
    value={value}
    onClick={onClick}
    inputRef={ref}
    sx={{ "& .MuiInputBase-root": { height: "56px", display: "flex", alignItems: "center" } }}
  />
));

CustomDateInput.displayName = "CustomDateInput";

// Función para calcular totales globales
const calcularTotales = (desglose) => {
  return desglose.reduce(
    (totales, concepto) => {
      totales.pagoTotal += parseFloat(concepto.PagoProporcional);
      totales.subtotalTotal += parseFloat(concepto.SubtotalProporcional);
      concepto.ImpuestosProporcionales.forEach((impuesto) => {
        totales.impuestosTotales += parseFloat(impuesto.MontoProporcional);
      });
      return totales;
    },
    { pagoTotal: 0, subtotalTotal: 0, impuestosTotales: 0 }
  );
};

export default function Pagos({ register, conceptos }) {
  const [pago, setPago] = useState({});
  const [fechaPago, setFechaPago] = useState(new Date());
  const [desglose, setDesglose] = useState([]);
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
        const baseProporcional = (impuesto.BaseImpuesto / totalConcepto) * pagoParcial;
        const montoProporcional = baseProporcional * impuesto.TasaOCuota;
        return {
          NombreImpuesto: impuesto.NombreImpuesto,
          BaseProporcional: baseProporcional.toFixed(2),
          MontoProporcional: montoProporcional.toFixed(2),
        };
      });

      return {
        Descripcion: concepto.Descripcion,
        PagoProporcional: pagoParcial.toFixed(2),
        SubtotalProporcional: ((concepto.Subtotal / totalConcepto) * pagoParcial).toFixed(2),
        ImpuestosProporcionales: impuestosProporcionales,
      };
    });

    // Calcular totales globales
    const nuevosTotales = nuevoDesglose.reduce((acc, concepto) => {
      concepto.ImpuestosProporcionales.forEach((impuesto) => {
        acc[`Total${impuesto.NombreImpuesto}`] =
          (acc[`Total${impuesto.NombreImpuesto}`] || 0) + parseFloat(impuesto.MontoProporcional);
      });
      return acc;
    }, { ...totales });

    setDesglose(nuevoDesglose);
    setTotales(nuevosTotales);
  };

  const mostrarTotalesImpuestos = (totales) => {
    return Object.entries(totales)
      .filter(([_, value]) => value > 0)
      .map(([key, value], index) => (
        <Typography key={index} variant="body2">
          {key}: ${value.toFixed(2)}
        </Typography>
      ));
  };

  const handleMontoChange = (e) => {
    const nuevoMonto = parseFloat(e.target.value) || 0;
    setPago({ ...pago, monto: nuevoMonto });
    calcularDesglose(nuevoMonto);
  };

  return (
    <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
      <Typography variant="h6" mb={4}>
        Pagos
      </Typography>
      <Box display="grid" gap={3}>
        <StyledReactDatePicker>
          <ReactDatePicker
            selected={fechaPago}
            onChange={(date) => {
              setFechaPago(date);
              setPago({ ...pago, fechaPago: date });
            }}
            showTimeSelect
            timeIntervals={15}
            dateFormat="MM/dd/yyyy h:mm aa"
            customInput={<CustomDateInput />}
          />
        </StyledReactDatePicker>
        <Select
          register={register}
          nombre="FormaPago"
          url="https://facturacioncfditotal.com/api/catalogos/Catalogos/FormaPago"
          clave="Clave"
          descripcion="Descripcion"
        />
        <TextField
          label="Monto"
          name="monto"
          value={pago.monto || ""}
          onChange={handleMontoChange}
          fullWidth
        />
      </Box>
      <Box mt={4}>
        <Typography variant="h6">Totales de Impuestos</Typography>
        {mostrarTotalesImpuestos(totales)}
      </Box>
      <Box mt={4}>
        <Typography variant="h6">Desglose del Pago por Concepto</Typography>
        {desglose.map((concepto, index) => (
          <Box key={index} p={2} border="1px solid #ddd" borderRadius={2} mb={2}>
            <Typography variant="subtitle1">{concepto.Descripcion}</Typography>
            <Typography variant="body2">
              Pago Proporcional: ${concepto.PagoProporcional}
            </Typography>
            <Typography variant="body2">
              Base Gravada: ${concepto.SubtotalProporcional}
            </Typography>
            <Box ml={2}>
              <Typography variant="body2">Impuestos:</Typography>
              {concepto.ImpuestosProporcionales.map((impuesto, idx) => (
                <Typography key={idx} variant="body2">
                  - {impuesto.NombreImpuesto}: ${impuesto.MontoProporcional}
                </Typography>
              ))}
            </Box>
          </Box>
        ))}
        {desglose.length > 0 && (
          <Box mt={4}>
            <Typography variant="h6">Totales Generales</Typography>
            <Box p={2} border="1px solid #ddd" borderRadius={2} mb={2}>
              <Typography variant="body1">
                Total Pago Proporcional: ${calcularTotales(desglose).pagoTotal.toFixed(2)}
              </Typography>
              <Typography variant="body1">
                Total Base Gravada: ${calcularTotales(desglose).subtotalTotal.toFixed(2)}
              </Typography>
              <Typography variant="body1">
                Total Impuestos: ${calcularTotales(desglose).impuestosTotales.toFixed(2)}
              </Typography>
            </Box>
          </Box>
        )}
      </Box>
    </Box>
  );
}
