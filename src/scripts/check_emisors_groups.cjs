const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const emisors = await prisma.emisors.findMany();
        console.log("=== EMISORES EN BD ===");
        emisors.forEach(e => console.log({ id: e.id.toString(), rfc: e.rfc, nombre: e.nombre, grupo_id: e.grupo_id ? e.grupo_id.toString() : null, es_predeterminado: e.es_predeterminado }));

        const usuarios = await prisma.usuarios.findMany();
        console.log("\n=== USUARIOS EN BD ===");
        usuarios.forEach(u => console.log({ id: u.id.toString(), nombre: u.nombre, email: u.email, grupo_id: u.grupo_id ? u.grupo_id.toString() : null, tipo: u.tipo_usuario }));

        const alumnoCount = await prisma.alumno.count();
        const alumnoByGrupo = await prisma.alumno.groupBy({ by: ['grupo_id'], _count: { id: true } });
        console.log("\n=== ALUMNOS ===");
        console.log("Total:", alumnoCount, "Por grupo:", alumnoByGrupo.map(g => ({ grupo_id: g.grupo_id ? g.grupo_id.toString() : null, count: g._count.id })));

        const cargoByGrupo = await prisma.cargoAlumno.groupBy({ by: ['grupo_id'], _count: { id: true } });
        console.log("\n=== CARGOS ALUMNO ===");
        console.log("Por grupo:", cargoByGrupo.map(g => ({ grupo_id: g.grupo_id ? g.grupo_id.toString() : null, count: g._count.id })));

        const compByGrupo = await prisma.comprobantes.groupBy({ by: ['grupo_id'], _count: { id: true } });
        console.log("\n=== COMPROBANTES ===");
        console.log("Por grupo:", compByGrupo.map(g => ({ grupo_id: g.grupo_id ? g.grupo_id.toString() : null, count: g._count.id })));

    } catch (e) {
        console.error("Error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
