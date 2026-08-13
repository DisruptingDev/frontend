import puppeteer from 'puppeteer';
import nodemailer from 'nodemailer';

/**
 * Formatea montos a moneda MXN ($#,##0.00)
 */
function formatMoney(amount) {
    const num = typeof amount === 'number' ? amount : parseFloat(amount || 0);
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(num);
}

/**
 * Formatea fechas a formato legible (DD/MM/YYYY)
 */
function formatDate(dateInput) {
    if (!dateInput) return 'N/A';
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleDateString('es-MX', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

/**
 * Genera el documento HTML estilizado para la Ficha de Cargo con 1 o más conceptos
 */
export function generarHtmlFichaCargo(cargo) {
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

    // Procesar conceptos (desglose multi-concepto o concepto principal)
    let items = [];
    if (cargo.detalles_items) {
        try {
            items = typeof cargo.detalles_items === 'string' 
                ? JSON.parse(cargo.detalles_items) 
                : cargo.detalles_items;
        } catch (e) {
            console.warn('Error al parsear detalles_items en generarHtmlFichaCargo:', e);
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

    const rowsHtml = items.map((it, idx) => `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; color: #374151;">
                ${it.concepto}
            </td>
            <td style="padding: 12px 16px; border-bottom: 1px solid #e5e7eb; font-size: 13px; font-weight: bold; text-align: right; color: #111827;">
                ${formatMoney(it.monto)}
            </td>
        </tr>
    `).join('');

    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <title>Ficha de Cargo - ${codigoFicha}</title>
        <style>
            @page {
                size: Letter;
                margin: 15mm;
            }
            body {
                font-family: 'Helvetica Neue', Arial, sans-serif;
                color: #1f2937;
                background-color: #ffffff;
                margin: 0;
                padding: 0;
                -webkit-print-color-adjust: exact;
            }
            .container {
                max-width: 750px;
                margin: 0 auto;
                border: 1px solid #cbd5e1;
                border-radius: 8px;
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #1b384a 0%, #0f2533 100%);
                color: #ffffff;
                padding: 24px;
                text-align: center;
            }
            .header h1 {
                margin: 0 0 4px 0;
                font-size: 20px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            .header p {
                margin: 2px 0 0 0;
                font-size: 12px;
                opacity: 0.85;
            }
            .title-strip {
                background-color: #2563eb;
                color: #ffffff;
                text-align: center;
                padding: 8px 16px;
                font-size: 13px;
                font-weight: bold;
                letter-spacing: 1px;
                text-transform: uppercase;
            }
            .section {
                padding: 20px;
            }
            .grid {
                display: table;
                width: 100%;
                table-layout: fixed;
                margin-bottom: 20px;
            }
            .row {
                display: table-row;
            }
            .col {
                display: table-cell;
                width: 50%;
                padding: 6px 10px;
                vertical-align: top;
            }
            .label {
                font-size: 11px;
                color: #64748b;
                text-transform: uppercase;
                font-weight: bold;
                margin-bottom: 2px;
            }
            .value {
                font-size: 14px;
                color: #0f172a;
                font-weight: 600;
            }
            .code-badge {
                font-family: monospace;
                background-color: #eff6ff;
                color: #1d4ed8;
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 15px;
                font-weight: bold;
                display: inline-block;
            }
            .table-container {
                margin-top: 10px;
                margin-bottom: 20px;
                border: 1px solid #e2e8f0;
                border-radius: 6px;
                overflow: hidden;
            }
            table {
                width: 100%;
                border-collapse: collapse;
            }
            th {
                background-color: #f1f5f9;
                color: #334155;
                font-size: 12px;
                font-weight: bold;
                text-transform: uppercase;
                padding: 10px 14px;
                text-align: left;
                border-bottom: 2px solid #cbd5e1;
            }
            th.right {
                text-align: right;
            }
            .total-box {
                background-color: #f8fafc;
                padding: 14px 20px;
                border-top: 2px solid #e2e8f0;
                text-align: right;
            }
            .total-label {
                font-size: 13px;
                color: #475569;
                font-weight: bold;
                margin-right: 15px;
            }
            .total-amount {
                font-size: 20px;
                color: #1e3a8a;
                font-weight: 800;
            }
            .bank-card {
                background-color: #f0f7ff;
                border: 2px dashed #3b82f6;
                border-radius: 8px;
                padding: 18px;
                text-align: center;
                margin-top: 20px;
            }
            .bank-title {
                font-size: 11px;
                color: #475569;
                text-transform: uppercase;
                font-weight: bold;
                letter-spacing: 0.5px;
            }
            .bank-reference {
                font-family: monospace;
                font-size: 22px;
                font-weight: 800;
                color: #1d4ed8;
                letter-spacing: 2px;
                margin: 8px 0;
            }
            .bank-instructions {
                font-size: 11px;
                color: #64748b;
                line-height: 1.5;
                margin-top: 10px;
            }
            .footer {
                text-align: center;
                padding: 16px;
                font-size: 11px;
                color: #94a3b8;
                border-top: 1px solid #f1f5f9;
                background-color: #fafafa;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>${emisorNombre}</h1>
                <p>RFC: ${emisorRfc} | Servicios Financieros y Cobranza Institucional</p>
            </div>
            
            <div class="title-strip">
                📄 FICHA OFICIAL DE CARGO Y PAGO DE COLEGIATURA
            </div>
            
            <div class="section">
                <div class="grid">
                    <div class="row">
                        <div class="col">
                            <div class="label">Código Único de Ficha</div>
                            <div class="value"><span class="code-badge">${codigoFicha}</span></div>
                        </div>
                        <div class="col">
                            <div class="label">Alumno / Estudiante</div>
                            <div class="value">${alumnoNombre}</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Matrícula ID</div>
                            <div class="value" style="font-family: monospace;">${matricula}</div>
                        </div>
                        <div class="col">
                            <div class="label">Programa / Carrera</div>
                            <div class="value">${carrera}</div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col">
                            <div class="label">Correo Electrónico Registrado</div>
                            <div class="value" style="font-size: 12px; color: #4b5563;">${emailAlumno}</div>
                        </div>
                        <div class="col">
                            <div class="label">Fechas del Cargo</div>
                            <div class="value" style="font-size: 12px;">
                                Emisión: <b>${fechaEmision}</b><br/>
                                Vencimiento: <b style="color: #dc2626;">${fechaVencimiento}</b>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="label" style="margin-bottom: 8px;">Concepto(s) e Importe(s) de la Ficha</div>
                <div class="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Concepto / Descripción</th>
                                <th class="right">Importe</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rowsHtml}
                        </tbody>
                    </table>
                    <div class="total-box">
                        <span class="total-label">MONTO TOTAL A PAGAR:</span>
                        <span class="total-amount">${formatMoney(montoTotal)}</span>
                    </div>
                </div>

                <div class="bank-card">
                    <div class="bank-title">REFERENCIA BANCARIA ÚNICA (CLABE / MÓDULO 10)</div>
                    <div class="bank-reference">${referenciaBancaria}</div>
                    
                    <div style="margin-top: 8px;">
                        <span class="bank-title">CONCEPTO / DESCRIPCIÓN DE PAGO EN TRANSFERENCIA SPEI:</span><br/>
                        <span style="font-family: monospace; font-weight: bold; color: #0369a1; font-size: 14px;">${codigoFicha}</span>
                    </div>

                    <div class="bank-instructions">
                        💡 <b>Instrucciones de Pago:</b> Puede realizar su depósito en cualquier sucursal BBVA Bancomer (Ventanilla / Practicaja) o mediante transferencia electrónica SPEI utilizando la CLABE/Referencia bancaria indicada arriba.
                    </div>
                </div>
            </div>

            <div class="footer">
                Este documento es una Ficha de Cargo oficial expedida por la institución. Al realizar el pago, conserve su comprobante bancario.
            </div>
        </div>
    </body>
    </html>
    `;
}

/**
 * Genera el Buffer PDF usando Puppeteer
 */
export async function generarPdfBufferFicha(cargo) {
    const htmlContent = generarHtmlFichaCargo(cargo);
    
    let browser = null;
    try {
        browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' }
        });
        await browser.close();
        return Buffer.from(pdfBuffer);
    } catch (error) {
        if (browser) {
            try { await browser.close(); } catch (e) {}
        }
        console.error('Error al generar PDF de Ficha con Puppeteer:', error.message);
        throw error;
    }
}

/**
 * Envía el PDF de la Ficha por correo electrónico al alumno
 */
export async function enviarFichaPorCorreo({ cargo, pdfBuffer, emailDestino }) {
    const alumno = cargo.alumno || {};
    const correoFinal = emailDestino || alumno.email || alumno.receptor?.email;

    if (!correoFinal || !correoFinal.includes('@')) {
        console.warn(`[FICHA EMAIL] No se envió correo para la ficha ${cargo.codigo_ficha}: Alumno sin email válido (${correoFinal || 'Sin correo'}).`);
        return {
            enviado: false,
            motivo: 'El alumno no cuenta con una dirección de correo electrónico válida.'
        };
    }

    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = Number(process.env.SMTP_PORT || 587);
    const smtpSecure = process.env.SMTP_SECURE === 'true';
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: (smtpUser && smtpPass) ? { user: smtpUser, pass: smtpPass } : undefined,
        tls: { rejectUnauthorized: false }
    });

    const alumnoNombre = `${alumno.nombre || ''} ${alumno.apellido_paterno || ''}`.trim() || 'Estudiante';
    const codigoFicha = cargo.codigo_ficha || `F-${cargo.id}`;
    const montoTotalFormatted = formatMoney(cargo.monto_total);
    const fechaVenc = formatDate(cargo.fecha_vencimiento);
    const referencia = alumno.clabe_interbancaria || cargo.referencia_bancaria || 'N/A';

    const mailOptions = {
        from: smtpUser ? `"Cobranza Institucional" <${smtpUser}>` : '"Sistema de Cobranza" <no-reply@wisefacturacion.com>',
        to: correoFinal,
        subject: `📄 Ficha de Cargo Emitida - ${codigoFicha} | ${alumnoNombre}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
                <div style="background-color: #1b384a; color: #ffffff; padding: 20px; text-align: center;">
                    <h2 style="margin: 0; font-size: 18px;">Ficha Oficial de Pago Emitida</h2>
                    <p style="margin: 5px 0 0 0; font-size: 13px; opacity: 0.9;">Servicios de Cobranza Escolar</p>
                </div>
                <div style="padding: 20px;">
                    <p style="font-size: 15px;">Estimado(a) <strong>${alumnoNombre}</strong>,</p>
                    <p>Le informamos que se ha generado exitosamente su <strong>Ficha de Cargo</strong> con los conceptos a pagar:</p>
                    
                    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 15px; margin: 20px 0; border-radius: 4px;">
                        <p style="margin: 0 0 8px 0;"><strong>Código de Ficha:</strong> <span style="font-family: monospace; color: #2563eb; font-weight: bold;">${codigoFicha}</span></p>
                        <p style="margin: 0 0 8px 0;"><strong>Monto Total a Pagado/Pendiente:</strong> <span style="font-size: 16px; font-weight: bold; color: #0f172a;">${montoTotalFormatted}</span></p>
                        <p style="margin: 0 0 8px 0;"><strong>Fecha Límite de Pago:</strong> <span style="color: #dc2626; font-weight: bold;">${fechaVenc}</span></p>
                        <p style="margin: 0;"><strong>Referencia Bancaria (CLABE / Módulo 10):</strong> <span style="font-family: monospace; font-size: 15px; font-weight: bold;">${referencia}</span></p>
                    </div>

                    <p>Adjunto a este correo encontrará el archivo <strong>PDF oficial de la Ficha de Cargo</strong>, el cual contiene el desglose detallado de conceptos y las instrucciones de depósito bancario (Ventanilla, Practicaja o Transferencia SPEI).</p>
                    
                    <p style="font-size: 12px; color: #666; margin-top: 25px;">Por favor, conserve el comprobante PDF para sus registros y al realizar su pago.</p>
                </div>
                <div style="background-color: #f1f5f9; text-align: center; padding: 12px; font-size: 11px; color: #64748b;">
                    Este es un correo automático enviado por el Sistema de Cobranza.
                </div>
            </div>
        `,
        attachments: [
            {
                filename: `Ficha_Cargo_${codigoFicha}.pdf`,
                content: pdfBuffer,
                contentType: 'application/pdf'
            }
        ]
    };

    await transporter.sendMail(mailOptions);

    return {
        enviado: true,
        email: correoFinal
    };
}

/**
 * Función integrada que genera el PDF y envía el correo al alumno de forma segura
 */
export async function generarYEnviarFichaPorCorreo(cargo, customEmail = null) {
    try {
        const pdfBuffer = await generarPdfBufferFicha(cargo);
        const resultadoEnvio = await enviarFichaPorCorreo({
            cargo,
            pdfBuffer,
            emailDestino: customEmail
        });

        return {
            exito: true,
            pdfGenerado: true,
            pdfBuffer,
            correoEnviado: resultadoEnvio.enviado,
            email: resultadoEnvio.email || customEmail,
            motivo: resultadoEnvio.motivo
        };
    } catch (error) {
        console.error(`[FICHA PROCESS ERROR] Error al procesar PDF/Correo para la ficha ${cargo.id || cargo.codigo_ficha}:`, error.message);
        return {
            exito: false,
            pdfGenerado: false,
            correoEnviado: false,
            error: error.message
        };
    }
}
