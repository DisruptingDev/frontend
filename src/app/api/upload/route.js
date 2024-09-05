import { writeFile } from 'fs/promises';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs'; 

const uploadDir = path.join(process.cwd(), 'public', 'uploads');

export async function POST(request) {
  try {
    // Verificar y crear la carpeta de subida si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const data = await request.formData();
    const file = data.get('file');

    if (!file) {
      return new Response(JSON.stringify({ success: false, message: 'No file uploaded' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const filePath = path.join(uploadDir, file.name);

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

    return new Response(JSON.stringify({ success: true, filePath: `/uploads/${file.name}` }), {
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
