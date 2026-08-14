const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSpecificEmisores() {
    console.log("=== EMISORES FOR GRUPO 2 ===");
    const em2 = await prisma.emisors.findMany({ where: { grupo_id: 2n } });
    console.log(em2);

    console.log("=== EMISORES FOR GRUPO 48 ===");
    const em48 = await prisma.emisors.findMany({ where: { grupo_id: 48n } });
    console.log(em48);

    console.log("=== ALUMNOS FOR GRUPO 48 ===");
    const al48 = await prisma.Alumno.findMany({ where: { grupo_id: 48n } });
    console.log(al48);

    console.log("=== ALUMNOS FOR GRUPO 2 ===");
    const al2 = await prisma.Alumno.findMany({ where: { grupo_id: 2n } });
    console.log(al2);

    await prisma.$disconnect();
}

checkSpecificEmisores().catch(console.error);
