"use client";
import { useEffect, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Impuesto({
    watch,
    register,
    setValue,
    getValues,
    index,
    baseImpuesto,
    remove,
    fieldsLength,
    objetoImpuestoError,
    impuestoError,
    setObjetoImpuestoError,
    setImpuestoError,
    impuestoEditor,
    isNotaCredito = false // Nuevo prop para identificar notas de crédito
}) {
    const [impuesto, setImpuesto] = useState('');
    const [tasa, setTasa] = useState('');
    const [monto, setMonto] = useState(0);
    const [tasaUrl, setTasaUrl] = useState('');

    // Sincronizar datos del editor de impuestos al cargar
    useEffect(() => {
        if (impuestoEditor) {
            setValue(`impuestos[${index}].Impuesto`, impuestoEditor.Impuesto || '');
            setValue(`impuestos[${index}].Tasa`, impuestoEditor.Tasa || '');
            setValue(`impuestos[${index}].NombreImpuesto`, impuestoEditor.NombreImpuesto || '');
            setValue(`impuestos[${index}].ImpuestoClave`, impuestoEditor.ImpuestoClave || '');

            if (impuestoEditor.Tasa) {
                setTasa(impuestoEditor.Tasa);
                setValue(`impuestos[${index}].Tasa`, impuestoEditor.Tasa || 0);
            }

            const nombreImpuesto = impuestoEditor.NombreImpuesto || getValues(`impuestos[${index}].NombreImpuesto`);
            const tipo = impuestoEditor.Tipo || getValues(`impuestos[${index}].Tipo`);
            if (nombreImpuesto && tipo) {
                setTasaUrl(`${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${nombreImpuesto}&tipo=${tipo}`);
            }
        }
    }, [impuestoEditor, index, setValue, getValues]);

    // Actualizar URL de tasas y sincronizar valores al cambiar impuesto
    useEffect(() => {
        if (impuesto) {
            try {
                const data = JSON.parse(impuesto);
                setValue(`impuestos[${index}].NombreImpuesto`, data.Impuesto || '');
                setValue(`impuestos[${index}].Tipo`, data.Tipo || '');
                setValue(`impuestos[${index}].ImpuestoClave`, data.Clave || '');

                const nombreImpuesto = data.Impuesto || getValues(`impuestos[${index}].NombreImpuesto`);
                const tipo = data.Tipo || getValues(`impuestos[${index}].Tipo`);
                if (nombreImpuesto && tipo) {
                    const url = `${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${nombreImpuesto}&tipo=${tipo}`;
                    setTasaUrl(url);
                    setValue(`impuestos.${index}.TasaUrl`, url);
                }
            } catch (e) {
                console.error("El valor de impuesto no es un JSON válido:", impuesto);
            }
        }
    }, [impuesto, index, setValue, getValues]);

    // Calcular el monto basado en la tasa y base de impuesto
    useEffect(() => {
        const tasaCuota = getValues(`impuestos[${index}].TasaOCuota`);
        if (tasaCuota) {
            let resultado = parseFloat(tasaCuota) * baseImpuesto;
            
            // Para notas de crédito, el monto debe ser negativo
            if (isNotaCredito) {
                resultado = -Math.abs(resultado);
            }
            
            // Redondeo para evitar errores de precisión
            const montoRedondeado = Math.round((resultado + Number.EPSILON) * 100) / 100;
            
            setMonto(montoRedondeado);
            setValue(`impuestos[${index}].Monto`, montoRedondeado);
        } else {
            const defaultMonto = isNotaCredito ? -0.00 : 0.00;
            setMonto(defaultMonto);
            setValue(`impuestos[${index}].Monto`, defaultMonto);
        }
    }, [tasa, baseImpuesto, setValue, index, getValues, watch(`impuestos[${index}].TasaOCuota`), isNotaCredito]);

    const handleImpuestoChange = (e) => {
        const value = e.target.value;
        setImpuesto(value);
        setImpuestoError(!value);
    };

    const handleTasaChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setTasa(data.ID);
            setValue(`impuestos[${index}].Tasa`, data.ID);
            setValue(`impuestos[${index}].TasaOCuota`, parseFloat(data.Valor));
        } catch (error) {
            console.error("Error al manejar el cambio de tasa:", error);
        }
    };

    const formatCurrency = (value) => {
        if (value === undefined || value === null) return '$0.00';
        
        // Convertir a número y manejar notas de crédito (valores negativos)
        const num = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]/g, '')) : value;
        const absNum = Math.abs(num);
        const isNegative = num < 0;
        
        // Formatear el valor absoluto
        const formatted = absNum.toLocaleString('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).replace('MXN', '').trim();
        
        // Añadir paréntesis para valores negativos (opcional)
        return isNegative ? `-${formatted}` : formatted;
    };

    return (
        <Box>
            <Box display="flex" flexDirection="row" alignItems="start" gap={2}>
                <Box flex={1}>
                    <Select
                        register={register}
                        clave='Clave'
                        id='ID'
                        descripcion='Descripcion'
                        nombre={`impuestos[${index}].Impuesto`}
                        label='Impuesto'
                        url={`${apiUrl}/api/catalogos/Catalogos/ImpuestoClave`}
                        onChange={handleImpuestoChange}
                        error={impuestoError}
                        helperText={impuestoError ? "El impuesto es requerido." : ""}
                        value={getValues(`impuestos[${index}].Impuesto`) || ''}
                    />
                </Box>

                <Box flex={1}>
                    <Select
                        register={register}
                        clave=""
                        id="ID"
                        nombre={`impuestos[${index}].Tasa`}
                        label='Tasa o Cuota'
                        descripcion="Valor"
                        url={getValues(`impuestos.${index}.TasaUrl`)}
                        onChange={handleTasaChange}
                        value={getValues(`impuestos[${index}].Tasa`)}
                        sx={{ minWidth: 120 }}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Base Impuesto"
                        type="text"
                        {...register(`impuestos[${index}].BaseImpuesto`)}
                        value={formatCurrency(baseImpuesto || 0)}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Monto"
                        type="text"
                        {...register(`impuestos[${index}].Monto`)}
                        value={formatCurrency(monto)}
                        fullWidth
                        InputProps={{ readOnly: true }}
                        sx={{
                            '& .MuiInputBase-input': {
                                color: isNotaCredito && monto < 0 ? 'error.main' : 'text.primary'
                            }
                        }}
                    />
                </Box>

                {fieldsLength > 1 && (
                    <Box>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: 'rgba(29, 57, 77, 1)',
                                '&:hover': { backgroundColor: 'rgba(19, 47, 67, 1)' }
                            }}
                            onClick={() => remove(index)}
                        >
                            <RemoveCircleIcon sx={{ fontSize: '30px' }} />
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}