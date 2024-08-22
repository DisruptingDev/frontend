import React, { forwardRef } from 'react';
import TextField from '@mui/material/TextField';

// Componente de entrada personalizado
const CustomInput = forwardRef(({ value, onClick, label }, ref) => (
  <TextField
    fullWidth
    label={label}
    value={value}
    onClick={onClick}
    inputRef={ref}
  />
));

// Añadiendo displayName para evitar warnings de ESLint
CustomInput.displayName = 'CustomInput';

export default CustomInput;