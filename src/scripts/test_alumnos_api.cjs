const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        console.log(`Buscando con where:`, JSON.stringify(where, (key, value) => typeof value === 'bigint' ? value.toString() : value, 2));

        const alumnos = await prisma.alumno.findMany({
            where,
            include: {
                receptors: true
            },
            orderBy: {
                matricula: 'asc'
            }
        });
        
        console.log(`Encontrados ${alumnos.length} alumnos para grupoId=${grupoIdStr}, isSuperUser=${isSuperUserStr}`);
        return alumnos;

    } catch (e) {
        console.error('ERROR en GET:', e.message);
    }
}

async function main() {
    await GET('2', 'false'); // Mauricio Casado
    await GET('3', 'true');  // SuperAdmin
    await GET('48', 'false'); // UNIMCO
    await prisma.$disconnect();
}
main();
