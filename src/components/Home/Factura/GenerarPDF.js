"use client";
import jsPDF from 'jspdf';
import html2pdf from 'html2pdf.js';

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
    const conceptosHTML = factura.Conceptos.ListaConceptos.map(concepto => `
        <div class="concepto-item">
            <span>${concepto.ClaveProdServ}</span>
            <span>${concepto.Descripcion}</span>
            <span>${concepto.Cantidad}</span>
            <span>${concepto.ValorUnitario}</span>
            <span>${concepto.Importe}</span>
        </div>
    `).join('');

    // Generar HTML para impuestos retenidos
    const retencionesHTML = factura.Conceptos.ListaConceptos.flatMap(concepto => concepto.Impuestos.Retenciones).map(retencion => `
        <div class="impuesto-item">
            <span>${retencion.Base}</span>
            <span>${retencion.ImpuestoClave}</span>
            <span>${retencion.TipoFactor}</span>
            <span>${retencion.TasaOCuota}</span>
            <span>${retencion.Importe}</span>
        </div>
    `).join('');

    // Generar HTML para impuestos trasladados
    const trasladosHTML = factura.Conceptos.ListaConceptos.flatMap(concepto => concepto.Impuestos.Traslados).map(traslado => `
        <div class="impuesto-item">
            <span>${traslado.Base}</span>
            <span>${traslado.ImpuestoClave}</span>
            <span>${traslado.TipoFactor}</span>
            <span>${traslado.TasaOCuota}</span>
            <span>${traslado.Importe}</span>
        </div>
    `).join('');

    // Reemplazar los placeholders en la plantilla con los valores correspondientes
    return template
        .replace('{{version}}', factura.Version)
        .replace('{{serie}}', factura.Serie)
        .replace('{{folio}}', factura.Folio)
        .replace('{{fecha}}', factura.Fecha)
        .replace('{{formaPago}}', factura.FormaPago)
        .replace('{{condicionesDePago}}', factura.CondicionesDePago)
        .replace('{{subTotal}}', factura.SubTotal)
        .replace('{{total}}', factura.Total)
        .replace('{{lugarExpedicion}}', factura.LugarExpedicion)
        .replace('{{conceptos}}', conceptosHTML)
        .replace('{{retenciones}}', retencionesHTML)
        .replace('{{traslados}}', trasladosHTML);
        //Informacion Global
        // .replace('{{periodicidad}}', factura.InformacionGlobal);
};

// Función para generar el PDF usando html2pdf
// Función para generar el PDF usando html2pdf
const generatePDF = async (factura) => {
    try {
        if (typeof window === 'undefined') {
            console.error('html2pdf solo debe ejecutarse en el cliente.');
            return;
        }

        const template = await loadTemplate('/plantillas/plantilla.html');

        if (!template) {
            throw new Error('No se pudo cargar la plantilla para generar el PDF.');
        }

        const filledTemplate = fillTemplate(template, factura); // Rellenar la plantilla con los datos

        // Crear un elemento div temporal para renderizar el HTML
        const element = document.createElement('div');
        element.innerHTML = filledTemplate;

        // Configuraciones para html2pdf
        const options = {
            margin: 10,
            filename: 'factura.pdf',
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // Generar el PDF
        html2pdf().from(element).set(options).save();
    } catch (error) {
        console.error("Error al generar el PDF: ", error);
    }
};

export default generatePDF;
