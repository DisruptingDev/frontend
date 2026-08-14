const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (typeof obj === 'object') {
        if (obj instanceof Date) return obj.toISOString();
        if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
        const serialized = {};
        for (const key in obj) {
            serialized[key] = serializeBigIntsAndDecimals(obj[key]);
        }
        return serialized;
    }
    return obj;
}

async function GET(grupoIdStr, isSuperUserStr) {
    try {
        let grupoId = grupoIdStr;
        const isSuperUser = isSuperUserStr === 'true';

        const andFiltersAlumnos = [];
        if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS') {
            andFiltersAlumnos.push({ grupo_id: BigInt(grupoId) });
        } else if (!isSuperUser) {
            andFiltersAlumnos.push({ grupo_id: BigInt(-1) });
        }

        const where = andFiltersAlumnos.length > 0 ? { AND: andFiltersAlumnos } : {};

        const alumnos = await prisma.alumno.findMany({
            where,
            include: { receptors: true },
            orderBy: { matricula: 'asc' }
        });

        const emisorIds = [...new Set(alumnos.map(a => a.emisor_id).filter(Boolean))];
        const programaIds = [...new Set(alumnos.map(a => a.programa_academico_id).filter(Boolean))];
        let emisoresMap = {};
        let programasMap = {};

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

        if (programaIds.length > 0) {
            try {
                const listProgramas = await prisma.programaAcademico.findMany({
                    where: { id: { in: programaIds.map(id => BigInt(id)) } }
                });
                for (const pr of listProgramas) {
                    programasMap[pr.id.toString()] = pr;
                }
            } catch (e) {
                console.log('Error buscando programas académicos:', e.message);
            }
        }

        const alumnosFormatted = alumnos.map(a => ({
            ...a,
            receptor: a.receptors || null,
            programa_academico: a.programa_academico_id ? (programasMap[a.programa_academico_id.toString()] || null) : null,
            carrera: a.programa_academico_id ? (programasMap[a.programa_academico_id.toString()]?.nombre || a.carrera) : a.carrera,
            emisor: a.emisor_id ? (emisoresMap[a.emisor_id.toString()] || null) : null
        }));

        console.log(`Encontrados ${alumnos.length} alumnos para grupoId=${grupoIdStr}, isSuperUser=${isSuperUserStr}`);
        const result = serializeBigIntsAndDecimals(alumnosFormatted);
        console.log("Serializable:", Array.isArray(result));
        return result;

    } catch (e) {
        console.error('ERROR en GET:', e.message);
    }
}

async function main() {
    await GET('2', 'false'); 
    await GET('3', 'true'); 
    await GET('48', 'false'); 
    await prisma.$disconnect();
}
main();
