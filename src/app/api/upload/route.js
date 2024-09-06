import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs'; 

const uploadDir = path.join(process.cwd(), 'public', 'logos');

export async function POST(request) {
  try {
    const data = await request.formData();
    const file = data.get('file');
    const rfc = data.get('rfc'); // Obtén el RFC del formulario

    if (!file || !rfc) {
      return new Response(JSON.stringify({ success: false, message: 'No file or RFC provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Crear la carpeta del RFC si no existe
    const companyDir = path.join(uploadDir, rfc);
    if (!fs.existsSync(companyDir)) {
      fs.mkdirSync(companyDir, { recursive: true });
    }

    // Guardar el archivo como logo.png dentro de la carpeta del RFC
    const filePath = path.join(companyDir, 'logo.png');

    // Manejo de errores al escribir el archivo
    try {
      await writeFile(filePath, buffer);
    } catch (writeError) {
      console.error('Error al guardar el archivo:', writeError);
      return new Response(JSON.stringify({ success: false, message: 'Error saving file' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`Archivo guardado en: ${filePath}`);

    return new Response(JSON.stringify({ success: true, filePath: `/logos/${rfc}/logo.png` }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en el procesamiento de la subida:', error);
    return new Response(JSON.stringify({ success: false, message: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
