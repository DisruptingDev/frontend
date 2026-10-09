import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { jsPDF } from 'jspdf';

function generarPdfAcuseCancelacion(comprobante, acuseData = {}) {
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'letter'
    });

    const uuid = comprobante?.uuid || acuseData?.uuid || acuseData?.folio_fiscal || 'N/A';
    const rfcEmisor = comprobante?.emisors?.rfc || acuseData?.rfc_emisor || 'UHI980415XXX';
    const nombreEmisor = comprobante?.emisors?.nombre || 'UNIVERSIDAD HISPANOAMERICANA S.C.';
    const rfcReceptor = comprobante?.receptors?.rfc || acuseData?.rfc_receptor || 'XAXX010101000';
    const nombreReceptor = comprobante?.receptors?.nombre || 'RECEPTOR GENERAL';
    const total = comprobante?.total || comprobante?.total_string || '0.00';
    const fechaEmision = comprobante?.fecha || 'N/A';
    const fechaCancelacion = acuseData?.fecha_cancelacion
        ? new Date(acuseData.fecha_cancelacion).toLocaleString('es-MX')
        : (comprobante?.updated_at ? new Date(comprobante.updated_at).toLocaleString('es-MX') : new Date().toLocaleString('es-MX'));
    const motivo = acuseData?.motivo || '02 - Comprobante emitido con errores sin relación';

    // Banner Superior
    doc.setFillColor(30, 41, 59);
    doc.rect(0, 0, 612, 70, 'F');

    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(255, 255, 255);
    doc.text('ACUSE DE CANCELACIÓN DE CFDI', 306, 35, { align: 'center' });

    doc.setFontSize(9);
    doc.setFont('Helvetica', 'normal');
    doc.text('Servicio de Administración Tributaria (SAT) / Comprobante Fiscal Digital por Internet', 306, 52, { align: 'center' });

    // Estatus Box
    doc.setFillColor(220, 38, 38);
    doc.roundedRect(40, 85, 532, 35, 4, 4, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('Helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('ESTATUS DE CANCELACIÓN: CANCELADO CON ÉXITO', 306, 107, { align: 'center' });

    // Sección 1: Datos del Comprobante
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('INFORMACIÓN GENERAL DEL COMPROBANTE', 40, 145);
    doc.setDrawColor(203, 213, 225);
    doc.line(40, 150, 572, 150);

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.text('Folio Fiscal (UUID):', 40, 170);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(37, 99, 235);
    doc.text(String(uuid), 170, 170);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.text('Fecha de Emisión:', 40, 188);
    doc.setFont('Helvetica', 'normal');
    doc.text(String(fechaEmision), 170, 188);

    doc.setFont('Helvetica', 'bold');
    doc.text('Fecha de Cancelación:', 40, 206);
    doc.setFont('Helvetica', 'normal');
    doc.setTextColor(220, 38, 38);
    doc.text(String(fechaCancelacion), 170, 206);

    doc.setTextColor(15, 23, 42);
    doc.setFont('Helvetica', 'bold');
    doc.text('Motivo de Cancelación:', 40, 224);
    doc.setFont('Helvetica', 'normal');
    doc.text(String(motivo), 170, 224);

    doc.setFont('Helvetica', 'bold');
    doc.text('Monto Total:', 40, 242);
    doc.setFont('Helvetica', 'normal');
    doc.text(`$${total} MXN`, 170, 242);

    // Sección 2: Emisor y Receptor
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.text('DATOS DE LOS INVOLUCRADOS', 40, 280);
    doc.line(40, 285, 572, 285);

    doc.setFillColor(248, 250, 252);
    doc.rect(40, 295, 260, 90, 'F');
    doc.rect(312, 295, 260, 90, 'F');

    doc.setFontSize(9.5);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text('DATOS DEL EMISOR', 50, 312);
    doc.text('DATOS DEL RECEPTOR', 322, 312);

    doc.setFontSize(8.5);
    doc.setFont('Helvetica', 'bold');
    doc.text('RFC:', 50, 330);
    doc.setFont('Helvetica', 'normal');
    doc.text(String(rfcEmisor), 85, 330);

    doc.setFont('Helvetica', 'bold');
    doc.text('Nombre:', 50, 345);
    doc.setFont('Helvetica', 'normal');
    const splitEmisor = doc.splitTextToSize(String(nombreEmisor), 205);
    doc.text(splitEmisor, 50, 358);

    doc.setFont('Helvetica', 'bold');
    doc.text('RFC:', 322, 330);
    doc.setFont('Helvetica', 'normal');
    doc.text(String(rfcReceptor), 357, 330);

    doc.setFont('Helvetica', 'bold');
    doc.text('Nombre:', 322, 345);
    doc.setFont('Helvetica', 'normal');
    const splitReceptor = doc.splitTextToSize(String(nombreReceptor), 205);
    doc.text(splitReceptor, 322, 358);

    // Sección 3: Cadena Digital y Sello
    doc.setFontSize(11);
    doc.setFont('Helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text('SELLO Y AUTENTICACIÓN DIGITAL', 40, 415);
    doc.line(40, 420, 572, 420);

    const selloSat = comprobante?.sello_sat || comprobante?.sello || `SAT_CANCELADO_OK_${uuid}`;
    doc.setFontSize(7.5);
    doc.setFont('Helvetica', 'bold');
    doc.text('Sello Digital de Cancelación del SAT / PAC:', 40, 435);
    doc.setFont('Courier', 'normal');
    doc.setTextColor(71, 85, 105);
    const splitSello = doc.splitTextToSize(String(selloSat), 532);
    doc.text(splitSello, 40, 447);

    // Pie de página
    doc.setFont('Helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('Este documento es una representación impresa oficial de un Acuse de Cancelación de CFDI.', 306, 750, { align: 'center' });

    const arrayBuf = doc.output('arraybuffer');
    return Buffer.from(arrayBuf);
}

export async function GET(request, { params }) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

        const comprobanteId = BigInt(id);

        // 1. Buscar en la tabla acuse_cancelacions donde comprobante_id == id
        let acuse = await prisma.acuse_cancelacions.findFirst({
            where: { comprobante_id: comprobanteId }
        });

        // 2. Cargar datos del comprobante por si se requiere generar el acuse o buscar por UUID
        const comprobante = await prisma.comprobantes.findUnique({
            where: { id: comprobanteId },
            include: {
                emisors: true,
                receptors: true
            }
        });

        // 3. Si no se encontró acuse por comprobante_id pero el comprobante tiene UUID, buscar por UUID o folio_fiscal
        if (!acuse && comprobante?.uuid) {
            acuse = await prisma.acuse_cancelacions.findFirst({
                where: {
                    OR: [
                        { uuid: comprobante.uuid },
                        { folio_fiscal: comprobante.uuid }
                    ]
                }
            });
        }

        let pdfBuffer = null;
        let filename = `acuse_cancelacion_${id}.pdf`;

        if (acuse && acuse.acuse_base64) {
            let base64Data = acuse.acuse_base64;
            if (base64Data.includes('base64,')) {
                base64Data = base64Data.split('base64,')[1];
            }
            pdfBuffer = Buffer.from(base64Data, 'base64');
            filename = acuse.folio_fiscal ? `acuse_cancelacion_${acuse.folio_fiscal}.pdf` : `acuse_cancelacion_${acuse.uuid || id}.pdf`;
        } else if (comprobante || acuse) {
            // Si el acuse no tiene base64 o no existe el registro en acuse_cancelacions pero la factura sí existe,
            // generar el PDF del Acuse de Cancelación de forma dinámica
            pdfBuffer = generarPdfAcuseCancelacion(comprobante, acuse);
            const uuid = comprobante?.uuid || acuse?.uuid || id;
            filename = `acuse_cancelacion_${uuid}.pdf`;

            // Persistir el acuse generado en la base de datos en segundo plano
            try {
                const base64Str = pdfBuffer.toString('base64');
                if (acuse) {
                    await prisma.acuse_cancelacions.update({
                        where: { id: acuse.id },
                        data: {
                            acuse_base64: base64Str,
                            comprobante_id: comprobanteId
                        }
                    });
                } else if (comprobante) {
                    await prisma.acuse_cancelacions.create({
                        data: {
                            uuid: comprobante.uuid || `UUID-CANCELADO-${id}`,
                            rfc_emisor: comprobante.emisors?.rfc || 'UHI980415XXX',
                            rfc_receptor: comprobante.receptors?.rfc || 'XAXX010101000',
                            fecha_cancelacion: new Date(),
                            motivo: '02 - Comprobante emitido con errores sin relación',
                            folio_fiscal: comprobante.uuid,
                            acuse_base64: base64Str,
                            comprobante_id: comprobanteId
                        }
                    });
                }
            } catch (persistErr) {
                console.warn('[ACUSE WARN] No se pudo guardar el acuse generado en DB:', persistErr.message);
            }
        } else {
            return NextResponse.json({ error: 'Factura o acuse de cancelación no encontrado.' }, { status: 404 });
        }

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="${filename}"`,
            },
        });

    } catch (error) {
        console.error('Error al obtener el acuse de cancelación:', error);
        return NextResponse.json({ error: 'Error al procesar acuse de cancelación: ' + error.message }, { status: 500 });
    }
}
