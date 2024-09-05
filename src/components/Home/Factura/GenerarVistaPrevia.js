"use client";

function numeroALetras(num, moneda) {
    const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];
    
    function convertirDecenas(num) {
        if (num < 10) return unidades[num];
        else if (num >= 10 && num < 20) return especiales[num - 10];
        else {
            const dec = Math.floor(num / 10);
            const unidad = num % 10;
            return `${decenas[dec]}${unidad ? ' y ' + unidades[unidad] : ''}`;
        }
    }
    
    function convertirCentenas(num) {
        const cen = Math.floor(num / 100);
        const dec = num % 100;
        if (cen === 1 && dec === 0) return 'cien';
        return `${centenas[cen]}${dec ? ' ' + convertirDecenas(dec) : ''}`;
    }
    
    function convertirMiles(num) {
        const mil = Math.floor(num / 1000);
        const resto = num % 1000;
        if (mil === 1) return `mil ${convertirCentenas(resto)}`;
        return `${convertirCentenas(mil)} mil ${convertirCentenas(resto)}`;
    }
    
    function convertirMillones(num) {
        const millon = Math.floor(num / 1000000);
        const resto = num % 1000000;
        if (millon === 1) return `un millón ${convertirMiles(resto)}`;
        return `${convertirCentenas(millon)} millones ${convertirMiles(resto)}`;
    }
    
    function convertirNumero(num) {
        if (num < 100) return convertirDecenas(num);
        else if (num < 1000) return convertirCentenas(num);
        else if (num < 1000000) return convertirMiles(num);
        else return convertirMillones(num);
    }
    
    // Dividir la parte entera y decimal
    const partes = num.toFixed(2).split('.');
    const parteEntera = parseInt(partes[0], 10);
    const parteDecimal = parseInt(partes[1], 10);

    let monedaLetra = `${convertirNumero(parteEntera)} ${moneda || 'pesos'}`;
    if (parteDecimal > 0) {
        monedaLetra += ` con ${convertirNumero(parteDecimal)} centavos`;
    }

    return monedaLetra;
}
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
                <td>${concepto.Cantidad}</td>
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

    // Generar HTML para impuestos adicionales
    // Generar HTML para impuestos retenidos
    const retencionesHTML = factura.Conceptos.ListaConceptos.flatMap(concepto => concepto.Impuestos.Retenciones).map(retencion => `
        <p><span>${retencion.NombreImpuesto}</span> <span>$</span> <span>${retencion.Importe}</span></p>
       
    `).join('');

    // Generar HTML para impuestos trasladados
    const trasladosHTML = factura.Conceptos.ListaConceptos.flatMap(concepto => concepto.Impuestos.Traslados).map(traslado => `
      <p><span>${traslado.NombreImpuesto}</span> <span>$</span> <span>${traslado.Importe}</span></p>
    `).join('');

const impuestos = retencionesHTML + trasladosHTML;
   

    

    // Reemplazar los placeholders en la plantilla con los valores correspondientes
    return template
    .replace('{{nombreEmisor}}',factura.EmisorNombre)
    .replace('{{rfcEmisor}}',factura.EmisorRFC)
    .replace('{{direccionEmisor}}',factura.EmisorDireccion)
    .replace('{{regimenFiscalEmisor}}',factura.EmisorRegimenFiscal)
    .replace('{{nombreReceptor}}',factura.ReceptorNombre)
    .replace('{{rfcReceptor}}',factura.ReceptorRFC)
    .replace('{{direccionReceptor}}',factura.ReceptorDireccion)
    .replace('{{usoCFDI}}',factura.ReceptorUsoCFDI+' ' + factura.ReceptorUsoCFDIDescripcion)


   .replace('{{subtotal}}', factura.SubTotal.toFixed(2))
   .replace('{{impuestos}}', impuestos)
   .replace('{{total}}', factura.Total.toFixed(2))
   .replace('{{totalLetra}}',numeroALetras(factura.Total,'pesos'))

    .replace('{{version}}', factura.Version)
    .replace('{{serie}}', factura.Serie)
    .replace('{{folio}}', factura.Folio)
    .replace('{{fecha}}', new Date(factura.Fecha).toLocaleString())
    
    
   
    .replace('{{lugarExpedicion}}', factura.LugarExpedicion)
    .replace('{{conceptos}}', conceptosHTML)

    .replace('{{formaPago}}', factura.FormaPago+' '+ factura.FormaPagoDescripcion)
    .replace('{{regimenFiscal}}', factura.ReceptorRegimenFiscal)
    .replace('{{divisa}}',factura.Moneda)
    .replace('{{metodoPago}}', factura.MetodoPago + ' ' + factura.MetodoPagoDescripcion)
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
