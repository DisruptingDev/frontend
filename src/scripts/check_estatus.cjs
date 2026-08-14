const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    try {
        const alumnos = await prisma.alumno.findMany({
            where: { grupo_id: 2n }
        });
        console.log(`Found ${alumnos.length} students for grupo_id=2`);
        alumnos.forEach(a => {
            console.log(`ID: ${a.id}, Matricula: ${a.matricula}, Estatus: '${a.estatus}'`);
        });
    } catch (e) {
        console.error("Prisma error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
checkDb();
