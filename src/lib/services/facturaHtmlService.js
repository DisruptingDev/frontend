import QRCode from 'qrcode';
import { getDescripcionRegimen, getDescripcionUsoCFDI } from '../../utils/catalogoSAT.js';

// Paletas de diseño según el ID de plantilla registrado en la BD
const PALETAS_PLANTILLAS = {
    1: { // Default
        nombre: 'Default',
        primario: '#1b384a',
        secundario: '#2a9d8f',
        acento: '#e76f51',
        fondoHeader: '#f1f5f9',
        borde: '#cbd5e1',
        tablaHeaderBg: '#1b384a',
        tablaHeaderColor: '#ffffff',
        estilo: 'moderno'
    },
    2: { // Default Azul
        nombre: 'Default Azul',
        primario: '#003a6c',
        secundario: '#0284c7',
        acento: '#0369a1',
        fondoHeader: '#eff6ff',
        borde: '#bfdbfe',
        tablaHeaderBg: '#003a6c',
        tablaHeaderColor: '#ffffff',
        estilo: 'azul'
    },
    3: { // Minimalista
        nombre: 'Minimalista',
        primario: '#18181b',
        secundario: '#52525b',
        acento: '#71717a',
        fondoHeader: '#fafafa',
        borde: '#e4e4e7',
        tablaHeaderBg: '#27272a',
        tablaHeaderColor: '#ffffff',
        estilo: 'minimalista'
    },
    4: { // Minimalista Compact
        nombre: 'Minimalista Compact',
        primario: '#27272a',
        secundario: '#3f3f46',
        acento: '#71717a',
        fondoHeader: '#ffffff',
        borde: '#d4d4d8',
        tablaHeaderBg: '#3f3f46',
        tablaHeaderColor: '#ffffff',
        estilo: 'compact'
    },
    5: { // Formal
        nombre: 'Formal',
        primario: '#0f172a',
        secundario: '#334155',
        acento: '#94a3b8',
        fondoHeader: '#f8fafc',
        borde: '#94a3b8',
        tablaHeaderBg: '#0f172a',
        tablaHeaderColor: '#ffffff',
        estilo: 'formal'
    },
    6: { // Default Naranja
        nombre: 'Default Naranja',
        primario: '#c2410c',
        secundario: '#ea580c',
        acento: '#fb923c',
        fondoHeader: '#fff7ed',
        borde: '#fed7aa',
        tablaHeaderBg: '#c2410c',
        tablaHeaderColor: '#ffffff',
        estilo: 'naranja'
    },
    7: { // Default Amarillo / Dorado
        nombre: 'Default Amarillo',
        primario: '#854d0e',
        secundario: '#ca8a04',
        acento: '#eab308',
        fondoHeader: '#fefce8',
        borde: '#fef08a',
        tablaHeaderBg: '#854d0e',
        tablaHeaderColor: '#ffffff',
        estilo: 'dorado'
    },
    8: { // Default Marine
        nombre: 'Default Marine',
        primario: '#0c4a6e',
        secundario: '#0284c7',
        acento: '#38bdf8',
        fondoHeader: '#f0f9ff',
        borde: '#bae6fd',
        tablaHeaderBg: '#0c4a6e',
        tablaHeaderColor: '#ffffff',
        estilo: 'marine'
    }
};

function numeroALetras(monto) {
    const num = Math.floor(monto);
    const centavos = Math.round((monto - num) * 100);
    const centavosText = centavos < 10 ? `0${centavos}` : `${centavos}`;

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const cientos = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (num === 0) return `CERO PESOS ${centavosText}/100 M.N.`;

    function convertirGrupo(n) {
        let output = '';
        const c = Math.floor(n / 100);
        const d = Math.floor((n % 100) / 10);
        const u = n % 10;

        if (n === 100) return 'CIEN ';
        if (c > 0) output += cientos[c] + ' ';

        if (d === 1 && u >= 0) {
            output += diezA19[u] + ' ';
        } else if (d > 1) {
            output += (u > 0) ? `${decenas[d]} Y ${unidades[u]} ` : `${decenas[d]} `;
        } else if (u > 0) {
            output += unidades[u] + ' ';
        }
        return output;
    }

    const miles = Math.floor(num / 1000);
    const resto = num % 1000;
    let letras = '';

    if (miles > 0) {
        letras += (miles === 1) ? 'UN MIL ' : `${convertirGrupo(miles)}MIL `;
    }
    if (resto > 0) {
        letras += convertirGrupo(resto);
    }

    return `${letras.trim()} PESOS ${centavosText}/100 M.N.`;
}

