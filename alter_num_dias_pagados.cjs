const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Cambiando tipo de columna num_dias_pagados a INTEGER...");
        
        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."nomina" 
            ALTER COLUMN "num_dias_pagados" TYPE INTEGER 
            USING "num_dias_pagados"::integer;
        `);

        await prisma.$executeRawUnsafe(`
            ALTER TABLE "public"."nominas" 
            ALTER COLUMN "num_dias_pagados" TYPE INTEGER 
            USING "num_dias_pagados"::integer;
        `);

        console.log("Columnas modificadas exitosamente.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
