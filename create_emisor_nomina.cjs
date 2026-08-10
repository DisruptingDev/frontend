const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Conectando a la base de datos para crear la tabla 'emisor_nominas'...");
        
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."emisor_nominas" (
                "id" SERIAL PRIMARY KEY,
                "registro_patronal" VARCHAR(255),
                "rfc_patron_origen" VARCHAR(255),
                "emisor_id" INTEGER,
                "nomina_id" INTEGER
            );
        `);
        
        console.log("Tabla 'emisor_nominas' creada exitosamente.");

        // Por si Gorm busca el nombre en singular:
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."emisor_nomina" (
                "id" SERIAL PRIMARY KEY,
                "registro_patronal" VARCHAR(255),
                "rfc_patron_origen" VARCHAR(255),
                "emisor_id" INTEGER,
                "nomina_id" INTEGER
            );
        `);
        console.log("Tabla 'emisor_nomina' creada exitosamente.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
