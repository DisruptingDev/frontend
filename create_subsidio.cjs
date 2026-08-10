const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creando tabla subsidio_al_empleo...");
        
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."subsidio_al_empleo" (
                "id" SERIAL PRIMARY KEY,
                "subsidio_causado" DECIMAL(10,2),
                "nomina_id" INTEGER,
                "otro_pago_id" INTEGER
            );
        `);

        // En caso de que GORM requiera plural o algo similar
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."subsidio_al_empleos" (
                "id" SERIAL PRIMARY KEY,
                "subsidio_causado" DECIMAL(10,2),
                "nomina_id" INTEGER,
                "otro_pago_id" INTEGER
            );
        `);

        console.log("Tabla 'subsidio_al_empleo' creada exitosamente.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
