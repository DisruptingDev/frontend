
"use client"
// const fs = require('fs');
const xml2js = require('xml2js');
// const puppeteer = require('puppeteer');

async function convertXMLToPDF(xmlString, outputPath) {
  // Parsear el XML
  const parser = new xml2js.Parser();
  const parsedXML = await parser.parseStringPromise(xmlString);
console.log('XMLL',parsedXML);

  // Generar HTML a partir del XML
  const htmlContent = `
    <html>
    <head>
      <title>Documento PDF</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        h1 { text-align: center; }
        .content { margin-top: 20px; }
      </style>
    </head>
    <body>
      <h1>Información del Documento</h1>
      <div class="content">
        <pre>${JSON.stringify(parsedXML, null, 2)}</pre>
      </div>
    </body>
    </html>
  `;

  // Convertir HTML a PDF usando Puppeteer
//   const browser = await puppeteer.launch();
//   const page = await browser.newPage();
//   await page.setContent(htmlContent);
//   await page.pdf({ path: outputPath, format: 'Letter' });

//   await browser.close();
console.log(htmlContent);
//   console.log(`PDF generado en: ${outputPath}`);
}
export default convertXMLToPDF;

// // Ejemplo de cadena XML y conversión
// const xmlString = `<Acuse xmlns="http://www.sat.gob.mx/cfd/3"...</Acuse>`; // Tu cadena XML
// const outputPath = 'documento.pdf';

// convertXMLToPDF(xmlString, outputPath)
//   .catch(error => console.error('Error al convertir:', error));
