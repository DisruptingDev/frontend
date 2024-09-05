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
    const [tasa, setTasa] = useState(0);
    const [monto, setMonto] = useState(0);

    useEffect(() => {
        if (impuestoEditor) {
            console.log('Impuesto Editor:', impuestoEditor, index);
            setValue(`impuestos[${index}].ObjetoImpuesto`, impuestoEditor.ObjetoImpuesto || '');
            setValue(`impuestos[${index}].Impuesto`, impuestoEditor.Impuesto || '');
            setValue(`impuestos[${index}].Tasa`, impuestoEditor.Tasa || '');
            setValue(`impuestos[${index}].NombreImpuesto`, impuestoEditor.NombreImpuesto || '');
            setTasa(impuestoEditor.Tasa || 0);
        }
    }, [impuestoEditor, index, setValue]);

    useEffect(() => {
        if (impuesto) {
            try {
                const data = JSON.parse(impuesto);
                setTasa(data["Tasa"]);
                setValue(`impuestos[${index}].Tasa`, data["Tasa"]);
                setValue(`impuestos[${index}].NombreImpuesto`, data["Descripcion"] || ''); // Asegúrate de que NombreImpuesto se actualice
                setValue(`impuestos[${index}].Tipo`, data["Tipo"] || ''); // Actualiza el tipo
                console.log("Tipo del impuesto:", data["Tipo"]); // Muestra el tipo en la consola
            } catch (e) {
                console.error("El valor de impuesto no es un JSON válido:", impuesto);
            }
        }
    }, [impuesto, index, setValue]);

    useEffect(() => {
        const resultado = tasa * baseImpuesto;
        setMonto(resultado);
        setValue(`impuestos[${index}].Monto`, resultado);
    }, [tasa, baseImpuesto, setValue, index]);

    const handleObjetoImpuestoChange = (e) => {
        const value = e.target.value;
        setValue(`impuestos[${index}].ObjetoImpuesto`, value);
        if (!value) {
            setObjetoImpuestoError(true);
        } else {
            setObjetoImpuestoError(false);
        }
    };

    const handleImpuestoChange = (e) => {
        const value = e.target.value;
        setImpuesto(value);
        if (!value) {
            setImpuestoError(true);
        } else {
            setImpuestoError(false);
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
                    <TextField
                        label="Tasa"
                        type="number"
                        {...register(`impuestos[${index}].Tasa`)}
                        value={tasa}
                        fullWidth
                        InputProps={{ readOnly: true }}
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
