const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const alumnos = await prisma.alumno.findMany({
            where: { grupo_id: 2 },
            include: { receptors: true }
        });
        console.log("SUCCESS WITH receptors");
    } catch (e) {
        console.log("ERROR WITH receptors:", e.name, e.message);
    }
    
    try {
        const alumnos2 = await prisma.alumno.findMany({
            where: { grupo_id: 2 },
            include: { receptor: true }
        });
        console.log("SUCCESS WITH receptor");
    } catch (e) {
        console.log("ERROR WITH receptor:", e.name, e.message);
    }
    await prisma.$disconnect();
}
main();
