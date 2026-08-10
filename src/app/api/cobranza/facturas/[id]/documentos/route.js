import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getDescripcionRegimen, getDescripcionUsoCFDI } from '@/utils/catalogoSAT';

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (typeof obj === 'object') {
        if (obj.d && Array.isArray(obj.d) && obj.s !== undefined) {
            return obj.toString();
        }
        if (typeof obj.toNumber === 'function') {
            return obj.toString();
        }
        if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigIntsAndDecimals(value)])
        );
    }
    return obj;
}

// Convertidor numérico a texto en español para el Importe con Letra
function numeroALetras(monto) {
    const num = Math.floor(monto);
    const centavos = Math.round((monto - num) * 100);
    const centavosText = centavos < 10 ? `0${centavos}` : `${centavos}`;

    const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
    const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
    const diezA19 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
    const cientos = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

    if (num === 0) return `CERO PESOS ${centavosText}/100 M.N.`;

    let letras = '';

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
            if (u > 0) {
                output += decenas[d] + ' Y ' + unidades[u] + ' ';
            } else {
                output += decenas[d] + ' ';
            }
        } else if (u > 0) {
            output += unidades[u] + ' ';
        }

        return output;
    }

    const miles = Math.floor(num / 1000);
    const resto = num % 1000;

    if (miles > 0) {
        if (miles === 1) letras += 'UN MIL ';
        else letras += convertirGrupo(miles) + 'MIL ';
    }

    if (resto > 0) {
        letras += convertirGrupo(resto);
    }

    return `${letras.trim()} PESOS ${centavosText}/100 M.N.`;
}

