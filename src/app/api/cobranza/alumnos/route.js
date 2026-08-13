import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

// GET: Obtener lista de Alumnos con receptor, emisor asignado y perfil fiscal
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const grupoId = searchParams.get('grupo_id') || searchParams.get('grupoId') || request.headers.get('x-grupo-id');
        const carrera = searchParams.get('carrera');
        const semestre = searchParams.get('semestre');
        const estatus = searchParams.get('estatus');
        const isSuperUser = searchParams.get('is_superadmin') === 'true' || 
                            searchParams.get('super_user') === 'true' || 
                            request.headers.get('x-super-user') === 'true' ||
                            grupoId === 'ALL' || grupoId === 'TODOS';

        const andFiltersAlumnos = [];
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
        if (carrera) andFiltersAlumnos.push({ carrera });
        if (semestre) andFiltersAlumnos.push({ semestre: parseInt(semestre) });
        if (estatus && estatus !== 'TODOS') andFiltersAlumnos.push({ estatus: estatus.toUpperCase() });

        const where = andFiltersAlumnos.length > 0 ? { AND: andFiltersAlumnos } : {};

        const alumnos = await prisma.alumno.findMany({
            where,
            include: {
                receptor: true,
                programa_academico: true
            },
            orderBy: {
                matricula: 'asc'
            }
        });

        // Mapear emisores asignados de manera segura sin depender de relaciones compiladas de Prisma Client
        const emisorIds = [...new Set(alumnos.map(a => a.emisor_id).filter(Boolean))];
        let emisoresMap = {};

        if (emisorIds.length > 0) {
            try {
                const listEmisores = await prisma.emisors.findMany({
                    where: { id: { in: emisorIds.map(id => BigInt(id)) } }
                });
                for (const em of listEmisores) {
                    emisoresMap[em.id.toString()] = em;
                }
            } catch (e) {
                console.log('Error buscando emisores asignados:', e.message);
            }
        }

        const alumnosFormatted = alumnos.map(a => ({
            ...a,
            carrera: a.programa_academico?.nombre || a.carrera,
            emisor: a.emisor_id ? (emisoresMap[a.emisor_id.toString()] || null) : null
        }));

        return NextResponse.json(serializeBigIntsAndDecimals(alumnosFormatted), { status: 200 });

    } catch (error) {
        console.error('Error fetching alumnos:', error);
        return NextResponse.json({ error: 'Error al consultar lista de alumnos: ' + error.message }, { status: 500 });
    }
}

