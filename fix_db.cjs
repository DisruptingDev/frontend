const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Conectando a la base de datos para agregar la columna 'receptor_nomina_id'...");
        
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."comprobantes" 
            ADD COLUMN IF NOT EXISTS "receptor_nomina_id" integer;
        `);
        
        console.log("Columna 'receptor_nomina_id' agregada exitosamente a la tabla 'comprobantes'.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
