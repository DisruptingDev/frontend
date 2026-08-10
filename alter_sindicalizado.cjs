const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Agregando columna 'sindicalizado' a 'receptor_nomina'...");
        
        const alterQuery = `
            ADD COLUMN IF NOT EXISTS "sindicalizado" VARCHAR(255)
        `;

        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."receptor_nomina" ${alterQuery};`);
        console.log("Columna 'sindicalizado' agregada a 'receptor_nomina'.");

        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."receptor_nominas" ${alterQuery};`);
        console.log("Columna 'sindicalizado' agregada a 'receptor_nominas'.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
