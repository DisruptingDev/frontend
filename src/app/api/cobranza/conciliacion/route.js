import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { parseExcelFile, parseGenerico } from '@/libs/bankParsers/bankParsers';
import { construirDescripcionConcepto } from '@/lib/services/servicioFacturacion';

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (obj instanceof Date) {
        return isNaN(obj.getTime()) ? null : obj.toISOString();
    }
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

async function getGrupoIdFromRequest(request, body = null) {
    let activeGrupoId = null;
    
    // Si body es FormData, usar .get()
    if (body && typeof body.get === 'function') {
        activeGrupoId = body.get('grupo_id') || body.get('grupoId');
    } else {
        activeGrupoId = body?.grupo_id || body?.grupoId;
    }

    if (activeGrupoId && activeGrupoId !== 'undefined' && activeGrupoId !== 'null' && activeGrupoId !== '') {
        return activeGrupoId.toString();
    }

    const { searchParams } = new URL(request.url);
    let grupoIdParam = searchParams.get('grupo_id') || searchParams.get('grupoId') || request.headers.get('x-grupo-id');
    if (grupoIdParam && grupoIdParam !== 'undefined' && grupoIdParam !== 'null' && grupoIdParam !== '') {
        return grupoIdParam;
    }

    const authHeader = request.headers.get('authorization');
    let tokenGrupoId = null;
    let dbGrupoId = null;

    if (authHeader && authHeader.includes('Bearer ')) {
        try {
            const tokenStr = authHeader.replace('Bearer ', '').trim();
            const payloadStr = Buffer.from(tokenStr.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
            const parsed = JSON.parse(payloadStr);

            if (parsed.grupo_id || parsed.grupoId || parsed.GrupoID) {
                tokenGrupoId = (parsed.grupo_id || parsed.grupoId || parsed.GrupoID).toString();
            }

            const email = parsed.email || parsed.correo || parsed.sub || parsed.username;
            const userId = parsed.id || parsed.user_id || parsed.usuario_id;

            if (email || userId) {
                const userWhere = [];
                if (userId) {
                    try { userWhere.push({ id: BigInt(userId) }); } catch(e){}
                }
                if (email && typeof email === 'string' && email.includes('@')) {
                    userWhere.push({ email: email.trim().toLowerCase() });
                }

                if (userWhere.length > 0) {
                    const dbUser = await prisma.usuarios.findFirst({
                        where: { OR: userWhere },
                        select: { grupo_id: true }
                    });
                    if (dbUser && dbUser.grupo_id) {
                        dbGrupoId = dbUser.grupo_id.toString();
                    }
                }
            }
        } catch (e) {
            console.error('Error resolviendo grupoId en token:', e.message);
        }
    }

    if (tokenGrupoId && tokenGrupoId !== 'undefined' && tokenGrupoId !== 'null' && tokenGrupoId !== '') {
        return tokenGrupoId;
    }
    if (dbGrupoId && dbGrupoId !== 'undefined' && dbGrupoId !== 'null' && dbGrupoId !== '') {
        return dbGrupoId;
    }

    return null;
}

function sanitizeNullBytes(val) {
    if (val === null || val === undefined) return val;
    if (typeof val === 'string') {
        return val.replace(/\u0000/g, '');
    }
    if (typeof val === 'object') {
        if (Array.isArray(val)) {
            return val.map(sanitizeNullBytes);
        }
        if (typeof val.toNumber === 'function' || (val.d && Array.isArray(val.d))) {
            return val; // Skip Decimal/Prisma types
        }
        return Object.fromEntries(
            Object.entries(val).map(([k, v]) => [k, sanitizeNullBytes(v)])
        );
    }
    return val;
}

function parseFechaSegura(val) {
    if (!val) return new Date();
    if (val instanceof Date) {
        return isNaN(val.getTime()) ? new Date() : val;
    }
    if (typeof val === 'object') {
        return new Date();
    }
    const str = String(val).trim();
    if (str === '[object Object]' || str === 'Invalid Date') return new Date();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts[0].length === 4) {
            val = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2]) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            val = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    } else if (str.includes('-')) {
        const parts = str.split('-');
        if (parts[0].length === 4) {
            val = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
        } else if (parts[2]) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            val = `${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return new Date();
    return d;
}

function getFechaLocalSAT() {
    const now = new Date();
    const mxDateStr = now.toLocaleString('en-US', { timeZone: 'America/Mexico_City' });
    const mxDate = new Date(mxDateStr);
    
    const pad = (n) => String(n).padStart(2, '0');
    const year = mxDate.getFullYear();
    const month = pad(mxDate.getMonth() + 1);
    const day = pad(mxDate.getDate());
    const hours = pad(mxDate.getHours());
    const minutes = pad(mxDate.getMinutes());
    const seconds = pad(mxDate.getSeconds());
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Obtener o auto-generar la Razón Social Emisora predeterminada de la Universidad (Multitenancy)
async function obtenerOGenerarEmisorPredeterminado(emisorId = null, grupoId = null) {
    if (emisorId && emisorId !== 'TODOS' && emisorId !== 'todos') {
        try {
            const emisorEncontrado = await prisma.emisors.findUnique({
                where: { id: BigInt(emisorId) }
            });
            if (emisorEncontrado) return emisorEncontrado;
        } catch (e) {
            console.error('Invalid emisorId format:', emisorId);
        }
    }

    const whereBase = { NOT: { rfc: 'UHI950412XX1' } };
    if (grupoId) whereBase.grupo_id = BigInt(grupoId);

    let emisor = null;
    try {
        emisor = await prisma.emisors.findFirst({
            where: { ...whereBase, es_predeterminado: true }
        });
    } catch (e) {
        console.warn('[conciliacion] Warning searching by es_predeterminado:', e.message);
    }

    if (!emisor) {
        emisor = await prisma.emisors.findFirst({
            where: whereBase,
            orderBy: { id: 'asc' }
        });
    }

    if (!emisor && grupoId) {
        emisor = await prisma.emisors.findFirst({
            where: { grupo_id: BigInt(grupoId) },
            orderBy: { id: 'asc' }
        });
    }

    if (!emisor) {
        throw new Error('No existe ninguna Razón Social Emisora registrada para esta cuenta o grupo. Por favor configure su empresa en la plataforma.');
    }
    return emisor;
}

// Obtener o auto-generar Concepto de Cobro predeterminado
async function obtenerOGenerarConceptoDefault(grupoId = null) {
    let concepto = await prisma.conceptoCobro.findFirst();
    if (!concepto) {
        concepto = await prisma.conceptoCobro.create({
            data: {
                nombre: 'Colegiatura Mensual',
                descripcion: 'Cuota de colegiatura regular universitaria',
                clave_prod_serv: '',
                clave_unidad: 'E48',
                monto_base: 2500.00,
                aplica_recargo: false,
                grupo_id: grupoId ? BigInt(grupoId) : null
            }
        });
    }
    return concepto;
}

// Obtener y validar la Serie y Folio real desde el catálogo de Series
async function obtenerSiguienteFolioSerie(emisorId, dbClient = prisma, serieId = null) {
    let whereClause = {
        emisor_id: BigInt(emisorId),
        tipo_comprobante: 'I'
    };
    if (serieId) {
        whereClause.id = BigInt(serieId);
    }

    let serie = await dbClient.series.findFirst({
        where: whereClause
    });

    if (!serie) {
        serie = await dbClient.series.create({
            data: {
                clave: 'F',
                descripcion: 'Serie Facturación Colegiaturas',
                ultimo_folio: 0n,
                emisor_id: BigInt(emisorId),
                tipo_comprobante: 'I'
            }
        });
    }

    const ultimoFolioNum = Number(serie.ultimo_folio || 0);
    const nuevoFolioNum = ultimoFolioNum + 1;

    await dbClient.series.update({
        where: { id: serie.id },
        data: { ultimo_folio: BigInt(nuevoFolioNum) }
    });

    return {
        serie: serie.clave || 'F',
        folio: nuevoFolioNum.toString()
    };
}

// Helper para poblar estructura completa de Conceptos y XML Base CFDI 4.0
async function crearEstructuraCompletaCFDI({ comprobante, emisor, receptor, descripcionConcepto, monto, grupoId, dbClient = prisma, items = [] }) {
    const prevHeaders = await dbClient.conceptos.findMany({
        where: { comprobante_id: comprobante.id },
        select: { id: true }
    });

    if (prevHeaders.length > 0) {
        const prevHeaderIds = prevHeaders.map(h => h.id);
        try {
            const prevConceptos = await dbClient.concepto.findMany({
                where: { conceptos_id: { in: prevHeaderIds } },
                select: { id: true }
            });
            if (prevConceptos.length > 0) {
                const prevConceptoIds = prevConceptos.map(c => c.id);
                const prevImpuestos = await dbClient.impuestos.findMany({
                    where: { concepto_id: { in: prevConceptoIds } },
                    select: { id: true }
                });
                if (prevImpuestos.length > 0) {
                    const prevImpuestoIds = prevImpuestos.map(i => i.id);
                    await dbClient.traslados.deleteMany({ where: { impuestos_id: { in: prevImpuestoIds } } });
                    await dbClient.retencions.deleteMany({ where: { impuestos_id: { in: prevImpuestoIds } } });
                    await dbClient.impuestos.deleteMany({ where: { id: { in: prevImpuestoIds } } });
                }
                await dbClient.concepto.deleteMany({
                    where: { id: { in: prevConceptoIds } }
                });
            }
            await dbClient.conceptos.deleteMany({
                where: { id: { in: prevHeaderIds } }
            });
        } catch(e) {}
    }

    const conceptosHeader = await dbClient.conceptos.create({
        data: {
            comprobante_id: comprobante.id,
            grupo_id: grupoId || emisor.grupo_id,
            total_impuestos_trasladados: 0,
            total_impuestos_retenidos: 0,
            total_impuestos_trasladados_string: "0.00",
            total_impuestos_retenidos_string: "0.00"
        }
    });

    let listaItemsFinal = [];
    if (Array.isArray(items) && items.length > 0) {
        listaItemsFinal = items.map(it => ({
            descripcion: (it.descripcion || it.concepto || 'Servicios Educativos').trim(),
            monto: Number(it.monto || it.valor_unitario || 0),
            clave_prod_serv: it.clave_prod_serv || ''
        })).filter(it => it.monto > 0);
    }

    if (listaItemsFinal.length === 0) {
        listaItemsFinal = [{
            descripcion: descripcionConcepto || 'Colegiatura y Servicios Educativos Integrales',
            monto: Number(monto || 0),
            clave_prod_serv: ''
        }];
    }

    let subtotalAcumulado = 0;
    let totalAcumulado = 0;
    let xmlConceptosList = '';

    for (const item of listaItemsFinal) {
        const montoNeto = Number(item.monto.toFixed(2));
        subtotalAcumulado += montoNeto;
        totalAcumulado += montoNeto;

        const descSat = (item.descripcion || 'Servicios Educativos').trim();

        const conceptoDB = await dbClient.concepto.create({
            data: {
                conceptos_id: conceptosHeader.id,
                clave_prod_serv: item.clave_prod_serv || '',
                clave_unidad: 'E48',
                unidad: 'Servicio',
                cantidad: 1n,
                descripcion: descSat,
                valor_unitario: montoNeto,
                valor_unitario_string: montoNeto.toFixed(2),
                importe: montoNeto,
                importe_string: montoNeto.toFixed(2),
                descuento: 0,
                descuento_string: '0',
                objeto_imp: '02'
            }
        });

        const impuestoConcepto = await dbClient.impuestos.create({
            data: { concepto_id: conceptoDB.id }
        });

        await dbClient.traslados.create({
            data: {
                impuestos_id: impuestoConcepto.id,
                base: montoNeto,
                base_string: montoNeto.toFixed(2),
                impuesto_clave: '002',
                tipo_factor: 'Exento',
                tasa_catalogo_id: 4,
                impuesto_catalogo_id: 2
            }
        });

        xmlConceptosList += `    <cfdi:Concepto ClaveProdServ="${item.clave_prod_serv || ''}" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="${descSat}" ValorUnitario="${montoNeto.toFixed(2)}" Importe="${montoNeto.toFixed(2)}" ObjetoImp="02">
      <cfdi:Impuestos>
        <cfdi:Traslados>
          <cfdi:Traslado Base="${montoNeto.toFixed(2)}" Impuesto="002" TipoFactor="Exento"/>
        </cfdi:Traslados>
      </cfdi:Impuestos>
    </cfdi:Concepto>\n`;
    }

    subtotalAcumulado = Number(subtotalAcumulado.toFixed(2));
    totalAcumulado = Number(totalAcumulado.toFixed(2));

    const xmlBase = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante xmlns:cfdi="http://www.sat.gob.mx/cfd/4" Version="4.0" Serie="${comprobante.serie}" Folio="${comprobante.folio}" Fecha="${comprobante.fecha}" FormaPago="03" MetodoPago="PUE" Moneda="MXN" SubTotal="${subtotalAcumulado.toFixed(2)}" Total="${totalAcumulado.toFixed(2)}" TipoDeComprobante="I" LugarExpedicion="${emisor.lugar_expedicion || '01000'}">
  <cfdi:Emisor Rfc="${emisor.rfc}" Nombre="${emisor.nombre}" RegimenFiscal="${emisor.regimen_fiscal || '601'}"/>
  <cfdi:Receptor Rfc="${receptor.rfc}" Nombre="${receptor.nombre}" DomicilioFiscalReceptor="${receptor.domicilio_fiscal_receptor || emisor.lugar_expedicion || '01000'}" RegimenFiscalReceptor="${receptor.regimen_fiscal_receptor || '616'}" UsoCFDI="${receptor.uso_cfdi || 'S01'}"/>
  <cfdi:Conceptos>
${xmlConceptosList.trimEnd()}
  </cfdi:Conceptos>
</cfdi:Comprobante>`;

    await dbClient.comprobantes.update({
        where: { id: comprobante.id },
        data: {
            sub_total: String(subtotalAcumulado),
            sub_total_string: subtotalAcumulado.toFixed(2),
            total: String(totalAcumulado),
            total_string: totalAcumulado.toFixed(2),
            xml_timbrado: xmlBase
        }
    });
}

