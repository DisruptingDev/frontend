const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function fixAntiguedad(val) {
    if (!val) return val;
    // Replace "0Y" with ""
    val = val.replace(/0Y/g, '');
    // Replace "0M" with ""
    val = val.replace(/0M/g, '');
    // Ensure "P" is at start
    if (!val.startsWith("P")) val = "P" + val.replace(/P/g, '');
    // If we removed Y and M and there's only P and D (e.g. P18D), that's fine.
    return val;
}

async function main() {
    try {
        console.log("Corrigiendo valores de 'antiguedad' mal formados en la base de datos...");
        
        const rows = await prisma.$queryRawUnsafe(`SELECT id, antiguedad FROM "public"."receptor_nomina" WHERE antiguedad LIKE '%0M%' OR antiguedad LIKE '%0Y%'`);
        for (const row of rows) {
            const fixed = fixAntiguedad(row.antiguedad);
            console.log(`Corrigiendo receptor_nomina ID ${row.id}: ${row.antiguedad} -> ${fixed}`);
            await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nomina" SET antiguedad = $1 WHERE id = $2`, fixed, row.id);
        }

        const rows2 = await prisma.$queryRawUnsafe(`SELECT id, antiguedad FROM "public"."receptor_nominas" WHERE antiguedad LIKE '%0M%' OR antiguedad LIKE '%0Y%'`);
        for (const row of rows2) {
            const fixed = fixAntiguedad(row.antiguedad);
            console.log(`Corrigiendo receptor_nominas ID ${row.id}: ${row.antiguedad} -> ${fixed}`);
            await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nominas" SET antiguedad = $1 WHERE id = $2`, fixed, row.id);
        }

        console.log("Corrección completada.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
