"use client"
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from 'react-hook-form';
import { Snackbar, Alert, Box, Button, Grid, CircularProgress, Typography } from '@mui/material';
import { isAuthenticated } from "@/utils/authRedirect";
import Header from "@/components/Header/Header.jsx";
import SideBarMenu from "@/components/Dashborard/SideBarMenu";
import Emisor from "@/components/FormFactura/Emisor/Emisor.jsx";
import Receptor from "@/components/FormFactura/Receptor/Receptor.jsx";
import EditarPago from "@/components/FormFactura/Pagos/EditarPago.jsx";
import RecuperarFactura from "@/components/FormFactura/RecuperarFactura";

const apiUrl = process.env.NEXT_PUBLIC_API_URL;

function extraerPagosDeXML(xml) {
    if (!xml || typeof xml !== 'string') return null;
    const getAttr = (str, attr) => {
        if (!str) return '';
        const m = str.match(new RegExp('\\b' + attr + '=["\']([^"\']*)["\']', 'i'));
        return m ? m[1] : '';
    };

    let totales = {
        TotalTrasladosBaseIVA16: '0.00',
        TotalTrasladosBaseIVA16String: '0.00',
        TotalTrasladosImpuestoIVA16: '0.00',
        TotalTrasladosImpuestoIVA16String: '0.00',
        TotalRetencionesISR: '0.00',
        TotalRetencionesISRString: '0.00',
        TotalRetencionesIVA: '0.00',
        TotalRetencionesIVAString: '0.00',
        MontoTotalPagos: '0.00',
        MontoTotalPagosString: '0.00'
    };

    const totalesMatch = xml.match(/<(?:\w+:)?Totales\b([^>]*)\/?>/i);
    if (totalesMatch) {
        const tAttrs = totalesMatch[1] || '';
        totales = {
            TotalTrasladosBaseIVA16: getAttr(tAttrs, 'TotalTrasladosBaseIVA16') || '0.00',
            TotalTrasladosBaseIVA16String: getAttr(tAttrs, 'TotalTrasladosBaseIVA16') || '0.00',
            TotalTrasladosImpuestoIVA16: getAttr(tAttrs, 'TotalTrasladosImpuestoIVA16') || '0.00',
            TotalTrasladosImpuestoIVA16String: getAttr(tAttrs, 'TotalTrasladosImpuestoIVA16') || '0.00',
            TotalRetencionesISR: getAttr(tAttrs, 'TotalRetencionesISR') || '0.00',
            TotalRetencionesISRString: getAttr(tAttrs, 'TotalRetencionesISR') || '0.00',
            TotalRetencionesIVA: getAttr(tAttrs, 'TotalRetencionesIVA') || '0.00',
            TotalRetencionesIVAString: getAttr(tAttrs, 'TotalRetencionesIVA') || '0.00',
            MontoTotalPagos: getAttr(tAttrs, 'MontoTotalPagos') || '0.00',
            MontoTotalPagosString: getAttr(tAttrs, 'MontoTotalPagos') || '0.00'
        };
    }

    const pagoMatches = xml.match(/<(?:\w+:)?Pago\b[^>]*>([\s\S]*?)<\/(?:\w+:)?Pago>/gi) ||
                        xml.match(/<(?:\w+:)?Pago\b[^>]*\/>/gi) || [];

    const listaPagos = [];

    for (const pMatch of pagoMatches) {
        const openTagMatch = pMatch.match(/<(?:\w+:)?Pago\b([^>]*)>/i) || [pMatch, pMatch];
        const openAttrs = openTagMatch[1] || pMatch;

        const fechaPago = getAttr(openAttrs, 'FechaPago');
        const formaPago = getAttr(openAttrs, 'FormaDePagoP') || getAttr(openAttrs, 'FormaPago') || '03';
        const monedaP = getAttr(openAttrs, 'MonedaP') || getAttr(openAttrs, 'Moneda') || 'MXN';
        const monto = parseFloat(getAttr(openAttrs, 'Monto') || '0');

        const doctoMatches = pMatch.match(/<(?:\w+:)?DoctoRelacionado\b[^>]*>([\s\S]*?)<\/(?:\w+:)?DoctoRelacionado>/gi) ||
                             pMatch.match(/<(?:\w+:)?DoctoRelacionado\b[^>]*\/>/gi) || [];
        const doctosRel = doctoMatches.map(dStr => {
            const impPag = parseFloat(getAttr(dStr, 'ImpPagado') || monto.toString());
            const saldoAnt = parseFloat(getAttr(dStr, 'ImpSaldoAnt') || '0');
            const saldoIns = parseFloat(getAttr(dStr, 'ImpSaldoInsoluto') || Math.max(0, saldoAnt - impPag).toString());
            return {
                IdDocumento: getAttr(dStr, 'IdDocumento'),
                Serie: getAttr(dStr, 'Serie'),
                Folio: getAttr(dStr, 'Folio'),
                MonedaDR: getAttr(dStr, 'MonedaDR') || 'MXN',
                NumParcialidad: parseInt(getAttr(dStr, 'NumParcialidad') || '1'),
                ImpSaldoAnt: saldoAnt,
                ImpSaldoAntString: saldoAnt.toFixed(2),
                ImpPagado: impPag,
                ImpPagadoString: impPag.toFixed(2),
                ImpSaldoInsoluto: saldoIns,
                ImpSaldoInsolutoString: saldoIns.toFixed(2),
                ObjetoImpDR: getAttr(dStr, 'ObjetoImpDR') || '01'
            };
        });

        if (doctosRel.length === 0) {
            doctosRel.push({
                IdDocumento: '',
                Serie: '',
                Folio: '',
                MonedaDR: 'MXN',
                NumParcialidad: 1,
                ImpSaldoAnt: monto,
                ImpSaldoAntString: monto.toFixed(2),
                ImpPagado: monto,
                ImpPagadoString: monto.toFixed(2),
                ImpSaldoInsoluto: 0,
                ImpSaldoInsolutoString: '0.00',
                ObjetoImpDR: '01'
            });
        }

        const traslados = [];
        const retenciones = [];
        const trasMatches = pMatch.match(/<(?:\w+:)?(?:TrasladoP|TrasladoDR)\b([^>]*)\/?>/gi) || [];
        trasMatches.forEach(tStr => {
            const base = parseFloat(getAttr(tStr, 'BaseP') || getAttr(tStr, 'BaseDR') || '0');
            const imp = parseFloat(getAttr(tStr, 'ImporteP') || getAttr(tStr, 'ImporteDR') || '0');
            traslados.push({
                Base: base,
                BaseString: base.toFixed(2),
                ImpuestoClave: getAttr(tStr, 'ImpuestoP') || getAttr(tStr, 'ImpuestoDR') || '002',
                TipoFactor: getAttr(tStr, 'TipoFactorP') || getAttr(tStr, 'TipoFactorDR') || 'Tasa',
                TasaOCuota: getAttr(tStr, 'TasaOCuotaP') || getAttr(tStr, 'TasaOCuotaDR') || '0.160000',
                Importe: imp,
                ImporteString: imp.toFixed(2)
            });
        });

        const retMatches = pMatch.match(/<(?:\w+:)?(?:RetencionP|RetencionDR)\b([^>]*)\/?>/gi) || [];
        retMatches.forEach(rStr => {
            const imp = parseFloat(getAttr(rStr, 'ImporteP') || getAttr(rStr, 'ImporteDR') || '0');
            retenciones.push({
                ImpuestoClave: getAttr(rStr, 'ImpuestoP') || getAttr(rStr, 'ImpuestoDR') || '001',
                Importe: imp,
                ImporteString: imp.toFixed(2)
            });
        });

        listaPagos.push({
            FechaPago: fechaPago || new Date().toISOString(),
            FormaDePagoP: formaPago,
            MonedaP: monedaP,
            Monto: monto,
            MontoString: monto.toFixed(2),
            DoctoRelacionados: doctosRel,
            DoctosRelacionados: doctosRel,
            Impuestos: {
                Traslados: traslados,
                Retenciones: retenciones
            }
        });
    }

    if (listaPagos.length === 0) return null;

    if (!totales.MontoTotalPagos || parseFloat(totales.MontoTotalPagos) === 0) {
        const sumaMonto = listaPagos.reduce((acc, p) => acc + (parseFloat(p.Monto) || 0), 0);
        totales.MontoTotalPagos = sumaMonto.toFixed(2);
        totales.MontoTotalPagosString = sumaMonto.toFixed(2);
    }

    return {
        Version: '2.0',
        Totales: totales,
        Pagos: listaPagos
    };
}

