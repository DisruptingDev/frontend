"use client";

import { useEffect, useState } from 'react';
import { Box, TextField, Button, Divider } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';

export default function Impuesto({ register, setValue, index, baseImpuesto, remove, fieldsLength, isLast }) {
    const [tasa, setTasa] = useState(0);
    const [monto, setMonto] = useState(0);

    useEffect(() => {
        const resultado = tasa * baseImpuesto;
        setMonto(resultado);
        setValue(`impuestos[${index}].Monto`, resultado);
    }, [tasa, baseImpuesto, setValue, index]);

    useEffect(() => {
        setValue(`impuestos[${index}].BaseImpuesto`, baseImpuesto);
    }, [baseImpuesto, setValue, index]);

    const ChangeSelectImpuesto = (e) => {
        const data = JSON.parse(e.target.value);
        setTasa(data.Tasa);
        setValue(`impuestos[${index}].Tasa`, data.Tasa);
    };

    return (
        <Box>
            <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                <Box flex={1}>
                    <Select
                        register={register}
                        nombre={`Objeto Impuesto`}
                        url="http://31.220.31.152:8081/Catalogos/ObjetoImpuestos"
                    />
                </Box>

                <Box flex={1}>
                    <Select
                        register={register}
                        nombre={`Impuesto`}
                        url="http://31.220.31.152:8081/Catalogos/ImpuestoClave"
                        onChange={ChangeSelectImpuesto}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Tasa"
                        type="number"
                        {...register(`impuestos[${index}].Tasa`)}
                        value={tasa}
                        fullWidth
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Base Impuesto"
                        type="number"
                        {...register(`impuestos[${index}].BaseImpuesto`)}
                        value={baseImpuesto}
                        fullWidth
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </Box>

                <Box flex={1}>
                    <TextField
                        label="Monto"
                        type="number"
                        {...register(`impuestos[${index}].Monto`)}
                        value={monto}
                        fullWidth
                        InputProps={{
                            readOnly: true,
                        }}
                    />
                </Box>

                {/* Mostrar el botón "Eliminar" solo si hay más de un impuesto */}
                {fieldsLength > 1 && (
                    <Box>
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: 'rgba(29, 57, 77, 1)',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                '&:hover': {
                                    backgroundColor: 'rgba(19, 47, 67, 1)',
                                }
                            }}
                            onClick={() => remove(index)} // Llama a la función remove con el índice correcto
                        >
                            <RemoveCircleIcon sx={{ fontSize: '30px' }} />
                        </Button>
                    </Box>
                )}
            </Box>
        </Box>
    );
}