// POST: Registrar/Editar Alumno O Asignación Masiva de Razón Social Emisora O Cambiar Estatus
export async function POST(request) {
    try {
        const body = await request.json();
        const {
            action,
            alumno_id,
            alumnos_ids,
            emisor_id,
            carrera_filtro,
            asignacion_total,
            matricula,
            nombre,
            apellido_paterno,
            apellido_materno,
            email,
            telefono,
            carrera,
            semestre,
            estatus,
            concepto_id,
            monto_personalizado,
            motivo_cambio,
            dia_pago,
            requiere_factura,
            rfc,
            razon_social,
            codigo_postal,
            regimen_fiscal,
            uso_cfdi,
            clabe_interbancaria,
            referencia_pago,
            informacion_pago,
            ids_alumno,
            grupo_id,
            programa_academico_id
        } = body;

        // =========================================================================
        // CASO 1: ASIGNACIÓN MASIVA DE RAZÓN SOCIAL EMISORA A ALUMNOS
        // =========================================================================
        if (action === 'ASIGNACION_MASIVA_EMISOR') {
            if (!emisor_id) {
                return NextResponse.json({ error: 'Debe seleccionar una Razón Social Emisora para asignar.' }, { status: 400 });
            }

            const emisorTargetId = BigInt(emisor_id);

            let whereCondition = {};
            if (Array.isArray(alumnos_ids) && alumnos_ids.length > 0) {
                whereCondition.id = { in: alumnos_ids.map(id => BigInt(id)) };
            } else if (carrera_filtro && carrera_filtro !== 'TODAS') {
                whereCondition.carrera = carrera_filtro;
            } else if (!asignacion_total) {
                return NextResponse.json({ error: 'Seleccione los alumnos o marque la asignación a todos los alumnos.' }, { status: 400 });
            }

            if (grupo_id) whereCondition.grupo_id = BigInt(grupo_id);

            const result = await prisma.alumno.updateMany({
                where: whereCondition,
                data: {
                    emisor_id: emisorTargetId
                }
            });

            const emisorObj = await prisma.emisors.findUnique({ where: { id: emisorTargetId } });

            return NextResponse.json({
                mensaje: `Se asignó la empresa "${emisorObj?.nombre || 'Emisor'}" a ${result.count} alumno(s) exitosamente.`
            }, { status: 200 });
        }

        // =========================================================================
        // CASO 2: CAMBIO DE ESTATUS INDIVIDUAL RÁPIDO (ACTIVO / BAJA / GRADUADO)
        // =========================================================================
        if (action === 'CAMBIAR_ESTATUS') {
            if (!alumno_id || !estatus) {
                return NextResponse.json({ error: 'alumno_id y estatus son obligatorios para esta acción' }, { status: 400 });
            }

            const estatusNormalizado = estatus.toUpperCase();
            if (!['ACTIVO', 'BAJA', 'GRADUADO'].includes(estatusNormalizado)) {
                return NextResponse.json({ error: 'Estatus inválido. Valores permitidos: ACTIVO, BAJA, GRADUADO' }, { status: 400 });
            }

            const alumnoActualizado = await prisma.alumno.update({
                where: { id: BigInt(alumno_id) },
                data: { estatus: estatusNormalizado },
                include: { receptor: true }
            });

            return NextResponse.json(serializeBigIntsAndDecimals(alumnoActualizado), { status: 200 });
        }

        // =========================================================================
        // CASO 3: REGISTRO / EDICIÓN INDIVIDUAL DE ALUMNO
        // =========================================================================
        if (!matricula || !nombre || !apellido_paterno || !monto_personalizado) {
            return NextResponse.json({ error: 'Matrícula, Nombre, Apellido Paterno y Monto Mensual son obligatorios' }, { status: 400 });
        }

        let receptorId = null;

        if (requiere_factura && rfc && razon_social) {
            const receptorExistente = await prisma.receptors.findFirst({
                where: { rfc: rfc.trim().toUpperCase() }
            });

            if (receptorExistente) {
                const receptorActualizado = await prisma.receptors.update({
                    where: { id: receptorExistente.id },
                    data: {
                        nombre: razon_social.trim(),
                        domicilio_fiscal_receptor: codigo_postal || receptorExistente.domicilio_fiscal_receptor,
                        regimen_fiscal_receptor: regimen_fiscal || receptorExistente.regimen_fiscal_receptor,
                        uso_cfdi: uso_cfdi || receptorExistente.uso_cfdi,
                        email: email || receptorExistente.email
                    }
                });
                receptorId = receptorActualizado.id;
            } else {
                const nuevoReceptor = await prisma.receptors.create({
                    data: {
                        rfc: rfc.trim().toUpperCase(),
                        nombre: razon_social.trim(),
                        domicilio_fiscal_receptor: codigo_postal || null,
                        regimen_fiscal_receptor: regimen_fiscal || '605',
                        uso_cfdi: uso_cfdi || 'S01',
                        email: email || null,
                        grupo_id: grupo_id ? BigInt(grupo_id) : null
                    }
                });
                receptorId = nuevoReceptor.id;
            }
        }

        const dataAlumno = {
            matricula: matricula.trim(),
            nombre: nombre.trim(),
            apellido_paterno: apellido_paterno.trim(),
            apellido_materno: apellido_materno ? apellido_materno.trim() : null,
            email: email ? email.trim() : null,
            telefono: telefono ? telefono.trim() : null,
            carrera: carrera ? carrera.trim() : null,
            semestre: semestre ? parseInt(semestre) : 1,
            estatus: estatus ? estatus.trim().toUpperCase() : 'ACTIVO',
            clabe_interbancaria: clabe_interbancaria ? clabe_interbancaria.trim() : null,
            referencia_pago: referencia_pago ? referencia_pago.trim() : null,
            informacion_pago: informacion_pago ? informacion_pago.trim() : null,
            ids_alumno: ids_alumno ? ids_alumno.trim() : null,
            requiere_factura: Boolean(requiere_factura),
            receptor_id: receptorId,
            emisor_id: emisor_id ? BigInt(emisor_id) : null,
            grupo_id: grupo_id ? BigInt(grupo_id) : null,
            programa_academico_id: programa_academico_id ? BigInt(programa_academico_id) : null,
            monto_personalizado: parseFloat(monto_personalizado)
        };

        if (concepto_id) dataAlumno.concepto_id = BigInt(concepto_id);
        if (dia_pago) dataAlumno.dia_pago = parseInt(dia_pago);

        let alumnoResultado = null;
        if (alumno_id) {
            const original = await prisma.alumno.findUnique({ where: { id: BigInt(alumno_id) } });

            alumnoResultado = await prisma.alumno.update({
                where: { id: BigInt(alumno_id) },
                data: dataAlumno,
                include: { receptor: true }
            });

            if (original && Number(original.monto_personalizado) !== Number(dataAlumno.monto_personalizado)) {
                await prisma.historialMontoAlumno.create({
                    data: {
                        alumno_id: alumnoResultado.id,
                        monto_anterior: original.monto_personalizado,
                        monto_nuevo: dataAlumno.monto_personalizado,
                        motivo_cambio: motivo_cambio || 'Actualización de datos manual'
                    }
                });
            }
        } else {
            alumnoResultado = await prisma.alumno.create({
                data: dataAlumno,
                include: { receptor: true }
            });

            await prisma.historialMontoAlumno.create({
                data: {
                    alumno_id: alumnoResultado.id,
                    monto_anterior: null,
                    monto_nuevo: dataAlumno.monto_personalizado,
                    motivo_cambio: motivo_cambio || 'Monto inicial al registro'
                }
            });
        }

        return NextResponse.json(serializeBigIntsAndDecimals(alumnoResultado), { status: 201 });

    } catch (error) {
        console.error('Error creating/updating alumno:', error);
        return NextResponse.json({ error: 'Error al procesar alumno: ' + error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const { searchParams } = new URL(request.url);
        const alumno_id = searchParams.get('id');

        if (!alumno_id) {
            return NextResponse.json({ error: 'Se requiere el ID del alumno a eliminar' }, { status: 400 });
        }

        const alumno = await prisma.alumno.findUnique({
            where: { id: BigInt(alumno_id) }
        });

        if (!alumno) {
            return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
        }

        await prisma.alumno.delete({
            where: { id: BigInt(alumno_id) }
        });

        return NextResponse.json({ mensaje: 'Alumno eliminado exitosamente' }, { status: 200 });

    } catch (error) {
        console.error('Error deleting alumno:', error);
        return NextResponse.json({ error: 'No se pudo eliminar el alumno. Es posible que tenga registros relacionados estrictos.' }, { status: 500 });
    }
}

