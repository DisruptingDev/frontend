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
    if (norm.includes('mensual') || norm.includes('colegiatura')) return 'M';
    if (norm.includes('titula') || norm.includes('grado')) return 'T';
    if (norm.includes('constancia') || norm.includes('certifica')) return 'C';
    if (norm.includes('inscr') || norm.includes('reinscr')) return 'I';
    if (norm.includes('examen') || norm.includes('extraordinario') || norm.includes('regulariz')) return 'E';
    return 'X';
}

async function generarCodigoFichaUnico(nombreConcepto) {
    const prefijo = obtenerPrefijoConcepto(nombreConcepto);
    const ultimos = await prisma.cargoAlumno.findMany({
        where: {
            codigo_ficha: { startsWith: `${prefijo}-` }
        },
        select: { codigo_ficha: true },
        orderBy: { id: 'desc' },
        take: 100
    });

    let maxNum = 0;
    for (const c of ultimos) {
        if (c.codigo_ficha && c.codigo_ficha.startsWith(`${prefijo}-`)) {
            const numPart = parseInt(c.codigo_ficha.slice(2), 10);
            if (!isNaN(numPart) && numPart > maxNum) {
                maxNum = numPart;
            }
        }
    }

    if (maxNum === 0) {
        const totalCount = await prisma.cargoAlumno.count();
        maxNum = totalCount;
    }

    const proximoNum = maxNum + 1;
    return `${prefijo}-${String(proximoNum).padStart(5, '0')}`;
}

// GET: Obtener cargos con relación a alumno y concepto
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumnoId = searchParams.get('alumno_id');
        const estatus = searchParams.get('estatus');
        const grupoId = searchParams.get('grupo_id');

        const where = {};
        if (alumnoId) where.alumno_id = BigInt(alumnoId);
        if (estatus && estatus !== 'TODOS') where.estatus = estatus;
        if (grupoId) where.grupo_id = BigInt(grupoId);

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
            codigo_ficha: c.codigo_ficha || `${obtenerPrefijoConcepto(c.concepto?.nombre)}${String(c.id).padStart(5, '0')}`
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
                    const codigoFicha = await generarCodigoFichaUnico(conceptoActual.nombre);
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

        let itemsFinales = [];
        let montoCalculado = 0;
        let nombreConceptoPrimerItem = nombre_concepto || 'Mensualidad';

        if (Array.isArray(items) && items.length > 0) {
            itemsFinales = items.map(it => ({
                concepto: (it.concepto || 'Mensualidad').trim(),
                monto: parseFloat(it.monto || 0)
            })).filter(it => it.monto > 0);

            if (itemsFinales.length > 0) {
                montoCalculado = itemsFinales.reduce((acc, curr) => acc + curr.monto, 0);
                nombreConceptoPrimerItem = itemsFinales[0].concepto;
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

            const codigoFicha = await generarCodigoFichaUnico(nombreConceptoPrimerItem);

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
