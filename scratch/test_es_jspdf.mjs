import { generarPdfBufferFicha } from '../src/lib/services/fichaPdfEmailService.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
    const mockCargo = {
        id: 202,
        codigo_ficha: 'M-00202',
        referencia_bancaria: '012180015099887766',
        monto_total: 3500.00,
        fecha_emision: new Date(),
        fecha_vencimiento: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        detalles_items: JSON.stringify([
            { concepto: 'Colegiatura Mensual Marzo 2026', monto: 3000.00 },
            { concepto: 'Derecho a Examen Parcial', monto: 500.00 }
        ]),
        alumno: {
            nombre: 'María Fernanda',
            apellido_paterno: 'López',
            apellido_materno: 'Hernández',
            matricula: '2026-B104',
            carrera: 'Licenciatura en Derecho',
            email: 'maria.lopez@ejemplo.edu.mx',
            clabe_interbancaria: '012180015099887766'
        },
        emisor: {
            nombre: 'UNIVERSIDAD HISPANOAMERICANA S.C.',
            rfc: 'UHI980415XXX'
        }
    };

    console.log('Probando generarPdfBufferFicha con jsPDF nativo...');
    const pdfBuf = await generarPdfBufferFicha(mockCargo);
    console.log('PDF generado exitosamente. Tamaño buffer:', pdfBuf.length);
    fs.writeFileSync(path.join(__dirname, 'test_es_ficha.pdf'), pdfBuf);
}

main().catch(console.error);
