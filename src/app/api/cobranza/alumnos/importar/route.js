import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

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

export async function POST(request) {
    try {
        const body = await request.json();
        const { alumnos } = body;

        if (!Array.isArray(alumnos) || alumnos.length === 0) {
            return NextResponse.json({ error: 'No se enviaron alumnos para importar.' }, { status: 400 });
        }

        // Fetch academic programs for validation
        const programas = await prisma.programaAcademico.findMany();
        const encontrarPrograma = (nombreCarrera) => {
            if (!nombreCarrera) return null;
            const normalizedSearch = nombreCarrera.trim().toLowerCase();
            return programas.find(p => p.nombre.trim().toLowerCase() === normalizedSearch) || null;
        };

        let creados = 0;
        const errores = [];

        for (const [index, a] of alumnos.entries()) {
            const rowNumber = index + 2; // Rows are 1-based, plus header row is row 1.
            try {
                const matricula = String(a.matricula || '').trim();
                const nombre = String(a.nombre || '').trim();
                const apellido_paterno = String(a.apellido_paterno || '').trim();
                const apellido_materno = a.apellido_materno ? String(a.apellido_materno).trim() : null;
                const email = a.email ? String(a.email).trim() : null;
                const telefono = a.telefono ? String(a.telefono).trim() : null;
                const carrera = a.carrera ? String(a.carrera).trim() : null;
                const semestre = a.semestre ? parseInt(a.semestre) : 1;
                const estatus = a.estatus ? String(a.estatus).trim().toUpperCase() : 'ACTIVO';
                const clabe_interbancaria = a.clabe_interbancaria ? String(a.clabe_interbancaria).trim() : null;
                const referencia_pago = a.referencia_pago ? String(a.referencia_pago).trim() : null;
                const informacion_pago = a.informacion_pago ? String(a.informacion_pago).trim() : null;
                const ids_alumno = a.ids_alumno ? String(a.ids_alumno).trim() : null;
                
                const requiere_factura = a.requiere_factura === 'SÍ' || a.requiere_factura === 'SI' || a.requiere_factura === true;
                const rfc = a.rfc ? String(a.rfc).trim().toUpperCase() : null;
                const razon_social = a.razon_social ? String(a.razon_social).trim() : null;
                const codigo_postal = a.codigo_postal ? String(a.codigo_postal).trim() : null;
                const regimen_fiscal = a.regimen_fiscal ? String(a.regimen_fiscal).trim() : '605';
                const uso_cfdi = a.uso_cfdi ? String(a.uso_cfdi).trim() : 'D10';

                const monto_personalizado = a.monto_personalizado ? parseFloat(a.monto_personalizado) : 0;
                const dia_pago = a.dia_pago ? parseInt(a.dia_pago) : 5;

                if (!matricula || !nombre || !apellido_paterno) {
                    throw new Error('Matrícula, Nombre y Apellido Paterno son obligatorios.');
                }

                // Validate Carrera/Plan de estudio
                let programaAcademicoId = null;
                if (carrera) {
                    const prog = encontrarPrograma(carrera);
                    if (!prog) {
                        throw new Error(`El plan de estudio/carrera "${carrera}" no existe en el catálogo.`);
                    }
                    programaAcademicoId = prog.id;
                } else {
                    throw new Error('El plan de estudio/carrera es obligatorio.');
                }

                // Check if matricula already exists
                const existeAlumno = await prisma.alumno.findUnique({
                    where: { matricula }
                });

                if (existeAlumno) {
                    throw new Error(`La matrícula "${matricula}" ya está registrada.`);
                }

                let receptorId = null;
                if (requiere_factura && rfc && razon_social) {
                    const rfcTrimmed = rfc.trim().toUpperCase();
                    const receptorExistente = await prisma.receptors.findFirst({
                        where: { rfc: rfcTrimmed }
                    });

                    if (receptorExistente) {
                        const receptorActualizado = await prisma.receptors.update({
                            where: { id: receptorExistente.id },
                            data: {
                                nombre: razon_social,
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
                                rfc: rfcTrimmed,
                                nombre: razon_social,
                                domicilio_fiscal_receptor: codigo_postal || null,
                                regimen_fiscal_receptor: regimen_fiscal,
                                uso_cfdi,
                                email
                            }
                        });
                        receptorId = nuevoReceptor.id;
                    }
                }

                // Create student
                await prisma.alumno.create({
                    data: {
                        matricula,
                        nombre,
                        apellido_paterno,
                        apellido_materno,
                        email,
                        telefono,
                        carrera,
                        semestre,
                        estatus,
                        clabe_interbancaria,
                        referencia_pago,
                        informacion_pago,
                        ids_alumno,
                        requiere_factura,
                        receptor_id: receptorId,
                        monto_personalizado,
                        dia_pago,
                        programa_academico_id: programaAcademicoId
                    }
                });

                creados++;
            } catch (err) {
                errores.push(`Fila ${rowNumber}: ${err.message}`);
            }
        }

        return NextResponse.json({
            mensaje: `Importación finalizada. Creados: ${creados}, Errores: ${errores.length}`,
            creados,
            errores
        }, { status: 200 });

    } catch (error) {
        console.error('Error importing alumnos:', error);
        return NextResponse.json({ error: 'Error interno al importar alumnos: ' + error.message }, { status: 500 });
    }
}
