"use client";
import { PagesOutlined } from '@mui/icons-material';
// import html2pdf from 'html2pdf.js';
import QRCode from 'qrcode';

function numeroALetras(num, moneda = 'pesos') {
    const unidades = ['cero', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
    const especiales = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
    const decenas = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
    const centenas = ['', 'cien', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

    function convertirDecenas(num) {
        if (num < 10) return unidades[num];
        if (num >= 10 && num < 20) return especiales[num - 10];
        const dec = Math.floor(num / 10);
        const unidad = num % 10;
        return `${decenas[dec]}${unidad ? ' y ' + unidades[unidad] : ''}`;
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
        if (num < 1000) return convertirCentenas(num);
        if (num < 1000000) return convertirMiles(num);
        return convertirMillones(num);
    }

    // Dividir la parte entera y decimal
    const partes = num.toFixed(2).split('.');
    const parteEntera = parseInt(partes[0], 10);
    const parteDecimal = parseInt(partes[1], 10);

    let monedaLetra = `${convertirNumero(parteEntera)} ${moneda}`;
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
const fillTemplate = async (template, data) => {
    let factura

    if (data.factura) {
        factura = data.factura;
        console.log("datos:", factura);
    }
    else {
        factura = data;
        console.log("datos:", factura);
    }
    // // Generar HTML para conceptos
    // const conceptosHTML = factura.Conceptos.ListaConceptos.map(concepto => {
    //     // Generar HTML para impuestos retenidos
    //     const retencionesHTML = concepto.Impuestos.Retenciones.map(retencion => `
    //         <small>IMPUESTO: <span>${retencion.ImpuestoClave} - Retención</span></small>
    //         <small>IMPORTE: <span>$${retencion.Importe.toFixed(2)}</span></small>
    //         <br>
    //     `).join('');

    //     // Generar HTML para impuestos trasladados
    //     const trasladosHTML = concepto.Impuestos.Traslados.map(traslado => `
    //         <small>IMPUESTO: <span>${traslado.ImpuestoClave} - Traslado</span></small>
    //         <small>IMPORTE: <span>$${traslado.Importe.toFixed(2)}</span></small>
    //         <br>
    //     `).join('');

    //     return `
    //         <tr>
    //             <td>${concepto.Cantidad}</td>
    //             <td>${concepto.ClaveUnidad}</td>
    //             <td>
    //                 ${concepto.Descripcion}
    //                 <br>
    //                 <small>CLAVE SAT: <span>${concepto.ClaveProdServ}</span></small>
    //                 <small>No. IDENTIFICACIÓN: <span>${concepto.NoIdentificacion || 'N/A'}</span></small>
    //                 <br>
    //                 ${retencionesHTML}
    //                 ${trasladosHTML}
    //             </td>
    //             <td>${concepto.ValorUnitario.toFixed(2)}</td>
    //             <td>${concepto.Importe.toFixed(2)}</td>
    //         </tr>
    //     `;
    // }).join('');

    // // Generar HTML para impuestos adicionales
    // // Generar HTML para impuestos retenidos
    // const retencionesHTML = factura.Conceptos.ListaConceptos.flatMap(concepto => concepto.Impuestos.Retenciones).map(retencion => `
    //     <p><span>${retencion.NombreImpuesto || retencion.ImpuestoCatalogo?.Impuesto}</span> <span>$</span> <span>${retencion.Importe}</span></p>
       
    // `).join('');

    // // Generar HTML para impuestos trasladados
    // const trasladosHTML = factura.Conceptos.ListaConceptos.flatMap(concepto => concepto.Impuestos.Traslados).map(traslado => `
    //   <p><span>${traslado.NombreImpuesto || traslado.ImpuestoCatalogo?.Impuesto}</span> <span>$</span> <span>${traslado.Importe}</span></p>
    // `).join('');

    // const impuestos = retencionesHTML + trasladosHTML;



    let direccionEmisor='';
        if(factura.Emisor.Calle){
            direccionEmisor += factura.Emisor.Calle ;
            if(factura.Emisor.NumeroExterior){
                direccionEmisor += ', ' + factura.Emisor.NumeroExterior;
            }
            if(factura.Emisor.NumeroInterior){
                direccionEmisor += ', ' + factura.Emisor.NumeroInterior;
            }
            if(factura.Emisor.Colonia){
                direccionEmisor += ', ' + factura.Emisor.Colonia;
            }
            if(factura.Emisor.Municipio){
                direccionEmisor += ', ' + factura.Emisor.Municipio;
            }
        }
        

 
    
    console.log('direccionEmisor', direccionEmisor);


    let direccionReceptor = '';
    console.log('factura.Receptor', factura.Receptor);
    if(factura.Receptor.Calle){
        direccionReceptor += factura.Receptor.Calle ;
        if(factura.Receptor.NumeroExterior){
            direccionReceptor += ', ' + factura.Receptor.NumeroExterior;
        }
        if(factura.Receptor.NumeroInterior){
            direccionReceptor += ', ' + factura.Receptor.NumeroInterior;
        }
        if(factura.Receptor.Colonia){
            direccionReceptor += ', ' + factura.Receptor.Colonia;
        }
        if(factura.Receptor.Municipio){
            direccionReceptor += ', ' + factura.Receptor.Municipio;
        }
        if(factura.Receptor.Estado){
            direccionReceptor += ', ' + factura.Receptor.Estado;
        }
    }
    console.log('direccionReceptor', direccionReceptor);

    if (direccionEmisor.includes('undefined')) {
        direccionEmisor = '';
    }
    if (direccionReceptor.includes('undefined')) {
        direccionReceptor = '';
    }


    let qrImageBase64 = '';


    if (factura.uuid) {
        const firma = factura.Certificado;
        const ultimos8 = firma.slice(-8);
        const cadenaQr = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?&id=${factura.uuid}&re=${factura.Emisor.Rfc}&rr=${factura.Receptor.Rfc}&tt=${factura.Total}&fe=${ultimos8}`;
        // Generar código QR dinámico desde la cadena
        try {
            qrImageBase64 = await QRCode.toDataURL(cadenaQr, { errorCorrectionLevel: 'H' });
        } catch (error) {
            console.error('Error al generar el código QR:', error);
        }


    }
    let formaPago, metodoPago, regimenFiscalEmisor, RegimenFiscalReceptor, usoCFDI;
    if (data.forma_pago) {
        formaPago = data.forma_pago.Clave + ' ' + data.forma_pago.Descripcion;
        metodoPago = data.metodo_pago.Clave + ' ' + data.metodo_pago.Descripcion;
        regimenFiscalEmisor = data.regimen_fiscal_emisor.Clave + ' ' + data.regimen_fiscal_emisor.Descripcion;
        regimenFiscalReceptor = data.regimen_fiscal_receptor.Clave + ' ' + data.regimen_fiscal_receptor.Descripcion;
        usoCFDI = data.uso_cfdi.Clave + ' ' + data.uso_cfdi.Descripcion;
    }
    else {
        formaPago = factura.FormaPago + ' ' + factura.FormaPagoDescripcion;
        metodoPago = factura.MetodoPago + ' ' + factura.MetodoPagoDescripcion;
        regimenFiscalEmisor = factura.Emisor.RegimenFiscal;

        RegimenFiscalReceptor = factura.Receptor.RegimenFiscal
        usoCFDI = factura.Receptor.UsoCFDI + ' ' + factura.Receptor.UsoCFDIDescripcion;

    }
    


    const observacionesHTML = factura.Descripcion
      ? `<div class="seccion">
           <h2>Observaciones / Información Adicional</h2>
           <p style="font-size: 11px;">${factura.Descripcion}</p>
         </div>`
      : "";

    // Reemplazar los placeholders en la plantilla con los valores correspondientes
    return template
        .replace("{{observaciones}}", observacionesHTML)
        .replace("{{qrCode}}",
        qrImageBase64
          ? `<img src="${qrImageBase64}" alt="Código QR">`
          : '<img src="/images/qr-code.png" alt="Código QR">') // Insertar el QR

        .replace("{{logo}}",
        factura.Emisor.LogoPath
          ? `<img src="${factura.Emisor.LogoPath}" alt="Logo">`
          : '<img src="/images/Logo_wise_factura.png" alt="Logo">' // Insertar el logo
        )
        .replace('{{nombreEmisor}}', factura.Emisor.Nombre)
        .replace('{{rfcEmisor}}', factura.Emisor.Rfc)
        .replace('{{direccionEmisor}}',  direccionEmisor || "")
        .replace('{{regimenFiscalEmisor}}', regimenFiscalEmisor)

        .replace('{{folioFactura}}', factura.Folio || "")
        .replace('{{folioFiscal}}', factura.uuid || "")
        .replace('{{serieCSD}}', factura.NoCertificado || "")
        .replace('{{fechaEmision}}', factura.Fecha || "")
        .replace('{{TipoComprobante}}', factura.TipoDeComprobante || "")
        .replace('{{Exportacion}}', factura.Exportacion || "")


        .replace('{{nombreReceptor}}', factura.Receptor.Nombre)
        .replace('{{rfcReceptor}}', factura.Receptor.Rfc)
        .replace('{{direccionReceptor}}', factura.ReceptorDireccion || direccionReceptor || "")
        .replace('{{regimenFiscalReceptor}}', factura.Receptor.RegimenFiscal)    
        // .replace('{{usoCFDI}}',(factura.Receptor.UsoCFDI  +' ' + factura.Receptor.UsoCFDIDescripcion) || factura.UsoCFDI)



        .replace('{{subtotal}}', factura.SubTotal.toFixed(2))
        .replace('{{descuento}}', factura.descuento || 0.00)
        .replace('{{retenciones}}', factura.Conceptos.TotalImpuestosRetenidos)
        .replace('{{traslados}}', factura.Conceptos.TotalImpuestosTrasladados)
        .replace('{{total}}', factura.Total.toFixed(2))
        .replace('{{totalLetra}}', numeroALetras(factura.Total, 'pesos'))

        .replace('{{version}}', factura.Version)
        .replace('{{serie}}', factura.Serie)
        .replace('{{folio}}', factura.Folio)
        .replace('{{fecha}}', new Date(factura.Fecha).toLocaleString())
        .replace('{{lugarExpedicion}}', factura.LugarExpedicion)
        // .replace('{{conceptos}}', conceptosHTML)

        // .replace('{{formaPago}}', (factura.FormaPago+' '+ factura.FormaPagoDescripcion) || factura.FormaPago)


        .replace('{{divisa}}', factura.Moneda)

        .replace('{{uuidRelacionado}}', factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].IdDocumento)
        .replace('{{parcialidad}}', factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].Numparcialidad)
        .replace('{{saldoAnterior}}', factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoAnt)
        .replace('{{importePagado}}', factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpPagado)
        .replace('{{saldoInsoluto}}', factura.Complemento.Pagos.Pagos[0].DoctoRelacionados[0].ImpSaldoInsoluto)



        .replace('{{selloCFDI}}', factura.Sello || "<br><br>")
        .replace('{{selloSAT}}', factura.selloSAT || "<br><br>")
        .replace('{{cadenaSAT}}', factura.cadenaOriginalSAT || "<br><br>")
        .replace('{{serieCertificadoSAT}}', factura.NoCertificado || "<br><br>")
        .replace('{{fechaCertificacion}}', factura.fechaTimbrado || "<br><br>")


        .replace('{{formaPago}}', formaPago)
        .replace('{{metodoPago}}', metodoPago)
        .replace('{{regimenFiscal}}', RegimenFiscalReceptor)
        .replace('{{usoCFDI}}', usoCFDI)
        .replace('{{condicionesPago}}', factura.CondicionesDePago || "Sin dato");

};


// Función para generar el PDF usando html2pdf
const generarVistaPrevia = async (factura) => {
    //console.log('Ejecutando generatePDF con la factura:', factura);
    try {
        let filledTemplate;
        const template = await loadTemplate('/plantillas/plantilla-rpe.html');
        // const template = await loadTemplate('/plantillas/cancelado.html');
        if (!template) {
            throw new Error('No se pudo cargar la plantilla para la vista previa.');
        }
     
    filledTemplate = await fillTemplate(template, factura);

        
      
// console.log('filledTemplate', filledTemplate);
        return filledTemplate;
    } catch (error) {
        console.error("Error al mostrar la vista previa: ", error);
    }
};

export default generarVistaPrevia;
