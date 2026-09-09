import puppeteer from 'puppeteer';

export async function POST(req) {
  try {
    // Obtener el HTML y el nombre del archivo desde el body de la solicitud
    const { htmlContent, fileName } = await req.json();

    // Iniciar Puppeteer
    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();

    // Establecer el contenido HTML de la página
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

    // Generar el PDF
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      printBackground: true,
    });

    // Cerrar el navegador
    await browser.close();

    // Nombre del archivo PDF, o por defecto "generated.pdf" si no se proporciona fileName
    const pdfFileName = fileName ? `${fileName}.pdf` : 'factura.pdf';
    console.log("PDF generado",pdfFileName);

    // Devolver el PDF como una respuesta con el nombre de archivo personalizado
    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=${pdfFileName}`,
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
