const fs = require('fs');
const path = require('path');

async function testHtml() {
    // Import ES Module
    const service = await import('../src/lib/services/fichaPdfEmailService.js');
    
    const mockCargo = {
        id: 101,
        codigo_ficha: 'M-00101',
        referencia_bancaria: '987654321012345678',
        monto_total: 2850.50,
        fecha_emision: new Date(),
        fecha_vencimiento: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        detalles_items: JSON.stringify([
            { concepto: 'Colegiatura Mensual Febrero 2026', monto: 2500.00 },
            { concepto: 'Constancia de Estudios Oficial', monto: 350.50 }
        ]),
        alumno: {
            nombre: 'Juan Carlos',
            apellido_paterno: 'Pérez',
            apellido_materno: 'Gómez',
            matricula: '2026-A992',
            carrera: 'Licenciatura en Administración',
            email: 'juan.perez@ejemplo.edu.mx',
            clabe_interbancaria: '012180015012345678'
        },
        emisor: {
            nombre: 'UNIVERSIDAD HISPANOAMERICANA S.C.',
            rfc: 'UHI980415XXX'
        }
    };

    console.log('--- Generando HTML de Ficha ---');
    const html = service.generarHtmlFichaCargo(mockCargo);
    console.log('HTML generado (longitud):', html.length);
    
    console.log('--- Generando PDF Buffer con Puppeteer ---');
    try {
        const pdfBuf = await service.generarPdfBufferFicha(mockCargo);
        console.log('PDF generado exitosamente. Tamaño buffer (bytes):', pdfBuf.length);
        const outputPath = path.join(__dirname, 'test_ficha.pdf');
        fs.writeFileSync(outputPath, pdfBuf);
        console.log('PDF guardado en:', outputPath);
    } catch (err) {
        console.error('Error durante generación de PDF:', err);
    }
}

testHtml().catch(console.error);
