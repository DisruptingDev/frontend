import React, { forwardRef } from "react";
import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

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

// Componente de entrada personalizado
const CustomDateInput = forwardRef(({ value, onClick, label, id }, ref) => (
  <TextField
    id={id}
    fullWidth
    variant="outlined"
    label={label || "Fecha y hora de pago"}
    value={value || ""}
    onClick={onClick}
    inputRef={ref}
  />
));

CustomDateInput.displayName = "CustomDateInput";

// Componente principal
export default function DatePickerComponent({ selectedDate, onChange, label, id, name }) {
  return (
    <StyledReactDatePicker>
      <ReactDatePicker
        id={id}
        name={name}
        selected={selectedDate}
        onChange={onChange}
        showTimeSelect
        timeIntervals={15}
        dateFormat="MM/dd/yyyy h:mm aa"
        customInput={<CustomDateInput label={label} id={id} />}
      />
    </StyledReactDatePicker>
  );
}
