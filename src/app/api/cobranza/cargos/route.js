import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { generarReferenciaBancaria } from '@/utils/referenciaBancaria';
import { generarYEnviarFichaPorCorreo } from '@/lib/services/fichaPdfEmailService';

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

function obtenerPrefijoConcepto(nombreConcepto) {
    if (!nombreConcepto) return 'M';
    const norm = nombreConcepto.toLowerCase().trim();

    // 1. Reglas explícitas asignadas por el usuario
    if (norm === 'mensualidad' || norm.startsWith('mensual')) return 'M';
    if (norm === 'materia ordinaria') return 'MO';
    if (norm === 'materia de revalidación' || norm === 'materia de revalidacion') return 'MR';
    if (norm === 'materia de adelanto') return 'MA';
    if (norm === 'materia recursada') return 'MRC';
    if (norm === 'constancia' || norm.startsWith('constancia')) return 'CO';
    if (norm === 'credencial' || norm.startsWith('credencial')) return 'C';
    if (norm === 'kardex') return 'K';
    if (norm.includes('titula')) return 'AT';
    if (norm.includes('gradua')) return 'G';
    if (norm === 'inscripción' || norm === 'inscripcion') return 'I';
    if (norm === 'reinscripción' || norm === 'reinscripcion') return 'RE';

    // 2. Algoritmo dinámico por iniciales (omitir artículos / preposiciones)
    const stopWords = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'a', 'en', 'por', 'para']);
    const palabras = norm.split(/\s+/).filter(p => p.length > 0 && !stopWords.has(p));

    if (palabras.length === 0) return 'X';
    if (palabras.length === 1) {
        const p = palabras[0];
        if (p.startsWith('co')) return 'CO';
        return p.substring(0, 1).toUpperCase();
    }

    // Tomar primera letra de cada palabra significativa (ej. Materia Adelanto -> MA)
    return palabras.map(p => p[0]).join('').toUpperCase();
}

function obtenerPrefijoFicha(conceptosInput) {
    if (!conceptosInput) return 'F';

    const listaConceptos = Array.isArray(conceptosInput)
        ? conceptosInput
        : (typeof conceptosInput === 'string' ? [conceptosInput] : []);

    if (listaConceptos.length === 0) return 'F';

    const prefijos = [];
    for (const item of listaConceptos) {
        const nombreStr = typeof item === 'string' ? item : (item.concepto || item.nombre || '');
        if (nombreStr) {
            const p = obtenerPrefijoConcepto(nombreStr);
            if (p && !prefijos.includes(p)) {
                prefijos.push(p);
            }
        }
    }

    return prefijos.length > 0 ? prefijos.join('-') : 'F';
}

