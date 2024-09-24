"use client"
import React, { useState, useEffect } from 'react';
import { Box, TextField, Typography, Button, Autocomplete, Snackbar, Alert } from '@mui/material';
import Impuesto from "@/components/FormFactura/Impuesto/Impuesto.jsx";
import { useForm, useFieldArray } from 'react-hook-form';
import CrearConcepto from "./ModelConceptos.js";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import Select from '@/components/Select/Select.jsx';
import { BoxZoomHandler } from 'mapbox-gl';

export default function Conceptos({ setConceptos, conceptos, editIndex, setEditIndex }) {
    const [claveProdServOptions, setClaveProdServOptions] = useState([]);
    const [claveUnidadOptions, setClaveUnidadOptions] = useState([]);
    const [queryProdServ, setQueryProdServ] = useState('');
    const [queryUnidad, setQueryUnidad] = useState('');
    const [selectedClaveProdServ, setSelectedClaveProdServ] = useState(null);
    const [selectedClaveUnidad, setSelectedClaveUnidad] = useState(null);
    const [token, setToken] = useState(null);
    const [objetoImpuesto, setObjetoImpuesto] = useState("02");

    // Acceder a localStorage solo en el cliente
    useEffect(() => {
        if (typeof window !== 'undefined') {
            setToken(localStorage.getItem('authToken'));
        }
    }, []);

    // Resto del código para los estados de error y el manejo del formulario
    const [descripcionError, setDescripcionError] = useState(false);
    const [claveProdServError, setClaveProdServError] = useState(false);
    const [claveUnidadError, setClaveUnidadError] = useState(false);

    const [cantidadError, setCantidadError] = useState(false);
    const [valorUnitarioError, setValorUnitarioError] = useState(false);
    const [objetoImpuestoError, setObjetoImpuestoError] = useState(false);
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
            impuestos: [{  Impuesto: '', Tasa: '', BaseImpuesto: '', Monto: '', Tipo: '' }]
        },
    });

    const { fields, append, remove } = useFieldArray({
        control,
        name: 'impuestos',
    });

    const fetchOptions = async () => {
        if (!token) return;

        try {
            const prodServResponse = await fetch(`http://31.220.31.152:8081/Catalogos/ClaveProdServ?query=${queryProdServ}`, {
                method: 'GET',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const prodServData = await prodServResponse.json();
            setClaveProdServOptions(Array.isArray(prodServData) ? prodServData : []);

            const unidadResponse = await fetch(`http://31.220.31.152:8081/Catalogos/ClaveUnidad?query=${queryUnidad}`, {
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
        if (editIndex !== null && conceptos[editIndex]) {
            const concepto = conceptos[editIndex];
            console.log('Concepto seleccionado para editar:', concepto);

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
            concepto.Impuestos.forEach((impuesto, index) => {
                // setValue(`impuestos.${index}.ObjetoImpuesto`, impuesto.ObjetoImpuesto || '');
                setValue(`impuestos.${index}.Impuesto`, impuesto.Impuesto || '');
                setValue(`impuestos.${index}.Tasa`, impuesto.Tasa || 0);
                setValue(`impuestos.${index}.TasaOCuota`, impuesto.TasaOCuota || 0);
                setValue(`impuestos.${index}.BaseImpuesto`, impuesto.BaseImpuesto || 0);
                setValue(`impuestos.${index}.NombreImpuesto`, impuesto.NombreImpuesto || '');
                setValue(`impuestos.${index}.Tipo`, impuesto.Tipo || '');
                console.log("MONT", impuesto.Monto)
                setValue(`impuestos.${index}.Monto`, impuesto.Monto || 0);


                const token = localStorage.getItem('authToken');
                fetch(`http://31.220.31.152:8081/Catalogos/ImpuestoClave`, {
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
                    
                  const opcionSeleccionada = data.find(opt => opt.ID == impuesto.Impuesto );
                  if (opcionSeleccionada) {
                    // const data = JSON.parse(opcionSeleccionada)
                    // setValue(`impuestos[${index}].Nom`, opcionSeleccionada.Clave);
                    // console.log("opcionSeleccionada",opcionSeleccionada["Impuesto"]);  
                    setValue(`impuestos.${index}.TasaUrl`, `http://31.220.31.152:8081/Catalogos/TasaOCuota?impuesto=${opcionSeleccionada["Impuesto"]}&tipo=${opcionSeleccionada["Tipo"]}`)
                    // setValue(`impuestos.${index}.Tasa`,impuesto.TasaCatalogoID);
                    setValue(`impuestos.${index}.Tipo`, opcionSeleccionada["Tipo"]);
                    setValue(`impuestos.${index}.TasaOCuota`, impuesto.TasaOCuota || 0);
                }
                    
                  

                  // setValue(`impuestos[${index}].ImpuestoClave`, data[0].TasaOCuota || 0);
                })



                // setValue(`impuestos.${index}.TasaUrl`, `http://31.220.31.152:8081/Catalogos/TasaOCuota?impuesto=${impuesto.NombreImpuesto}&tipo=${impuesto.Tipo}`)

                console.log('Concepto editado:', getValues(`impuestos.${index}`));
                // console.log('Concepto editado:', getValues(`impuestos.${index}`);
            });
            setValue("impuestos", concepto.Impuestos)
            trigger('impuestos');

            
            
                  
                



            console.log('Concepto editado:', getValues(`impuestos`));

            // Fetch ClaveProdServ options if needed
            if (!claveProdServOptions.some(opt => opt.Clave === concepto.ClaveProdServ)) {
                console.log(`Consultando opciones de ClaveProdServ para: ${concepto.ClaveProdServ}`);
                fetch(`http://31.220.31.152:8081/Catalogos/ClaveProdServ?query=${concepto.ClaveProdServ}`, {
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
                fetch(`http://31.220.31.152:8081/Catalogos/ClaveUnidad?query=${concepto.ClaveUnidad}`, {
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

    }, [editIndex, conceptos, setValue, trigger]);



    const handleAgregarConcepto = () => {
        // Resetear errores antes de validar
        setDescripcionError(false);
        setClaveProdServError(false);
        setClaveUnidadError(false);
        setCantidadError(false);
        setValorUnitarioError(false);
        setObjetoImpuestoError(false);
        setImpuestoError(false);

        let hasError = false;

        // Validaciones para los campos de Conceptos
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
        if(objetoImpuesto!=="01"){
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

        // const objetoImpuesto = getValues("impuestos")[0]?.ObjetoImpuesto;
        // if (!objetoImpuesto || objetoImpuesto === "Default") {
        //     console.error("El campo ObjetoImpuesto es obligatorio y no puede estar vacío.");
        //     return;
        // }

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
                    Cantidad: '',
                    ValorUnitario: '',
                    Descuento: '',
                    ObjetoImpuesto: "02",
                    impuestos: [{ Impuesto: '', Tasa: '' }]
                });
            };
            resetForm()
            
            // setObjetoImpuesto("02");
            setSelectedClaveProdServ(null);
            setSelectedClaveUnidad(null);
        } else {
            console.log("Ocurrió un error en el concepto");
        }
    };

    const handleDeleteConcepto = (index) => {
        setConceptos(prevConceptos => prevConceptos.filter((_, i) => i !== index));
    };

    const handleObjetoImpuestoChange =(e)=>{
        const value = e.target.value;
        const data = JSON.parse(e.target.value);
        setObjetoImpuesto(data.Clave);
    };
    return (
        <Box bgcolor="white" my={6} mx={4} p={4} boxShadow={3} borderRadius={2}>
            <Typography variant="h6" mb={6}>Conceptos</Typography>
            <Box display="grid" gridTemplateColumns="8fr 1fr" gap={3}>
                <TextField
                    label="Descripción"
                    {...register("Descripcion")}
                    error={descripcionError}
                    helperText={descripcionError && "La descripción es obligatoria."}
                    fullWidth
                    multiline
                    rows={4}
                />
            </Box>
            <Box display="grid"
                gridTemplateColumns={{
                    xs: '1fr',
                    sm: '1fr 1fr',
                    md: '1fr 0.5fr 0.5fr',
                    lg: '1.5fr 2.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.5fr 0.2fr 0.2fr'
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
                />
                <TextField
                    label="Precio Unitario"
                    type="number"
                    value={getValues("ValorUnitario")}
                    onChange={(e) => {
                        setValue('ValorUnitario', e.target.value);
                        setValorUnitarioError(false);
                    }}
                    error={valorUnitarioError}
                    helperText={valorUnitarioError && "Campo obligatorio."}
                    fullWidth
                />
                <TextField
                    label="Descuento"
                    type="number"
                    value={getValues("Descuento")}
                    onChange={(e) => setValue('Descuento', e.target.value)}
                    fullWidth
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
                    url="http://31.220.31.152:8081/Catalogos/ObjetoImpuestos"
                    value={getValues("ObjetoImpuesto") || "02"}
                    onChange={handleObjetoImpuestoChange}
                    sx={{ width: 'auto' }}
                    
                />
            </Box>

            {objetoImpuesto!=="01"  &&(
                console.log("NO ES 01", objetoImpuesto),
              <Box display="grid" gridTemplateColumns="repeat(7, 1fr)" gap={3} mt={4}>
               
                {fields.map((field, index) => {
                    // const impuestoEditor = getValues(`impuestos.${index}`);
                    // console.log(`Impuesto enviado al componente Impuesto:`, impuestoEditor); // Debug log
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
                                impuestoEditor={getValues(`impuestos.${index}`)} // Pass the specific impuesto object
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
                    sx={{ backgroundColor: 'rgba(29, 57, 77, var(--tw-bg-opacity, 1))' }}
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