// Función para normalizar cualquier estructura devuelta por el servicio de Go, BD local o XML
function normalizarFacturaPago(data) {
    if (!data) return null;
    const f = data.factura || data.comprobante || data;
    if (!f || typeof f !== 'object') return null;

    // 1. Buscar Complemento en todas sus variantes
    let complemento = f.Complemento || f.complemento || 
                      data.Complemento || data.complemento ||
                      (Array.isArray(f.Complementos) ? f.Complementos[0] : null) ||
                      (Array.isArray(f.complementos) ? f.complementos[0] : null) ||
                      (Array.isArray(data.complementos) ? data.complementos[0] : null) ||
                      {};

    // 2. Buscar Pagos en todas sus variantes
    let pagosNode = complemento?.Pagos || complemento?.pagos || 
                    f.Pagos || f.pagos || 
                    data.Pagos || data.pagos;

    let listaPagos = [];
    let totales = complemento?.Pagos?.Totales || complemento?.pagos?.totales || 
                  complemento?.Totales || f.Totales || data.Totales || {};

    if (Array.isArray(pagosNode)) {
        listaPagos = pagosNode;
    } else if (pagosNode && typeof pagosNode === 'object') {
        const arr = pagosNode.Pagos || pagosNode.pagos || pagosNode.Pago || pagosNode.pago;
        if (Array.isArray(arr)) {
            listaPagos = arr;
        } else if (pagosNode.FechaPago || pagosNode.Monto || pagosNode.DoctoRelacionados || pagosNode.DoctosRelacionados) {
            listaPagos = [pagosNode];
        }
        if (pagosNode.Totales) totales = pagosNode.Totales;
        else if (pagosNode.totales) totales = pagosNode.totales;
    }

    // 3. Fallback: Parsear XML si la estructura JSON no trajo Pagos
    const rawXml = f.XMLTimbrado || f.xml_timbrado || f.xml || f.XML || f.xmlTimbrado || 
                   data.XMLTimbrado || data.xml_timbrado || data.xml || '';
    if ((!listaPagos || listaPagos.length === 0) && rawXml) {
        const pagosParsed = extraerPagosDeXML(rawXml);
        if (pagosParsed) {
            listaPagos = pagosParsed.Pagos;
            totales = pagosParsed.Totales;
        }
    }

    // 4. Fallback: Si es factura tipo Pago (P) y aún no hay pagos, generar estructura default
    const esTipoPago = (f.TipoDeComprobante || f.tipo_de_comprobante || f.tipo_comprobante || data.TipoDeComprobante || '').toUpperCase() === 'P';
    if ((!listaPagos || listaPagos.length === 0) && esTipoPago) {
        const totalNum = parseFloat(f.Total || f.total_string || f.total || data.Total || data.total_string || 0);
        const baseCalculada = (totalNum / 1.16).toFixed(2);
        const ivaCalculado = (totalNum - parseFloat(baseCalculada)).toFixed(2);

        listaPagos = [{
            FechaPago: f.Fecha || f.fecha || new Date().toISOString(),
            FormaDePagoP: f.FormaPago || f.forma_pago || '03',
            MonedaP: f.Moneda || f.moneda || 'MXN',
            Monto: totalNum,
            MontoString: totalNum.toFixed(2),
            DoctoRelacionados: [{
                IdDocumento: '',
                Serie: '',
                Folio: '',
                MonedaDR: 'MXN',
                NumParcialidad: 1,
                ImpSaldoAnt: totalNum,
                ImpSaldoAntString: totalNum.toFixed(2),
                ImpPagado: totalNum,
                ImpPagadoString: totalNum.toFixed(2),
                ImpSaldoInsoluto: 0,
                ImpSaldoInsolutoString: '0.00',
                ObjetoImpDR: '01'
            }],
            DoctosRelacionados: [{
                IdDocumento: '',
                Serie: '',
                Folio: '',
                MonedaDR: 'MXN',
                NumParcialidad: 1,
                ImpSaldoAnt: totalNum,
                ImpSaldoAntString: totalNum.toFixed(2),
                ImpPagado: totalNum,
                ImpPagadoString: totalNum.toFixed(2),
                ImpSaldoInsoluto: 0,
                ImpSaldoInsolutoString: '0.00',
                ObjetoImpDR: '01'
            }],
            Impuestos: {
                Traslados: [{
                    Base: parseFloat(baseCalculada),
                    BaseString: baseCalculada,
                    ImpuestoClave: "002",
                    NombreImpuesto: "IVA",
                    TipoFactor: "Tasa",
                    TasaOCuota: "0.160000",
                    Importe: parseFloat(ivaCalculado),
                    ImporteString: ivaCalculado
                }],
                Retenciones: []
            }
        }];

        totales = {
            TotalTrasladosBaseIVA16: baseCalculada,
            TotalTrasladosBaseIVA16String: baseCalculada,
            TotalTrasladosImpuestoIVA16: ivaCalculado,
            TotalTrasladosImpuestoIVA16String: ivaCalculado,
            TotalRetencionesISR: '0.00',
            TotalRetencionesISRString: '0.00',
            TotalRetencionesIVA: '0.00',
            TotalRetencionesIVAString: '0.00',
            MontoTotalPagos: totalNum.toFixed(2),
            MontoTotalPagosString: totalNum.toFixed(2)
        };
    }

    if (!listaPagos || listaPagos.length === 0) {
        return null;
    }

    // Normalizar cada pago para asegurar que existan DoctoRelacionados y DoctosRelacionados
    listaPagos = listaPagos.map(pagoItem => {
        const doctos = pagoItem.DoctoRelacionados || pagoItem.DoctosRelacionados || [];
        return {
            ...pagoItem,
            DoctoRelacionados: doctos,
            DoctosRelacionados: doctos
        };
    });

    return {
        ...f,
        TipoDeComprobante: 'P',
        Complemento: {
            ...complemento,
            Pagos: {
                Version: pagosNode?.Version || '2.0',
                Totales: totales,
                Pagos: listaPagos
            }
        }
    };
}

