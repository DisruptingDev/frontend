import { promises as fsPromises } from 'fs';
import fs from 'fs'; // Importa fs normal para createWriteStream
import path from 'path';
import archiver from 'archiver';
import puppeteer from 'puppeteer';
export async function POST(req) {
  try {
    const { htmlContent, xmlContent, fileName } = await req.json();
    
    const tempDir = path.join(process.cwd(), 'temp');
    await fsPromises.mkdir(tempDir, { recursive: true });

    // Generar archivo XML temporal
    const xmlPath = path.join(tempDir, `${fileName}.xml`);
    await fsPromises.writeFile(xmlPath, xmlContent);

    // Generar archivo PDF temporal
    const pdfPath = path.join(tempDir, `${fileName}.pdf`);
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'Letter', printBackground: true });
    await browser.close();
    await fsPromises.writeFile(pdfPath, pdfBuffer);

    // Crear el archivo ZIP
    const zipPath = path.join(tempDir, `${fileName}.zip`);
    const output = fs.createWriteStream(zipPath); // Usar fs.createWriteStream
    const archive = archiver('zip', { zlib: { level: 9 } });

    archive.pipe(output);
    archive.append(fs.createReadStream(pdfPath), { name: `${fileName}.pdf` });
    archive.append(fs.createReadStream(xmlPath), { name: `${fileName}.xml` });

    await archive.finalize();

    // Esperar a que se complete el archivo ZIP
    await new Promise((resolve, reject) => {
      output.on('close', resolve);
      archive.on('error', reject);
    });

    // Leer el archivo ZIP y devolverlo
    const zipBuffer = await fsPromises.readFile(zipPath);
    return new Response(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename=${fileName}.zip`,
      },
    });
  } catch (error) {
    console.error('Error al generar el ZIP:', error);
    return new Response(JSON.stringify({ message: 'Error al procesar la solicitud', error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
