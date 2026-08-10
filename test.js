import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const cargos = await prisma.cargoAlumno.findMany({ take: 5, orderBy: { id: 'desc' } });
        console.log("Cargos found:", cargos.length);
        if (cargos.length > 0) {
            const ids = cargos.map(c => c.id.toString());
            const rawItems = await prisma.$queryRawUnsafe(`SELECT id, detalles_items FROM "CargoAlumno" WHERE id IN (${ids.join(',')})`);
            console.log("Raw query result:", rawItems);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
