"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header/Header.jsx";
import { isAuthenticated } from "@/utils/authRedirect";
import { Box, Button, Grid } from "@mui/material";
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ModalXMLMultiple from "@/components/ImportarXML/ModalXMLMultiple";
import ResumenImportacion from "@/components/ImportarXML/ResumenImportacion";
import VistaXMLMultiple from "@/components/ImportarXML/VistaXMLMultiple"; // Nuevo componente
import ModalError from "@/components/Home/Modales/modalError";
import ModalExito from "@/components/Home/Modales/modalExito";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import { formatearFacturaXML, formatearFacturaXMLSimple } from "@/components/ImportarXML/FormatearXML.js";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

export default function ImportarFacturas() {
    const router = useRouter();
    const [openModalMultiple, setOpenModalMultiple] = useState(false);
    const [openResumen, setOpenResumen] = useState(false);
    const [openModalExito, setOpenModalExito] = useState(false);
    const [openModalError, setOpenModalError] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState("");
    const [facturas, setFacturas] = useState([]);
    const [facturasValidacion, setFacturasValidacion] = useState([]);
    const [token, setToken] = useState("");
    const [loading, setLoading] = useState(false);
    const handleCloseModalExito = () => setOpenModalExito(false);

    // Función para dar de alta una serie
    const darAltaSerie = async (serieData) => {
        try {
            const response = await fetch(`${apiUrl}/api/catalogos/RegistroSerie`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    serie: serieData.serie,
                    descripcion: serieData.descripcion || `Serie ${serieData.serie}`,
                    estatus: "Activo"
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear la serie');
            }

            return await response.json();
        } catch (error) {
            console.error('Error al dar de alta serie:', error);
            throw error;
        }
    };

    // Función para dar de alta un receptor
    const darAltaReceptor = async (receptorData) => {
        try {
            const clienteData = {
                rfc: receptorData.RFC,
                nombre: receptorData.Nombre || receptorData.nombre,
                regimenFiscal: receptorData.RegimenFiscalReceptor || receptorData.regimenFiscalReceptor,
                domicilioFiscal: receptorData.DomicilioFiscalReceptor || receptorData.domicilioFiscalReceptor,
                usoCFDI: receptorData.UsoCFDI || receptorData.usoCFDI || "G03",
                estatus: "Activo"
            };

            const response = await fetch(`${apiUrl}/api/gestores/RegistroReceptor`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify(clienteData),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Error al crear el receptor');
            }

            return await response.json();
        } catch (error) {
            console.error('Error al dar de alta receptor:', error);
            throw error;
        }
    };

    // Función para validar y crear registros faltantes
    const validarYCompletarRegistros = async (factura) => {
        try {
            const response = await fetch(`${apiUrl}/api/importarxml/validar-xml`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    xml_content: factura.xmlContentOriginal || factura.xmlContent
                }),
            });

            if (!response.ok) {
                throw new Error('Error al validar el XML');
            }

            const resultado = await response.json();
            
            if (resultado.success) {
                const validaciones = resultado.data?.factura_completa?.validaciones || {};
                
                const operaciones = [];

                // Si la serie no existe, la creamos
                if (!validaciones.serie_existe) {
                    try {
                        await darAltaSerie({
                            serie: factura.Serie,
                            descripcion: `Serie ${factura.Serie} - ${factura.Emisor?.Nombre || 'Empresa'}`
                        });
                        operaciones.push(`Serie ${factura.Serie} creada`);
                    } catch (error) {
                        console.error('Error al crear serie:', error);
                        throw new Error(`No se pudo crear la serie ${factura.Serie}: ${error.message}`);
                    }
                }

                // Si el receptor no existe, lo creamos
                if (!validaciones.receptor_existe && factura.Receptor) {
                    try {
                        await darAltaReceptor(factura.Receptor);
                        operaciones.push(`Receptor ${factura.Receptor.RFC} creado`);
                    } catch (error) {
                        console.error('Error al crear receptor:', error);
                        throw new Error(`No se pudo crear el receptor ${factura.Receptor.RFC}: ${error.message}`);
                    }
                }

                if (operaciones.length > 0) {
                    factura.registrosCreados = operaciones;
                }

                return true;
            } else {
                const errores = resultado.errors?.join('\n') || 'Error desconocido en la validación';
                throw new Error(`Error de validación:\n${errores}`);
            }
        } catch (error) {
            console.error('Error en validación:', error);
            throw error;
        }
    };

    // Manejar la carga múltiple de XML
    const handleUploadMultiple = (resultados) => {
        // Procesar los resultados para obtener las facturas formateadas
        const facturasProcesadas = resultados
            .filter(r => r.status === 'success' || r.status === 'warning')
            .map(result => {
                let facturaFormateada = formatearFacturaXML(result.data, result.xmlContentOriginal);
                
                return {
                    ...facturaFormateada,
                    estaTimbrado: true,
                    infoTimbrado: facturaFormateada.infoTimbrado || result.data?.factura_completa?.timbre || {},
                    xmlContentOriginal: result.xmlContentOriginal,
                    fileName: result.fileName,
                    status: result.status,
                    advertencias: result.advertencias
                };
            });

        // Guardar resultados de validación
        setFacturasValidacion(resultados);
        
        // Guardar facturas procesadas
        setFacturas(facturasProcesadas);
        
        // Abrir modal de resumen
        setOpenResumen(true);
    };

    // Confirmar importación desde el resumen
    const confirmarImportacion = (facturasAImportar) => {
        setOpenResumen(false);
        guardarFacturasTimbradas(facturasAImportar);
    };

    useEffect(() => {
        const token = isAuthenticated();
        if (!token) {
            router.push("/IniciaSesion");
        } else {
            setToken(token);
        }
    }, [router]);

    const handleOpenModalMultiple = () => setOpenModalMultiple(true);
    const handleCloseModalMultiple = () => setOpenModalMultiple(false);
    const handleCloseResumen = () => setOpenResumen(false);
    const handleCloseModalError = () => setOpenModalError(false);

    // Guardar facturas timbradas
    const guardarFacturasTimbradas = async (facturasAGuardar) => {
        setLoading(true);
        let exito = 0;
        const errores = [];

        try {
            for (const factura of facturasAGuardar) {
                if (!factura.estaTimbrado) {
                    console.warn("Se intentó guardar una factura no timbrada, se omitirá:", factura);
                    continue;
                }

                // Validar y crear registros faltantes antes de guardar
                try {
                    await validarYCompletarRegistros(factura);
                } catch (error) {
                    errores.push(`Factura ${factura.Serie}-${factura.Folio}: Error en validación previa - ${error.message}`);
                    continue;
                }

                const endpoint = factura.es_complemento_pago 
                    ? `${apiUrl}/api/facturas/GuardarFacturaTimbrada`
                    : `${apiUrl}/api/facturas/GuardarFacturaTimbrada`;

                let datosEnvio;
                if (factura.es_complemento_pago) {
                    datosEnvio = prepararComplementoPago(factura);
                } else {
                    datosEnvio = prepararFacturaNormal(factura);
                }

                const response = await fetch(endpoint, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(datosEnvio),
                });

                if (response.ok) {
                    exito++;
                } else {
                    const errorData = await response.json();
                    console.error("Error al guardar:", errorData);
                    errores.push(`Factura ${factura.Serie}-${factura.Folio}: ${errorData.error || "Error desconocido"}`);
                }
            }

            if (exito > 0) {
                let mensaje = `✅ Se importaron ${exito} factura(s) correctamente.`;
                if (errores.length > 0) {
                    mensaje += `\n\n❌ Errores (${errores.length}):\n${errores.join('\n')}`;
                }
                setConfirmationMessage(mensaje);
                setOpenModalExito(true);
                
                // Limpiar estado después de importar
                setFacturas([]);
                setFacturasValidacion([]);
                
                // Redirigir después de un tiempo
                setTimeout(() => router.push("/Home"), 3000);
            } else {
                setConfirmationMessage(`❌ No se pudo importar ninguna factura.\n\nErrores:\n${errores.join('\n')}`);
                setOpenModalError(true);
            }
        } catch (error) {
            console.error("Error:", error);
            setConfirmationMessage("Error de conexión");
            setOpenModalError(true);
        } finally {
            setLoading(false);
        }
    };

    // Función para ver detalle de una factura
    const verDetalleFactura = (factura) => {
        // Aquí podrías abrir un modal con el detalle completo
        // Por ahora solo mostramos en consola
        console.log('Detalle de factura:', factura);
        // Podrías implementar un modal de detalle si lo necesitas
    };

    // Función específica para complementos de pago
    const prepararComplementoPago = (factura) => {
        const datos = JSON.parse(JSON.stringify(factura));
        
        if (datos.Complemento?.Pagos?.Pagos) {
            datos.Complemento.Pagos.Pagos.forEach(pago => {
                if (pago.DoctosRelacionados) {
                    pago.DoctosRelacionados.forEach(docto => {
                        if (docto.NumParcialidad) {
                            docto.NumParcialidad = parseInt(docto.NumParcialidad) || 1;
                        }
                        if (docto.ImpSaldoAnt) docto.ImpSaldoAnt = parseFloat(docto.ImpSaldoAnt);
                        if (docto.ImpPagado) docto.ImpPagado = parseFloat(docto.ImpPagado);
                        if (docto.ImpSaldoInsoluto) docto.ImpSaldoInsoluto = parseFloat(docto.ImpSaldoInsoluto);
                    });
                }
                
                if (pago.Impuestos) {
                    if (pago.Impuestos.Traslados) {
                        pago.Impuestos.Traslados.forEach(tras => {
                            if (tras.ImpuestoCatalogoID) tras.ImpuestoCatalogoID = parseInt(tras.ImpuestoCatalogoID) || 0;
                            if (tras.TasaCatalogoID) tras.TasaCatalogoID = parseInt(tras.TasaCatalogoID) || 0;
                            if (tras.Base) tras.Base = parseFloat(tras.Base);
                            if (tras.Importe) tras.Importe = parseFloat(tras.Importe);
                            if (tras.TasaOCuota) tras.TasaOCuota = parseFloat(tras.TasaOCuota);
                        });
                    }
                    if (pago.Impuestos.Retenciones) {
                        pago.Impuestos.Retenciones.forEach(ret => {
                            if (ret.ImpuestoCatalogoID) ret.ImpuestoCatalogoID = parseInt(ret.ImpuestoCatalogoID) || 0;
                            if (ret.TasaCatalogoID) ret.TasaCatalogoID = parseInt(ret.TasaCatalogoID) || 0;
                            if (ret.Base) ret.Base = parseFloat(ret.Base);
                            if (ret.Importe) ret.Importe = parseFloat(ret.Importe);
                            if (ret.TasaOCuota) ret.TasaOCuota = parseFloat(ret.TasaOCuota);
                        });
                    }
                }
            });
        }
        
        return {
            TipoDeComprobante: datos.TipoDeComprobante || "P",
            Version: datos.Version || "4.0",
            Serie: datos.Serie || "",
            Folio: datos.Folio || "",
            NoCertificado : datos.NoCertificado || "",
            Certificado: datos.Certificado || "",
            Sello: datos.Sello || "",
            Fecha: datos.Fecha,
            LugarExpedicion: datos.LugarExpedicion || "",
            Moneda: datos.Moneda || "XXX",
            Total: datos.Total || 0,
            SubTotal: datos.SubTotal || 0,
            Descuento: datos.Descuento || 0,
            TipoCambio: datos.TipoCambio || "1",
            Exportacion: datos.Exportacion || "01",
            Confirmacion: datos.Confirmacion || "",
            UsoCFDI: datos.Receptor?.UsoCFDI || "P01",
            Conceptos: {
                ListaConceptos: [
                    {
                        ClaveProdServ: "84111506",
                        Cantidad: 1,
                        ClaveUnidad: "ACT",
                        Unidad: "Actividad",
                        Descripcion: "Pago",
                        ValorUnitario: 0,
                        Importe: 0,
                        Descuento: 0,
                        ValorUnitarioString: "0",
                        ImporteString: "0",
                        DescuentoString: "0",
                        ObjetoImp: "01",
                        Impuestos: {
                            Traslados: [],
                            Retenciones: [],
                        },
                    },
                ],
                TotalImpuestosTrasladados: 0,
                TotalImpuestosRetenidos: 0,
            },
            FormaPago: datos.FormaPago || "99",
            MetodoPago: datos.MetodoPago || "PUE",
            EmisorID: datos.EmisorID || 0,
            ReceptorID: datos.ReceptorID || 0,
            Emisor: datos.Emisor || {
                RFC: datos.Emisor?.RFC || "",
                Nombre: datos.Emisor?.Nombre || ""
            },
            Receptor: datos.Receptor || {
                RFC: datos.Receptor?.RFC || "",
                Nombre: datos.Receptor?.Nombre || "",
                UsoCFDI: datos.Receptor?.UsoCFDI || "P01",
                DomicilioFiscalReceptor: datos.Receptor?.DomicilioFiscalReceptor || "",
                RegimenFiscalReceptor: datos.Receptor?.RegimenFiscalReceptor || ""
            },
            UUID: datos.UUID || datos.infoTimbrado?.UUID,
            FechaTimbrado: datos.infoTimbrado?.FechaTimbrado,
            NoCertificadoSAT: datos.infoTimbrado?.NoCertificadoSAT,
            SelloSAT: datos.infoTimbrado?.SelloSAT,
            RfcProvCertif: datos.infoTimbrado?.RfcProvCertif,
            CadenaOriginalSAT: datos.infoTimbrado?.CadenaOriginalSAT || "cadena_original_ficticia",
            es_complemento_pago: true,
            Complemento: datos.Complemento,
            xml_content: datos.xmlContent || datos.xmlContentOriginal,
            CondicionesDePago: datos.CondicionesDePago || "",
            Descripcion: datos.Descripcion || "",
            facturaOriginalUUID: datos.facturaOriginalUUID,
            facturaOriginalSerie: datos.facturaOriginalSerie,
            facturaOriginalFolio: datos.facturaOriginalFolio,
            validaciones: datos.validaciones || {},
            errores: datos.errores || []
        };
    };

    // Función para facturas normales
    const prepararFacturaNormal = (factura) => {
        const datos = JSON.parse(JSON.stringify(factura));
        
        return {
            ...datos,
            FormaPago: datos.FormaPago || "99",
            MetodoPago: datos.MetodoPago || "PUE",
            EmisorID: datos.EmisorID || 0,
            ReceptorID: datos.ReceptorID || 0,
            Emisor: datos.Emisor || {},
            Receptor: datos.Receptor || {},
            UUID: datos.UUID || datos.infoTimbrado?.UUID,
            UsoCFDI: datos.Receptor?.UsoCFDI || "G03",
        };
    };

    return (
        <div>
            <Header />
            <Grid container>
                <Grid item>
                    <SideBarMenu />
                </Grid>
                <Grid>
                    <Box
                        bgcolor="white"
                        ml={{ xs: 1, sm: 5, md: 10 }}
                        mr={{ xs: 1, sm: 2, md: 3 }}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                        sx={{
                            width: {
                                xs: '90vw',
                                sm: '85vw',
                                md: '80vw',
                                lg: '94vw',
                            },
                        }}
                    >
                        <Box display="flex" justifyContent="flex-end" mb={2} gap={2} width="100%">
                            <Button
                                variant="contained"
                                sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                                onClick={handleOpenModalMultiple}
                                startIcon={<CloudUploadIcon />}
                            >
                                Importación Múltiple XML
                            </Button>
                        </Box>

                        <VistaXMLMultiple
                            facturas={facturas}
                            token={token}
                            actualizarFacturas={setFacturas}
                            onVerDetalle={verDetalleFactura}
                        />

                        <ModalXMLMultiple
                            token={token}
                            open={openModalMultiple}
                            handleClose={handleCloseModalMultiple}
                            handleUploadMultiple={handleUploadMultiple}
                        />

                        <ResumenImportacion
                            open={openResumen}
                            handleClose={handleCloseResumen}
                            facturas={facturasValidacion}
                            onConfirm={confirmarImportacion}
                        />

                        <ModalExito
                            openModalSuccess={openModalExito}
                            handleCloseModal={handleCloseModalExito}
                            confirmationMessage={confirmationMessage}
                        />

                        <ModalError 
                            openModalError={openModalError} 
                            handleCloseModal={handleCloseModalError} 
                            confirmationMessage={confirmationMessage} 
                        />

                        {facturas.length > 0 && (
                            <Box display="flex" justifyContent="center" mt={4}>
                                <Button
                                    variant="contained"
                                    sx={{ backgroundColor: "#1b384a", "&:hover": { backgroundColor: "#10232f" } }}
                                    onClick={() => guardarFacturasTimbradas(facturas.filter(f => f.status !== 'error'))}
                                    disabled={loading}
                                >
                                    {loading ? "Procesando..." : `Importar ${facturas.filter(f => f.status !== 'error').length} Factura(s)`}
                                </Button>
                            </Box>
                        )}
                    </Box>
                </Grid>
            </Grid>
        </div>
    );
}