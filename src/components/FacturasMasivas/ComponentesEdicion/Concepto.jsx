import React, { useState, useEffect } from 'react';
import { TextField, Box, Typography, Autocomplete } from '@mui/material';
import Select from "@/components/Select/Select.jsx";
import { useWatch } from 'react-hook-form'; // Importa useWatch

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function Concepto({
    datosConcepto,
    datosImpuesto,
    setValue,
    register,
    getValues,
    token,
    errors,
    trigger,
    control // Asegúrate de pasar "control" como prop
}) {
    const [claveProdServOptions, setClaveProdServOptions] = useState([]);
    const [claveUnidadOptions, setClaveUnidadOptions] = useState([]);
    const [queryProdServ, setQueryProdServ] = useState('');
    const [queryUnidad, setQueryUnidad] = useState('');
    const [selectedClaveProdServ, setSelectedClaveProdServ] = useState(null);
    const [selectedClaveUnidad, setSelectedClaveUnidad] = useState(null);
    const [tasaURL, setTasaURL] = useState('');
    const [objetoImpuesto, setObjetoImpuesto] = useState('02');

    // Usa useWatch para observar cambios en los campos
    const cantidad = useWatch({ control, name: "Cantidad" });
    const precioUnitario = useWatch({ control, name: "PrecioUnitario" });
    const descuento = useWatch({ control, name: "Descuento" });
    const tasaOCuota = useWatch({ control, name: "TasaOCuota" }); // Observa la tasa o cuota

    // Efecto para calcular el total y la base impuesto
    useEffect(() => {
        const cantidadNum = parseFloat(cantidad) || 0;
        const precioUnitarioNum = parseFloat(precioUnitario) || 0;
        const descuentoNum = parseFloat(descuento) || 0;

        // Calcula el total
        const total = cantidadNum * precioUnitarioNum - descuentoNum;
        setValue("Total", total);

        // La base impuesto es igual al total
        setValue("BaseImpuesto", total);
    }, [cantidad, precioUnitario, descuento, setValue]);

    // Efecto para calcular el monto (base impuesto * tasa o cuota)
    useEffect(() => {
        const baseImpuestoNum = parseFloat(getValues("BaseImpuesto")) || 0;
        const tasaOCuotaNum = parseFloat(tasaOCuota) || 0;

        // Calcula el monto
        const monto = baseImpuestoNum * tasaOCuotaNum;
        setValue("Monto", monto);
    }, [tasaOCuota, getValues("BaseImpuesto"), setValue]);

    // Efecto para rellenar los valores del formulario cuando se va a editar 
    useEffect(() => {
        if (datosConcepto) {
            console.log('Concepto', datosConcepto);
            // Establecer valores del concepto
            setValue("DescripcionConcepto", datosConcepto.Descripcion);
            setValue("ClaveProdServ", datosConcepto.ClaveProductoServicio);
            setValue("ClaveUnidad", datosConcepto.ClaveUnidad);
            setValue("Cantidad", datosConcepto.Cantidad);
            setValue("PrecioUnitario", datosConcepto.PrecioUnitario);
            setValue("Descuento", datosConcepto.Descuento);
            // Busca el valor de ClaveProdServ en las opciones
            if (!claveProdServOptions.some(opt => opt.Clave === datosConcepto.ClaveProductoServicio)) { // Si no hay opciones de ClaveProdServ
                console.log(`Consultando opciones de ClaveProdServ para: ${datosConcepto.ClaveProductoServicio}`);
                fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveProdServ?query=${datosConcepto.ClaveProductoServicio}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Opciones recibidas de ClaveProdServ:", data);
                        setClaveProdServOptions(prevOptions => [...prevOptions, ...data]); // Agrega las opciones al estado
                        // Busca la ClaveProdServ seleccionada en las opciones
                        const selectedProdServ = data.find(opt => opt.Clave == datosConcepto.ClaveProductoServicio);
                        console.log("ClaveProdServ seleccionada tras la consulta:", selectedProdServ);
                        setSelectedClaveProdServ(selectedProdServ || null); // Establece la opción seleccionada
                    })
                    .catch(error => console.error('Error al buscar ClaveProdServ:', error));
            } else { // Si ya hay opciones de ClaveProdServ
                console.log("Opciones ClaveProdServ ya disponibles:", claveProdServOptions);
                const selectedProdServ = claveProdServOptions.find(opt => opt.Clave == datosConcepto.ClaveProductoServicio); // Busca la opción seleccionada
                console.log("ClaveProdServ seleccionada:", selectedProdServ);
                setSelectedClaveProdServ(selectedProdServ || null); // Establece la opción seleccionada
            }
            // Busca el valor de ClaveUnidad en las opciones
            if (!claveUnidadOptions.some(opt => opt.Clave === datosConcepto.ClaveUnidad)) { // Si no hay opciones de ClaveUnidad
                console.log(`Consultando opciones de ClaveUnidad para: ${datosConcepto.ClaveUnidad}`); // Busca el valor de ClaveUnidad en las opciones
                fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveUnidad?query=${datosConcepto.ClaveUnidad}`, {
                    method: 'GET',
                    headers: { 'Authorization': `Bearer ${token}` },
                })
                    .then(response => response.json())
                    .then(data => {
                        console.log("Opciones recibidas de ClaveUnidad:", data);
                        setClaveUnidadOptions(prevOptions => [...prevOptions, ...data]); // Agrega las opciones al estado
                        const selectedUnidad = data.find(opt => opt.Clave == datosConcepto.ClaveUnidad); // Busca la ClaveUnidad seleccionada
                        console.log("ClaveUnidad seleccionada tras la consulta:", selectedUnidad);
                        setSelectedClaveUnidad(selectedUnidad || null); // Establece la opción seleccionada
                    })
                    .catch(error => console.error('Error al buscar ClaveUnidad:', error));
            } else { // Si ya hay opciones de ClaveUnidad
                console.log("Opciones ClaveUnidad ya disponibles:", claveUnidadOptions);
                const selectedUnidad = claveUnidadOptions.find(opt => opt.Clave == datosConcepto.ClaveUnidad); // Busca la opción seleccionada
                console.log("ClaveUnidad seleccionada:", selectedUnidad);
                setSelectedClaveUnidad(selectedUnidad || null); // Establece la opción seleccionada
            }
        }
    }, [datosConcepto]);
    // Efecto para actualizar los valores del formulario cuando cambia datosImpuesto
    useEffect(() => {
        if (datosImpuesto) {
            console.log('Impuesto', datosImpuesto);

            // Asigna los valores del formulario
            setValue("ObjetoImpuesto", datosImpuesto.ObjetoImpuesto);
            setObjetoImpuesto(datosImpuesto.ObjetoImpuesto); // Establece el objeto de impuesto
            setValue("ObjetoImpuestoID", datosImpuesto.ObjetoImpuestoID);
            setValue("ImpuestoClaveID", datosImpuesto.ImpuestoClaveID);
            setValue("ClaveImpuesto", datosImpuesto.ClaveImpuesto);

            setTasaURL(`${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${datosImpuesto.ClaveImpuesto}&tipo=${datosImpuesto.Tipo}`) // Establece la URL de consulta de TasaOCuota
            console.log("Tasa URL", tasaURL);

            setValue("TasaOCuota", datosImpuesto.TasaOCuota);
            setValue("TasaOCuotaID", datosImpuesto.TasaOCuotaID);
            trigger("TasaOCuotaID");
            setValue("BaseImpuesto", datosImpuesto.BaseImpuesto);
            setValue("Monto", datosImpuesto.Monto);
            setValue("Tipo", datosImpuesto.Tipo);

            fetch(`${apiUrl}/api/catalogos/Catalogos/ImpuestoClave`, { // Consulta las opciones de ImpuestoClave
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(data => {
                    console.log("Opciones recibidas de ImpuestoClave:", data);
                    const opcionSeleccionada = data.find(opt => opt.ID == datosImpuesto.ImpuestoClaveID); // Busca la opción seleccionada
                    if (opcionSeleccionada) {
                        setTasaURL(`${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${opcionSeleccionada["Impuesto"]}&tipo=${opcionSeleccionada["Tipo"]}`) // Establece la URL de consulta de TasaOCuota
                    }
                })
        }
    }, [datosImpuesto]);

    // Función para buscar las opciones de ClaveProdServ y ClaveUnidad
    const fetchOptions = async () => {
        if (!token) return;

        try {
            // Consulta las opciones de ClaveProdServ 
            const prodServResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveProdServ?query=${queryProdServ}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const prodServData = await prodServResponse.json(); // Obtiene los datos de la respuesta
            setClaveProdServOptions(Array.isArray(prodServData) ? prodServData : []); // Establece las opciones de ClaveProdServ

            // Consulta las opciones de ClaveUnidad
            const unidadResponse = await fetch(`${apiUrl}/api/catalogos/Catalogos/ClaveUnidad?query=${queryUnidad}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const unidadData = await unidadResponse.json(); // Obtiene los datos de la respuesta
            setClaveUnidadOptions(Array.isArray(unidadData) ? unidadData : []); // Establece las opciones de ClaveUnidad
        } catch (error) {
            console.error('Error al buscar ClaveProdServ o ClaveUnidad:', error);
        }
    };

    // Efecto para asignar la unidad de la clave seleccionada
    useEffect(() => {
        if (selectedClaveUnidad) {
            console.log("Seleccion", selectedClaveUnidad.Descripcion);
            setValue("Unidad", selectedClaveUnidad.Descripcion);
        }
    }, [selectedClaveUnidad, setValue])

    // Efecto para buscar las opciones cuando se carga la página o cuando cambia el query
    useEffect(() => {
        console.log("Entre a la funcion");
        fetchOptions(); // Busca las opciones
    }, [queryProdServ, queryUnidad, token]);

    // Función para manejar el cambio de ClaveProdServ seleccionada
    const handleImpuestoClaveIDChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            console.log("ImpuestoClaveID", data);
            // Asigna los valores 
            setValue("ClaveImpuesto", data.Clave);
            setValue("Tipo", data.Tipo);
            setTasaURL(`${apiUrl}/api/catalogos/Catalogos/TasaOCuota?impuesto=${data.Impuesto}&tipo=${data.Tipo}`); // Establece el URL para consultar la tasa
        } catch (error) {
            console.error(error);
        }
    }

    // Función para manejar el cambio de ObjetoImpuesto seleccionado
    const handleObjetoImpuestoChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            // Asigna los valores
            console.log("ObjetoImpuesto", data);
            setValue("ObjetoImpuestoID", data.ID);
            setObjetoImpuesto(data.Clave); // Establece el objeto de impuesto
        } catch (error) {
            console.log("Error", error);
        }
    }

    // Función para manejar el cambio de TasaOCuotaID seleccionada
    const handleTasaOCuotaIDChange = (e) => {
        try {
            const data = JSON.parse(e.target.value);
            console.log("TasaOCuotaID", data);
            setValue("TasaOCuota", data.Valor);
        } catch (error) {
            console.log("Error", error);

        }
    }


    return (
        <Box>
            <Typography variant="h6">Concepto</Typography>
            <Box
                display="grid"
                gap={3}
                sx={{
                    gridTemplateColumns: {
                        xs: '1fr',
                        sm: 'repeat(2, 1fr)',
                        md: '1fr ',
                        lg: '1fr '
                    }
                }}>
                <TextField
                    label="Descripcion"
                    {...register("DescripcionConcepto", {
                        required: "La descripción es obligatoria"
                    })}
                    multiline
                    rows={4}
                    fullWidth
                />
            </Box>
            <Box
                display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1.5fr 2.5fr 0.5fr 0.5fr 0.5fr 0.5fr'
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
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Clave ProdServ"
                            fullWidth
                            error={!!errors.ClaveProdServ}
                            helperText={errors.ClaveProdServ ? "Este campo es obligatorio" : ""}
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
                        setValue('Unidad', value?.Descripcion || '');
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Clave Unidad"
                            fullWidth
                            error={!!errors.claveUnidad}
                            helperText={errors.claveUnidadError ? "Este campo es obligatorio" : ""}
                        />
                    )}
                />
                <TextField
                    label="Cantidad"
                    {...register("Cantidad", {
                        required: "La cantidad es obligatoria"
                    })}
                    type="number"
                    fullWidth
                    InputProps={{
                        min: 1,
                        max: 1000,
                        step: 1,
                    }}
                    error={!!errors.Cantidad}
                    helperText={errors.Cantidad ? "Este campo es obligatorio" : ""}
                />
                <TextField
                    label="Precio Unitario"
                    type="number"
                    {...register("PrecioUnitario", {
                        required: "El precio unitario es obligatorio"
                    })}
                    fullWidth
                    InputProps={{
                        min: 0,
                        step: 0.01,
                    }}
                    error={!!errors.PrecioUnitario}
                    helperText={errors.PrecioUnitario ? "Este campo es obligatorio" : ""}
                />
                <TextField
                    label="Descuento"
                    type="number"
                    {...register("Descuento", {
                        required: "El descuento es obligatorio"
                    })}
                    fullWidth
                    InputProps={{
                        min: 0,
                        max: 100,
                        step: 0.01,
                    }}
                    error={!!errors.Descuento}
                    helperText={errors.Descuento ? "Este campo es obligatorio" : ""}
                />
                <TextField
                    label="Total"
                    type="number"
                    {...register("Total")}
                    value={getValues("Total")}
                    fullWidth
                    InputProps={{
                        readOnly: true
                    }}
                    error={!!errors.Total}
                    helperText={errors.Total ? "Este campo es obligatorio" : ""}
                />
            </Box>
            <Box>
                <Typography variant="h6" mb={2}>Impuestos</Typography>
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
                <Box display="grid"
                    gridTemplateColumns={{
                        xs: '1fr',
                        sm: '1fr 1fr',
                        md: '1fr 0.5fr 0.5fr',
                        lg: '1fr 0.5fr 0.5fr 0.5fr 0.5fr'
                    }}
                    gap={3}
                    mt={4}>
                    <Select
                        register={register}
                        clave='Clave'
                        id='ID'
                        descripcion='Descripcion'
                        nombre='ImpuestoClaveID'
                        label='Impuesto'
                        url={`${apiUrl}/api/catalogos/Catalogos/ImpuestoClave`}
                        value={getValues("ImpuestoClaveID") || ""}
                        onChange={handleImpuestoClaveIDChange}
                        error={!!errors.ImpuestoClaveID}
                        helperText={errors.ImpuestoClaveID ? "Este campo es obligatorio" : ""}
                    />
                    <Select
                        register={register}
                        clave=""
                        id="ID"
                        nombre="TasaOCuotaID"
                        label='Tasa o Cuota'
                        descripcion="Valor"
                        url={tasaURL}
                        onChange={handleTasaOCuotaIDChange}
                        value={getValues("TasaOCuotaID") || ""}
                        sx={{ minWidth: 120 }}
                        error={!!errors.TasaOCuotaID}
                        helperText={errors.TasaOCuotaID ? "Este campo es obligatorio" : ""}
                    />
                    <TextField
                        label="Base Impuesto"
                        type="number"
                        {...register(`BaseImpuesto`, {
                            required: "La base impuesto es obligatoria"
                        })}
                        value={getValues("BaseImpuesto")}
                        fullWidth
                        InputProps={{
                            readOnly: true
                        }}
                        error={!!errors.BaseImpuesto}
                        helperText={errors.BaseImpuesto ? "Este campo es obligatorio" : ""}
                    />
                    <TextField
                        label="Monto"
                        type="number"
                        {...register(`Monto`, {
                            required: "El monto es obligatorio"
                        })}
                        value={getValues("Monto")}
                        fullWidth
                        InputProps={{
                            readOnly: true
                        }}
                        error={!!errors.Monto}
                        helperText={errors.Monto ? "Este campo es obligatorio" : ""}
                        inputProps={{ step: "any" }}
                    />
                </Box>
            )}
        </Box>
    );
}