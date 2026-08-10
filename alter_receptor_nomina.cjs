const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Agregando columnas 'rfc' y 'nombre' a 'receptor_nomina'...");
        
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."receptor_nomina" 
            ADD COLUMN IF NOT EXISTS "rfc" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "nombre" VARCHAR(255);
        `);
        console.log("Columnas agregadas a 'receptor_nomina'.");

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."receptor_nominas" 
            ADD COLUMN IF NOT EXISTS "rfc" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "nombre" VARCHAR(255);
        `);
        console.log("Columnas agregadas a 'receptor_nominas'.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
