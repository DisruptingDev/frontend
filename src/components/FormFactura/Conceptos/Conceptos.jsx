"use client"
import React, { useState, useEffect, useCallback } from 'react';
import { Box, TextField, Typography, Button, Autocomplete, Snackbar, Alert } from '@mui/material';
import Impuesto from "@/components/FormFactura/Impuesto/Impuesto.jsx";
import { useForm, useFieldArray, get } from 'react-hook-form';
import CrearConcepto from "./ModelConceptos.js";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from '@/components/Select/Select.jsx';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Conceptos({ setConceptos, conceptos, editIndex, setEditIndex, token, modalAgregarConcepto, onClose }) {
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

    const { fields, append, remove } = useFieldArray({
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
            console.log("CONCEPTOS", data);
            setConceptoOptions(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Error al buscar Conceptos:', error);
        }

    }, [queryConcepto, token]);

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
            console.log("Seleccion", selectedClaveUnidad.Descripcion);

            setValue("Unidad", selectedClaveUnidad.Descripcion);

        }

    }, [selectedClaveUnidad, setValue])

    useEffect(() => {
        console.log("Entre a la funcion");
        fetchOptions();
    }, [queryProdServ, queryUnidad, token]);

    useEffect(() => {
        const calcularSubtotal = () => {
            const cantidad = getValues('Cantidad');
            const precioUnitario = getValues('ValorUnitario');
            const descuento = getValues('Descuento');
            const subtotal = (cantidad * precioUnitario) - descuento;
            setValue("Subtotal", subtotal);
            return subtotal;
        };

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
                console.log("CONCEPTO SELECCIONADO", conceptoSeleccionado);
                concepto = conceptoSeleccionado;
            } else {

                concepto = conceptos[editIndex];
                console.log('Concepto seleccionado para editar:', concepto);
            }

            // Establecer valores del concepto
            setValue("Descripcion", concepto.Descripcion || '');
            setValue("ClaveProdServ", concepto.ClaveProdServ || '');
            setValue("ClaveUnidad", concepto.ClaveUnidad || '');
            setValue("Unidad", concepto.Unidad || '');
            setValue("Cantidad", concepto.Cantidad || 1);
            setValue("ValorUnitario", concepto.ValorUnitario || 0);
            setValue("Descuento", concepto.Descuento || 0);
            setValue("Subtotal", concepto.Subtotal || 0);
            setValue("ObjetoImpuesto", concepto.ObjetoImpuesto || "02");
            setObjetoImpuesto(concepto.ObjetoImpuesto || "02");
            console.log('Impuestos:', getValues(`impuestos`));
            console.log("IMPUESTOS ACT", concepto.Impuestos);

            console.log('Concepto editado:', getValues(`impuestos`));
            console.log('Impuestos editado:', concepto.Impuestos);
            concepto.Impuestos.forEach((impuesto, index) => {
                // setValue(`impuestos.${index}.ObjetoImpuesto`, impuesto.ObjetoImpuesto || '');
                setValue(`impuestos.${index}.Impuesto`, impuesto.Impuesto || '');
                setValue(`impuestos.${index}.ImpuestoClave`, impuesto.ImpuestoClave || '');
                setValue(`impuestos.${index}.Tasa`, impuesto.Tasa || 0);
                setValue(`impuestos.${index}.TasaOCuota`, impuesto.TasaOCuota || 0);
                setValue(`impuestos.${index}.BaseImpuesto`, impuesto.BaseImpuesto || 0);
                setValue(`impuestos.${index}.NombreImpuesto`, impuesto.NombreImpuesto || '');
                setValue(`impuestos.${index}.Tipo`, impuesto.Tipo || '');
                console.log("MONT", impuesto.Monto)
                setValue(`impuestos.${index}.Monto`, impuesto.Monto || 0);
                // const token = localStorage.getItem('authToken');
                fetch(`${apiUrl}/api/catalogos/Catalogos/ImpuestoClave`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log(data);
                        // console.log("TIPO", impuestoEditor.TipoFactor);

                        const opcionSeleccionada = data.find(opt => opt.ID == impuesto.Impuesto);
                        if (opcionSeleccionada) {
                            // const data = JSON.parse(opcionSeleccionada)
                            // setValue(`impuestos[${index}].Nom`, opcionSeleccionada.Clave);
                            // console.log("opcionSeleccionada",opcionSeleccionada["Impuesto"]);  
                            setValue(`impuestos.${index}.TasaUrl`, `${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${opcionSeleccionada["Impuesto"]}&tipo=${opcionSeleccionada["Tipo"]}`)
                            // setValue(`impuestos.${index}.Tasa`,impuesto.TasaCatalogoID);
                            // setValue(`impuestos.${index}.Tasa`, opcionSeleccionada["ID"]);
                            setValue(`impuestos.${index}.Tipo`, opcionSeleccionada["Tipo"]);
                            setValue(`impuestos.${index}.TasaOCuota`, impuesto.TasaOCuota || 0);
                        }
                        // setValue(`impuestos[${index}].ImpuestoClave`, data[0].TasaOCuota || 0);
                    })
                // setValue(`impuestos.${index}.TasaUrl`, `${apiUrl}/Catalogos/TasaOCuota?impuesto=${impuesto.NombreImpuesto}&tipo=${impuesto.Tipo}`)

                console.log('Concepto editado:', getValues(`impuestos.${index}`));
                // console.log('Concepto editado:', getValues(`impuestos.${index}`);
            });
            // setValue("impuestos", concepto.Impuestos)
            // trigger('impuestos');
            console.log('Concepto editado:', getValues(`impuestos`));

            if (!conceptoOptions.some(opt => opt.ID === concepto.ID)) {
                console.log(`Consultando opciones de Conceptos para: ${concepto.ID}`);
                fetch(`${apiUrl}/api/catalogos/Catalogos/Conceptos?descripcion=${concepto.Descripcion}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Opciones recibidas de Conceptos:", data);
                        setConceptoOptions(prevOptions => [...prevOptions, ...data]);
                        const selectedConcepto = data.find(opt => opt.ID == concepto.ID);
                        if (selectedConcepto) {
                            console.log("Concepto seleccionado tras la consulta:", selectedConcepto);
                            setSelectedConcepto(selectedConcepto || null);
                        }
                        else {
                            handleAddNewOption(concepto.Descripcion);
                        }
                    })
                    .catch(error => console.error('Error al buscar Conceptos:', error));
            } else {
                console.log("Opciones Conceptos ya disponibles:", conceptoOptions);
                const selectedConcepto = conceptoOptions.find(opt => opt.ID == concepto.ID);
                console.log("Concepto seleccionado:", selectedConcepto);
                setSelectedConcepto(selectedConcepto || null);
            }
            // Fetch ClaveProdServ options if needed
            if (!claveProdServOptions.some(opt => opt.Clave === concepto.ClaveProdServ)) {
                console.log(`Consultando opciones de ClaveProdServ para: ${concepto.ClaveProdServ}`);
                fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveProdServ?query=${concepto.ClaveProdServ}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Opciones recibidas de ClaveProdServ:", data);
                        setClaveProdServOptions(prevOptions => [...prevOptions, ...data]);
                        const selectedProdServ = data.find(opt => opt.Clave == concepto.ClaveProdServ);
                        console.log("ClaveProdServ seleccionada tras la consulta:", selectedProdServ);
                        setSelectedClaveProdServ(selectedProdServ || null);
                    })
                    .catch(error => console.error('Error al buscar ClaveProdServ:', error));
            } else {
                console.log("Opciones ClaveProdServ ya disponibles:", claveProdServOptions);
                const selectedProdServ = claveProdServOptions.find(opt => opt.Clave == concepto.ClaveProdServ);
                console.log("ClaveProdServ seleccionada:", selectedProdServ);
                setSelectedClaveProdServ(selectedProdServ || null);
            }
            // Fetch ClaveUnidad options if needed
            if (!claveUnidadOptions.some(opt => opt.Clave === concepto.ClaveUnidad)) {
                console.log(`Consultando opciones de ClaveUnidad para: ${concepto.ClaveUnidad}`);
                fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveUnidad?query=${concepto.ClaveUnidad}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Opciones recibidas de ClaveUnidad:", data);
                        setClaveUnidadOptions(prevOptions => [...prevOptions, ...data]);
                        const selectedUnidad = data.find(opt => opt.Clave == concepto.ClaveUnidad);
                        console.log("ClaveUnidad seleccionada tras la consulta:", selectedUnidad);
                        setSelectedClaveUnidad(selectedUnidad || null);
                    })
                    .catch(error => console.error('Error al buscar ClaveUnidad:', error));
            } else {
                console.log("Opciones ClaveUnidad ya disponibles:", claveUnidadOptions);
                const selectedUnidad = claveUnidadOptions.find(opt => opt.Clave == concepto.ClaveUnidad);
                console.log("ClaveUnidad seleccionada:", selectedUnidad);
                setSelectedClaveUnidad(selectedUnidad || null);
            }

        }
    }, [editIndex, conceptos, conceptoSeleccionado, setValue, trigger]);

    const handleAgregarConcepto = () => {
        // Resetear errores antes de validar
        setConceptoSeleccionado(null);
        // setValue("Descripcion",'');

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

        if(modalAgregarConcepto && !getValues('Nombre')){
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
        if (!getValues('Cantidad') || getValues('Cantidad') <= 0) {
            setCantidadError(true);
            hasError = true;
        }
        if (!getValues('ValorUnitario') || getValues('ValorUnitario') < 0) {
            setValorUnitarioError(true);
            hasError = true;
        }
        if (!getValues('Descuento') || getValues('Descuento') > ((getValues('Cantidad') * getValues('ValorUnitario')) / 2)) {
            if (!getValues('Descuento')) {
                setDescuentoErrorMesage('Campo obligatorio.');
            }
            else {
                setDescuentoErrorMesage('El descuento no puede ser mayor al 50% del total.');
            }
            setDescuentoError(true);
            hasError = true;
        }
        if (getValues('Descuento') === 0) {
            setDescuentoError(false);
            hasError = false;
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
            // setSnackbarMessage('Por favor, complete todos los campos obligatorios.');
            // setSnackbarSeverity('warning');
            // setOpenSnackbar(true);
            return;
        }

        console.log('ImpuestosENVIANDOS', getValues("impuestos"));
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
            //reset();
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
            // setObjetoImpuesto("02");
            setSelectedClaveProdServ(null);
            setSelectedClaveUnidad(null);
            setSelectedConcepto(null);
            setQueryConcepto('');
            handleAddNewOption('');
            // setValue("Descripcion", '');
            console.log("Conepto Seleccionad0", selectedConcepto);
            console.log("Conepto Seleccionad", conceptoSeleccionado);
            console.log("ClaveProdServ", selectedClaveProdServ);
            console.log("ClaveUnidad", selectedClaveUnidad);
            if (modalAgregarConcepto) {
                onClose();
            }

        } else {
            console.log("Ocurrió un error en el concepto");
        }
    };

    const handleObjetoImpuestoChange = (e) => {
        const value = e.target.value;
        const data = JSON.parse(e.target.value);
        setObjetoImpuesto(data.Clave);
    };

    const handleConcepto = (event, value) => {
        // const value =  JSON.parse(e.target.value);
        console.log("VALUE", value);
        if (typeof value === 'string') {
            console.log("VALUE STRING", value);
            handleAddNewOption(value);
            setValue('Descripcion', value);
        } else {// console.log("VALUE", value.ID);
            if (value) {
                console.log("VALUE", value);

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
                        ImpuestoClave:  formatImpuestoClave(impuesto.ImpuestoClave),
                        Tasa: impuesto.TasaCatalogoID,
                        TasaOCuota: impuesto.TasaOCuota,
                        BaseImpuesto: impuesto.Base || value.Subtotal,
                        Monto: impuesto.Importe,
                        Tipo: impuesto.TipoFactor
                    })),
                }
                console.log("CONCEPTO", concepto);
                setConceptoSeleccionado(concepto);
            }
            else{
                setValue("Descripcion",'')
            }

            setSelectedConcepto(null);
        }
    }
    const formatImpuestoClave = (value) => {
        console.log("VALUE rellenar", value);
        // Verifica si el valor es un número o se puede convertir a número
        if (!isNaN(value)) {
            console.log("VALUE rellenar2", value);
            // Convierte a string y rellena con ceros al inicio hasta que tenga al menos 3 caracteres
            return value.toString().padStart(3, '0');
        }
        return value; // Si no es un número, devuelve el valor tal cual
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
            sx={{   padding: '1rem', margin:'auto', marginTop:'1rem'}}
        >
            <Typography variant="h6" mb={4}>Conceptos</Typography>
            {modalAgregarConcepto === true ?
                <Box display="grid" gridTemplateColumns="8fr">
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
                <Box display="grid" gridTemplateColumns="8fr" >
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
                    lg: '1.5fr 2.5fr 0.5fr 0.5fr 0.5fr 0.5fr  '
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
                    label="Precio Unitario"
                    type="number"
                    value={getValues("ValorUnitario")}
                    onChange={(e) => {
                        // Captura el valor introducido
                        let inputValue = e.target.value;

                        // Permitir solo números y un solo punto decimal
                        inputValue = inputValue.replace(/[^0-9.]/g, '');

                        // Asegurar que solo haya un punto decimal
                        if ((inputValue.match(/\./g) || []).length > 1) {
                            inputValue = inputValue.replace(/\.+$/, '');
                        }

                        // Establecer el valor solo si es válido
                        setValue('ValorUnitario', inputValue);
                        setValorUnitarioError(false);
                    }}
                    error={valorUnitarioError}
                    helperText={valorUnitarioError && "Campo obligatorio."}
                    fullWidth
                    inputProps={{
                        inputMode: 'decimal', // Permitir el punto decimal en teclados móviles
                        pattern: '[0-9]*[.]?[0-9]*' // Permitir números decimales
                    }}
                />
                <TextField
                    label="Descuento"
                    type="number"
                    value={getValues("Descuento")}
                    onChange={(e) => {
                        // Captura el valor introducido
                        let inputValue = e.target.value;
                        // Permitir solo números y un solo punto decimal
                        inputValue = inputValue.replace(/[^0-9.]/g, '');
                        // Asegurar que solo haya un punto decimal
                        if ((inputValue.match(/\./g) || []).length > 1) {
                            inputValue = inputValue.replace(/\.+$/, '');
                        }
                        // Establecer el valor solo si es válido
                        setValue('Descuento', inputValue);
                    }}
                    error={descuentoError}
                    helperText={descuentoError && descuentoErrorMesage}
                    fullWidth
                    inputProps={{
                        inputMode: 'decimal', // Permitir el punto decimal en teclados móviles
                        pattern: '[0-9]*[.]?[0-9]*' // Permitir números decimales
                    }}
                />

                <TextField
                    label="Subtotal"
                    type="number"
                    value={getValues("Subtotal")}
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
                // console.log("NO ES 01", objetoImpuesto),
                <Box display="grid" gridTemplateColumns="repeat(6, 1fr)" gap={3} mt={4}>

                    {(fields.length > 0 ? fields : [{}]).map((field, index) => {

                        return (
                            <Box key={field.id || index} gridColumn="span 6">
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
                                // impuestoEditor={getValues(`impuestos.${index}`)} // Pass the specific impuesto object
                                />
                            </Box>
                        );
                    })}

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
            {/* <pre>{JSON.stringify(getValues(), null, 2)}</pre>
            <pre>{'Concepto: ' + JSON.stringify(selectedConcepto, null, 2)}</pre> */}
        </Box>
    );
}
