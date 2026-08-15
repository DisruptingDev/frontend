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
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    const seconds = pad(d.getSeconds());
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
                clave_prod_serv: '86121500',
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
async function obtenerSiguienteFolioSerie(emisorId, dbClient = prisma) {
    let serie = await dbClient.series.findFirst({
        where: {
            emisor_id: BigInt(emisorId),
            tipo_comprobante: 'I'
        }
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
        await dbClient.concepto.deleteMany({
            where: { conceptos_id: { in: prevHeaderIds } }
        });
        await dbClient.conceptos.deleteMany({
            where: { id: { in: prevHeaderIds } }
        });
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
            clave_prod_serv: it.clave_prod_serv || '86121500'
        })).filter(it => it.monto > 0);
    }

    if (listaItemsFinal.length === 0) {
        listaItemsFinal = [{
            descripcion: descripcionConcepto || 'Colegiatura y Servicios Educativos Integrales',
            monto: Number(monto || 0),
            clave_prod_serv: '86121500'
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

        await dbClient.concepto.create({
            data: {
                conceptos_id: conceptosHeader.id,
                clave_prod_serv: item.clave_prod_serv || '86121500',
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
                objeto_imp: '01'
            }
        });

        xmlConceptosList += `    <cfdi:Concepto ClaveProdServ="${item.clave_prod_serv || '86121500'}" Cantidad="1" ClaveUnidad="E48" Unidad="Servicio" Descripcion="${descSat}" ValorUnitario="${montoNeto.toFixed(2)}" Importe="${montoNeto.toFixed(2)}" ObjetoImp="01"/>\n`;
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
            const { action, alumno_id, monto, fecha_pago, referencia_bancaria, descripcion, emisor_id, grupo_id } = body;

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
                    where: { alumno_id: BigInt(alumno_id), estatus: { in: ['PENDIENTE', 'PARCIAL'] } },
                    orderBy: { id: 'asc' },
                    include: { producto: true }
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
                        }
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

                const { serie, folio } = await obtenerSiguienteFolioSerie(emisor.id);

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
                        uso_cfdi: receptorObj.uso_cfdi || 'S01',
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
                    producto: cargoEncontrado.producto?.nombre || 'MENSUALIDAD',
                    carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                    fechaPago: fecha_pago,
                    nombreAlumno: `${alumnoObj.nombre} ${alumnoObj.apellido_paterno} ${alumnoObj.apellido_materno || ''}`.trim(),
                    curp: alumnoObj.curp,
                    matricula: alumnoObj.matricula,
                    rvoe: alumnoObj.programa_academico?.rvoe
                });

                await crearEstructuraCompletaCFDI({
                    comprobante: comprobanteAuto,
                    emisor,
                    receptor: receptorObj,
                    monto: montoNum,
                    grupoId: emisor.grupo_id,
                    items: [{
                        descripcion: descConcepto,
                        monto: montoNum,
                        clave_prod_serv: cargoEncontrado.producto?.clave_prod_serv || '86121500'
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
                    const { alumno_id, monto, fecha_pago, referencia_bancaria, descripcion, cargos_ids } = asig;
                    if (!alumno_id) continue;

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
                                where: { id: { in: cargos_ids.map(id => BigInt(id)) } },
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
                                where: { alumno_id: alumnoObj.id, estatus: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDO'] } },
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
                        if (montoRestante > 0) {
                            const concDef = await tx.conceptoCobro.findFirst({ where: { nombre: 'Colegiatura' } });
                            const concId = concDef ? concDef.id : BigInt(1);
                            
                            let refSAF = `SAF-${referencia_bancaria || Date.now()}`;
                            const refExiste = await tx.cargoAlumno.findFirst({
                                where: { referencia_bancaria: refSAF }
                            });
                            if (refExiste) {
                                refSAF = `${refSAF}-${Math.floor(Math.random() * 10000)}`;
                            }

                            const cargoSaldoAFavor = await tx.cargoAlumno.create({
                                data: {
                                    alumno_id: alumnoObj.id,
                                    concepto_id: concId,
                                    codigo_ficha: `SAF-${String(Math.floor(Math.random()*90000+10000))}`,
                                    referencia_bancaria: refSAF,
                                    monto_total: -montoRestante,
                                    monto_pagado: 0,
                                    monto_pendiente: -montoRestante,
                                    fecha_emision: new Date(),
                                    fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Válido por 1 año
                                    estatus: 'PENDIENTE',
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

                        const { serie, folio } = await obtenerSiguienteFolioSerie(emisor.id, tx);

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
                                uso_cfdi: receptorObj.uso_cfdi || 'S01',
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
                                    clave_prod_serv: '86121500'
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
                                        clave_prod_serv: cargo.producto?.clave_prod_serv || '86121500'
                                    });
                                }
                            } else {
                                const prodNombre = cargo.producto?.nombre || cargo.concepto?.nombre || 'MENSUALIDAD';
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
                                    clave_prod_serv: cargo.producto?.clave_prod_serv || '86121500'
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
                                clave_prod_serv: '86121500'
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
        const grupoId = formData.get('grupo_id');

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
        if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS') {
            andFiltersAlumnos.push({
                OR: [
                    { grupo_id: BigInt(grupoId) },
                    { grupo_id: null }
                ]
            });
        } else if (!isSuperUser) {
            andFiltersAlumnos.push({ grupo_id: BigInt(-1) });
        }

        const todosLosAlumnos = await prisma.alumno.findMany({
            where: { AND: andFiltersAlumnos },
            include: { receptor: true, programa_academico: true }
        });

        const ahoraConc = new Date();
        try {
            await prisma.cargoAlumno.updateMany({
                where: {
                    ...(grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS' ? { grupo_id: BigInt(grupoId) } : {}),
                    fecha_vencimiento: { lt: ahoraConc },
                    monto_pendiente: { gt: 0 },
                    estatus: { in: ['PENDIENTE', 'PARCIAL'] }
                },
                data: {
                    estatus: 'VENCIDO'
                }
            });
        } catch (e) {}

        const andFiltersCargos = [{ estatus: { in: ['PENDIENTE', 'PARCIAL', 'VENCIDO'] } }];
        if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS') {
            andFiltersCargos.push({
                OR: [
                    { grupo_id: BigInt(grupoId) },
                    { grupo_id: null }
                ]
            });
        } else if (!isSuperUser) {
            andFiltersCargos.push({ grupo_id: BigInt(-1) });
        }

        const cargosPendientes = await prisma.cargoAlumno.findMany({
            where: { AND: andFiltersCargos },
            include: { producto: true, concepto: true }
        });

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

        let conciliadosCount = 0;
        let pendientesCount = 0;
        let montoTotal = 0;
        const pagosProcesados = [];

        const coincideFicha = (c, refClean, dClean) => {
            if (!c) return false;
            const refB = (c.referencia_bancaria || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (refB && (refB === refClean || refClean.includes(refB) || dClean.includes(refB))) return true;
            const codF = (c.codigo_ficha || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
            if (codF && (codF === refClean || refClean.includes(codF) || dClean.includes(codF))) return true;
            if (c.codigo_ficha) {
                const partes = c.codigo_ficha.split(/\s+/).map(p => p.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()).filter(Boolean);
                for (const p of partes) {
                    if (p.length >= 3 && (refClean.includes(p) || dClean.includes(p))) return true;
                }
            }
            return false;
        };

        for (const mov of movimientos) {
            montoTotal += mov.monto;

            let alumnoEncontrado = null;
            let metodoMatcheo = null;
            
            const refMovOriginal = (mov.referenciaLimpia || mov.referencia || '').toUpperCase();
            const descOriginal = (mov.descripcion || '').toUpperCase();
            
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
            const refMovClean = cleanStr(refMovOriginal);
            const descClean = cleanStr(descOriginal);

            // 1. Matcheo directo con Alumnos por CLABE o Referencia Personal
            alumnoEncontrado = todosLosAlumnos.find(a => {
                const clabeAlu = cleanStr(a.clabe_interbancaria);
                const refPagoAlu = cleanStr(a.referencia_pago);
                const idsAlu = a.ids_alumno ? a.ids_alumno.split(',').map(i => cleanStr(i)).filter(Boolean) : [];

                if (clabeAlu && clabeAlu.length >= 5 && (refMovClean.includes(clabeAlu) || descClean.includes(clabeAlu))) return true;
                if (refPagoAlu && refPagoAlu.length >= 4 && (refMovClean.includes(refPagoAlu) || descClean.includes(refPagoAlu))) return true;
                for (const idPlan of idsAlu) {
                    if (idPlan && idPlan.length >= 4 && (refMovClean.includes(idPlan) || descClean.includes(idPlan))) return true;
                }
                return false;
            });

            if (alumnoEncontrado) {
                const identificador = alumnoEncontrado.clabe_interbancaria || alumnoEncontrado.referencia_pago || alumnoEncontrado.ids_alumno;
                metodoMatcheo = `Identificador Único (${identificador})`;
            }

            // 2. Matcheo buscando la referencia en CargosPendientes (si pagó una ficha en específico)
            if (!alumnoEncontrado) {
                const cargoMatcheado = cargosPendientes.find(c => coincideFicha(c, refMovClean, descClean));

                if (cargoMatcheado) {
                    alumnoEncontrado = todosLosAlumnos.find(a => a.id === cargoMatcheado.alumno_id);
                    if (alumnoEncontrado) {
                        metodoMatcheo = `Código/Referencia Ficha (${cargoMatcheado.codigo_ficha || cargoMatcheado.referencia_bancaria})`;
                    }
                }
            }

            // 3. Matcheo por Nombre de Alumno en Descripción SPEI (probando permutaciones de orden de nombres mexicanos)
            if (!alumnoEncontrado && mov.descripcion) {
                alumnoEncontrado = todosLosAlumnos.find(a => {
                    const nomStr = cleanStr(a.nombre);
                    const patStr = cleanStr(a.apellido_paterno);
                    const matStr = cleanStr(a.apellido_materno);
                    const primerNombre = cleanStr((a.nombre || '').trim().split(/\s+/)[0]);

                    const p1 = `${nomStr}${patStr}`;                  // JUANPEREZ
                    const p2 = `${nomStr}${patStr}${matStr}`;         // JUANPEREZLOPEZ
                    const p3 = `${patStr}${matStr}${nomStr}`;         // PEREZLOPEZJUAN
                    const p4 = `${patStr}${matStr}${primerNombre}`;   // PEREZLOPEZJUAN
                    const p5 = `${primerNombre}${patStr}`;            // JUANPEREZ
                    const p6 = `${patStr}${primerNombre}`;            // PEREZJUAN

                    if (p2.length >= 6 && descClean.includes(p2)) return true;
                    if (p3.length >= 6 && descClean.includes(p3)) return true;
                    if (p1.length >= 6 && descClean.includes(p1)) return true;
                    if (p4.length >= 6 && descClean.includes(p4)) return true;
                    if (p5.length >= 6 && descClean.includes(p5)) return true;
                    if (p6.length >= 6 && descClean.includes(p6)) return true;

                    return false;
                });
                if (alumnoEncontrado) metodoMatcheo = 'Coincidencia Nombre Alumno SPEI';
            }

            if (alumnoEncontrado) {
                let alumnoCargosPendientes = cargosPendientes.filter(cp => cp.alumno_id === alumnoEncontrado.id);

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
                        cargos_pendientes: serializeBigIntsAndDecimals(alumnoCargosPendientes)
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
            mensaje: `Conciliación bancaria procesada. ${conciliadosCount} movimientos conciliados y ${pendientesCount} sin coincidencia.`,
            resumen: {
                total_movimientos: movimientos.length,
                conciliados: conciliadosCount,
                pendientes_revision: pendientesCount,
                monto_total: montoTotal
            },
            pagos: pagosProcesados
        };
        
        return NextResponse.json(responseData, { status: 200 });

    } catch (error) {
        console.error('Error procesando conciliacion:', error);
        return NextResponse.json({ error: 'Error al procesar archivo bancario: ' + error.message }, { status: 500 });
    }
}
