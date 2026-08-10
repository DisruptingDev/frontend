const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const triggers = await prisma.$queryRaw`
            SELECT tgname, pg_get_triggerdef(oid) 
            FROM pg_trigger 
            WHERE tgrelid = 'public.comprobantes'::regclass;
        `;
        console.log("Triggers:", triggers);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