/**
 * Genera el HTML completo para representación impresa de un CFDI 4.0
 * adaptado a la plantilla configurada en la empresa emisora.
 */
export async function generarHtmlFactura(comprobante) {
    const emisor = comprobante.emisors || {};
    const receptor = comprobante.receptors || {};

    const plantillaId = Number(emisor.plantilla_id || 1);
    const paleta = PALETAS_PLANTILLAS[plantillaId] || PALETAS_PLANTILLAS[1];

    const esTimbrado = Boolean(comprobante.uuid && comprobante.uuid.trim().length > 10);
    const uuidFiscal = comprobante.uuid || 'PENDIENTE DE TIMBRADO FISCAL';
    const fechaEmision = comprobante.fecha ? new Date(comprobante.fecha).toLocaleString('es-MX') : new Date().toLocaleString('es-MX');
    const fechaCertificacion = comprobante.fecha_timbrado ? new Date(comprobante.fecha_timbrado).toLocaleString('es-MX') : (esTimbrado ? fechaEmision : 'SIN TIMBRAR');

    const totalNum = parseFloat(comprobante.total_string || comprobante.total || 0) || 0;
    const subtotalNum = parseFloat(comprobante.sub_total_string || comprobante.sub_total || totalNum) || totalNum;
    const descuentoNum = parseFloat(comprobante.descuento_string || comprobante.descuento || 0) || 0;
    const importeLetra = numeroALetras(totalNum);

    // Partidas / Conceptos
    let partidas = [];
    if (comprobante.Conceptos && Array.isArray(comprobante.Conceptos)) {
        for (const cGroup of comprobante.Conceptos) {
            if (cGroup.Concepto && Array.isArray(cGroup.Concepto)) {
                for (const item of cGroup.Concepto) {
                    partidas.push({
                        clave_prod_serv: item.clave_prod_serv || '01010101',
                        clave_unidad: item.clave_unidad || 'E48',
                        unidad: item.unidad || 'Servicio',
                        cantidad: Number(item.cantidad || 1),
                        descripcion: item.descripcion || 'Servicio Facturado',
                        valor_unitario: parseFloat(item.valor_unitario_string || item.valor_unitario || 0) || 0,
                        importe: parseFloat(item.importe_string || item.importe || 0) || 0,
                        objeto_imp: item.objeto_imp || '02'
                    });
                }
            }
        }
    }

    if (partidas.length === 0 && comprobante.PagoAlumno && Array.isArray(comprobante.PagoAlumno)) {
        for (const p of comprobante.PagoAlumno) {
            const nombreAlumno = p.alumno ? `${p.alumno.nombre} ${p.alumno.apellido_paterno} ${p.alumno.apellido_materno || ''}`.trim() : '';
            const desc = `${p.cargo?.concepto?.nombre || 'Colegiatura y Servicios Educativos'}${nombreAlumno ? ' - ' + nombreAlumno : ''}${p.alumno?.matricula ? ' (Matrícula: ' + p.alumno.matricula + ')' : ''}`;
            partidas.push({
                clave_prod_serv: p.cargo?.producto?.clave_prod_sat || p.cargo?.concepto?.clave_prod_serv || '86121500',
                clave_unidad: 'E48',
                unidad: 'Servicio',
                cantidad: 1,
                descripcion: desc,
                valor_unitario: Number(p.monto || totalNum),
                importe: Number(p.monto || totalNum),
                objeto_imp: '02'
            });
        }
    }

    if (partidas.length === 0) {
        partidas.push({
            clave_prod_serv: '86121500',
            clave_unidad: 'E48',
            unidad: 'Servicio',
            cantidad: 1,
            descripcion: comprobante.descripcion || 'Servicios Educativos / Facturación',
            valor_unitario: subtotalNum,
            importe: subtotalNum,
            objeto_imp: '02'
        });
    }

    // Sellos y QR
    const selloEmisor = comprobante.sello || 'SELLO DIGITAL DEL EMISOR';
    const selloSAT = comprobante.sello_sat || 'SELLO DIGITAL DEL SAT';
    const cadenaOriginal = comprobante.cadena_original_sat || (esTimbrado ? `||1.1|${uuidFiscal}|${new Date().toISOString()}|SAT970701NN3|${selloEmisor}|${comprobante.no_certificado || '00001000000504465028'}||` : 'CADENA ORIGINAL DISPONIBLE AL TIMBRAR');

    let qrCodeDataUrl = '';
    if (esTimbrado) {
        try {
            const qrText = `https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuidFiscal}&re=${emisor.rfc || ''}&rr=${receptor.rfc || ''}&tt=${totalNum.toFixed(6)}&fe=${selloEmisor.slice(-8)}`;
            qrCodeDataUrl = await QRCode.toDataURL(qrText, { width: 140, margin: 1 });
        } catch (e) {
            console.error('Error generando QR code:', e);
        }
    }

    const logoHtml = (emisor.logo_url || emisor.logo_path) ?
        `<img src="${emisor.logo_url || emisor.logo_path}" alt="Logo" style="max-height: 75px; max-width: 220px; object-fit: contain; margin-bottom: 6px;"/>` :
        `<div style="font-size: 18px; font-weight: bold; color: ${paleta.primario}; border: 2px solid ${paleta.primario}; padding: 6px 14px; display: inline-block; border-radius: 4px; margin-bottom: 6px;">${emisor.nombre || 'EMISOR'}</div>`;

    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CFDI 4.0 - ${comprobante.serie || 'F'}-${comprobante.folio || '0'}</title>
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: Arial, Helvetica, sans-serif;
            color: #1e293b;
            margin: 0;
            padding: 24px;
            font-size: 10.5px;
            line-height: 1.35;
            background: #ffffff;
        }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .header-table td { vertical-align: top; }
        .emisor-title { font-size: 15px; font-weight: bold; color: ${paleta.primario}; margin-bottom: 2px; }
        
        .factura-badge-box {
            background: ${paleta.fondoHeader};
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            padding: 8px 12px;
            text-align: right;
        }
        .factura-folio-title { font-size: 14px; font-weight: bold; color: ${paleta.primario}; }
        .factura-folio-num { font-size: 15px; font-weight: bold; color: ${paleta.acento}; margin-top: 1px; }
        .uuid-code { font-family: monospace; font-size: 9.5px; font-weight: bold; color: ${esTimbrado ? paleta.secundario : '#dc2626'}; word-break: break-all; }
        
        .badge-status {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 9.5px;
            margin-top: 4px;
            background: ${esTimbrado ? '#dcfce7' : '#fee2e2'};
            color: ${esTimbrado ? '#15803d' : '#b91c1c'};
        }

        .cards-row { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .cards-row td { vertical-align: top; width: 50%; }
        .info-card {
            border: 1px solid ${paleta.borde};
            background: ${paleta.fondoHeader};
            border-radius: 6px;
            padding: 8px 12px;
            margin-right: 6px;
            min-height: 95px;
        }
        .info-card.last { margin-right: 0; margin-left: 6px; }
        .card-title {
            font-size: 10.5px;
            font-weight: bold;
            color: ${paleta.primario};
            border-bottom: 1px solid ${paleta.borde};
            padding-bottom: 3px;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }

        .table-conceptos { width: 100%; border-collapse: collapse; margin-top: 8px; margin-bottom: 12px; }
        .table-conceptos th {
            background: ${paleta.tablaHeaderBg};
            color: ${paleta.tablaHeaderColor};
            padding: 6px 8px;
            text-align: left;
            font-size: 10px;
            font-weight: bold;
        }
        .table-conceptos td {
            padding: 6px 8px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 10px;
        }
        .table-conceptos tr:nth-child(even) td { background: #f8fafc; }

        .totals-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; }
        .totals-table td { vertical-align: top; }
        .letra-box {
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            padding: 8px 12px;
            background: ${paleta.fondoHeader};
        }
        .totals-box {
            width: 260px;
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            background: ${paleta.fondoHeader};
            padding: 8px 12px;
            float: right;
        }
        .totals-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10.5px; }
        .totals-final {
            font-size: 13px;
            font-weight: bold;
            color: ${paleta.primario};
            border-top: 2px solid ${paleta.primario};
            margin-top: 4px;
            padding-top: 4px;
        }

        .fiscal-section {
            border: 1px solid ${paleta.borde};
            border-radius: 6px;
            padding: 8px;
            background: #ffffff;
            margin-top: 10px;
        }
        .stamp-label { font-size: 9px; font-weight: bold; color: ${paleta.primario}; margin-top: 3px; }
        .stamp-val { font-family: monospace; font-size: 8px; color: #475569; word-break: break-all; margin-bottom: 3px; line-height: 1.2; }
        
        .footer-sat {
            text-align: center;
            margin-top: 14px;
            font-size: 8.5px;
            color: #64748b;
            border-top: 1px solid #e2e8f0;
            padding-top: 8px;
        }
        .badge-plantilla {
            display: inline-block;
            font-size: 8px;
            color: #94a3b8;
            margin-top: 3px;
        }
    </style>
</head>
<body>
    <!-- ENCABEZADO -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                ${logoHtml}
                <div class="emisor-title">${emisor.nombre || 'EMISOR'}</div>
                <div><strong>RFC Emisor:</strong> ${emisor.rfc || 'N/A'}</div>
                <div><strong>Régimen Fiscal:</strong> ${emisor.regimen_fiscal ? getDescripcionRegimen(emisor.regimen_fiscal) : '601 - General de Ley'}</div>
                <div><strong>Lugar de Expedición:</strong> C.P. ${comprobante.lugar_expedicion || emisor.lugar_expedicion || '01000'}</div>
                <div><strong>Tipo de Comprobante:</strong> ${comprobante.tipo_de_comprobante || 'I'} - Ingreso</div>
                <div class="badge-plantilla">Diseño Aplicado: ${paleta.nombre}</div>
            </td>
            <td style="width: 45%;">
                <div class="factura-badge-box">
                    <div class="factura-folio-title">COMPROBANTE FISCAL DIGITAL (CFDI 4.0)</div>
                    <div class="factura-folio-num">SERIE Y FOLIO: ${comprobante.serie || 'F'}-${comprobante.folio || '0'}</div>
                    <div style="margin-top: 4px;"><strong>Folio Fiscal (UUID):</strong></div>
                    <div class="uuid-code">${uuidFiscal}</div>
                    <div style="margin-top: 3px;"><strong>Fecha Emisión:</strong> ${fechaEmision}</div>
                    <div><strong>Certificación SAT:</strong> ${fechaCertificacion}</div>
                    <div>
                        <span class="badge-status">${esTimbrado ? '✔ TIMBRADO SAT OFICIAL' : '⚠️ PRE-FACTURA BORRADOR'}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- DATOS RECEPTOR Y CONDICIONES -->
    <table class="cards-row">
        <tr>
            <td>
                <div class="info-card">
                    <div class="card-title">Datos del Receptor / Cliente</div>
                    <div><strong>Nombre:</strong> ${receptor.nombre || 'PÚBLICO EN GENERAL'}</div>
                    <div><strong>RFC:</strong> ${receptor.rfc || 'XAXX010101000'}</div>
                    <div><strong>Régimen Fiscal:</strong> ${receptor.regimen_fiscal_receptor ? getDescripcionRegimen(receptor.regimen_fiscal_receptor) : '616 - Sin obligaciones'}</div>
                    <div><strong>Domicilio Fiscal:</strong> C.P. ${receptor.domicilio_fiscal_receptor || '01000'}</div>
                    <div><strong>Uso de CFDI:</strong> ${receptor.uso_cfdi ? getDescripcionUsoCFDI(receptor.uso_cfdi) : 'S01 - Sin efectos fiscales'}</div>
                </div>
            </td>
            <td>
                <div class="info-card last">
                    <div class="card-title">Detalles de Emisión y Pago</div>
                    <div><strong>Forma de Pago:</strong> ${comprobante.forma_pago || '03 - Transferencia electrónica'}</div>
                    <div><strong>Método de Pago:</strong> ${comprobante.metodo_pago || 'PUE - Pago en una sola exhibición'}</div>
                    <div><strong>Moneda:</strong> ${comprobante.moneda || 'MXN'} (Tipo de Cambio: ${comprobante.tipo_cambio || '1'})</div>
                    <div><strong>No. Certificado Emisor:</strong> ${comprobante.no_certificado || emisor.no_certificado || '00001000000504465028'}</div>
                    <div><strong>Exportación:</strong> ${comprobante.exportacion || '01 - No aplica'}</div>
                </div>
            </td>
        </tr>
    </table>

    <!-- TABLA DE CONCEPTOS -->
    <table class="table-conceptos">
        <thead>
            <tr>
                <th style="width: 12%;">Clave SAT</th>
                <th style="width: 8%;">Cant.</th>
                <th style="width: 12%;">Unidad</th>
                <th style="width: 44%;">Descripción</th>
                <th style="width: 12%; text-align: right;">Unitario</th>
                <th style="width: 12%; text-align: right;">Importe</th>
            </tr>
        </thead>
        <tbody>
            ${partidas.map(p => `
            <tr>
                <td><strong>${p.clave_prod_serv}</strong></td>
                <td>${p.cantidad}</td>
                <td>${p.clave_unidad} - ${p.unidad}</td>
                <td>${p.descripcion} <br/><span style="color:#64748b; font-size: 8.5px;">ObjetoImp: ${p.objeto_imp}</span></td>
                <td style="text-align: right;">$${p.valor_unitario.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${p.importe.toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- TOTALES -->
    <table class="totals-table">
        <tr>
            <td style="width: 60%; padding-right: 10px;">
                <div class="letra-box">
                    <div style="font-weight: bold; color: ${paleta.primario}; font-size: 10px; text-transform: uppercase;">Importe Total con Letra</div>
                    <div style="font-weight: bold; margin-top: 2px;">*** ${importeLetra} ***</div>
                </div>
            </td>
            <td style="width: 40%;">
                <div class="totals-box">
                    <div class="totals-row">
                        <span>Subtotal:</span>
                        <span>$${subtotalNum.toFixed(2)}</span>
                    </div>
                    ${descuentoNum > 0 ? `
                    <div class="totals-row" style="color: #dc2626;">
                        <span>Descuento:</span>
                        <span>-$${descuentoNum.toFixed(2)}</span>
                    </div>` : ''}
                    <div class="totals-row totals-final">
                        <span>TOTAL:</span>
                        <span>$${totalNum.toFixed(2)} ${comprobante.moneda || 'MXN'}</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- SELLOS DIGITALES Y QR -->
    <div class="fiscal-section">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 125px; text-align: center; vertical-align: top; padding-right: 8px;">
                    ${qrCodeDataUrl ? `<img src="${qrCodeDataUrl}" alt="QR SAT" style="width: 115px; height: 115px;"/>` : '<div style="width:110px; height:110px; border:1px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:9px;">QR SAT</div>'}
                </td>
                <td style="vertical-align: top;">
                    <div class="stamp-label">CADENA ORIGINAL DEL COMPLEMENTO DE CERTIFICACIÓN DIGITAL DEL SAT:</div>
                    <div class="stamp-val">${cadenaOriginal}</div>

                    <div class="stamp-label">SELLO DIGITAL DEL CFDI (EMISOR):</div>
                    <div class="stamp-val">${selloEmisor}</div>

                    <div class="stamp-label">SELLO DIGITAL DEL SAT:</div>
                    <div class="stamp-val">${selloSAT}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- PIE DE PÁGINA SAT -->
    <div class="footer-sat">
        Este documento es una representación impresa de un CFDI Versión 4.0 expedido por ${emisor.nombre || 'el Emisor'}.<br/>
        RFC Emisor: ${emisor.rfc || 'N/A'} | Régimen: ${emisor.regimen_fiscal || '601'} | RFC Prov. Certif.: SAT970701NN3
    </div>
</body>
</html>`;
}
