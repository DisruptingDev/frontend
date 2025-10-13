// utils/FormatearXML.js

/**
 * Detecta si un XML ya está timbrado
 */
export const detectarTimbradoXML = (xmlContent) => {
    if (!xmlContent) return false;
    
    try {
        // Buscar elementos específicos de un CFDI timbrado
        const tieneComplementoTimbre = xmlContent.includes('http://www.sat.gob.mx/TimbreFiscalDigital');
        const tieneTimbreFiscal = xmlContent.includes('tfd:TimbreFiscalDigital') || 
                                 xmlContent.includes('TimbreFiscalDigital');
        const tieneUUID = xmlContent.includes('UUID');
        
        return tieneComplementoTimbre && tieneTimbreFiscal && tieneUUID;
        
    } catch (error) {
        console.error("Error detectando timbrado:", error);
        return false;
    }
};

/**
 * Extrae información del timbre fiscal si existe
 */
export const extraerInfoTimbrado = (xmlContent) => {
    if (!xmlContent) return null;
    
    try {
        // Usar DOMParser para extraer datos del timbre
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
        
        // Buscar el complemento de timbre fiscal
        const timbre = xmlDoc.getElementsByTagName('tfd:TimbreFiscalDigital')[0] || 
                      xmlDoc.getElementsByTagName('TimbreFiscalDigital')[0];
        
        if (!timbre) return null;
        
        const infoTimbrado = {
            UUID: timbre.getAttribute('UUID') || '',
            FechaTimbrado: timbre.getAttribute('FechaTimbrado') || '',
            NoCertificadoSAT: timbre.getAttribute('NoCertificadoSAT') || '',
            SelloCFD: timbre.getAttribute('SelloCFD') || '',
            SelloSAT: timbre.getAttribute('SelloSAT') || '',
            Version: timbre.getAttribute('Version') || '1.1'
        };
        
        return infoTimbrado;
        
    } catch (error) {
        console.error("Error extrayendo info de timbrado:", error);
        return null;
    }
};

/**
 * Castea SOLO los campos críticos que causan error en el backend
 */
const castearCamposCriticos = (factura) => {
    if (factura.Conceptos?.ListaConceptos) {
        factura.Conceptos.ListaConceptos.forEach(concepto => {
            if (concepto.Impuestos?.Traslados) {
                concepto.Impuestos.Traslados.forEach(traslado => {
                    if (typeof traslado.ImpuestoCatalogoID === 'string') {
                        traslado.ImpuestoCatalogoID = parseInt(traslado.ImpuestoCatalogoID, 10);
                    }
                    if (typeof traslado.TasaCatalogoID === 'string') {
                        traslado.TasaCatalogoID = parseInt(traslado.TasaCatalogoID, 10);
                    }
                });
            }

            if (concepto.Impuestos?.Retenciones) {
                concepto.Impuestos.Retenciones.forEach(retencion => {
                    if (typeof retencion.ImpuestoCatalogoID === 'string') {
                        retencion.ImpuestoCatalogoID = parseInt(retencion.ImpuestoCatalogoID, 10);
                    }
                    if (typeof retencion.TasaCatalogoID === 'string') {
                        retencion.TasaCatalogoID = parseInt(retencion.TasaCatalogoID, 10);
                    }
                });
            }
        });
    }
};

/**
 * Asegura campos requeridos por el SAT
 */
const asegurarCamposRequeridosSAT = (factura) => {
    // Asegurar campos en conceptos
    if (factura.Conceptos?.ListaConceptos) {
        factura.Conceptos.ListaConceptos.forEach(concepto => {
            // ✅ Campo Unidad no puede estar vacío - asignar valor por defecto
            if (!concepto.Unidad || concepto.Unidad.trim() === '') {
                concepto.Unidad = 'UNIDAD';
            }
            
            // ✅ Campo NoIdentificacion puede estar vacío pero no null
            if (concepto.NoIdentificacion === null || concepto.NoIdentificacion === undefined) {
                concepto.NoIdentificacion = '';
            }
            
            // ✅ Asegurar que ClaveUnidad tenga valor
            if (!concepto.ClaveUnidad || concepto.ClaveUnidad.trim() === '') {
                concepto.ClaveUnidad = 'H87';
            }
        });
    }
};

/**
 * Formatea una factura XML y detecta si ya está timbrada
 */
