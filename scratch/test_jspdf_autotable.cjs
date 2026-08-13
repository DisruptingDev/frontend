const { jsPDF } = require('jspdf');
require('jspdf-autotable');
const fs = require('fs');
const path = require('path');

function formatMoney(amount) {
    const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
}

function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function generarPdfFichaCargoJsPdf(cargo) {
    const doc = new jsPDF({ unit: 'pt', format: 'letter' });

    const alumno = cargo.alumno || {};
    const emisor = alumno.emisor || cargo.emisor || {};
    const emisorNombre = emisor.nombre || 'UNIVERSIDAD HISPANOAMERICANA S.C.';
    const emisorRfc = emisor.rfc || 'UHI980415XXX';

    const alumnoNombre = `${alumno.nombre || ''} ${alumno.apellido_paterno || ''} ${alumno.apellido_materno || ''}`.trim() || 'Estudiante';
    const matricula = alumno.matricula || 'N/A';
    const carrera = alumno.carrera || 'General / Licenciatura';
    const emailAlumno = alumno.email || alumno.receptor?.email || 'No registrado';

    const codigoFicha = cargo.codigo_ficha || `F-${cargo.id || '00000'}`;
    const referenciaBancaria = alumno.clabe_interbancaria || cargo.referencia_bancaria || 'N/A';
    const fechaEmision = formatDate(cargo.fecha_emision || new Date());
    const fechaVencimiento = formatDate(cargo.fecha_vencimiento);

    let items = [];
    if (cargo.detalles_items) {
        try {
            items = typeof cargo.detalles_items === 'string' ? JSON.parse(cargo.detalles_items) : cargo.detalles_items;
        } catch (e) {
            items = [];
        }
    }

    if (!Array.isArray(items) || items.length === 0) {
        items = [{
            concepto: cargo.concepto?.nombre || 'Colegiatura Mensual / Concepto de Cobro',
            monto: Number(cargo.monto_total || 0)
        }];
    }

    const montoTotal = Number(cargo.monto_total || items.reduce((sum, item) => sum + (parseFloat(item.monto) || 0), 0));

    // Header Banner
    doc.setFillColor(27, 56, 74); // #1b384a
    doc.rect(0, 0, 612, 70, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(emisorNombre.toUpperCase(), 306, 32, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`RFC: ${emisorRfc} | Servicios Financieros y Cobranza Institucional`, 306, 48, { align: 'center' });

    // Subtitle Strip
    doc.setFillColor(37, 99, 235); // #2563eb
    doc.rect(0, 70, 612, 22, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('FICHA OFICIAL DE CARGO Y PAGO DE COLEGIATURA', 306, 85, { align: 'center' });

    // Box: Info Alumno & Ficha
    let y = 110;
    doc.setDrawColor(203, 213, 225); // #cbd5e1
    doc.setFillColor(248, 250, 252); // #f8fafc
    doc.roundedRect(40, y, 532, 90, 4, 4, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CÓDIGO ÚNICO DE FICHA:', 55, y + 20);
    doc.setFont('courier', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(29, 78, 216);
    doc.text(codigoFicha, 55, y + 36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('ESTUDIANTE / ALUMNO:', 310, y + 20);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(alumnoNombre, 310, y + 36);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('MATRÍCULA ID:', 55, y + 56);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(matricula, 55, y + 70);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('PROGRAMA / CARRERA:', 310, y + 56);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text(carrera, 310, y + 70);

    // Fechas & Email
    y += 105;
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text('CORREO REGISTRADO:', 55, y);
    doc.setTextColor(51, 65, 85);
    doc.text(emailAlumno, 175, y);

    doc.setTextColor(100, 116, 139);
    doc.text('FECHA EMISIÓN:', 350, y);
    doc.setTextColor(51, 65, 85);
    doc.text(fechaEmision, 440, y);

    y += 15;
    doc.setTextColor(100, 116, 139);
    doc.text('FECHA VENCIMIENTO:', 350, y);
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.text(fechaVencimiento, 470, y);

    // Table of concepts using autoTable
    y += 20;
    const tableBody = items.map(it => [it.concepto, formatMoney(it.monto)]);

    doc.autoTable({
        startY: y,
        margin: { left: 40, right: 40 },
        head: [['Concepto / Descripción de Cobro', 'Importe']],
        body: tableBody,
        headStyles: {
            fillColor: [241, 245, 249],
            textColor: [51, 65, 85],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'left'
        },
        columnStyles: {
            0: { halign: 'left', cellWidth: 380, fontSize: 9 },
            1: { halign: 'right', cellWidth: 152, fontSize: 9, fontStyle: 'bold' }
        },
        theme: 'grid',
        styles: { cellPadding: 8 }
    });

    const finalY = doc.lastAutoTable.finalY || (y + 60);

    // Total Box
    doc.setFillColor(248, 250, 252);
    doc.rect(40, finalY, 532, 32, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.line(40, finalY, 572, finalY);
    doc.line(40, finalY + 32, 572, finalY + 32);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text('MONTO TOTAL A PAGAR:', 360, finalY + 20);

    doc.setFontSize(13);
    doc.setTextColor(30, 58, 138);
    doc.text(formatMoney(montoTotal), 560, finalY + 20, { align: 'right' });

    // Bank Payment Info Card
    const bankY = finalY + 50;
    doc.setDrawColor(59, 130, 246);
    doc.setFillColor(240, 247, 255);
    doc.roundedRect(40, bankY, 532, 110, 6, 6, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text('REFERENCIA BANCARIA ÚNICA (CLABE INTERBANCARIA / MÓDULO 10)', 306, bankY + 20, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(29, 78, 216);
    doc.text(referenciaBancaria, 306, bankY + 44, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('CONCEPTO / DESCRIPCIÓN DE PAGO EN TRANSFERENCIA SPEI:', 306, bankY + 65, { align: 'center' });

    doc.setFont('courier', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(3, 105, 161);
    doc.text(codigoFicha, 306, bankY + 78, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('Instrucciones: Puede realizar su depósito en Ventanilla/Practicaja BBVA o transferencia electrónica SPEI.', 306, bankY + 96, { align: 'center' });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Este documento es una Ficha de Cargo oficial expedida por la institución. Conserve su comprobante de pago.', 306, 750, { align: 'center' });

    const arrayBuf = doc.output('arraybuffer');
    return Buffer.from(arrayBuf);
}

const mockCargo = {
    id: 101,
    codigo_ficha: 'M-00101',
    referencia_bancaria: '012180015012345678',
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

const pdfBuf = generarPdfFichaCargoJsPdf(mockCargo);
console.log('PDF generado exitosamente con jsPDF + autoTable. Tamaño buffer (bytes):', pdfBuf.length);
fs.writeFileSync(path.join(__dirname, 'test_jspdf_ficha.pdf'), pdfBuf);
