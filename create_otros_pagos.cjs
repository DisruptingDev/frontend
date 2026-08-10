const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creando tabla otros_pagos...");
        
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."otros_pagos" (
                "id" SERIAL PRIMARY KEY,
                "nomina_id" INTEGER
            );
        `);

        console.log("Tabla 'otros_pagos' creada exitosamente.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
