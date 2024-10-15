'use client';

// React Imports
import React, { useState, forwardRef, useEffect } from 'react';

// MUI Imports
import TextField from '@mui/material/TextField';
import { styled } from '@mui/material/styles';

// Third-party Imports
import 'react-datepicker/dist/react-datepicker.css'; // Importa los estilos por defecto de react-datepicker
import ReactDatePicker from 'react-datepicker';

// Estilo personalizado usando Material-UI
const StyledReactDatePicker = styled('div')(({ theme }) => ({
    
  '& .react-datepicker-wrapper': {
    width: '100%',
  },
  '& .react-datepicker-popper': {
    zIndex: 20,
    paddingTop: `${theme.spacing(0.5)} !important`,
  },
  '& .react-datepicker': {
    fontFamily: theme.typography.fontFamily,
    borderRadius: theme.shape.borderRadius,
    boxShadow: theme.shadows[3],
    border: 'none',
    '& .react-datepicker__header': {
      backgroundColor: theme.palette.background.paper,
      borderBottom: 'none',
      paddingBottom: theme.spacing(2),
    },
    '& .react-datepicker__current-month, & .react-datepicker__day-name': {
      color: theme.palette.text.primary,
      fontWeight: theme.typography.fontWeightMedium,
    },
    '& .react-datepicker__day--selected, & .react-datepicker__day--in-range': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.common.white,
    },
    '& .react-datepicker__day:hover': {
      backgroundColor: theme.palette.primary.light,
      color: theme.palette.common.white,
    },
    '& .react-datepicker__day--keyboard-selected': {
      backgroundColor: theme.palette.primary.light,
    },
    '& .react-datepicker__day--today': {
      fontWeight: 'bold',
      color: 'black',
    },
  },
}));

const CustomInput = forwardRef(({ value, onClick }, ref) => (
  <TextField
    fullWidth
    variant='filled'
    label="Rango de Fecha"
    value={value}
    onClick={onClick}
    inputRef={ref}
    sx={{
        
      '& .MuiInputLabel-root': {
        color: 'rgba(85, 105, 255, 1)', // Color similar al del ejemplo
      },
      '& .MuiOutlinedInput-root': {
        '& fieldset': {
          borderColor: 'rgba(85, 105, 255, 1)', // Color similar al del ejemplo
        },
        '&:hover fieldset': {
          borderColor: 'rgba(85, 105, 255, 0.8)',
        },
        '&.Mui-focused fieldset': {
          borderColor: 'rgba(85, 105, 255, 1)',
        },
      },
    }}
  />
));

CustomInput.displayName = 'CustomInput';



const DateRangePickerComponent = ({register, setValue, resetCalendario, setResetCalendario}) => {
  // Definir el día actual y 5 días atrás
  const today = new Date();
  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(today.getDate() - 5);

  const [startDate, setStartDate] = useState(fiveDaysAgo); // Fecha de inicio: 5 días atrás
  const [endDate, setEndDate] = useState(today); // Fecha de fin: hoy

  const handleOnChange = (dates) => {
    const [start, end] = dates;
    if (start && end) {
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); // Convertir a días
      
      if (diffDays > 5) {
        const newEndDate = new Date(start);
        newEndDate.setDate(start.getDate() + 5); // Ajustar la fecha de fin a máximo 5 días después
        setEndDate(newEndDate);
        setValue("FechaFin", newEndDate);
      } else {
        setEndDate(end);
        setValue("FechaFin", end);
      }
    } else {
      setEndDate(end);
      setValue("FechaFin", end);
    }

    setStartDate(start);
    setValue("FechaInicio", start);
    console.log("Fechas", start, end);
  };

  useEffect(() => {
    setValue("FechaInicio", startDate);
    setValue("FechaFin", endDate);
  }, [endDate, setValue, startDate]);

  useEffect(() => {
    if (resetCalendario) {
      setStartDate(fiveDaysAgo);
      setEndDate(today);
      setValue("FechaInicio", fiveDaysAgo);
      setValue("FechaFin", today);
      setResetCalendario(false);
    }
  }, [resetCalendario, setResetCalendario, setValue, fiveDaysAgo, today]);

  return (
    <StyledReactDatePicker>
      <ReactDatePicker
        selectsRange
        startDate={startDate}
        endDate={endDate}
        onChange={handleOnChange}
        customInput={<CustomInput />}
        shouldCloseOnSelect={true}
      />
    </StyledReactDatePicker>
  );
};


export default DateRangePickerComponent;