// POST: Procesar conciliación bancaria O asignación manual de movimiento a un alumno
export async function POST(request) {
    try {
        const contentType = request.headers.get('content-type') || '';

        // =========================================================================
        // CASO A: ASIGNACIÓN MANUAL DE MOVIMIENTO A UN ALUMNO (JSON)
        // =========================================================================
        if (contentType.includes('application/json')) {
            const body = sanitizeNullBytes(await request.json());
            const { action, alumno_id, monto, fecha_pago, referencia_bancaria, descripcion, emisor_id, grupo_id, serie_id } = body;

            if (action === 'ASIGNAR_MANUAL') {
                if (!alumno_id) {
                    return NextResponse.json({ error: 'Debe seleccionar un alumno para la asignación.' }, { status: 400 });
                }

                const alumnoObj = await prisma.alumno.findUnique({
                    where: { id: BigInt(alumno_id) },
                    include: { receptor: true, programa_academico: true }
                });

                if (!alumnoObj) {
                    return NextResponse.json({ error: 'El alumno seleccionado no existe.' }, { status: 404 });
                }

                const emisor = await obtenerOGenerarEmisorPredeterminado(emisor_id);
                const conceptoDefault = await obtenerOGenerarConceptoDefault(grupo_id);

                let cargoEncontrado = await prisma.cargoAlumno.findFirst({
                    where: { alumno_id: BigInt(alumno_id), estatus: { in: ['PENDIENTE', 'PARCIAL'] }, monto_pendiente: { gt: 0 } },
                    orderBy: { id: 'asc' },
                    include: { producto: true, concepto: true }
                });

                const montoNum = Number(monto || 0);

                // Garantizar una referencia bancaria única para evitar fallos de Unique Constraint
                let refBancariaSegura = (referencia_bancaria && referencia_bancaria !== 'SIN_REF') 
                    ? referencia_bancaria 
                    : `REF-MANUAL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

                const refExiste = await prisma.cargoAlumno.findFirst({
                    where: { referencia_bancaria: refBancariaSegura }
                });

                if (refExiste) {
                    refBancariaSegura = `${refBancariaSegura}-${Math.floor(Math.random() * 10000)}`;
                }

                if (!cargoEncontrado) {
                    const fechaVenc = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                    cargoEncontrado = await prisma.cargoAlumno.create({
                        data: {
                            alumno_id: BigInt(alumno_id),
                            concepto_id: conceptoDefault.id,
                            fecha_emision: new Date(),
                            fecha_vencimiento: fechaVenc,
                            monto_total: montoNum,
                            monto_pagado: 0,
                            monto_pendiente: montoNum,
                            referencia_bancaria: refBancariaSegura,
                            estatus: 'PENDIENTE',
                            grupo_id: grupo_id ? BigInt(grupo_id) : emisor.grupo_id
                        },
                        include: { producto: true, concepto: true }
                    });
                }

                const nuevoMontoPagado = Number(cargoEncontrado.monto_pagado) + montoNum;
                const nuevoMontoPendiente = Math.max(0, Number(cargoEncontrado.monto_total) - nuevoMontoPagado);
                const nuevoEstatus = nuevoMontoPendiente === 0 ? 'PAGADO' : 'PARCIAL';

                await prisma.cargoAlumno.update({
                    where: { id: cargoEncontrado.id },
                    data: {
                        monto_pagado: nuevoMontoPagado,
                        monto_pendiente: nuevoMontoPendiente,
                        estatus: nuevoEstatus
                    }
                });

                let receptorId = alumnoObj.receptor_id;
                let receptorObj = alumnoObj.receptor;

                if (!receptorId || !receptorObj) {
                    let receptorGenerico = await prisma.receptors.findFirst({ where: { rfc: 'XAXX010101000' } });
                    if (!receptorGenerico) {
                        receptorGenerico = await prisma.receptors.create({
                            data: {
                                rfc: 'XAXX010101000',
                                nombre: 'PUBLICO EN GENERAL',
                                domicilio_fiscal_receptor: emisor.lugar_expedicion || '01000',
                                regimen_fiscal_receptor: '616',
                                uso_cfdi: 'S01'
                            }
                        });
                    }
                    receptorId = receptorGenerico.id;
                    receptorObj = receptorGenerico;
                }

                const { serie, folio } = await obtenerSiguienteFolioSerie(emisor.id, prisma, serie_id);

                const subTotalStr = String(Number(montoNum).toFixed(2));

                const comprobanteAuto = await prisma.comprobantes.create({
                    data: sanitizeNullBytes({
                        emisors: { connect: { id: BigInt(emisor.id) } },
                        receptors: { connect: { id: BigInt(receptorId) } },
                        ...(emisor.grupo_id ? { grupos: { connect: { id: BigInt(emisor.grupo_id) } } } : {}),
                        version: '4.0',
                        serie: serie,
                        folio: folio,
                        fecha: getFechaLocalSAT(),
                        forma_pago: '03',
                        metodo_pago: 'PUE',
                        moneda: 'MXN',
                        tipo_cambio: '1',
                        exportacion: '01',
                        tipo_de_comprobante: 'I',
                        uso_cfdi: (receptorObj.uso_cfdi || 'D10').split(' ')[0].trim(),
                        lugar_expedicion: emisor.lugar_expedicion || '01000',
                        sub_total_string: subTotalStr,
                        total_string: subTotalStr,
                        descuento_string: '0.00',
                        estatus: 'PENDIENTE'
                    })
                });

                await prisma.$executeRawUnsafe(`
                    UPDATE "comprobantes" 
                    SET "sub_total" = '${subTotalStr}', "total" = '${subTotalStr}', "descuento" = '0.00', "emisor_id" = ${emisor.id}, "receptor_id" = ${receptorId}
                    WHERE id = ${comprobanteAuto.id}
                `);

                const descConcepto = construirDescripcionConcepto({
                    producto: cargoEncontrado.producto?.nombre || cargoEncontrado.concepto?.nombre || 'MENSUALIDAD',
                    carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                    fechaPago: fecha_pago,
                    nombreAlumno: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno} ${alumnoObj.apellido_materno || ''}`.trim(),
                    curp: alumnoObj.curp,
                    matricula: alumnoObj.matricula,
                    rvoe: alumnoObj.programa_academico?.rvoe
                });

                let claveProdManual = '';
                if (alumnoObj.programa_academico_id) {
                    const concProg = await prisma.conceptoCobro.findFirst({
                        where: { programa_academico_id: BigInt(alumnoObj.programa_academico_id) }
                    });
                    if (concProg?.clave_prod_serv) {
                        claveProdManual = concProg.clave_prod_serv;
                    }
                }
                if (!claveProdManual) {
                    claveProdManual = cargoEncontrado.producto?.clave_prod_sat || cargoEncontrado.concepto?.clave_prod_serv || '';
                }

                await crearEstructuraCompletaCFDI({
                    comprobante: comprobanteAuto,
                    emisor,
                    receptor: receptorObj,
                    monto: montoNum,
                    grupoId: emisor.grupo_id,
                    items: [{
                        descripcion: descConcepto,
                        monto: montoNum,
                        clave_prod_serv: claveProdManual || ''
                    }]
                });

                const pago = await prisma.pagoAlumno.create({
                    data: {
                        alumno_id: BigInt(alumno_id),
                        cargo_id: cargoEncontrado.id,
                        fecha_pago: parseFechaSegura(fecha_pago),
                        monto: montoNum,
                        referencia_bancaria: refBancariaSegura,
                        metodo_pago: '03',
                        estado_conciliacion: 'CONCILIADO',
                        comprobante_id: comprobanteAuto.id,
                        grupo_id: grupo_id ? BigInt(grupo_id) : emisor.grupo_id
                    }
                });

                return NextResponse.json({
                    mensaje: `Movimiento bancario asignado exitosamente a ${alumnoObj.nombre} ${alumnoObj.apellido_paterno}. Pre-factura ${serie}-${folio} creada.`,
                    comprobante_folio: `${serie}-${folio}`,
                    alumno_nombre: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno}`,
                    pago_id: pago.id.toString()
                }, { status: 200 });
            }

                        if (action === 'CONFIRMAR_MASIVO') {
                const { asignaciones } = body;
                if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
                    return NextResponse.json({ error: 'No hay asignaciones para procesar.' }, { status: 400 });
                }

                const emisor = await obtenerOGenerarEmisorPredeterminado(emisor_id);
                const procesados = [];

                for (const asig of asignaciones) {
                    const { alumno_id, monto, fecha_pago, referencia_bancaria, descripcion, cargos_ids, serie_id } = asig;
                    if (!alumno_id) continue;
                    try {
                        await prisma.$transaction(async (tx) => {
                            const alumnoObj = await tx.alumno.findUnique({
                                where: { id: BigInt(alumno_id) },
                                include: { receptor: true, programa_academico: true }
                            });
                            if (!alumnoObj) return;

                            let montoRestante = Number(monto);
                            let cargosAplicados = [];
                            
                            // Si el usuario seleccionó cargos específicos, los buscamos
                            if (cargos_ids && Array.isArray(cargos_ids) && cargos_ids.length > 0) {
                                const cargosSeleccionados = await tx.cargoAlumno.findMany({
                                    where: { id: { in: cargos_ids.map(id => BigInt(id)) }, monto_pendiente: { gt: 0 } },
                                    include: { producto: true, concepto: true },
                                    orderBy: { id: 'asc' }
                                });

                                if (cargosSeleccionados.length > 0) {
                                    try {
                                        const cIdsStr = cargosSeleccionados.map(c => c.id.toString()).join(',');
                                        const rawItems = await tx.$queryRawUnsafe(`SELECT id, detalles_items FROM "CargoAlumno" WHERE id IN (${cIdsStr})`);
                                        const rawMap = {};
                                        for (const r of rawItems) {
                                            rawMap[r.id.toString()] = r.detalles_items;
                                        }
                                        for (const c of cargosSeleccionados) {
                                            if (rawMap[c.id.toString()]) {
                                                c.detalles_items = rawMap[c.id.toString()];
                                            }
                                        }
                                    } catch (e) {}
                                }
                                
                                for (const cargo of cargosSeleccionados) {
                                    if (montoRestante <= 0) break;
                                    const pendiente = Number(cargo.monto_pendiente);
                                    if (pendiente <= 0) continue;
                                    
                                    const aplicar = Math.min(pendiente, montoRestante);
                                    montoRestante -= aplicar;
                                    
                                    const nuevoPagado = Number(cargo.monto_pagado) + aplicar;
                                    const nuevoPendiente = Number(cargo.monto_total) - nuevoPagado;
                                    const nuevoEstatus = nuevoPendiente <= 0 ? 'PAGADO' : 'PARCIAL';
                                    
                                    await tx.cargoAlumno.update({
                                        where: { id: cargo.id },
                                        data: {
                                            monto_pagado: nuevoPagado,
                                            monto_pendiente: nuevoPendiente,
                                            estatus: nuevoEstatus
                                        }
                                    });
                                    
                                    cargosAplicados.push({ cargo, montoAplicado: aplicar });
                                }
                            } else {
                                // Si no se seleccionó cargo (quizás no había pendientes), intentar con el más antiguo si existe
                                let cargoEncontrado = await tx.cargoAlumno.findFirst({
                                    where: { alumno_id: alumnoObj.id, estatus: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDO'] }, monto_pendiente: { gt: 0 } },
                                    include: { producto: true, concepto: true },
                                    orderBy: { id: 'asc' }
                                });
                                if (cargoEncontrado) {
                                    try {
                                        const rawItems = await tx.$queryRawUnsafe(`SELECT id, detalles_items FROM "CargoAlumno" WHERE id = ${cargoEncontrado.id}`);
                                        if (rawItems && rawItems.length > 0) {
                                            cargoEncontrado.detalles_items = rawItems[0].detalles_items;
                                        }
                                    } catch (e) {}

                                    const pendiente = Number(cargoEncontrado.monto_pendiente);
                                    const aplicar = Math.min(pendiente, montoRestante);
                                    montoRestante -= aplicar;
                                    
                                    const nuevoPagado = Number(cargoEncontrado.monto_pagado) + aplicar;
                                    const nuevoPendiente = Number(cargoEncontrado.monto_total) - nuevoPagado;
                                    const nuevoEstatus = nuevoPendiente <= 0 ? 'PAGADO' : 'PARCIAL';
                                    
                                    await tx.cargoAlumno.update({
                                        where: { id: cargoEncontrado.id },
                                        data: { monto_pagado: nuevoPagado, monto_pendiente: nuevoPendiente, estatus: nuevoEstatus }
                                    });
                                    
                                    cargosAplicados.push({ cargo: cargoEncontrado, montoAplicado: aplicar });
                                }
                            }
                            
                            // Si sobró monto (Saldo a favor)
                            if (montoRestante > 0.01) {
                                const concDef = await tx.conceptoCobro.findFirst({ where: { nombre: 'Colegiatura' } });
                                const concId = concDef ? concDef.id : BigInt(1);
                                
                                // Generar código SAF consecutivo
                                const ultimosSAF = await tx.cargoAlumno.findMany({
                                    where: { codigo_ficha: { startsWith: 'SAF-' } },
                                    select: { codigo_ficha: true },
                                    orderBy: { id: 'desc' },
                                    take: 50
                                });
                                let maxSafNum = 0;
                                for (const c of ultimosSAF) {
                                    if (c.codigo_ficha) {
                                        const match = c.codigo_ficha.match(/^SAF-(\d+)$/i);
                                        if (match) {
                                            const num = parseInt(match[1], 10);
                                            if (!isNaN(num) && num > maxSafNum) maxSafNum = num;
                                        }
                                    }
                                }
                                const proximoSafNum = maxSafNum + 1;
                                const nuevoCodigoSAF = `SAF-${String(proximoSafNum).padStart(5, '0')}`;
                                let refSAF = `REF-${nuevoCodigoSAF}`;

                                const cargoSaldoAFavor = await tx.cargoAlumno.create({
                                    data: {
                                        alumno_id: alumnoObj.id,
                                        concepto_id: concId,
                                        codigo_ficha: nuevoCodigoSAF,
                                        referencia_bancaria: refSAF,
                                        monto_total: montoRestante,
                                        monto_pagado: montoRestante,
                                        monto_pendiente: 0,
                                        fecha_emision: new Date(),
                                        fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Válido por 1 año
                                        estatus: 'PAGADO',
                                        grupo_id: grupo_id ? BigInt(grupo_id) : alumnoObj.grupo_id
                                    }
                                });
                                
                                cargosAplicados.push({ cargo: cargoSaldoAFavor, montoAplicado: montoRestante, esSaldoAFavor: true });
                            }
                            
                            // Receptor 
                            let receptorId = alumnoObj.receptor_id;
                            let receptorObj = alumnoObj.receptor;

                            if (!receptorId || !receptorObj) {
                                let receptorGenerico = await tx.receptors.findFirst({ where: { rfc: 'XAXX010101000' } });
                                if (!receptorGenerico) {
                                    receptorGenerico = await tx.receptors.create({
                                        data: {
                                            rfc: 'XAXX010101000',
                                            nombre: 'PUBLICO EN GENERAL',
                                            domicilio_fiscal_receptor: emisor.lugar_expedicion || '01000',
                                            regimen_fiscal_receptor: '616',
                                            uso_cfdi: 'S01'
                                        }
                                    });
                                }
                                receptorId = receptorGenerico.id;
                                receptorObj = receptorGenerico;
                            }

                            const { serie, folio } = await obtenerSiguienteFolioSerie(emisor.id, tx, serie_id);

                            const subTotalStr = String(Number(monto).toFixed(2));

                            const comprobanteAuto = await tx.comprobantes.create({
                                data: sanitizeNullBytes({
                                    emisors: { connect: { id: BigInt(emisor.id) } },
                                    receptors: { connect: { id: BigInt(receptorId) } },
                                    ...(emisor.grupo_id ? { grupos: { connect: { id: BigInt(emisor.grupo_id) } } } : {}),
                                    version: '4.0',
                                    serie: serie,
                                    folio: folio,
                                    fecha: getFechaLocalSAT(),
                                    forma_pago: '03',
                                    metodo_pago: 'PUE',
                                    moneda: 'MXN',
                                    tipo_cambio: '1',
                                    exportacion: '01',
                                    tipo_de_comprobante: 'I',
                                    uso_cfdi: (receptorObj.uso_cfdi || 'D10').split(' ')[0].trim(),
                                    lugar_expedicion: emisor.lugar_expedicion || '01000',
                                    sub_total_string: subTotalStr,
                                    total_string: subTotalStr,
                                    descuento_string: '0.00',
                                    estatus: 'PENDIENTE'
                                })
                            });

                            await tx.$executeRawUnsafe(`
                                 UPDATE "comprobantes" 
                                 SET "sub_total" = '${subTotalStr}', "total" = '${subTotalStr}', "descuento" = '0.00', "emisor_id" = ${emisor.id}, "receptor_id" = ${receptorId}
                                 WHERE id = ${comprobanteAuto.id}
                             `);

                            const itemsList = [];
                            for (const { cargo, montoAplicado, esSaldoAFavor } of cargosAplicados) {
                                if (esSaldoAFavor) {
                                    itemsList.push({
                                        descripcion: construirDescripcionConcepto({
                                            producto: 'SALDO A FAVOR',
                                            carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                                            fechaPago: fecha_pago,
                                            nombreAlumno: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno} ${alumnoObj.apellido_materno || ''}`.trim(),
                                            curp: alumnoObj.curp,
                                            matricula: alumnoObj.matricula,
                                            rvoe: alumnoObj.programa_academico?.rvoe
                                        }),
                                        monto: montoAplicado,
                                        clave_prod_serv: ''
                                    });
                                    continue;
                                }

                                let parsedItems = null;
                                if (cargo.detalles_items) {
                                    try {
                                        parsedItems = typeof cargo.detalles_items === 'string' ? JSON.parse(cargo.detalles_items) : cargo.detalles_items;
                                    } catch (e) {}
                                }

                                if (Array.isArray(parsedItems) && parsedItems.length > 0) {
                                    const sumaMontoDetalles = parsedItems.reduce((acc, it) => acc + (parseFloat(it.monto) || 0), 0);
                                    for (const itemDet of parsedItems) {
                                        const itemMontoBase = parseFloat(itemDet.monto) || 0;
                                        const proporcion = sumaMontoDetalles > 0 ? (itemMontoBase / sumaMontoDetalles) : (1 / parsedItems.length);
                                        const itemMontoCalc = Math.round(montoAplicado * proporcion * 100) / 100;

                                        let claveItemDet = '';
                                        if (alumnoObj.programa_academico_id) {
                                            const concProg = await tx.conceptoCobro.findFirst({
                                                where: { programa_academico_id: BigInt(alumnoObj.programa_academico_id) }
                                            });
                                            if (concProg?.clave_prod_serv) {
                                                claveItemDet = concProg.clave_prod_serv;
                                            }
                                        }
                                        if (!claveItemDet) {
                                            claveItemDet = cargo.producto?.clave_prod_sat || cargo.concepto?.clave_prod_serv || '';
                                        }

                                        itemsList.push({
                                            descripcion: construirDescripcionConcepto({
                                                producto: (itemDet.concepto || cargo.concepto?.nombre || 'Colegiatura').toUpperCase(),
                                                carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                                                fechaPago: fecha_pago,
                                                nombreAlumno: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno} ${alumnoObj.apellido_materno || ''}`.trim(),
                                                curp: alumnoObj.curp,
                                                matricula: alumnoObj.matricula,
                                                rvoe: alumnoObj.programa_academico?.rvoe
                                            }),
                                            monto: itemMontoCalc > 0 ? itemMontoCalc : itemMontoBase,
                                            clave_prod_serv: claveItemDet || ''
                                        });
                                    }
                                } else {
                                    const prodNombre = cargo.producto?.nombre || cargo.concepto?.nombre || 'MENSUALIDAD';
                                    let claveItemAuto = '';
                                    if (alumnoObj.programa_academico_id) {
                                        const concProg = await tx.conceptoCobro.findFirst({
                                            where: { programa_academico_id: BigInt(alumnoObj.programa_academico_id) }
                                        });
                                        if (concProg?.clave_prod_serv) {
                                            claveItemAuto = concProg.clave_prod_serv;
                                        }
                                    }
                                    if (!claveItemAuto) {
                                        claveItemAuto = cargo.producto?.clave_prod_sat || cargo.concepto?.clave_prod_serv || '';
                                    }

                                    itemsList.push({
                                        descripcion: construirDescripcionConcepto({
                                            producto: prodNombre,
                                            carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                                            fechaPago: fecha_pago,
                                            nombreAlumno: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno} ${alumnoObj.apellido_materno || ''}`.trim(),
                                            curp: alumnoObj.curp,
                                            matricula: alumnoObj.matricula,
                                            rvoe: alumnoObj.programa_academico?.rvoe
                                        }),
                                        monto: montoAplicado,
                                        clave_prod_serv: claveItemAuto || ''
                                    });
                                }
                            }

                            if (itemsList.length === 0) {
                                itemsList.push({
                                    descripcion: construirDescripcionConcepto({
                                        producto: 'MENSUALIDAD',
                                        carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                                        fechaPago: fecha_pago,
                                        nombreAlumno: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno} ${alumnoObj.apellido_materno || ''}`.trim(),
                                        curp: alumnoObj.curp,
                                        matricula: alumnoObj.matricula,
                                        rvoe: alumnoObj.programa_academico?.rvoe
                                    }),
                                    monto: Number(monto),
                                    clave_prod_serv: ''
                                });
                            }

                            await crearEstructuraCompletaCFDI({
                                comprobante: comprobanteAuto,
                                emisor,
                                receptor: receptorObj,
                                monto: Number(monto),
                                grupoId: emisor.grupo_id,
                                items: itemsList,
                                dbClient: tx
                            });

                            // Registrar cada pago contra los cargos
                            for (const { cargo, montoAplicado } of cargosAplicados) {
                                await tx.pagoAlumno.create({
                                    data: {
                                        alumno_id: alumnoObj.id,
                                        cargo_id: cargo.id,
                                        fecha_pago: parseFechaSegura(fecha_pago),
                                        monto: montoAplicado,
                                        referencia_bancaria: referencia_bancaria || `MANUAL-${Date.now()}`,
                                        metodo_pago: '03',
                                        estado_conciliacion: 'CONCILIADO',
                                        comprobante_id: comprobanteAuto.id,
                                        grupo_id: grupo_id ? BigInt(grupo_id) : emisor.grupo_id
                                    }
                                });
                            }

                            procesados.push({
                                alumno_nombre: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno}`,
                                comprobante_folio: `${serie}-${folio}`
                            });
                        });
                    } catch (e) {
                        if (e.message !== 'SAF_NO_APROBADO') {
                            console.error('Error procesando fila:', e);
                        }
                    }
                }

                return NextResponse.json({
                    mensaje: `Se han guardado y generado ${procesados.length} pre-facturas exitosamente.`,
                    total_procesados: procesados.length,
                    procesados
                }, { status: 200 });
            }

            return NextResponse.json({ error: 'Acción no reconocida en conciliación.' }, { status: 400 });
        }

        // =========================================================================
        // CASO B: PROCESAR ARCHIVO BANCARIO COMPLETO (MULTIPART FORMDATA)
        // =========================================================================
        const formData = await request.formData();
        const file = formData.get('file');
        const banco = formData.get('banco') || 'GENERICO';
        const usuarioId = formData.get('usuario_id');
        const grupoId = await getGrupoIdFromRequest(request, formData);

        if (!file) {
            return NextResponse.json({ error: 'No se ha adjuntado ningún archivo para conciliación.' }, { status: 400 });
        }

        const emisor = await obtenerOGenerarEmisorPredeterminado();

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        let movimientos = [];
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
            movimientos = parseExcelFile(buffer, banco);
        } else {
            const textContent = buffer.toString('utf-8');
            movimientos = parseGenerico(textContent);
        }

        movimientos = sanitizeNullBytes(movimientos);

        if (movimientos.length === 0) {
            return NextResponse.json({ error: 'El archivo no contiene movimientos bancarios válidos o con formato reconocible.' }, { status: 400 });
        }

                const isSuperUser = formData.get('is_superadmin') === 'true' || request.headers.get('x-super-user') === 'true';

        // Filtro multitenant estricto para alumnos y cargos del grupo activo
        const andFiltersAlumnos = [{ estatus: 'ACTIVO' }];
        if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS' && grupoId !== 'null' && grupoId !== 'undefined' && grupoId !== '') {
            andFiltersAlumnos.push({
                OR: [
                    { grupo_id: BigInt(grupoId) },
                    { grupo_id: null }
                ]
            });
        } else if ((grupoId === 'ALL' || grupoId === 'TODOS') && isSuperUser) {
            // Vista global autorizada para superusuario
        } else {
            andFiltersAlumnos.push({ grupo_id: BigInt(-1) });
        }

        let todosLosAlumnos = [];
        try {
            todosLosAlumnos = await prisma.alumno.findMany({
                where: { AND: andFiltersAlumnos },
                include: { receptor: true, programa_academico: true }
            });
        } catch (e) {
            todosLosAlumnos = await prisma.alumno.findMany({
                where: { AND: andFiltersAlumnos }
            });
        }

        const ahoraConc = new Date();
        try {
            await prisma.cargoAlumno.updateMany({
                where: {
                    ...(grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS' && grupoId !== 'null' && grupoId !== 'undefined' && grupoId !== '' ? { grupo_id: BigInt(grupoId) } : {}),
                    fecha_vencimiento: { lt: ahoraConc },
                    monto_pendiente: { gt: 0 },
                    estatus: 'PENDIENTE'
                },
                data: {
                    estatus: 'VENCIDO'
                }
            });
        } catch (e) {}

        const andFiltersCargos = [{ estatus: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDO'] }, monto_pendiente: { gt: 0 } }];
        if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS' && grupoId !== 'null' && grupoId !== 'undefined' && grupoId !== '') {
            andFiltersCargos.push({
                OR: [
                    { grupo_id: BigInt(grupoId) },
                    { grupo_id: null }
                ]
            });
        } else if ((grupoId === 'ALL' || grupoId === 'TODOS') && isSuperUser) {
            // Vista global autorizada para superusuario
        } else {
            andFiltersCargos.push({ grupo_id: BigInt(-1) });
        }

        let cargosPendientes = [];
        try {
            cargosPendientes = await prisma.cargoAlumno.findMany({
                where: { AND: andFiltersCargos },
                include: { ConceptoCobro: true, Alumno: true }
            });
        } catch (e1) {
            try {
                cargosPendientes = await prisma.cargoAlumno.findMany({
                    where: { AND: andFiltersCargos },
                    include: { concepto: true, alumno: true }
                });
            } catch (e2) {
                cargosPendientes = await prisma.cargoAlumno.findMany({
                    where: { AND: andFiltersCargos }
                });
            }
        }

        if (cargosPendientes.length > 0) {
            try {
                const cpIdsStr = cargosPendientes.map(c => c.id.toString()).join(',');
                const rawItems = await prisma.$queryRawUnsafe(`SELECT id, detalles_items FROM "CargoAlumno" WHERE id IN (${cpIdsStr})`);
                const rawMap = {};
                for (const r of rawItems) {
                    rawMap[r.id.toString()] = r.detalles_items;
                }
                for (const c of cargosPendientes) {
                    if (rawMap[c.id.toString()]) {
                        c.detalles_items = rawMap[c.id.toString()];
                    }
                }
            } catch (e) {}
        }

        let pagosExistentes = [];
        try {
            pagosExistentes = await prisma.pagoAlumno.findMany({
                select: { monto: true, fecha_pago: true, referencia_bancaria: true }
            });
        } catch(e) {}

        let conciliadosCount = 0;
        let pendientesCount = 0;
        let duplicadosCount = 0;
        let montoTotal = 0;
        const pagosProcesados = [];

        const coincideFicha = (c, refClean, dClean, textoClean = '') => {
            if (!c) return false;
            const stripZ = (s) => (s || '').replace(/^0+/, '');
            const refC_Z = stripZ(refClean);
            const dC_Z = stripZ(dClean);
            const tC_Z = stripZ(textoClean);

            const refB = (c.referencia_bancaria || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const refB_Z = stripZ(refB);
            if (refB && (refB === refClean || refClean.includes(refB) || dClean.includes(refB) || textoClean.includes(refB))) return true;
            if (refB_Z && refB_Z.length >= 3 && (refC_Z.includes(refB_Z) || dC_Z.includes(refB_Z) || tC_Z.includes(refB_Z))) return true;

            const codF = (c.codigo_ficha || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            const codF_Z = stripZ(codF);
            if (codF && (codF === refClean || refClean.includes(codF) || dClean.includes(codF) || textoClean.includes(codF))) return true;
            if (codF_Z && codF_Z.length >= 3 && (refC_Z.includes(codF_Z) || dC_Z.includes(codF_Z) || tC_Z.includes(codF_Z))) return true;

            if (c.codigo_ficha) {
                const partes = c.codigo_ficha.split(/\s+/).map(p => p.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()).filter(Boolean);
                for (const p of partes) {
                    if (p.length >= 3 && (refClean.includes(p) || dClean.includes(p) || textoClean.includes(p))) return true;
                    const p_Z = stripZ(p);
                    if (p_Z.length >= 3 && (refC_Z.includes(p_Z) || dC_Z.includes(p_Z) || tC_Z.includes(p_Z))) return true;
                }
            }
            return false;
        };

        for (const mov of movimientos) {
            // Verificar si el movimiento ya fue procesado
            const esDuplicado = pagosExistentes.some(p => {
                const isSameMonto = Math.abs(Number(p.monto) - mov.monto) < 0.01;
                let dateP = '';
                try { dateP = new Date(p.fecha_pago).toISOString().split('T')[0]; } catch(e) {}
                let dateM = '';
                try { dateM = new Date(mov.fecha).toISOString().split('T')[0]; } catch(e) {}
                const isSameDate = dateP !== '' && dateM !== '' && dateP === dateM;
                const isSameRef = (p.referencia_bancaria || '') === (mov.referencia || '');
                return isSameMonto && isSameDate && isSameRef;
            });

            if (esDuplicado) {
                duplicadosCount++;
                continue;
            }

            montoTotal += mov.monto;

            let alumnoEncontrado = null;
            let metodoMatcheo = null;
            
            const refMovOriginal = (mov.referenciaLimpia || mov.referencia || '').toUpperCase();
            const descOriginal = (mov.descripcion || '').toUpperCase();
            const textoOriginal = (mov.texto_completo || '').toUpperCase();
            
            const cleanStr = (s) => {
                if (!s) return '';
                return String(s)
                    .normalize("NFD")
                    .replace(/[\u0300-\u036f]/g, "")
                    .replace(/ñ/g, "n")
                    .replace(/Ñ/g, "N")
                    .replace(/[^a-zA-Z0-9]/g, '')
                    .toUpperCase();
            };
            const stripZeros = (s) => (s || '').replace(/^0+/, '');
            const refMovClean = cleanStr(refMovOriginal);
            const descClean = cleanStr(descOriginal);
            const textoClean = cleanStr(textoOriginal);
            const refMovCleanNoZeros = stripZeros(refMovClean);
            const descCleanNoZeros = stripZeros(descClean);
            const textoCleanNoZeros = stripZeros(textoClean);

            // 1. Matcheo directo con Alumnos por CLABE o Referencia Personal
            alumnoEncontrado = todosLosAlumnos.find(a => {
                const clabeAlu = cleanStr(a.clabe_interbancaria);
                const clabeAluNoZeros = stripZeros(clabeAlu);
                const refPagoAlu = cleanStr(a.referencia_pago);
                const refPagoAluNoZeros = stripZeros(refPagoAlu);
                const idsAlu = a.ids_alumno ? a.ids_alumno.split(',').map(i => cleanStr(i)).filter(Boolean) : [];

                if (clabeAlu && clabeAlu.length >= 5) {
                    if (refMovClean.includes(clabeAlu) || descClean.includes(clabeAlu) || textoClean.includes(clabeAlu)) return true;
                    if (clabeAluNoZeros.length >= 5 && (refMovCleanNoZeros.includes(clabeAluNoZeros) || descCleanNoZeros.includes(clabeAluNoZeros) || textoCleanNoZeros.includes(clabeAluNoZeros))) return true;
                }
                if (refPagoAlu && refPagoAlu.length >= 4) {
                    if (refMovClean.includes(refPagoAlu) || descClean.includes(refPagoAlu) || textoClean.includes(refPagoAlu)) return true;
                    if (refPagoAluNoZeros.length >= 4 && (refMovCleanNoZeros.includes(refPagoAluNoZeros) || descCleanNoZeros.includes(refPagoAluNoZeros) || textoCleanNoZeros.includes(refPagoAluNoZeros))) return true;
                }
                for (const idPlan of idsAlu) {
                    if (idPlan && idPlan.length >= 4 && (refMovClean.includes(idPlan) || descClean.includes(idPlan) || textoClean.includes(idPlan))) return true;
                }
                return false;
            });

            if (alumnoEncontrado) {
                const identificador = alumnoEncontrado.clabe_interbancaria || alumnoEncontrado.referencia_pago || alumnoEncontrado.ids_alumno;
                metodoMatcheo = `Identificador Único (${identificador})`;
            }

            // 2. Matcheo buscando la referencia en CargosPendientes (si pagó una ficha en específico)
            if (!alumnoEncontrado) {
                const cargoMatcheado = cargosPendientes.find(c => coincideFicha(c, refMovClean, descClean, textoClean));

                if (cargoMatcheado) {
                    alumnoEncontrado = todosLosAlumnos.find(a => String(a.id) === String(cargoMatcheado.alumno_id));
                    if (alumnoEncontrado) {
                        metodoMatcheo = `Código/Referencia Ficha (${cargoMatcheado.codigo_ficha || cargoMatcheado.referencia_bancaria})`;
                    }
                }
            }

            // 3. Matcheo por Nombre de Alumno en Descripción SPEI (Completa)
            if (!alumnoEncontrado && mov.descripcion) {
                const cleanStrWithSpaces = (s) => {
                    if (!s) return '';
                    return String(s)
                        .normalize("NFD")
                        .replace(/[\u0300-\u036f]/g, "")
                        .replace(/ñ/g, "n")
                        .replace(/Ñ/g, "N")
                        .replace(/[^a-zA-Z0-9\s]/g, ' ')
                        .replace(/\s+/g, ' ')
                        .trim()
                        .toUpperCase();
                };
                
                const descCleanSpaces = cleanStrWithSpaces(mov.descripcion);
                
                alumnoEncontrado = todosLosAlumnos.find(a => {
                    const nom = cleanStrWithSpaces(a.nombre);
                    const pat = cleanStrWithSpaces(a.apellido_paterno);
                    const mat = cleanStrWithSpaces(a.apellido_materno);
                    
                    if (!nom || !pat) return false;

                    const p1 = `${nom} ${pat}`.trim();
                    const p2 = `${nom} ${pat} ${mat}`.trim();
                    const p3 = `${pat} ${mat} ${nom}`.trim();

                    if (p2.length >= 6 && descCleanSpaces.includes(p2)) return true;
                    if (p3.length >= 6 && descCleanSpaces.includes(p3)) return true;
                    if (p1.length >= 6 && descCleanSpaces.includes(p1)) return true;

                    return false;
                });
                if (alumnoEncontrado) metodoMatcheo = 'Coincidencia Nombre Alumno SPEI (Completa)';
            }

            if (alumnoEncontrado) {
                let alumnoCargosPendientes = cargosPendientes.filter(cp => String(cp.alumno_id) === String(alumnoEncontrado.id));

                // Priorización inteligente de los cargos del alumno:
                // 1º Coincidencia explícita de código de ficha / referencia
                // 2º Coincidencia exacta de monto
                // 3º Antigüedad ID asc
                alumnoCargosPendientes.sort((a, b) => {
                    const matchA = coincideFicha(a, refMovClean, descClean);
                    const matchB = coincideFicha(b, refMovClean, descClean);
                    if (matchA && !matchB) return -1;
                    if (!matchA && matchB) return 1;

                    const exactMontoA = Math.abs(Number(a.monto_pendiente) - mov.monto) < 0.01 || Math.abs(Number(a.monto_total) - mov.monto) < 0.01;
                    const exactMontoB = Math.abs(Number(b.monto_pendiente) - mov.monto) < 0.01 || Math.abs(Number(b.monto_total) - mov.monto) < 0.01;
                    if (exactMontoA && !exactMontoB) return -1;
                    if (!exactMontoA && exactMontoB) return 1;

                    return Number(a.id) - Number(b.id);
                });

                if (alumnoCargosPendientes.length === 0) {
                    pendientesCount++;
                    pagosProcesados.push({
                        id_tmp: `MOV-REV-${pendientesCount}`,
                        referencia_bancaria: mov.referencia || 'SIN_REF',
                        monto: mov.monto,
                        fecha_pago: mov.fecha,
                        descripcion: mov.descripcion,
                        estado_conciliacion: 'REVISION',
                        linea: mov.linea,
                        alumno_id: alumnoEncontrado.id.toString(),
                        alumno_nombre: `${alumnoEncontrado.nombre} ${alumnoEncontrado.apellido_paterno}`,
                        alumno_matricula: alumnoEncontrado.matricula,
                        metodo_matcheo: `${metodoMatcheo} - Sin Ficha de Cobro`
                    });
                } else {
                    conciliadosCount++;
                    let montoDisponible = mov.monto;
                    const cargosSeleccionadosSugeridos = [];
                    for (const cargo of alumnoCargosPendientes) {
                        if (montoDisponible <= 0) break;
                        cargosSeleccionadosSugeridos.push(cargo.id.toString());
                        montoDisponible -= Number(cargo.monto_pendiente);
                    }

                    const mappedCargos = alumnoCargosPendientes.map(cp => ({
                        ...cp,
                        concepto: cp.ConceptoCobro || cp.concepto || null,
                        producto: cp.ConceptoCobro || cp.producto || null
                    }));

                    pagosProcesados.push({
                        id_tmp: `MOV-${conciliadosCount}`,
                        fecha_pago: mov.fecha,
                        monto: mov.monto,
                        referencia_bancaria: mov.referencia || `REF-${Date.now()}`,
                        descripcion: mov.descripcion || '',
                        linea: mov.linea,
                        alumno_id: alumnoEncontrado.id.toString(),
                        cargos_sugeridos: cargosSeleccionadosSugeridos,
                        alumno_nombre: `${alumnoEncontrado.nombre} ${alumnoEncontrado.apellido_paterno}`,
                        alumno_matricula: alumnoEncontrado.matricula,
                        metodo_matcheo: metodoMatcheo,
                        requiere_factura: alumnoEncontrado.requiere_factura,
                        estado_conciliacion: 'SUGERIDO',
                        cargos_pendientes: serializeBigIntsAndDecimals(mappedCargos)
                    });
                }
            } else {
                pendientesCount++;
                pagosProcesados.push({
                    id_tmp: `MOV-REV-${pendientesCount}`,
                    referencia_bancaria: mov.referencia || 'SIN_REF',
                    monto: mov.monto,
                    fecha_pago: mov.fecha,
                    descripcion: mov.descripcion,
                    estado_conciliacion: 'REVISION',
                    linea: mov.linea
                });
            }
        }

        const responseData = {
            mensaje: `Conciliación bancaria procesada. ${conciliadosCount} movimientos conciliados, ${pendientesCount} sin coincidencia y ${duplicadosCount} ignorados por estar ya registrados.`,
            resumen: {
                total_movimientos: movimientos.length,
                conciliados: conciliadosCount,
                pendientes_revision: pendientesCount,
                duplicados_ignorados: duplicadosCount,
                monto_total: montoTotal,
                debug_alumnos_count: todosLosAlumnos.length,
                debug_cargos_count: cargosPendientes.length,
                debug_grupo_id: grupoId
            },
            pagos: pagosProcesados
        };
        
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error('Error procesando conciliacion:', error);
        return NextResponse.json({ error: 'Error al procesar archivo bancario: ' + error.message }, { status: 500 });
    }
}
