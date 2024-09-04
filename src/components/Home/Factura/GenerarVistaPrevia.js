"use client";


// Función para cargar la plantilla HTML desde un archivo
const loadTemplate = async (path) => {
    try {
        const response = await fetch(path);
        if (!response.ok) {
            throw new Error('No se pudo cargar la plantilla');
        }
        return await response.text();
    } catch (error) {
        console.error('Error al cargar la plantilla:', error);
        return '';
    }
};

// Función para reemplazar los placeholders en la plantilla con los datos de factura
const fillTemplate = (template, factura) => {
    // Generar HTML para conceptos
    const conceptosHTML = factura.Conceptos.ListaConceptos.map(concepto => {
        // Generar HTML para impuestos retenidos
        const retencionesHTML = concepto.Impuestos.Retenciones.map(retencion => `
            <small>IMPUESTO: <span>${retencion.ImpuestoClave} - Retención</span></small>
            <small>IMPORTE: <span>$${retencion.Importe.toFixed(2)}</span></small>
            <br>
        `).join('');
    
        // Generar HTML para impuestos trasladados
        const trasladosHTML = concepto.Impuestos.Traslados.map(traslado => `
            <small>IMPUESTO: <span>${traslado.ImpuestoClave} - Traslado</span></small>
            <small>IMPORTE: <span>$${traslado.Importe.toFixed(2)}</span></small>
            <br>
        `).join('');
    
        return `
            <tr>
                <td>${concepto.Cantidad.toFixed(5)}</td>
                <td>${concepto.ClaveUnidad}</td>
                <td>
                    ${concepto.Descripcion}
                    <br>
                    <small>CLAVE SAT: <span>${concepto.ClaveProdServ}</span></small>
                    <small>No. IDENTIFICACIÓN: <span>${concepto.NoIdentificacion || 'N/A'}</span></small>
                    <br>
                    ${retencionesHTML}
                    ${trasladosHTML}
                </td>
                <td>${concepto.ValorUnitario.toFixed(2)}</td>
                <td>${concepto.Importe.toFixed(2)}</td>
            </tr>
        `;
    }).join('');

   

    

    // Reemplazar los placeholders en la plantilla con los valores correspondientes
    return template
    .replace('{{nombreEmisor}}', Prueba)
    .replace('{{rfcEmisor}}', factura.Emisor.Rfc)
    .replace('{{direccionEmisor}}', factura.Emisor.DomicilioFiscal.Calle)
    .replace('{{version}}', factura.Version)
    .replace('{{serie}}', factura.Serie)
    .replace('{{folio}}', factura.Folio)
    .replace('{{fecha}}', new Date(factura.Fecha).toLocaleString())
    .replace('{{formaPago}}', factura.FormaPago)
    .replace('{{subTotal}}', factura.SubTotal.toFixed(2))
    .replace('{{total}}', factura.Total.toFixed(2))
    .replace('{{lugarExpedicion}}', factura.LugarExpedicion)
    .replace('{{conceptos}}', conceptosHTML);
};

// Función para generar el PDF usando html2pdf
const generarVistaPrevia = async (factura) => {
    console.log('Ejecutando generatePDF con la factura:', factura);  // Agrega este log
    try {
        const template = await loadTemplate('/plantillas/plantilla-prueba.html');
        if (!template) {
            throw new Error('No se pudo cargar la plantilla para la vista previa.');
        }
        const filledTemplate = fillTemplate(template, factura);
        return filledTemplate;
        // setPreviewContent(filledTemplate);
        // setOpenModal(true);
    } catch (error) {
        console.error("Error al mostrar la vista previa: ", error);
    }
};

export default generarVistaPrevia;
