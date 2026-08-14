const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectData() {
    console.log("=== USERS named Mauricio or similar ===");
    const users = await prisma.usuarios.findMany({
        where: {
            OR: [
                { nombre: { contains: 'Mauricio', mode: 'insensitive' } },
                { email: { contains: 'mauricio', mode: 'insensitive' } }
            ]
        }
    });
    console.log(users);

    console.log("\n=== ALL USERS ===");
    const allUsers = await prisma.usuarios.findMany({
        select: { id: true, nombre: true, email: true, grupo_id: true }
    });
    console.log(allUsers);

    console.log("\n=== ALL EMISORES ===");
    const emisores = await prisma.emisors.findMany({
        select: { id: true, rfc: true, nombre: true, grupo_id: true }
    });
    console.log(emisores);

    console.log("\n=== ALL ALUMNOS ===");
    const alumnos = await prisma.Alumno.findMany({
        select: { id: true, matricula: true, nombre: true, grupo_id: true, emisor_id: true }
    });
    console.log(alumnos);

    console.log("\n=== ALL GRUPOS ===");
    const grupos = await prisma.grupos.findMany({});
    console.log(grupos);

    await prisma.$disconnect();
}

inspectData().catch(console.error);
