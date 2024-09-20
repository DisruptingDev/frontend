// src/app/api/generate-pdf/route.js
import puppeteer from 'puppeteer';

export async function POST(req) {
  try {
    const { htmlContent } = await req.json(); // Obtener el HTML desde el body de la solicitud

    // Iniciar Puppeteer
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Establecer el contenido HTML de la página
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generar el PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    // Cerrar el navegador
    await browser.close();

    // Devolver el PDF como una respuesta
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=generated.pdf',
      },
    });
  } catch (error) {
    console.error('Error al generar el PDF:', error);
    return new Response(JSON.stringify({ message: 'Error al procesar la solicitud', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
