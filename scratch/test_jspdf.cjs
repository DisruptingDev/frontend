const { jsPDF } = require('jspdf');
require('jspdf-autotable');

try {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });
    doc.text('Ficha de Cargo Test', 40, 40);
    const arrayBuffer = doc.output('arraybuffer');
    const buffer = Buffer.from(arrayBuffer);
    console.log('jsPDF generado correctamente. Tamaño buffer:', buffer.length);
} catch (err) {
    console.error('Error con jsPDF:', err);
}
