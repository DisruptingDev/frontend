/**
 * Detecta si un XML ya está timbrado
 */
export const detectarTimbradoXML = (xmlContent) => {
  if (!xmlContent) return false;

  try {
    // Buscar elementos específicos de un CFDI timbrado
    const tieneComplementoTimbre = xmlContent.includes(
      "http://www.sat.gob.mx/TimbreFiscalDigital"
    );
    const tieneTimbreFiscal =
      xmlContent.includes("tfd:TimbreFiscalDigital") ||
      xmlContent.includes("TimbreFiscalDigital");
    const tieneUUID = xmlContent.includes("UUID");

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
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
    const timbre =
      xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0] ||
      xmlDoc.getElementsByTagName("TimbreFiscalDigital")[0];

    if (!timbre) return null;

    const UUID = timbre.getAttribute("UUID") || "";
    const FechaTimbrado = timbre.getAttribute("FechaTimbrado") || "";
    const NoCertificadoSAT = timbre.getAttribute("NoCertificadoSAT") || "";
    const SelloCFD = timbre.getAttribute("SelloCFD") || "";
    const SelloSAT = timbre.getAttribute("SelloSAT") || "";
    const Version = timbre.getAttribute("Version") || "1.1";

    // ✅ Construir la cadena original SAT (oficial)
    const CadenaOriginalSAT = `||${Version}|${UUID}|${FechaTimbrado}|${SelloCFD}|${NoCertificadoSAT}||`;

    return {
      UUID,
      FechaTimbrado,
      NoCertificadoSAT,
      SelloCFD,
      SelloSAT,
      Version,
      CadenaOriginalSAT,
    };
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
    factura.Conceptos.ListaConceptos.forEach((concepto) => {
      if (concepto.Impuestos?.Traslados) {
        concepto.Impuestos.Traslados.forEach((traslado) => {
          if (typeof traslado.ImpuestoCatalogoID === "string") {
            traslado.ImpuestoCatalogoID = parseInt(
              traslado.ImpuestoCatalogoID,
              10
            );
          }
          if (typeof traslado.TasaCatalogoID === "string") {
            traslado.TasaCatalogoID = parseInt(traslado.TasaCatalogoID, 10);
          }
        });
      }

      if (concepto.Impuestos?.Retenciones) {
        concepto.Impuestos.Retenciones.forEach((retencion) => {
          if (typeof retencion.ImpuestoCatalogoID === "string") {
            retencion.ImpuestoCatalogoID = parseInt(
              retencion.ImpuestoCatalogoID,
              10
            );
          }
          if (typeof retencion.TasaCatalogoID === "string") {
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
    factura.Conceptos.ListaConceptos.forEach((concepto) => {
      // ✅ Campo Unidad no puede estar vacío - asignar valor por defecto
      if (!concepto.Unidad || concepto.Unidad.trim() === "") {
        concepto.Unidad = "UNIDAD";
      }

      // ✅ Campo NoIdentificacion puede estar vacío pero no null
      if (
        concepto.NoIdentificacion === null ||
        concepto.NoIdentificacion === undefined
      ) {
        concepto.NoIdentificacion = "";
      }

      // ✅ Asegurar que ClaveUnidad tenga valor
      if (!concepto.ClaveUnidad || concepto.ClaveUnidad.trim() === "") {
        concepto.ClaveUnidad = "H87";
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

    // 🔧 Castear y asegurar campos del SAT
    castearCamposCriticos(facturaFormateada);
    asegurarCamposRequeridosSAT(facturaFormateada);

    // ================================================================
    // 🔍 Extraer información de timbrado
    // ================================================================
    let estaTimbrado = false;
    let infoTimbrado = null;

    const timbre = facturaXML?.factura_completa?.timbre;
    const timbradoValido =
      facturaXML?.factura_completa?.validaciones?.timbre_valido === true;

    if (timbre || timbradoValido) {
      estaTimbrado = true;
      infoTimbrado = timbre || {};
    }

    // Si no hay timbre en la respuesta, intentar extraerlo desde el XML
    if (!infoTimbrado && xmlContentOriginal) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContentOriginal, "text/xml");

      const timbreNode =
        xmlDoc.getElementsByTagName("tfd:TimbreFiscalDigital")[0] ||
        xmlDoc.getElementsByTagName("TimbreFiscalDigital")[0];

      if (timbreNode) {
        infoTimbrado = {
          UUID: timbreNode.getAttribute("UUID") || "",
          FechaTimbrado: timbreNode.getAttribute("FechaTimbrado") || "",
          RfcProvCertif: timbreNode.getAttribute("RfcProvCertif") || "",
          NoCertificadoSAT: timbreNode.getAttribute("NoCertificadoSAT") || "",
          SelloSAT: timbreNode.getAttribute("SelloSAT") || "",
        };
        estaTimbrado = true;
      }
    }

    // ================================================================
    // 🔍 Extraer campos del nodo Comprobante
    // ================================================================
    if (xmlContentOriginal) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContentOriginal, "text/xml");
      const comprobante = xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];

      if (comprobante) {
        facturaFormateada.Certificado =
          comprobante.getAttribute("Certificado") || "";
        facturaFormateada.NoCertificado =
          comprobante.getAttribute("NoCertificado") || "";
        facturaFormateada.Sello = comprobante.getAttribute("Sello") || "";
      }

      // ✅ Generar QR solo si está timbrado
      if (estaTimbrado && infoTimbrado) {
        const generarURLQR = (xmlDoc, infoTimbrado) => {
          const comprobante =
            xmlDoc.getElementsByTagName("cfdi:Comprobante")[0];
          const emisor = xmlDoc.getElementsByTagName("cfdi:Emisor")[0];
          const receptor = xmlDoc.getElementsByTagName("cfdi:Receptor")[0];

          const RFCEmisor = emisor?.getAttribute("Rfc") || "";
          const RFCReceptor = receptor?.getAttribute("Rfc") || "";
          const Total = parseFloat(comprobante?.getAttribute("Total") || "0")
            .toFixed(6)
            .padStart(17, "0");
          const ultimos8Sello = (
            comprobante?.getAttribute("Sello") || ""
          ).slice(-8);

          return `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${infoTimbrado.UUID}&re=${RFCEmisor}&rr=${RFCReceptor}&tt=${Total}&fe=${ultimos8Sello}`;
        };

        facturaFormateada.QRCode = generarURLQR(xmlDoc, infoTimbrado);
      }
    }

    // ================================================================
    // 🧩 Agregar campos al nivel raíz
    // ================================================================
    if (!infoTimbrado) estaTimbrado = false;

    facturaFormateada.estaTimbrado = estaTimbrado;
    facturaFormateada.infoTimbrado = infoTimbrado || {};
    facturaFormateada.XMLTimbrado = facturaXML.xml_content || "";

    if (infoTimbrado) {
      facturaFormateada.UUID = infoTimbrado.UUID || "";
      facturaFormateada.FechaTimbrado = infoTimbrado.FechaTimbrado || "";
      facturaFormateada.NoCertificadoSAT = infoTimbrado.NoCertificadoSAT || "";
      facturaFormateada.SelloCFD = infoTimbrado.SelloCFD || "";
      facturaFormateada.SelloSAT = infoTimbrado.SelloSAT || "";
      facturaFormateada.CadenaOriginalSAT =
        infoTimbrado.CadenaOriginalSAT ||
        `||${infoTimbrado.Version || "1.1"}|${infoTimbrado.UUID || ""}|${infoTimbrado.FechaTimbrado || ""}|${infoTimbrado.SelloCFD || ""}|${infoTimbrado.NoCertificadoSAT || ""}||`;
    }

    // Limpieza final
    delete facturaFormateada.validaciones;

    console.log("✅ Factura formateada lista para enviar:", facturaFormateada);
    return facturaFormateada;
  } catch (error) {
    console.error("❌ Error al formatear factura XML:", error);
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
