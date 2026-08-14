const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testGetAlumnos(grupoId) {
    const andFiltersAlumnos = [];
    if (grupoId && grupoId !== 'ALL' && grupoId !== 'TODOS') {
        andFiltersAlumnos.push({
            OR: [
                { grupo_id: BigInt(grupoId) },
                { grupo_id: null }
            ]
        });
    }

    const where = andFiltersAlumnos.length > 0 ? { AND: andFiltersAlumnos } : {};

    const alumnos = await prisma.alumno.findMany({
        where,
        include: {
            receptors: true
        },
        orderBy: {
            matricula: 'asc'
        }
    });

    console.log(`=== ALUMNOS ENCONTRADOS PARA GRUPO ${grupoId} ===`);
    console.table(alumnos.map(a => ({
        id: a.id.toString(),
        matricula: a.matricula,
        nombre: `${a.nombre} ${a.apellido_paterno}`,
        grupo_id: a.grupo_id ? a.grupo_id.toString() : 'NULL',
        requiere_factura: a.requiere_factura,
        receptor_rfc: a.receptors?.rfc || 'N/A'
    })));
}

async function main() {
    try {
        await testGetAlumnos(48);
        await testGetAlumnos(3);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
