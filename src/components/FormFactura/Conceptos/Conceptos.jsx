"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Typography, Button, Autocomplete, Snackbar, Alert } from '@mui/material';
import Impuesto from "@/components/FormFactura/Impuesto/Impuesto.jsx";
import { useForm, useFieldArray, get } from 'react-hook-form';
import CrearConcepto from "./ModelConceptos.js";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from '@/components/Select/Select.jsx';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Conceptos({ setConceptos, conceptos, editIndex, setEditIndex, token, modalAgregarConcepto, onClose, TipoComprobante, facturasRelacionadas }) {
    const tipoComprobanteValue = TipoComprobante;
    const isNotaCredito = tipoComprobanteValue === "E";
    const [conceptoOptions, setConceptoOptions] = useState([]);
    const [claveProdServOptions, setClaveProdServOptions] = useState([]);
    const [claveUnidadOptions, setClaveUnidadOptions] = useState([]);
    const [queryConcepto, setQueryConcepto] = useState('');
    const [queryProdServ, setQueryProdServ] = useState('');
    const [queryUnidad, setQueryUnidad] = useState('');
    const [selectedConcepto, setSelectedConcepto] = useState(null);
    const [selectedClaveProdServ, setSelectedClaveProdServ] = useState(null);
    const [selectedClaveUnidad, setSelectedClaveUnidad] = useState(null);
    const [objetoImpuesto, setObjetoImpuesto] = useState("02");
    const [conceptoSeleccionado, setConceptoSeleccionado] = useState(null);
    // Resto del código para los estados de error y el manejo del formulario
    const [nombreError, setNombreError] = useState(false);
    const [descripcionError, setDescripcionError] = useState(false);
    const [claveProdServError, setClaveProdServError] = useState(false);
    const [claveUnidadError, setClaveUnidadError] = useState(false);
    const [cantidadError, setCantidadError] = useState(false);
    const [valorUnitarioError, setValorUnitarioError] = useState(false);
    const [objetoImpuestoError, setObjetoImpuestoError] = useState(false);
    const [descuentoError, setDescuentoError] = useState(false);
    const [descuentoErrorMesage, setDescuentoErrorMesage] = useState('');
    const [impuestoError, setImpuestoError] = useState(false);

    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState('success');
    const [facturaSeleccionada, setFacturaSeleccionada] = useState(null);
    const [initialLoad, setInitialLoad] = useState(false);

    const { control, register, reset, getValues, setValue, watch, trigger } = useForm({
        defaultValues: {
            Descripcion: '',
            ClaveProdServ: '',
            ClaveUnidad: '',
            Unidad: '',
            Cantidad: 1,
            ValorUnitario: 0,
            Descuento: 0,
            Subtotal: 0,
            ObjetoImpuesto: "02",
            impuestos: [{ Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '', Tipo: '' }]
        },
    });

    const { fields, append, remove, replace } = useFieldArray({
        control,
        name: 'impuestos',
    });


    const fetchConceptos = useCallback(async () => {
        if (!token) return;
        try {
            const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/Conceptos?descripcion=${queryConcepto}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            setConceptoOptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al buscar Conceptos:', error);
        }

    }, [queryConcepto, token]);

    // 1. Elimina el primer efecto (el que solo imprime y establece initialLoad)
    // No es necesario ya que podemos hacer todo en un solo efecto

    // 2. Modifica el segundo efecto para que maneje todo el flujo
    useEffect(() => {
        // Verifica si debemos procesar las facturas
        const shouldProcess = isNotaCredito &&
            facturasRelacionadas &&
            Object.keys(facturasRelacionadas).length > 0;

        if (!shouldProcess) return;

        // 1. Prellenar descripción con UUIDs - Ahora accedemos directamente a ListaCFDIRelacionados
        const uuids = facturasRelacionadas.ListaCFDIRelacionados
            ?.filter(f => f.UUID) // Filtra elementos sin UUID
            ?.map(f => f.UUID)
            ?.join(', ');

        if (!uuids) {
            setSnackbarMessage('No se encontraron UUIDs para prellenar la descripción.');
            setSnackbarSeverity('warning');
            setOpenSnackbar(true);
            return;
        }

        const descripcion = `Nota de crédito aplicada a facturas con UUIDs: ${uuids}`;
        setValue('Descripcion', descripcion);

        // 2. Establecer valores por defecto
        setValue('ClaveProdServ', '84111506');
        setValue('ClaveUnidad', 'ACT');
        setValue('Cantidad', 1);

        // 3. Calcular valor unitario (usar negativo para nota de crédito)
        // Ahora accedemos directamente a SaldoTotalFacturasRelacionadas
        const saldoTotal = facturasRelacionadas.SaldoTotalFacturasRelacionadas || 0;
        //setValue('ValorUnitario', -Math.abs(saldoTotal)); // Negativo para NC

        // 4. Descuento a 0
        setValue('Descuento', 0);

        // Configurar opciones de selects
        const prodServ = { Clave: '84111506', Descripcion: 'Notas de crédito' };
        const unidad = { Clave: 'ACT', Descripcion: 'Actividad' };

        setSelectedClaveProdServ(prodServ);
        setSelectedClaveUnidad(unidad);
        setClaveProdServOptions([prodServ]);
        setClaveUnidadOptions([unidad]);

    }, [isNotaCredito, facturasRelacionadas, setValue]);

    const handleAddNewOption = (newOption) => {
        const newConcepto = { ID: '000', Descripcion: newOption };
        setConceptoOptions((prevOptions) => [...prevOptions, newConcepto]);
        setSelectedConcepto(newConcepto);
        setDescripcionError(false);
    };
    useEffect(() => {
        fetchConceptos();
    }, [fetchConceptos, queryConcepto, token]);

    const fetchOptions = async () => {
        if (!token) return;

        try {
            const prodServResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveProdServ?query=${queryProdServ}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const prodServData = await prodServResponse.json();
            setClaveProdServOptions(Array.isArray(prodServData) ? prodServData : []);

            const unidadResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveUnidad?query=${queryUnidad}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const unidadData = await unidadResponse.json();
            setClaveUnidadOptions(Array.isArray(unidadData) ? unidadData : []);
        } catch (error) {
            console.error('Error al buscar ClaveProdServ o ClaveUnidad:', error);
        }
    };

    useEffect(() => {
        if (selectedClaveUnidad) {
            setValue("Unidad", selectedClaveUnidad.Descripcion);
        }

    }, [selectedClaveUnidad, setValue])

    useEffect(() => {
        fetchOptions();
    }, [queryProdServ, queryUnidad, token]);

    useEffect(() => {
        const calcularSubtotal = () => {
            const cantidad = parseFloat(getValues('Cantidad'));
            const precioUnitario = parseFloat(getValues('ValorUnitario'));
            const descuento = parseFloat(getValues('Descuento'));
            let subtotal;
            if (isNotaCredito) {
                subtotal = (cantidad * precioUnitario) / 1.16;
            } else {
                subtotal = (cantidad * precioUnitario) - descuento;
            }
            setValue("Subtotal", subtotal);
            return subtotal;
        };

        // if (isNotaCredito) {
        //         const subtotal = (cantidad * precioUnitario) / 1.16; // Sumar descuento para NC
        //         setValue("Subtotal", subtotal);
        //                         return subtotal;
        //     } else {
        //         const subtotal = (cantidad * precioUnitario) - descuento;
        //         setValue("Subtotal", subtotal);
        //         return subtotal;
        //     }

        const subtotal = calcularSubtotal();
        setValue("Subtotal", subtotal);

        fields.forEach((_, index) => {
            setValue(`impuestos.${index}.BaseImpuesto`, subtotal);
        });

    }, [watch('Cantidad'), watch('ValorUnitario'), watch('Descuento'), fields, setValue, getValues]);

    useEffect(() => {
        if ((editIndex !== null && conceptos[editIndex]) || conceptoSeleccionado) {
            let concepto
            if (conceptoSeleccionado) {
                concepto = conceptoSeleccionado;
            } else {

                concepto = conceptos[editIndex];
            }

            // Establecer valores del concepto
            setValue("Descripcion", concepto.Descripcion || '');
            setValue("ClaveProdServ", concepto.ClaveProdServ || '');
            setValue("ClaveUnidad", concepto.ClaveUnidad || '');
            setValue("Unidad", concepto.Unidad || 'Pieza');
            setValue("Cantidad", concepto.Cantidad || 1);
            setValue("ValorUnitario", concepto.ValorUnitario || 0);
            setValue("Descuento", concepto.Descuento || 0);
            setValue("Subtotal", concepto.Subtotal || 0);
            setValue("ObjetoImpuesto", concepto.ObjetoImpuesto || "02");
            setObjetoImpuesto(concepto.ObjetoImpuesto || "02");

            if (concepto.Impuestos?.length) {
                Promise.all(
                    concepto.Impuestos.map(async (impuesto) => {
                        const response = await fetch(`${apiUrl}/api/catalogos/Catalogos/ImpuestoClave`, {
                            method: 'GET',
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        const data = await response.json();
                        const opcionSeleccionada = data.find(opt => opt.ID == impuesto.Impuesto);

                        return {
                            Impuesto: impuesto.Impuesto || '',
                            ImpuestoClave: impuesto.ImpuestoClave || '',
                            Tasa: impuesto.Tasa || 0,
                            TasaOCuota: impuesto.TasaOCuota || 0,
                            BaseImpuesto: impuesto.BaseImpuesto || '',
                            NombreImpuesto: impuesto.NombreImpuesto || '',
                            Tipo: opcionSeleccionada ? opcionSeleccionada["Tipo"] : (impuesto.Tipo || ''),
                            Monto: impuesto.Monto || '',
                            TasaUrl: opcionSeleccionada
                                ? `${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${opcionSeleccionada["Impuesto"]}&tipo=${opcionSeleccionada["Tipo"]}`
                                : `${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${impuesto.NombreImpuesto}&tipo=${impuesto.Tipo}`
                        };
                    })
                ).then((impuestosActualizados) => {
                    replace(impuestosActualizados);
                });
            }

            if (!conceptoOptions.some(opt => opt.ID === concepto.ID)) {
                fetch(`${apiUrl}/api/catalogos/Catalogos/Conceptos?descripcion=${concepto.Descripcion}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {

                        setConceptoOptions(prevOptions => [...prevOptions, ...data]);
                        const selectedConcepto = data.find(opt => opt.ID == concepto.ID);
                        if (selectedConcepto) {

                            setSelectedConcepto(selectedConcepto || null);
                        }
                        else {
                            handleAddNewOption(concepto.Descripcion);
                        }
                    })
                    .catch(error => console.error('Error al buscar Conceptos:', error));
            } else {
                const selectedConcepto = conceptoOptions.find(opt => opt.ID == concepto.ID);
                setSelectedConcepto(selectedConcepto || null);
            }
            // Fetch ClaveProdServ options if needed
            if (!claveProdServOptions.some(opt => opt.Clave === concepto.ClaveProdServ)) {
                fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveProdServ?query=${concepto.ClaveProdServ}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        setClaveProdServOptions(prevOptions => [...prevOptions, ...data]);
                        const selectedProdServ = data.find(opt => opt.Clave == concepto.ClaveProdServ);
                        setSelectedClaveProdServ(selectedProdServ || null);
                    })
                    .catch(error => console.error('Error al buscar ClaveProdServ:', error));
            } else {
                const selectedProdServ = claveProdServOptions.find(opt => opt.Clave == concepto.ClaveProdServ);
                setSelectedClaveProdServ(selectedProdServ || null);
            }
            // Fetch ClaveUnidad options if needed
            if (!claveUnidadOptions.some(opt => opt.Clave === concepto.ClaveUnidad)) {
                fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveUnidad?query=${concepto.ClaveUnidad}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        setClaveUnidadOptions(prevOptions => [...prevOptions, ...data]);
                        const selectedUnidad = data.find(opt => opt.Clave == concepto.ClaveUnidad);
                        setSelectedClaveUnidad(selectedUnidad || null);
                    })
                    .catch(error => console.error('Error al buscar ClaveUnidad:', error));
            } else {
                const selectedUnidad = claveUnidadOptions.find(opt => opt.Clave == concepto.ClaveUnidad);
                setSelectedClaveUnidad(selectedUnidad || null);
            }

        }
    }, [editIndex, conceptos, conceptoSeleccionado, setValue, trigger]);

    const handleAgregarConcepto = () => {
        setConceptoSeleccionado(null);
        setDescripcionError(false);
        setClaveProdServError(false);
        setClaveUnidadError(false);
        setCantidadError(false);
        setValorUnitarioError(false);
        setDescuentoError(false);
        setObjetoImpuestoError(false);
        setImpuestoError(false);
        let hasError = false;
        // Validaciones para los campos de Conceptos

        if (modalAgregarConcepto && !getValues('Nombre')) {
            setNombreError(true);
            hasError = true;
        }

        if (!getValues('Descripcion')) {
            setDescripcionError(true);
            hasError = true;
        }
        if (!getValues('ClaveProdServ')) {
            setClaveProdServError(true);
            hasError = true;
        }
        if (!getValues('ClaveUnidad')) {
            setClaveUnidadError(true);
            hasError = true;
        }
        if (isNotaCredito) {
            if (!getValues('Cantidad') || (getValues('Cantidad') >= 0 && getValues('Cantidad') === 0)) {
                setCantidadError(true);
                hasError = true;
            }
        } else {
            // Validación normal para otros comprobantes
            if (!getValues('Cantidad') || getValues('Cantidad') <= 0) {
                setCantidadError(true);
                hasError = true;
            }
        }
        if (isNotaCredito) {
            if (!getValues('ValorUnitario') || (getValues('ValorUnitario') >= 0 && getValues('ValorUnitario') === 0)) {
                setValorUnitarioError(true);
                hasError = true;
            }
        } else {
            // Validación normal para otros comprobantes
            if (!getValues('ValorUnitario') || getValues('ValorUnitario') <= 0) {
                setValorUnitarioError(true);
                hasError = true;
            }
        }
        if (isNotaCredito) {
            // Permitir descuentos negativos (ej: -100 para aumentar el monto)
            if (getValues('Descuento') === undefined || getValues('Descuento') === "") {
                setDescuentoError(true);
                setDescuentoErrorMesage('Campo obligatorio.');
                hasError = true;
            }
        } else {
            // Validación normal para facturas
            const descuento = getValues('Descuento');
            const limiteDescuento = (getValues('Cantidad') * getValues('ValorUnitario')) / 2;

            if (descuento === '' || descuento === undefined || Number(descuento) > limiteDescuento) {
                setDescuentoError(true);
                setDescuentoErrorMesage('El descuento no puede ser mayor al 50% del total.');
                hasError = true;
            } else {
                setDescuentoError(false);
            }
        }
        if (objetoImpuesto !== "01") {
            // Validaciones para los campos de Impuesto
            const impuestos = getValues("impuestos");
            impuestos.forEach((impuesto) => {

                if (!impuesto.Impuesto) {
                    setImpuestoError(true);
                    hasError = true;
                }
            });
        }
        if (hasError) {
            return;
        }

        const nuevoConcepto = CrearConcepto(getValues, getValues("impuestos"));

        if (nuevoConcepto !== "Error") {
            if (editIndex !== null) {
                // Editar concepto existente
                setConceptos(prevConceptos => prevConceptos.map((concepto, index) => index === editIndex ? nuevoConcepto : concepto));
                setEditIndex(null);
            } else {
                // Agregar nuevo concepto
                setConceptos(prevConceptos => [...prevConceptos, nuevoConcepto]);
            }
            const resetForm = () => {
                reset({
                    Descripcion: '',
                    Unidad: '',
                    Cantidad: 1,
                    ValorUnitario: 0,
                    Descuento: 0,
                    ObjetoImpuesto: "02",
                    impuestos: [{ Impuesto: '', Tasa: '' }]
                });
            };
            resetForm()
            setSelectedClaveProdServ(null);
            setSelectedClaveUnidad(null);
            setSelectedConcepto(null);
            setQueryConcepto('');
            handleAddNewOption('');
            if (modalAgregarConcepto) {
                onClose();
            }

        } else {
        }
    };

    const handleObjetoImpuestoChange = (e) => {
        const value = e.target.value;
        const data = JSON.parse(e.target.value);
        setObjetoImpuesto(data.Clave);
    };

    const handleConcepto = (event, value) => {
        if (typeof value === 'string') {
            handleAddNewOption(value);
            setValue('Descripcion', value);
        } else {
            if (value) {
                const impuestos = [
                    ...(value.Impuestos?.Retenciones || []), // Incluye las retenciones si existen
                    ...(value.Impuestos?.Traslados || [])   // Incluye los traslados si existen
                ]
                const concepto = {
                    ID: value.ID,
                    Descripcion: value.Descripcion,
                    ClaveProdServ: value.ClaveProdServ,
                    ClaveUnidad: value.ClaveUnidad,
                    Unidad: value.Unidad,
                    Cantidad: value.Cantidad,
                    ValorUnitario: value.ValorUnitario,
                    Descuento: value.Descuento,
                    Subtotal: value.Subtotal,
                    ObjetoImpuesto: value.ObjetoImp || "02",
                    Impuestos: impuestos.map(impuesto => ({
                        NombreImpuesto: impuesto.ImpuestoCatalogo.Impuesto,
                        Impuesto: impuesto.ImpuestoCatalogoID,
                        ImpuestoClave: formatImpuestoClave(impuesto.ImpuestoClave),
                        Tasa: impuesto.TasaCatalogoID,
                        TasaOCuota: impuesto.TasaOCuota,
                        BaseImpuesto: impuesto.Base || value.Subtotal,
                        Monto: impuesto.Importe,
                        Tipo: impuesto.TipoFactor
                    })),
                }
                setConceptoSeleccionado(concepto);
            }
            else {
                setValue("Descripcion", '')
            }

            setSelectedConcepto(null);
        }
    }
    const formatImpuestoClave = (value) => {
        // Verifica si el valor es un número o se puede convertir a número
        if (!isNaN(value)) {
            // Convierte a string y rellena con ceros al inicio hasta que tenga al menos 3 caracteres
            return value.toString().padStart(3, '0');
        }
        return value; // Si no es un número, devuelve el valor tal cual
    };

    const formatCurrency = (value) => {
        if (!value) return '$';

        // Convertir a string y limpiar (por si acaso)
        const numStr = value.toString().replace(/[^0-9.]/g, '');

        // Separar parte entera y decimal
        const parts = numStr.split('.');
        let integerPart = parts[0];
        const decimalPart = parts.length > 1 ? `.${parts[1]}` : '';

        // Formatear parte entera con separadores de miles
        integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        return `$${integerPart}${decimalPart}`;
    };

    const format2Currency = (value) => {
        if (value === undefined || value === null || value === "") return "$0.00";

        // Limpiar caracteres no numéricos
        const numStr = value.toString().replace(/[^0-9.]/g, '');

        // Separar parte entera y decimal
        const [integerPart, decimalPart = "00"] = numStr.split('.');

        // Formatear parte entera con separadores de miles
        const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

        // Asegurar 2 decimales (rellena con 0 si es necesario)
        const formattedDecimal = decimalPart.padEnd(2, '0').slice(0, 2);

        return `$${formattedInteger}.${formattedDecimal}`;
    };

    return (

        // <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
        // <Box bgcolor="white" p={4}>
        <Box
            bgcolor="white"
            p={4}
            my={modalAgregarConcepto ? 0 : 6}
            mx={modalAgregarConcepto ? 0 : 4}
            boxShadow={modalAgregarConcepto ? 0 : 3}
            borderRadius={modalAgregarConcepto ? 0 : 2}
            sx={{ padding: '1rem', margin: 'auto', marginTop: '1rem' }}
        >
            <Typography variant="h6" mb={4}>
                Conceptos {isNotaCredito && "(Nota de Crédito)"}
                {isNotaCredito && (
                    <Alert severity="info" sx={{ mt: 1 }}>
                        Asegúrate de que los importes para las notas de crédito sean correctos.
                    </Alert>
                )}
            </Typography>
            {modalAgregarConcepto === true ?
                <Box display="grid" gridTemplateColumns="10fr">
                    <TextField
                        sx={{ marginBottom: 2 }}
                        label='Nombre del Concepto'
                        {...register("Nombre")}
                        fullWidth
                        error={nombreError}
                        helperText={nombreError && "Campo obligatorio."}

                    />
                    <TextField

                        label="Descripcion"
                        {...register("Descripcion")}
                        multiline
                        rows={4} // Ajusta el número de líneas visibles
                        fullWidth
                        error={descripcionError}
                        helperText={descripcionError && "Campo obligatorio."}
                    />
                    <Typography variant="caption" color="textSecondary" align="right">
                        {`${getValues("Descripcion").length}/1000`}
                    </Typography>
                </Box>

                :
                <Box display="grid" gridTemplateColumns="10fr" >
                    <Autocomplete
                        freeSolo
                        // options={[{ ID: "Nuevo", Nombre: "Nuevo Concepto" }, ...conceptoOptions]}
                        options={conceptoOptions}
                        getOptionLabel={(option) => `${option.Nombre} - ${option.Descripcion}`}
                        value={selectedConcepto || null}
                        inputValue={getValues("Descripcion") || ''}
                        // value={getValues("Descripcion")|| ''}
                        isOptionEqualToValue={(option, value) => option.ID === value.ID}
                        onInputChange={(event, newInputValue) => setQueryConcepto(newInputValue)}

                        onChange={handleConcepto}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Descripcion"
                                {...register("Descripcion")}
                                // value={getValues("Descripcion")}
                                multiline
                                rows={4} // Ajusta el número de líneas visibles
                                fullWidth
                                error={descripcionError}
                                helperText={descripcionError && "Campo obligatorio."}
                            />
                        )}
                    />
                    <Typography variant="caption" color="textSecondary" align="right">
                        {`${getValues("Descripcion").length}/1000`}
                    </Typography>

                </Box>
            }

            <Box display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1.5fr 1.5fr 1fr 1fr 1fr 1fr  '
                }}
                gap={3}
                mt={4}>

                <Autocomplete
                    options={claveProdServOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`}
                    value={selectedClaveProdServ}
                    isOptionEqualToValue={(option, value) => option.Clave === value.Clave}
                    onInputChange={(event, newInputValue) => setQueryProdServ(newInputValue)}
                    onChange={(event, value) => {
                        setSelectedClaveProdServ(value);
                        setValue('ClaveProdServ', value?.Clave || '');
                        setClaveProdServError(false);
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Clave ProdServ"
                            fullWidth
                            error={claveProdServError}
                            helperText={claveProdServError && "Campo obligatorio."}
                        />
                    )}
                />
                <Autocomplete
                    options={claveUnidadOptions}
                    getOptionLabel={(option) => `${option.Clave} - ${option.Descripcion}`}
                    value={selectedClaveUnidad}
                    isOptionEqualToValue={(option, value) => option.Clave === value.Clave}
                    onInputChange={(event, newInputValue) => setQueryUnidad(newInputValue)}
                    onChange={(event, value) => {
                        setSelectedClaveUnidad(value);
                        setValue('ClaveUnidad', value?.Clave || '');
                        setClaveUnidadError(false);
                        setValue('Unidad', value?.Descripcion || '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Clave Unidad"
                            fullWidth
                            error={claveUnidadError}
                            helperText={claveUnidadError && "Campo obligatorio."}
                        />
                    )}
                />
                <TextField
                    label="Cantidad"
                    type="number"
                    value={getValues("Cantidad")}
                    onChange={(e) => {
                        setValue('Cantidad', e.target.value);
                        setCantidadError(false);
                    }}
                    error={cantidadError}
                    helperText={cantidadError && "Campo obligatorio."}
                    fullWidth
                    inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }} // Acepta solo números
                    onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '');
                    }} // Elimina caracteres no numéricos
                />
                <TextField
                    label={isNotaCredito ? "Monto de la nota de crédito" : "Precio unitario"}
                    type="text" // Mantenemos como 'text' para manejar el formato
                    value={formatCurrency(getValues("ValorUnitario"))}
                    onChange={(e) => {
                        // Eliminar el símbolo $ y cualquier formato existente
                        const rawValue = e.target.value.replace(/[^0-9.]/g, '');

                        // Validaciones como antes
                        let inputValue = rawValue;

                        // Asegurar que solo haya un punto decimal
                        if ((inputValue.match(/\./g) || []).length > 1) {
                            inputValue = inputValue.replace(/\.+$/, '');
                        }

                        // Limitar decimales
                        const decimalIndex = inputValue.indexOf('.');
                        if (decimalIndex !== -1 && inputValue.length - decimalIndex - 1 > 4) {
                            inputValue = inputValue.substring(0, decimalIndex + 5);
                        }

                        // Guardar el valor numérico (sin formato)
                        setValue('ValorUnitario', inputValue);
                        setValorUnitarioError(false);
                    }}
                    error={valorUnitarioError}
                    helperText={valorUnitarioError && "Campo obligatorio."}
                    fullWidth
                    inputProps={{
                        inputMode: 'decimal',
                    }}
                />
                <TextField
                    label="Descuento"
                    type="text"
                    value={formatCurrency(getValues("Descuento"))}
                    onChange={(e) => {
                        if (!isNotaCredito) {
                            let inputValue = e.target.value.replace(/[^0-9.]/g, '');
                            const decimalIndex = inputValue.indexOf('.');
                            if (decimalIndex !== -1 && inputValue.length - decimalIndex - 1 > 2) {
                                inputValue = inputValue.substring(0, decimalIndex + 3);
                            }
                            setValue('Descuento', inputValue === "" ? "" : inputValue);
                        }
                    }}
                    error={descuentoError}
                    helperText={descuentoError && descuentoErrorMesage}
                    fullWidth
                    inputProps={{
                        inputMode: 'decimal',
                        readOnly: isNotaCredito // Deshabilita el campo para notas de crédito
                    }}
                    disabled={isNotaCredito} // Deshabilita visualmente el campo
                />

                <TextField
                    label="Subtotal"
                    type="text"
                    value={format2Currency(getValues("Subtotal"))}
                    fullWidth
                    InputProps={{ readOnly: true }}
                    disabled
                />

            </Box>
            <Box>
                <Typography variant="h6" mt={4} mb={2}>Impuestos</Typography>
                <Select
                    register={register}
                    clave='Clave'
                    nombre='ObjetoImpuesto'
                    label='Objeto Impuesto'
                    descripcion='Descripcion'
                    url={`${apiUrl}/api/catalogos/Catalogos/ObjetoImpuestos`}
                    value={getValues("ObjetoImpuesto") || "02"}
                    onChange={handleObjetoImpuestoChange}
                    sx={{ width: 'auto', minWidth: '23%' }}
                />
            </Box>
            {objetoImpuesto !== "01" && (
                <Box display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={3} mt={4}>

                    {fields.map((field, index) => (
                        <Box key={field.id} gridColumn="span 6">
                            <Impuesto
                                watch={watch}
                                register={register}
                                setValue={setValue}
                                getValues={getValues}
                                index={index}
                                baseImpuesto={watch('Subtotal') || 0}
                                remove={remove}
                                fieldsLength={fields.length}
                                objetoImpuestoError={objetoImpuestoError}
                                impuestoError={impuestoError}
                                setObjetoImpuestoError={setObjetoImpuestoError}
                                setImpuestoError={setImpuestoError}
                                isNotaCredito={isNotaCredito}
                                impuestoEditor={getValues('impuestos')?.[index]}
                            />
                        </Box>
                    ))}


                    <Box gridColumn="7 / 8" display="flex" justifyContent="start" alignItems="start">
                        <Button
                            variant="contained"
                            sx={{
                                backgroundColor: 'rgba(29, 57, 77, 1)',
                                '&:hover': { backgroundColor: 'rgba(19, 47, 67, 1)' }
                            }}
                            onClick={() => append({ Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '' })}
                        >
                            <AddCircleIcon sx={{ fontSize: '30px' }} />
                        </Button>
                    </Box>
                </Box>
            )}

            <Box textAlign="end" mt={3}>
                <Button
                    startIcon={<AddCircleIcon />}
                    variant="contained"
                    sx={{ backgroundColor: '#1b384a', '&:hover': { backgroundColor: '#10232f' } }}
                    onClick={handleAgregarConcepto}
                >
                    {editIndex !== null ? "Guardar Cambios" : "Agregar Concepto"}
                </Button>
            </Box>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={3000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            >
                <Alert
                    onClose={() => setOpenSnackbar(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{
                        width: '100%',
                        fontSize: '1rem',
                    }}
                    style={{ padding: '12px' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Box>
    );
}