async function obtenerSiguienteCodigoPorPrefijo(prefijo, codigosGeneradosEnLote = []) {
    const prefijoBusqueda = `${prefijo}-`;
    const ultimos = await prisma.cargoAlumno.findMany({
        where: {
            codigo_ficha: { contains: prefijoBusqueda, mode: 'insensitive' }
        },
        select: { codigo_ficha: true },
        orderBy: { id: 'desc' },
        take: 1000
    });

    let maxNum = 0;
    const escapedPrefijo = prefijo.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?:^|\\s)${escapedPrefijo}-(\\d+)(?:\\s|$)`, 'i');

    for (const c of ultimos) {
        if (c.codigo_ficha) {
            const match = c.codigo_ficha.trim().match(regex);
            if (match) {
                const numPart = parseInt(match[1], 10);
                if (!isNaN(numPart) && numPart > maxNum) {
                    maxNum = numPart;
                }
            }
        }
    }

    for (const cod of codigosGeneradosEnLote) {
        if (cod) {
            const match = cod.trim().match(regex);
            if (match) {
                const numPart = parseInt(match[1], 10);
                if (!isNaN(numPart) && numPart > maxNum) {
                    maxNum = numPart;
                }
            }
        }
    }

    const proximoNum = maxNum + 1;
    return `${prefijo}-${String(proximoNum).padStart(5, '0')}`;
}

async function generarCodigoFichaUnico(conceptosInput, codigosGeneradosEnLote = []) {
    const listaConceptos = Array.isArray(conceptosInput)
        ? conceptosInput
        : (typeof conceptosInput === 'string' ? [conceptosInput] : []);

    if (listaConceptos.length === 0) {
        return await obtenerSiguienteCodigoPorPrefijo('F', codigosGeneradosEnLote);
    }

    const codigosFicha = [];
    for (const item of listaConceptos) {
        const nombreStr = typeof item === 'string' ? item : (item.concepto || item.nombre || '');
        if (nombreStr) {
            const prefijo = obtenerPrefijoConcepto(nombreStr);
            const codigoIndiv = await obtenerSiguienteCodigoPorPrefijo(
                prefijo, 
                [...codigosGeneradosEnLote, ...codigosFicha]
            );
            codigosFicha.push(codigoIndiv);
        }
    }

    if (codigosFicha.length === 0) {
        return await obtenerSiguienteCodigoPorPrefijo('F', codigosGeneradosEnLote);
    }

    return codigosFicha.join(' ');
}

async function getGrupoIdFromRequest(request) {
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
            console.error('Error resolviendo grupoId en token cargos:', e.message);
        }
    }

    if (tokenGrupoId && tokenGrupoId !== 'undefined' && tokenGrupoId !== 'null') {
        return tokenGrupoId;
    }
    if (dbGrupoId && dbGrupoId !== 'undefined' && dbGrupoId !== 'null') {
        return dbGrupoId;
    }

    const { searchParams } = new URL(request.url);
    let grupoIdParam = searchParams.get('grupo_id') || searchParams.get('grupoId') || request.headers.get('x-grupo-id');
    if (grupoIdParam && grupoIdParam !== 'undefined' && grupoIdParam !== 'null') {
        return grupoIdParam;
    }

    return null;
}

// GET: Obtener cargos con relación a alumno y concepto
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumnoId = searchParams.get('alumno_id');
        const estatus = searchParams.get('estatus');
        let grupoId = await getGrupoIdFromRequest(request);

        const isSuperUser = searchParams.get('is_superadmin') === 'true' || 
                            searchParams.get('super_user') === 'true' || 
                            request.headers.get('x-super-user') === 'true' ||
                            grupoId === 'ALL' || grupoId === 'TODOS';

        const ahora = new Date();
        try {
            await prisma.cargoAlumno.updateMany({
                where: {
                    ...(grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS' ? { grupo_id: BigInt(grupoId) } : {}),
                    fecha_vencimiento: { lt: ahora },
                    monto_pendiente: { gt: 0 },
                    estatus: { in: ['PENDIENTE', 'PARCIAL'] }
                },
                data: {
                    estatus: 'VENCIDO'
                }
            });
        } catch (e) {}

        const andFiltersCargos = [];
        if (alumnoId) andFiltersCargos.push({ alumno_id: BigInt(alumnoId) });
        if (estatus && estatus !== 'TODOS') andFiltersCargos.push({ estatus });

        if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS') {
            andFiltersCargos.push({ grupo_id: BigInt(grupoId) });
        } else if (!isSuperUser) {
            andFiltersCargos.push({ grupo_id: BigInt(-1) });
        }

        const where = andFiltersCargos.length > 0 ? { AND: andFiltersCargos } : {};

        const cargos = await prisma.cargoAlumno.findMany({
            where,
            include: {
                alumno: {
                    include: { receptor: true }
                },
                concepto: true
            },
            orderBy: {
                id: 'desc'
            }
        });

        // Workaround: Obtener detalles_items crudo si Prisma Client no está actualizado
        if (cargos.length > 0) {
            const ids = cargos.map(c => c.id.toString());
            const rawItems = await prisma.$queryRawUnsafe(`SELECT id, detalles_items FROM "CargoAlumno" WHERE id IN (${ids.join(',')})`);
            
            const rawItemsMap = {};
            for (const r of rawItems) {
                rawItemsMap[r.id.toString()] = r.detalles_items;
            }

            for (const cargo of cargos) {
                if (rawItemsMap[cargo.id.toString()]) {
                    cargo.detalles_items = rawItemsMap[cargo.id.toString()];
                }
            }
        }

        const cargosFormateados = cargos.map(c => ({
            ...c,
            codigo_ficha: c.codigo_ficha || `${obtenerPrefijoConcepto(c.concepto?.nombre)}-${String(c.id).padStart(5, '0')}`
        }));

        return NextResponse.json(serializeBigIntsAndDecimals(cargosFormateados), { status: 200 });

    } catch (error) {
        console.error('Error fetching cargos:', error);
        return NextResponse.json({ error: 'Error al consultar los cargos: ' + error.message }, { status: 500 });
    }
}

// POST: Generación Automática Masiva por Carrera/Periodo o Individual con Módulo 10
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            generacion_automatica,
            mes_periodo,
            concepto_id,
            carrera_filtro,
            alumnos_ids,
            fecha_vencimiento,
            monto_custom,
            grupo_id,
            producto_id
        } = body;

        if (generacion_automatica) {
            const [year, month] = (mes_periodo || new Date().toISOString().slice(0, 7)).split('-').map(Number);
            
            const whereAlumno = { estatus: 'ACTIVO' };
            if (carrera_filtro && carrera_filtro !== 'TODAS') {
                whereAlumno.carrera = carrera_filtro;
            }
            if (grupo_id) whereAlumno.grupo_id = BigInt(grupo_id);

            const alumnos = await prisma.alumno.findMany({
                where: whereAlumno
            });

            if (alumnos.length === 0) {
                return NextResponse.json({ error: 'No se encontraron alumnos activos para generar cobros.' }, { status: 400 });
            }

            const conceptoDefault = await obtenerOGenerarConceptoDefault(grupo_id);

            const cargosCreados = [];
            const errores = [];
            const codigosGeneradosLote = [];
            const fechaEmision = new Date();

            for (const alumno of alumnos) {
                if (alumno.monto_personalizado == null) {
                    errores.push(`Alumno ${alumno.matricula} ignorado: no tiene monto mensual asignado.`);
                    continue;
                }

                let conceptoActual = conceptoDefault;
                if (alumno.concepto_id) {
                    const conc = await prisma.conceptoCobro.findUnique({ where: { id: alumno.concepto_id } });
                    if (conc) conceptoActual = conc;
                }

                const montoFinal = Number(alumno.monto_personalizado);

                const diaVenc = alumno.dia_pago || 5;
                const fechaVenc = new Date(year, month - 1, diaVenc);

                const referencia = generarReferenciaBancaria({
                    matricula: alumno.matricula,
                    fechaVencimiento: fechaVenc,
                    conceptoId: conceptoActual.id
                });

                const existe = await prisma.cargoAlumno.findFirst({
                    where: { referencia_bancaria: referencia }
                });

                if (!existe) {
                    const codigoFicha = await generarCodigoFichaUnico(conceptoActual.nombre, codigosGeneradosLote);
                    codigosGeneradosLote.push(codigoFicha);
                    const nuevoCargo = await prisma.cargoAlumno.create({
                        data: {
                            alumno_id: alumno.id,
                            concepto_id: conceptoActual.id,
                            codigo_ficha: codigoFicha,
                            referencia_bancaria: referencia,
                            monto_total: montoFinal,
                            monto_pagado: 0,
                            monto_pendiente: montoFinal,
                            fecha_emision: fechaEmision,
                            fecha_vencimiento: fechaVenc,
                            estatus: 'PENDIENTE',
                            grupo_id: grupo_id ? BigInt(grupo_id) : alumno.grupo_id,
                            producto_id: producto_id ? BigInt(producto_id) : null
                        }
                    });

                    // Generar PDF de la ficha de cargo y enviar por correo al alumno en segundo plano
                    try {
                        const cargoCompleto = await prisma.cargoAlumno.findUnique({
                            where: { id: nuevoCargo.id },
                            include: {
                                alumno: { include: { receptor: true, emisor: true } },
                                concepto: true
                            }
                        });
                        if (cargoCompleto) {
                            generarYEnviarFichaPorCorreo(cargoCompleto).catch(e => console.error('Error enviando ficha por correo:', e));
                        }
                    } catch (e) {
                        console.error('Error procesando ficha PDF para correo:', e.message);
                    }

                    cargosCreados.push(nuevoCargo);
                }
            }

            return NextResponse.json(serializeBigIntsAndDecimals({
                mensaje: `Generación automática completada. Se emitieron ${cargosCreados.length} fichas. ${errores.length > 0 ? `Hubo ${errores.length} alumnos omitidos por no tener monto asignado.` : ''}`,
                total_generados: cargosCreados.length,
                cargos: cargosCreados,
                errores: errores
            }), { status: 201 });
        }

        let conceptoActual = null;
        if (concepto_id) {
            conceptoActual = await prisma.conceptoCobro.findUnique({
                where: { id: BigInt(concepto_id) }
            });
        }
        
        const { items, nombre_concepto, alumno_id, producto_id: manual_producto_id } = body;
        const prodIdTarget = manual_producto_id || producto_id;

        let itemsFinales = [];
        let montoCalculado = 0;
        let nombreConceptoPrimerItem = nombre_concepto || 'Mensualidad';

        if (prodIdTarget) {
            try {
                const prodObj = await prisma.productoFicha.findUnique({
                    where: { id: BigInt(prodIdTarget) }
                });
                if (prodObj && prodObj.nombre) {
                    nombreConceptoPrimerItem = prodObj.nombre;
                }
            } catch (e) {}
        }

        if (Array.isArray(items) && items.length > 0) {
            itemsFinales = items.map(it => ({
                concepto: (it.concepto || 'Mensualidad').trim(),
                monto: parseFloat(it.monto || 0)
            })).filter(it => it.monto > 0);

            if (itemsFinales.length > 0) {
                montoCalculado = itemsFinales.reduce((acc, curr) => acc + curr.monto, 0);
                if (!prodIdTarget) {
                    nombreConceptoPrimerItem = itemsFinales[0].concepto;
                }
            }
        }

        if (!conceptoActual && nombreConceptoPrimerItem) {
            conceptoActual = await prisma.conceptoCobro.findFirst({
                where: { nombre: nombreConceptoPrimerItem.trim() }
            });

            if (!conceptoActual) {
                conceptoActual = await prisma.conceptoCobro.create({
                    data: {
                        nombre: nombreConceptoPrimerItem.trim(),
                        descripcion: `Pago complementario: ${nombreConceptoPrimerItem.trim()}`,
                        clave_prod_serv: '86121500',
                        clave_unidad: 'E48',
                        monto_base: montoCalculado > 0 ? montoCalculado : (monto_custom != null ? parseFloat(monto_custom) : 100),
                        aplica_recargo: false,
                        grupo_id: grupo_id ? BigInt(grupo_id) : null
                    }
                });
            }
        }

        if (!conceptoActual) {
            conceptoActual = await obtenerOGenerarConceptoDefault(grupo_id);
        }

        let alumnos = [];
        if (alumno_id) {
            const single = await prisma.alumno.findUnique({
                where: { id: BigInt(alumno_id) }
            });
            if (single) alumnos = [single];
        } else if (Array.isArray(alumnos_ids) && alumnos_ids.length > 0) {
            alumnos = await prisma.alumno.findMany({
                where: { id: { in: alumnos_ids.map(id => BigInt(id)) } }
            });
        } else {
            const whereAlumno = { estatus: 'ACTIVO' };
            if (grupo_id) whereAlumno.grupo_id = BigInt(grupo_id);
            alumnos = await prisma.alumno.findMany({ where: whereAlumno });
        }

        if (alumnos.length === 0) {
            return NextResponse.json({ error: 'No se encontraron alumnos para generar la ficha.' }, { status: 400 });
        }

        const monto = montoCalculado > 0 
            ? montoCalculado 
            : (monto_custom != null ? parseFloat(monto_custom) : Number(conceptoActual.monto_base));

        const fechaEmision = new Date();
        const fechaVenc = fecha_vencimiento ? new Date(fecha_vencimiento) : new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
        const cargosCreados = [];

        for (const alumno of alumnos) {
            let referencia = generarReferenciaBancaria({
                matricula: alumno.matricula,
                fechaVencimiento: fechaVenc,
                conceptoId: conceptoActual.id
            });

            let existe = await prisma.cargoAlumno.findFirst({
                where: { referencia_bancaria: referencia }
            });

            let intentos = 0;
            while (existe && intentos < 10) {
                intentos++;
                const randomSuffix = Math.floor(Math.random() * 90 + 10);
                const baseUnica = `${referencia.slice(0, -1)}${randomSuffix}`;
                const dv = generarReferenciaBancaria({ matricula: baseUnica, fechaVencimiento: fechaVenc, conceptoId: 1 }).slice(-1);
                referencia = `${baseUnica}${dv}`;
                existe = await prisma.cargoAlumno.findFirst({
                    where: { referencia_bancaria: referencia }
                });
            }

            const conceptosParaCodigo = itemsFinales.length > 0 ? itemsFinales : [nombreConceptoPrimerItem];
            const codigoFicha = await generarCodigoFichaUnico(conceptosParaCodigo);

            const nuevoCargo = await prisma.cargoAlumno.create({
                data: {
                    alumno_id: alumno.id,
                    concepto_id: conceptoActual.id,
                    codigo_ficha: codigoFicha,
                    referencia_bancaria: referencia,
                    monto_total: monto,
                    monto_pagado: 0,
                    monto_pendiente: monto,
                    fecha_emision: fechaEmision,
                    fecha_vencimiento: fechaVenc,
                    estatus: 'PENDIENTE',
                    grupo_id: grupo_id ? BigInt(grupo_id) : alumno.grupo_id,
                    producto_id: manual_producto_id ? BigInt(manual_producto_id) : (producto_id ? BigInt(producto_id) : null)
                },
                include: {
                    alumno: { include: { receptor: true } },
                    concepto: true
                }
            });

            if (itemsFinales.length > 0) {
                const jsonItems = JSON.stringify(itemsFinales);
                try {
                    await prisma.$executeRawUnsafe(
                        `UPDATE "CargoAlumno" SET "detalles_items" = $1 WHERE id = $2`,
                        jsonItems,
                        nuevoCargo.id
                    );
                    nuevoCargo.detalles_items = jsonItems;
                } catch (e) {
                    console.error('Error guardando detalles_items raw:', e.message);
                }
            }

            // Generar PDF y enviar correo en PDF al alumno
            let resEnvio = { correoEnviado: false };
            try {
                const cargoCompleto = await prisma.cargoAlumno.findUnique({
                    where: { id: nuevoCargo.id },
                    include: {
                        alumno: { include: { receptor: true, emisor: true } },
                        concepto: true
                    }
                });
                if (cargoCompleto) {
                    if (itemsFinales.length > 0) {
                        cargoCompleto.detalles_items = JSON.stringify(itemsFinales);
                    }
                    resEnvio = await generarYEnviarFichaPorCorreo(cargoCompleto);
                }
            } catch (e) {
                console.error('Error al generar PDF o enviar correo de la ficha:', e.message);
                resEnvio = { exito: false, error: e.message };
            }
            nuevoCargo.envio_correo = resEnvio;

            cargosCreados.push(nuevoCargo);
        }

        const correoNotif = cargosCreados.some(c => c.envio_correo?.correoEnviado)
            ? ' y enviada por correo en PDF al alumno.'
            : '.';

        return NextResponse.json(serializeBigIntsAndDecimals({
            mensaje: `Ficha de pago emitida exitosamente${correoNotif} Código único asignado.`,
            total_generados: cargosCreados.length,
            cargos: cargosCreados
        }), { status: 201 });

    } catch (error) {
        console.error('Error generating cargos:', error);
        return NextResponse.json({ error: 'Error al generar los cargos de cobranza: ' + error.message }, { status: 500 });
    }
}