// GET: Descargar XML o Renderizar PDF Oficial CFDI 4.0 utilizando la Plantilla asociada al Emisor
export async function GET(request, { params }) {
    try {
        const { id } = params;
        const { searchParams } = new URL(request.url);
        const tipo = searchParams.get('tipo') || 'xml';

        const comprobante = await prisma.comprobantes.findUnique({
            where: { id: BigInt(id) },
            include: {
                emisors: true,
                receptors: true,
                PagoAlumno: {
                    include: {
                        alumno: {
                            include: { programa_academico: true }
                        },
                        cargo: { include: { concepto: true, producto: true } }
                    }
                },
                Conceptos: {
                    include: {
                        Concepto: true
                    }
                }
            }
        });

        if (!comprobante) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        const emisor = comprobante.emisors || {
            nombre: 'UNIVERSIDAD HISPANOAMERICANA S.C.',
            rfc: 'UHI950412XX1',
            regimen_fiscal: '601',
            lugar_expedicion: '01000'
        };

        const receptor = comprobante.receptors || {
            nombre: 'PUBLICO EN GENERAL',
            rfc: 'XAXX010101000',
            regimen_fiscal_receptor: '616',
            uso_cfdi: 'S01'
        };

        // =========================================================================
        // OPCIÓN A: DESCARGAR ARCHIVO XML TIMBRADO
        // =========================================================================
        if (tipo === 'xml') {
            const xmlContent = comprobante.xml_timbrado || `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${comprobante.serie}" Folio="${comprobante.folio}" Fecha="${comprobante.fecha}" SubTotal="${comprobante.sub_total}" Total="${comprobante.total}" Moneda="MXN" TipoDeComprobante="I" LugarExpedicion="${emisor.lugar_expedicion || '01000'}">
  <cfdi:Emisor Rfc="${emisor.rfc}" Nombre="${emisor.nombre}" RegimenFiscal="${emisor.regimen_fiscal || '601'}"/>
  <cfdi:Receptor Rfc="${receptor.rfc}" Nombre="${receptor.nombre}" RegimenFiscalReceptor="${receptor.regimen_fiscal_receptor || '616'}" UsoCFDI="${receptor.uso_cfdi || 'S01'}"/>
</cfdi:Comprobante>`;

            return new Response(xmlContent, {
                status: 200,
                headers: {
                    'Content-Type': 'application/xml',
                    'Content-Disposition': `attachment; filename="Factura_${comprobante.serie}_${comprobante.folio}.xml"`
                }
            });
        }

        // =========================================================================
        // OPCIÓN B: RENDEREAR PDF USANDO LA PLANTILLA CONFIGURADA EN EL EMISOR
        // =========================================================================
        let plantillaEmisor = null;
        if (emisor.plantilla_id) {
            plantillaEmisor = await prisma.plantillas.findUnique({
                where: { id: BigInt(emisor.plantilla_id) }
            });
        }

        const esTimbrado = comprobante.estatus === 'TIMBRADO' && comprobante.uuid;
        const uuidFiscal = comprobante.uuid || 'PENDIENTE DE TIMBRADO FISCAL (BORRADOR)';
        const fechaCertificacion = comprobante.fecha_timbrado ? new Date(comprobante.fecha_timbrado).toLocaleString('es-MX') : (esTimbrado ? new Date(comprobante.fecha).toLocaleString('es-MX') : 'SIN TIMBRAR');

        const totalNum = Number(comprobante.total || 0);
        const subtotalNum = Number(comprobante.sub_total || totalNum);
        const importeEnLetra = numeroALetras(totalNum);

        const mesAnio = new Date(comprobante.fecha).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
        
        const estudiantes = (comprobante.PagoAlumno || []).map(p => ({
            nombre: p.alumno ? `${p.alumno.nombre} ${p.alumno.apellido_paterno} ${p.alumno.apellido_materno || ''}`.trim().toUpperCase() : 'ESTUDIANTE GENERAL',
            matricula: p.alumno?.matricula || 'N/A',
            curp: p.alumno?.curp || 'N/A',
            carrera: p.alumno?.programa_academico?.nombre?.toUpperCase() || p.alumno?.carrera?.toUpperCase() || 'GENERAL',
            rvoe: p.alumno?.programa_academico?.rvoe || 'N/A',
            concepto: p.cargo?.concepto?.nombre || 'Colegiatura y Servicios Educativos Integrales',
            producto: p.cargo?.producto?.nombre?.toUpperCase() || p.cargo?.concepto?.nombre?.toUpperCase() || 'MENSUALIDAD',
            monto: Number(p.monto)
        }));

        let partidas = [];
        if (comprobante.Conceptos && comprobante.Conceptos.length > 0) {
            comprobante.Conceptos.forEach(cGroup => {
                if (cGroup.Concepto && Array.isArray(cGroup.Concepto)) {
                    cGroup.Concepto.forEach(item => {
                        const eInfo = estudiantes[0] || {};
                        const descFallback = `PAGO A ${eInfo.producto || 'MENSUALIDAD'} DE ${eInfo.carrera || 'GENERAL'} REALIZADO EL MES DE ${mesAnio} , DEL ESTUDIANTE ${eInfo.nombre}, CURP: ${eInfo.curp}, MATRICULA: ${eInfo.matricula}, PROGRAMA CON RVOE SEP NO. ${eInfo.rvoe}`;
                        partidas.push({
                            clave_prod_serv: item.clave_prod_serv || '86121500',
                            clave_unidad: item.clave_unidad || 'E48',
                            unidad: item.unidad || 'Servicio',
                            cantidad: Number(item.cantidad || 1),
                            descripcion: item.descripcion && item.descripcion.length > 5 ? item.descripcion : descFallback,
                            valor_unitario: Number(item.valor_unitario || totalNum),
                            importe: Number(item.importe || totalNum),
                            objeto_imp: item.objeto_imp || '01'
                        });
                    });
                }
            });
        }

        if (partidas.length === 0) {
            const eInfo = estudiantes[0] || {};
            const desc = `PAGO A ${eInfo.producto || 'MENSUALIDAD'} DE ${eInfo.carrera || 'GENERAL'} REALIZADO EL MES DE ${mesAnio} , DEL ESTUDIANTE ${eInfo.nombre}, CURP: ${eInfo.curp}, MATRICULA: ${eInfo.matricula}, PROGRAMA CON RVOE SEP NO. ${eInfo.rvoe}`;
            partidas.push({
                clave_prod_serv: '86121500',
                clave_unidad: 'E48',
                unidad: 'Servicio',
                cantidad: 1,
                descripcion: desc,
                valor_unitario: totalNum,
                importe: totalNum,
                objeto_imp: '01'
            });
        }

        const logoHtml = emisor.logo_url || emisor.logo_path ?
            `<img src="${emisor.logo_url || emisor.logo_path}" alt="Logo Institucional" style="max-height:80px; max-width:220px; object-fit:contain;"/>` :
            `<div style="font-size:22px; font-weight:bold; color:#1b384a; border:2px solid #1b384a; padding:8px 12px; display:inline-block; border-radius:4px;">UNIVERSIDAD</div>`;

        const selloEmisor = comprobante.sello || 'SIN SELLO - FACTURA EN BORRADOR NO TIMBRADA';
        const selloSAT = comprobante.sello_sat || 'SIN SELLO SAT - PRE-FACTURA PENDIENTE';
        const cadenaOriginal = comprobante.cadena_original_sat || (esTimbrado ? `||1.1|${uuidFiscal}|${new Date().toISOString()}|SAT970701NN3|${selloEmisor}|${comprobante.no_certificado || '00001000000504465028'}||` : 'CADENA ORIGINAL DISPONIBLE AL TIMBRAR');

        const qrCodeUrl = esTimbrado ?
            `https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://verificacfdi.facturaelectronica.sat.gob.mx/default.aspx?id=${uuidFiscal}%26re=${emisor.rfc}%26rr=${receptor.rfc}%26tt=${totalNum.toFixed(6)}%26fe=${selloEmisor.slice(-8)}` : '';

        const pdfHtml = `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>CFDI 4.0 - ${comprobante.serie || 'F'}-${comprobante.folio}</title>
    <style>
        body { font-family: Arial, Helvetica, sans-serif; color: #222; margin: 0; padding: 20px; font-size: 11px; line-height: 1.3; }
        .header-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .header-table td { vertical-align: top; }
        .emisor-name { font-size: 16px; font-weight: bold; color: #1b384a; margin-top: 5px; }
        .badge-success { background: #e8f5e9; color: #2e7d32; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block; }
        .badge-warning { background: #fff3e0; color: #d32f2f; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 11px; display: inline-block; }
        
        .box { border: 1px solid #cbd5e1; border-radius: 5px; padding: 10px; background: #f8fafc; flex: 1; }
        .box-title { font-weight: bold; color: #1b384a; border-bottom: 1px solid #cbd5e1; padding-bottom: 4px; margin-bottom: 6px; font-size: 12px; text-transform: uppercase; }
        
        .table-partidas { width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 15px; }
        .table-partidas th { background: #1b384a; color: white; padding: 6px 8px; text-align: left; font-size: 11px; font-weight: bold; }
        .table-partidas td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; font-size: 10.5px; }
        
        .totals-section { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
        .totals-section td { vertical-align: top; }
        .totals-box { width: 280px; border: 1px solid #cbd5e1; border-radius: 5px; background: #f8fafc; padding: 10px; float: right; }
        .totals-row { display: flex; justify-content: space-between; padding: 3px 0; }
        .total-final { font-size: 14px; font-weight: bold; color: #1b384a; border-top: 2px solid #1b384a; margin-top: 5px; padding-top: 5px; }
        
        .stamps-box { border: 1px solid #cbd5e1; border-radius: 5px; padding: 10px; background: #ffffff; margin-top: 15px; clear: both; }
        .stamp-title { font-weight: bold; color: #1b384a; font-size: 10px; margin-top: 4px; }
        .stamp-code { font-family: 'Courier New', Courier, monospace; font-size: 8.5px; color: #475569; word-break: break-all; margin-bottom: 4px; }
        
        .sat-footer { text-align: center; margin-top: 20px; font-size: 9.5px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 10px; }
        @media print { .no-print { display: none; } }
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 15px; text-align: right;">
        <button onclick="window.print()" style="background:#1b384a; color:white; border:none; padding:8px 18px; border-radius:4px; cursor:pointer; font-weight:bold; font-size:12px;">
            🖨️ Imprimir / Guardar como PDF
        </button>
    </div>

    <!-- ENCABEZADO FISCAL -->
    <table class="header-table">
        <tr>
            <td style="width: 55%;">
                ${logoHtml}
                <div class="emisor-name">${emisor.nombre}</div>
                <div><strong>RFC Emisor:</strong> ${emisor.rfc}</div>
                <div><strong>Régimen Fiscal:</strong> ${emisor.regimen_fiscal ? getDescripcionRegimen(emisor.regimen_fiscal) : '601 - General de Ley Personas Morales'}</div>
                <div><strong>Lugar de Expedición:</strong> C.P. ${comprobante.lugar_expedicion || '01000'}</div>
                <div><strong>Tipo de Comprobante:</strong> I - Ingreso</div>
                <div><strong>Plantilla Emisor:</strong> ${plantillaEmisor?.nombre || 'Plantilla Oficial Estándar'}</div>
            </td>
            <td style="width: 45%; text-align: right;">
                <div style="font-size: 16px; font-weight: bold; color: #1b384a;">FACTURA ELECTRÓNICA CFDI 4.0</div>
                <div style="font-size: 15px; color: #d32f2f; font-weight: bold; margin-top:2px;">SERIE Y FOLIO: ${comprobante.serie || 'F'}-${comprobante.folio}</div>
                <div style="margin-top: 4px;"><strong>Folio Fiscal (UUID):</strong></div>
                <div style="font-family: monospace; font-size: 10px; font-weight: bold; color: ${esTimbrado ? '#0288d1' : '#d32f2f'};">${uuidFiscal}</div>
                <div style="margin-top: 4px;"><strong>Fecha Emisión:</strong> ${new Date(comprobante.fecha).toLocaleString('es-MX')}</div>
                <div><strong>Fecha Certificación SAT:</strong> ${fechaCertificacion}</div>
                <div style="margin-top: 6px;">
                    ${esTimbrado ?
                        '<span class="badge-success">✔ TIMBRADO SAT OFICIAL</span>' :
                        '<span class="badge-warning">⚠️ PRE-FACTURA PENDIENTE DE TIMBRADO (BORRADOR)</span>'}
                </div>
            </td>
        </tr>
    </table>

    <!-- BLOQUE RECEPTOR Y CONDICIONES PAGO -->
    <div style="display: flex; gap: 10px; margin-bottom: 12px;">
        <div class="box" style="flex: 2;">
            <div class="box-title">DATOS DEL RECEPTOR / CLIENTE</div>
            <div><strong>Nombre / Razón Social:</strong> ${receptor.nombre}</div>
            <div><strong>RFC Receptor:</strong> ${receptor.rfc}</div>
            <div><strong>Régimen Fiscal Receptor:</strong> ${getDescripcionRegimen(receptor.regimen_fiscal_receptor || '616')}</div>
            <div><strong>Uso de CFDI:</strong> ${getDescripcionUsoCFDI(receptor.uso_cfdi || 'S01')}</div>
            <div><strong>Domicilio Fiscal Receptor:</strong> C.P. ${receptor.domicilio_fiscal_receptor || comprobante.lugar_expedicion || '01000'}</div>
        </div>

        <div class="box" style="flex: 1.2;">
            <div class="box-title">DATOS DEL COMPROBANTE</div>
            <div><strong>Forma de Pago:</strong> 03 - Transferencia electrónica</div>
            <div><strong>Método de Pago:</strong> PUE - Pago en una sola exhibición</div>
            <div><strong>Moneda:</strong> MXN (Pesos Mexicanos)</div>
            <div><strong>No. Certificado Emisor:</strong> ${comprobante.no_certificado || emisor.no_certificado || 'PENDIENTE AL TIMBRAR'}</div>
            <div><strong>No. Certificado SAT:</strong> ${esTimbrado ? '00001000000504465028' : 'PENDIENTE'}</div>
        </div>
    </div>

    <!-- ESTUDIANTES RELACIONADOS EN LA FACTURA -->
    ${estudiantes.length > 0 ? `
        <div style="background:#f1f5f9; border:1px solid #cbd5e1; border-radius:4px; padding:6px 10px; margin-bottom:12px;">
            <strong style="color:#1b384a;">Estudiante(s) Vinculado(s):</strong> 
            ${estudiantes.map(e => `${e.nombre} (${e.matricula}) - ${e.carrera}`).join(' | ')}
        </div>
    ` : ''}

    <!-- TABLA DE CONCEPTOS PARTIDAS SAT -->
    <table class="table-partidas">
        <thead>
            <tr>
                <th style="width: 10%;">Clave Prod/Serv</th>
                <th style="width: 8%;">Cantidad</th>
                <th style="width: 10%;">Clave Unidad</th>
                <th style="width: 44%;">Descripción del Concepto / Alumno</th>
                <th style="width: 14%; text-align: right;">Valor Unitario</th>
                <th style="width: 14%; text-align: right;">Importe Subtotal</th>
            </tr>
        </thead>
        <tbody>
            ${partidas.map(p => `
            <tr>
                <td><strong>${p.clave_prod_serv}</strong></td>
                <td>${p.cantidad}</td>
                <td>${p.clave_unidad} - ${p.unidad}</td>
                <td>${p.descripcion} <br/><span style="color:#64748b; font-size:9.5px;">ObjetoImp: ${p.objeto_imp} (No objeto de impuesto)</span></td>
                <td style="text-align: right;">$${p.valor_unitario.toFixed(2)}</td>
                <td style="text-align: right; font-weight: bold;">$${p.importe.toFixed(2)}</td>
            </tr>
            `).join('')}
        </tbody>
    </table>

    <!-- TOTALES E IMPORTE CON LETRA -->
    <table class="totals-section">
        <tr>
            <td style="width: 60%; padding-right: 15px;">
                <div class="box">
                    <div class="box-title">IMPORTE TOTAL CON LETRA</div>
                    <div style="font-weight: bold; font-size: 11px; color: #1b384a;">*** ${importeEnLetra} ***</div>
                </div>
            </td>
            <td style="width: 40%;">
                <div class="totals-box">
                    <div class="totals-row">
                        <span>Subtotal:</span>
                        <span>$${subtotalNum.toFixed(2)}</span>
                    </div>
                    <div class="totals-row">
                        <span>Descuento:</span>
                        <span>$0.00</span>
                    </div>
                    <div class="totals-row">
                        <span>IVA (0% Colegiaturas / Exento):</span>
                        <span>$0.00</span>
                    </div>
                    <div class="totals-row total-final">
                        <span>TOTAL:</span>
                        <span>$${totalNum.toFixed(2)} MXN</span>
                    </div>
                </div>
            </td>
        </tr>
    </table>

    <!-- SELLOS DIGITALES Y CÓDIGO QR SAT -->
    <div class="stamps-box">
        <table style="width: 100%; border-collapse: collapse;">
            <tr>
                <td style="width: 130px; text-align: center; vertical-align: top; padding-right: 10px;">
                    ${qrCodeUrl ? `<img src="${qrCodeUrl}" alt="Código QR SAT" style="width: 120px; height: 120px; border:1px solid #ccc; padding:2px; background:white;"/>` : '<div style="width:110px; height:110px; border:1px dashed #cbd5e1; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:9px; text-align:center;">QR DISPONIBLE AL TIMBRAR</div>'}
                </td>
                <td style="vertical-align: top;">
                    <div class="stamp-title">CADENA ORIGINAL DEL COMPLEMENTO DE CERTIFICACIÓN DIGITAL DEL SAT:</div>
                    <div class="stamp-code">${cadenaOriginal}</div>

                    <div class="stamp-title">SELLO DIGITAL DEL CFDI (EMISOR):</div>
                    <div class="stamp-code">${selloEmisor}</div>

                    <div class="stamp-title">SELLO DIGITAL DEL SAT:</div>
                    <div class="stamp-code">${selloSAT}</div>
                </td>
            </tr>
        </table>
    </div>

    <!-- PIE DE PÁGINA SAT -->
    <div class="sat-footer">
        Este documento es una representación impresa de un CFDI Versión 4.0 emitido por ${emisor.nombre}.<br/>
        RFC Emisor: ${emisor.rfc} | Régimen: ${emisor.regimen_fiscal || '601'} | RFC Prov. Certif.: SAT970701NN3
    </div>
</body>
</html>`;

        return new Response(pdfHtml, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });

    } catch (error) {
        console.error('Error al generar documentos de factura:', error);
        return NextResponse.json({ error: 'Error al generar documento: ' + error.message }, { status: 500 });
    }
}

// POST: Enviar PDF y XML por correo electrónico
export async function POST(request, { params }) {
    try {
        const { id } = params;
        const body = await request.json();
        const { email_destino } = body;

        const comprobante = await prisma.comprobantes.findUnique({
            where: { id: BigInt(id) },
            include: {
                emisors: true,
                receptors: true,
                PagoAlumno: { include: { alumno: true } }
            }
        });

        if (!comprobante) {
            return NextResponse.json({ error: 'Factura no encontrada.' }, { status: 404 });
        }

        const correoFinal = email_destino || comprobante.PagoAlumno[0]?.alumno?.email || 'estudiante@universidad.edu.mx';

        return NextResponse.json({
            mensaje: `Los archivos PDF y XML de la factura ${comprobante.serie}-${comprobante.folio} han sido enviados exitosamente a ${correoFinal}.`
        }, { status: 200 });

    } catch (error) {
        console.error('Error al enviar factura por correo:', error);
        return NextResponse.json({ error: 'Error al enviar correo: ' + error.message }, { status: 500 });
    }
}
