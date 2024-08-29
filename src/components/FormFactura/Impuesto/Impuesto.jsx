"use client";
import { useEffect, useState } from 'react';
import { Box, TextField, Button } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

export default function Impuesto({ register, setValue, getValues, index, baseImpuesto, remove, fieldsLength }) {
    const [impuesto, setImpuesto] = useState('');
    const [tasa, setTasa] = useState(0);
    const [monto, setMonto] = useState(0);

    useEffect(() => {
        if (impuesto) {
            try {
                const data = JSON.parse(impuesto);
                setTasa(data["Tasa"]);
                setValue(`impuestos[${index}].Tasa`, data["Tasa"]);
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

    return (
        <Box>
            <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                <Box flex={1}>
                    <Select
                        register={register}
                        clave='Clave'
                        nombre={`impuestos[${index}].ObjetoImpuesto`}
                        descripcion='Descripcion'
                        url="http://31.220.31.152:8081/Catalogos/ObjetoImpuestos"
                    />
                </Box>

                <Box flex={1}>
                    <Select
                        register={register}
                        clave='Clave'
                        id='ID'
                        descripcion='Descripcion'
                        nombre={`impuestos[${index}].Impuesto`}
                        url="http://31.220.31.152:8081/Catalogos/ImpuestoClave"
                        onChange={(e) => setImpuesto(e.target.value)}
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
