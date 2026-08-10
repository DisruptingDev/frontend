const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Corrigiendo CURPs mal formados en la base de datos de test...");
        
        // Usaremos una CURP genérica válida para pruebas que cumpla exactamente la regex del SAT
        // XAXX010101MDFXXX01 cumple con:
        // XAXX (letras)
        // 010101 (fecha)
        // M (sexo)
        // DF (entidad)
        // XXX (consonantes)
        // 01 (homoclave)
        const validCurp = "XAXX010101MDFXXX01";

        const rows = await prisma.$queryRawUnsafe(`SELECT id, curp FROM "public"."receptor_nomina"`);
        for (const row of rows) {
            if (row.curp !== validCurp) {
                console.log(`Corrigiendo receptor_nomina ID ${row.id}: ${row.curp} -> ${validCurp}`);
                await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nomina" SET curp = $1 WHERE id = $2`, validCurp, row.id);
            }
        }

        const rows2 = await prisma.$queryRawUnsafe(`SELECT id, curp FROM "public"."receptor_nominas"`);
        for (const row of rows2) {
            if (row.curp !== validCurp) {
                console.log(`Corrigiendo receptor_nominas ID ${row.id}: ${row.curp} -> ${validCurp}`);
                await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nominas" SET curp = $1 WHERE id = $2`, validCurp, row.id);
            }
        }

        console.log("Corrección de CURP completada.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