export default function EditarComplementoPago() {
    const { id } = useParams();
    const { register, watch, handleSubmit, setValue, getValues, trigger, formState: { errors } } = useForm();
    const [facturaData, setFacturaData] = useState(null);
    const [emisorData, setEmisorData] = useState(null);
    const [receptorData, setReceptorData] = useState(null);
    const [lugarExpedicion, setLugarExpedicion] = useState("");
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [loadingError, setLoadingError] = useState('');
    const [token, setToken] = useState("");
    const router = useRouter();

    // Autenticación
    useEffect(() => {
        const t = isAuthenticated();
        if (!t) router.push("/IniciaSesion");
        else setToken(t);
    }, [router]);

    // Cargar datos
    useEffect(() => {
        if (!id || !token) return;

        const cargarDatos = async () => {
            try {
                setLoadingError('');
                let goData = null;
                let localData = null;
                const cleanApiUrl = (apiUrl || '').replace(/\/+$/, '');

                // 1. Consultar el servicio de Go primero
                if (cleanApiUrl) {
                    try {
                        const targetGoUrl = `${cleanApiUrl}/api/facturas/ObtenerFactura/${id}`;
                        console.log("Consultando servicio Go:", targetGoUrl);
                        const resGo = await fetch(targetGoUrl, {
                            headers: { 
                                'Authorization': `Bearer ${token}`,
                                'Content-Type': 'application/json'
                            }
                        });
                        if (resGo.ok) {
                            goData = await resGo.json();
                            console.log("Respuesta recibida desde Go API:", goData);
                        } else {
                            console.warn("Go API respondió con código no OK:", resGo.status);
                        }
                    } catch (errGo) {
                        console.warn("Fallo fetch a Go API:", errGo);
                    }
                }

                // 2. Consultar la ruta local de la BD (Next.js API route)
                try {
                    const resLocal = await fetch(`/api/facturas/ObtenerFactura/${id}`, {
                        headers: { 
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (resLocal.ok) {
                        localData = await resLocal.json();
                        console.log("Respuesta recibida desde BD local:", localData);
                    }
                } catch (errLocal) {
                    console.warn("Fallo fetch a ruta local:", errLocal);
                }

                // 3. Normalizar y combinar datos
                let normalizadoGo = normalizarFacturaPago(goData);
                let normalizadoLocal = normalizarFacturaPago(localData);

                let finalFactura = null;

                if (normalizadoGo?.Complemento?.Pagos?.Pagos?.length) {
                    finalFactura = {
                        ...(localData?.factura || localData || {}),
                        ...normalizadoGo,
                        Complemento: {
                            ...((localData?.factura || localData)?.Complemento || {}),
                            ...normalizadoGo.Complemento
                        }
                    };
                } else if (normalizadoLocal?.Complemento?.Pagos?.Pagos?.length) {
                    finalFactura = {
                        ...(goData?.factura || goData || {}),
                        ...normalizadoLocal,
                        Complemento: {
                            ...((goData?.factura || goData)?.Complemento || {}),
                            ...normalizadoLocal.Complemento
                        }
                    };
                } else {
                    // Si ninguna fuente trajo pagos estructurados pero alguna respondió datos de factura
                    const rawAny = goData || localData;
                    if (rawAny) {
                        const baseObj = rawAny.factura || rawAny.comprobante || rawAny;
                        baseObj.TipoDeComprobante = 'P';
                        finalFactura = normalizarFacturaPago(baseObj);
                    }
                }

                if (!finalFactura?.Complemento?.Pagos?.Pagos?.length) {
                    console.error("No se pudo estructurar el complemento de pago ni desde Go ni desde BD local:", { goData, localData });
                    throw new Error('No se encontró el complemento de pago en la factura');
                }

                console.log("Factura final lista para editar:", finalFactura);
                setFacturaData({ factura: finalFactura });

                const fechaOriginal = finalFactura.Fecha || finalFactura.fecha || normalizadoGo?.Fecha || (localData?.factura || localData)?.Fecha || normalizadoLocal?.Fecha;
                if (fechaOriginal) {
                    setValue("Fecha", fechaOriginal);
                }

                // Recuperar Emisor y Receptor para modo lectura
                try {
                    const recovered = RecuperarFactura(finalFactura, setValue, null, setEmisorData, setReceptorData, setLugarExpedicion);
                    if (recovered?.emisor) {
                        setEmisorData({
                            ...recovered.emisor,
                            Fecha: fechaOriginal || recovered.emisor.Fecha
                        });
                    }
                    if (recovered?.receptor) setReceptorData(recovered.receptor);
                } catch (recErr) {
                    console.warn("Advertencia al recuperar datos de emisor/receptor:", recErr);
                    // Fallback directo desde finalFactura
                    if (finalFactura.Emisor) {
                        setEmisorData({
                            ID: finalFactura.EmisorID || finalFactura.Emisor.id,
                            RFCEmisor: finalFactura.Emisor.Rfc,
                            NombreEmisor: finalFactura.Emisor.Nombre,
                            RegimenFiscalEmisor: finalFactura.Emisor.RegimenFiscal,
                            LugarExpedicion: finalFactura.Emisor.LugarExpedicion,
                            Serie: finalFactura.Serie,
                            Fecha: fechaOriginal,
                            TipoComprobante: 'P'
                        });
                    }
                    if (finalFactura.Receptor) {
                        setReceptorData({
                            ID: finalFactura.ReceptorID || finalFactura.Receptor.id,
                            Rfc: finalFactura.Receptor.Rfc,
                            Nombre: finalFactura.Receptor.Nombre,
                            DomicilioFiscalReceptor: finalFactura.Receptor.DomicilioFiscalReceptor,
                            RegimenFiscal: finalFactura.Receptor.RegimenFiscalReceptor || finalFactura.Receptor.RegimenFiscal,
                            UsoCFDI: finalFactura.UsoCFDI || 'CP01'
                        });
                    }
                }

                return finalFactura;

            } catch (error) {
                console.error("Error cargando pago:", error);
                setLoadingError(error.message || 'Error al cargar el pago');
                setSnackbarMessage("Error al cargar el pago: " + (error.message || ''));
                setOpenSnackbar(true);
            }
        };

        cargarDatos();
    }, [id, token, setValue]);

    const handleSave = async (editedPago) => {
        try {
            const facturaObj = facturaData?.factura || facturaData;
            const primerPago = facturaObj?.Complemento?.Pagos?.Pagos?.[0] || {};
            const primerDocto = primerPago?.DoctoRelacionados?.[0] || primerPago?.DoctosRelacionados?.[0] || {};

            const doctosActualizados = [{
                ...primerDocto,
                ImpPagado: parseFloat(editedPago.Monto),
                ImpPagadoString: String(editedPago.Monto),
                ImpSaldoInsoluto: parseFloat(editedPago.ImpSaldoInsoluto),
                ImpSaldoInsolutoString: String(editedPago.ImpSaldoInsoluto),
            }];

            // Mantener la fecha original de emisión de la factura
            const fechaEmision = facturaObj.Fecha || facturaObj.fecha || getValues("Fecha");

            const updatedFactura = {
                ...facturaObj,
                Fecha: fechaEmision,
                Complemento: {
                    ...facturaObj.Complemento,
                    Pagos: {
                        ...facturaObj.Complemento?.Pagos,
                        Pagos: [{
                            ...primerPago,
                            FechaPago: editedPago.FechaPago,
                            FormaDePagoP: editedPago.FormaPagoComprobante,
                            Monto: parseFloat(editedPago.Monto),
                            MontoString: String(editedPago.Monto),
                            DoctoRelacionados: doctosActualizados,
                            DoctosRelacionados: doctosActualizados,
                            Impuestos: editedPago.Impuestos // {Traslados, Retenciones} ya viene listo de onSubmit
                        }],
                        Totales: {
                            ...facturaObj.Complemento?.Pagos?.Totales,
                            TotalTrasladosBaseIVA16: editedPago.Totales.TotalTrasladosBaseIVA16,
                            TotalTrasladosBaseIVA16String: editedPago.Totales.TotalTrasladosBaseIVA16,
                            TotalTrasladosImpuestoIVA16: editedPago.Totales.TotalTrasladosImpuestoIVA16,
                            TotalTrasladosImpuestoIVA16String: editedPago.Totales.TotalTrasladosImpuestoIVA16,
                            TotalRetencionesISR: editedPago.Totales.TotalRetencionesISR,
                            TotalRetencionesISRString: editedPago.Totales.TotalRetencionesISR,
                            TotalRetencionesIVA: editedPago.Totales.TotalRetencionesIVA,
                            TotalRetencionesIVAString: editedPago.Totales.TotalRetencionesIVA,
                            MontoTotalPagos: editedPago.Monto,
                            MontoTotalPagosString: String(editedPago.Monto),
                        }
                    }
                }
            };

            console.log("Factura actualizada enviando a Go API:", updatedFactura);

            const cleanApiUrl = (apiUrl || '').replace(/\/+$/, '');
            const targetUrl = `${cleanApiUrl}/api/facturas/EditarFactura`;
            const response = await fetch(targetUrl, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedFactura)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || errorData.error || errorData.Error || 'Error al actualizar el pago en Go API');
            }

            setSnackbarMessage('Pago actualizado correctamente');
            setOpenSnackbar(true);
            setTimeout(() => router.push("/Home"), 1500);

        } catch (error) {
            console.error("Error al guardar:", error);
            setSnackbarMessage(error.message || 'Error al actualizar el pago');
            setOpenSnackbar(true);
        }
    };

    if (!facturaData) {
        return (
            <div>
                <Header />
                <Grid container>
                    <Grid>
                        <SideBarMenu />
                    </Grid>
                    <Grid sx={{ flex: 1 }}>
                        <Box
                            display="flex"
                            flexDirection="column"
                            alignItems="center"
                            justifyContent="center"
                            minHeight="70vh"
                            p={3}
                        >
                            {loadingError ? (
                                <Box textAlign="center" maxWidth={500}>
                                    <Alert severity="error" sx={{ mb: 3 }}>
                                        {loadingError}
                                    </Alert>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => router.push("/Home")}
                                    >
                                        Volver al listado de facturas
                                    </Button>
                                </Box>
                            ) : (
                                <Box textAlign="center">
                                    <CircularProgress sx={{ mb: 2 }} />
                                    <Typography variant="h6">Cargando datos del complemento de pago...</Typography>
                                </Box>
                            )}
                        </Box>
                    </Grid>
                </Grid>
                <Snackbar
                    open={openSnackbar}
                    autoHideDuration={6000}
                    onClose={() => setOpenSnackbar(false)}
                    anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
                >
                    <Alert
                        severity={snackbarMessage.includes('Error') ? 'error' : 'success'}
                        sx={{ width: '100%' }}
                    >
                        {snackbarMessage}
                    </Alert>
                </Snackbar>
            </div>
        );
    }

    return (
        <div>
            <Header />
            <Grid container>
                <Grid>
                    <SideBarMenu />
                </Grid>
                <Grid sx={{ flex: 1, minWidth: 0 }}>
                    <Box
                        bgcolor="white"
                        ml={10}
                        mr={1}
                        p={2}
                        boxShadow={3}
                        borderRadius={2}
                    >
                        {/* 1. Emisor en modo lectura */}
                        <Emisor
                            register={register}
                            setLugarExpedicion={setLugarExpedicion}
                            setValue={setValue}
                            getValues={getValues}
                            trigger={trigger}
                            errors={errors}
                            emisorData={emisorData}
                            disabled={true}
                            esPago={false}
                        />

                        {/* 2. Receptor en modo lectura */}
                        <Receptor
                            register={register}
                            lugarExpedicion={lugarExpedicion}
                            errors={errors}
                            setValue={setValue}
                            getValues={getValues}
                            trigger={trigger}
                            receptorData={receptorData}
                            token={token}
                            disabled={true}
                        />

                        {/* 3. Formulario de Pago y Desglose de Impuestos */}
                        <Box mt={3}>
                            <EditarPago
                                factura={facturaData.factura || facturaData}
                                token={token}
                                onSave={handleSave}
                                onCancel={() => router.push("/Home")}
                            />
                        </Box>
                    </Box>
                </Grid>
            </Grid>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    severity={snackbarMessage.includes('Error') ? 'error' : 'success'}
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </div>
    );
}
