const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkUsersAndGroups() {
    console.log("=== USER FOR UNIMCO / 48 ===");
    const unimcoUsers = await prisma.usuarios.findMany({
        where: {
            OR: [
                { grupo_id: 48n },
                { email: { contains: 'unimco', mode: 'insensitive' } }
            ]
        }
    });
    console.log(unimcoUsers);

    await prisma.$disconnect();
}

checkUsersAndGroups().catch(console.error);
