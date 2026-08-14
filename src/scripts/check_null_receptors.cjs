const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const nullRecs = await prisma.receptors.findMany({ where: { grupo_id: null } });
        console.log("=== RECEPTORES CON GRUPO_ID NULL ===");
        console.table(nullRecs.map(r => ({
            id: r.id.toString(),
            rfc: r.rfc,
            nombre: r.nombre,
            email: r.email
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
