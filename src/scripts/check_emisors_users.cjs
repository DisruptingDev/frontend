const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== LISTA DE EMISORES Y SUS GRUPOS ===");
        const emisores = await prisma.emisors.findMany({
            include: { grupos: true }
        });
        console.table(emisores.map(e => ({
            id: e.id.toString(),
            rfc: e.rfc,
            nombre: e.nombre,
            grupo_id: e.grupo_id ? e.grupo_id.toString() : 'NULL',
            grupo_nombre: e.grupos?.nombre || 'N/A'
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