export const formatearFacturaXML = (facturaXML, xmlContentOriginal = null) => {
    if (!facturaXML) return null;

    try {
        const facturaFormateada = JSON.parse(JSON.stringify(facturaXML));
        
        // Castear campos problemáticos
        castearCamposCriticos(facturaFormateada);
        
        // Asegurar campos requeridos por el SAT
        asegurarCamposRequeridosSAT(facturaFormateada);
        
        // ✅ Detectar si ya está timbrado y añadir información del timbre
        if (xmlContentOriginal) {
            const estaTimbrado = detectarTimbradoXML(xmlContentOriginal);
            facturaFormateada.estaTimbrado = estaTimbrado;
            
            if (estaTimbrado) {
                const infoTimbrado = extraerInfoTimbrado(xmlContentOriginal);
                
                // ✅ AÑADIR TODA LA INFORMACIÓN DEL TIMBRE A LA FACTURA
                facturaFormateada.UUID = infoTimbrado?.UUID || '';
                facturaFormateada.FechaTimbrado = infoTimbrado?.FechaTimbrado || '';
                facturaFormateada.NoCertificadoSAT = infoTimbrado?.NoCertificadoSAT || '';
                facturaFormateada.SelloCFD = infoTimbrado?.SelloCFD || '';
                facturaFormateada.SelloSAT = infoTimbrado?.SelloSAT || '';
                facturaFormateada.VersionTimbre = infoTimbrado?.Version || '1.1';
                facturaFormateada.NoCertificado = infoTimbrado?.Version || '1.1';
                facturaFormateada.Certificado = "MIIFyDCCA7CgAwIBAgIUMzAwMDEwMDAwMDA1MDAwMDM0NDEwDQYJKoZIhvcNAQELBQAwggErMQ8wDQYDVQQDDAZBQyBVQVQxLjAsBgNVBAoMJVNFUlZJQ0lPIERFIEFETUlOSVNUUkFDSU9OIFRSSUJVVEFSSUExGjAYBgNVBAsMEVNBVC1JRVMgQXV0aG9yaXR5MSgwJgYJKoZIhvcNAQkBFhlvc2Nhci5tYXJ0aW5lekBzYXQuZ29iLm14MR0wGwYDVQQJDBQzcmEgY2VycmFkYSBkZSBjYWxpejEOMAwGA1UEEQwFMDYzNzAxCzAJBgNVBAYTAk1YMRkwFwYDVQQIDBBDSVVEQUQgREUgTUVYSUNPMREwDwYDVQQHDAhDT1lPQUNBTjERMA8GA1UELRMIMi41LjQuNDUxJTAjBgkqhkiG9w0BCQITFnJlc3BvbnNhYmxlOiBBQ0RNQS1TQVQwHhcNMjMwNTE4MTI1NzQzWhcNMjcwNTE4MTI1NzQzWjCB7zEvMC0GA1UEAxQmVU5JVkVSU0lEQUQgUk9CT1RJQ0EgRVNQQdFPTEEgU0EgREUgQ1YxLzAtBgNVBCkUJlVOSVZFUlNJREFEIFJPQk9USUNBIEVTUEHRT0xBIFNBIERFIENWMS8wLQYDVQQKFCZVTklWRVJTSURBRCBST0JPVElDQSBFU1BB0U9MQSBTQSBERSBDVjElMCMGA1UELRMcVVJFMTgwNDI5VE02IC8gVkFEQTgwMDkyN0RKMzEeMBwGA1UEBRMVIC8gVkFEQTgwMDkyN0hTUlNSTDA1MRMwEQYDVQQLEwpTdWN1cnNhbCAxMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAjQ7j8ydOmwFYkO0BDw8vZ0yp67AuVN3";
                facturaFormateada.Sello = "Hola mundo";
                facturaFormateada.CadenaOriginalSAT = "Hola mundo";
                
                // También mantener el objeto completo por si se necesita
                facturaFormateada.infoTimbrado = infoTimbrado;
                
                console.log("XML ya está timbrado. UUID:", infoTimbrado?.UUID);
                console.log("Información del timbre añadida:", infoTimbrado);
            } else {
                console.log("XML sin timbrar - listo para timbrar");
            }
        }
        
        // Limpiar solo validaciones
        delete facturaFormateada.validaciones;
        
        return facturaFormateada;
        
    } catch (error) {
        console.error("Error al formatear factura XML:", error);
        return facturaXML;
    }
};

/**
 * Función simple solo para castear campos problemáticos (sin detección de timbrado)
 */
export const formatearFacturaXMLSimple = (facturaXML) => {
    if (!facturaXML) return null;

    try {
        const facturaFormateada = JSON.parse(JSON.stringify(facturaXML));
        
        // Castear campos problemáticos
        castearCamposCriticos(facturaFormateada);
        
        // Asegurar campos requeridos por el SAT
        asegurarCamposRequeridosSAT(facturaFormateada);
        
        // Limpiar solo validaciones
        delete facturaFormateada.validaciones;
        
        return facturaFormateada;
        
    } catch (error) {
        console.error("Error al formatear factura XML:", error);
        return facturaXML;
    }
};