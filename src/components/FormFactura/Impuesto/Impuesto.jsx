"use client";
import { useEffect, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

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
}) {
    const [impuesto, setImpuesto] = useState('');
    const [tasa, setTasa] = useState('');
    const [monto, setMonto] = useState(0);
    const [tasaUrl, setTasaUrl] = useState('');

    // Sincronizar datos del editor de impuestos al cargar
    useEffect(() => {
        if (impuestoEditor) {
            setValue(`impuestos[${index}].ObjetoImpuesto`, impuestoEditor.ObjetoImpuesto || '');
            setValue(`impuestos[${index}].Impuesto`, impuestoEditor.Impuesto || '');
            setValue(`impuestos[${index}].Tasa`, impuestoEditor.Tasa || '');
            setValue(`impuestos[${index}].NombreImpuesto`, impuestoEditor.NombreImpuesto || '');

            if (impuestoEditor.Tasa) {
                setTasa(impuestoEditor.Tasa); 
                setValue(`impuestos[${index}].TasaOCuota`, impuestoEditor.TasaOCuota || 0);
            }

            const nombreImpuesto = impuestoEditor.NombreImpuesto || getValues(`impuestos[${index}].NombreImpuesto`);
            const tipo = impuestoEditor.Tipo || getValues(`impuestos[${index}].Tipo`);
            if (nombreImpuesto && tipo) {
                setTasaUrl(`http://31.220.31.152:8081/Catalogos/TasaOCuota?impuesto=${nombreImpuesto}&tipo=${tipo}`);
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

                const nombreImpuesto = data.Impuesto || getValues(`impuestos[${index}].NombreImpuesto`);
                const tipo = data.Tipo || getValues(`impuestos[${index}].Tipo`);
                if (nombreImpuesto && tipo) {
                    setTasaUrl(`http://31.220.31.152:8081/Catalogos/TasaOCuota?impuesto=${nombreImpuesto}&tipo=${tipo}`);
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
            const resultado = parseFloat(tasaCuota) * baseImpuesto;
            setMonto(resultado);
            setValue(`impuestos[${index}].Monto`, resultado);
        } else {
            setMonto(0);
            setValue(`impuestos[${index}].Monto`, 0);
        }
    }, [tasa, baseImpuesto, setValue, index, getValues]);

    // Manejar cambios en ObjetoImpuesto
    const handleObjetoImpuestoChange = (e) => {
        const value = e.target.value;
        setValue(`impuestos[${index}].ObjetoImpuesto`, value);
        setObjetoImpuestoError(!value);
    };

    // Manejar cambios en Impuesto
    const handleImpuestoChange = (e) => {
        const value = e.target.value;
        setImpuesto(value);
        setImpuestoError(!value);
    };

    // Sincronizar tasa seleccionada y actualizar valor del formulario
    const handleTasaChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            setTasa(data.ID); // Usar el ID para el campo de `Tasa`
            setValue(`impuestos[${index}].Tasa`, data.ID); // Asignar ID al campo `Tasa`
            setValue(`impuestos[${index}].TasaOCuota`, parseFloat(data.Valor)); // Registrar el valor en `TasaOCuota`
        } catch (error) {
            console.error("Error al manejar el cambio de tasa:", error);
        }
    };

    return (
        <Box>
            <Box display="flex" flexDirection="row" alignItems="start" gap={2}>
                <Box flex={2}>
                    <Select
                        register={register}
                        clave='Clave'
                        nombre={`impuestos[${index}].ObjetoImpuesto`}
                        label='ObjetoImpuesto'
                        descripcion='Descripcion'
                        url="http://31.220.31.152:8081/Catalogos/ObjetoImpuestos"
                        onChange={handleObjetoImpuestoChange}
                        error={objetoImpuestoError}
                        helperText={objetoImpuestoError ? "El objeto de impuesto es requerido." : ""}
                        value={getValues(`impuestos[${index}].ObjetoImpuesto`) || ''}
                    />
                </Box>

                <Box flex={1}>
                    <Select
                        register={register}
                        clave='Clave'
                        id='ID'
                        descripcion='Descripcion'
                        nombre={`impuestos[${index}].Impuesto`}
                        label='Impuesto'
                        url="http://31.220.31.152:8081/Catalogos/ImpuestoClave"
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
                        label='Tasa'
                        descripcion="Valor"
                        url={tasaUrl}
                        onChange={handleTasaChange}
                        value={tasa}
                        sx={{ minWidth: 120 }}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Base Impuesto"
                        type="number"
                        {...register(`impuestos[${index}].BaseImpuesto`)}
                        value={baseImpuesto}
                        fullWidth
                        InputProps={{ readOnly: true }}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Monto"
                        type="number"
                        {...register(`impuestos[${index}].Monto`)}
                        value={monto}
                        fullWidth
                        InputProps={{ readOnly: true }}
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
