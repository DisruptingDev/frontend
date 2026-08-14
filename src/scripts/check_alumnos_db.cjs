const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDb() {
    try {
        const alumnos = await prisma.alumno.findMany({
            where: { grupo_id: 2n },
            include: { receptors: true }
        });
        console.log(`Found ${alumnos.length} students for grupo_id=2`);
        if (alumnos.length > 0) {
            console.log("First student:", alumnos[0].matricula, alumnos[0].nombre);
        }
    } catch (e) {
        console.error("Prisma error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
checkDb();
