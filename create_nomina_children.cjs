const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creando tablas relacionadas de nómina...");
        
        // percepciones
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."percepciones" (
                "id" SERIAL PRIMARY KEY,
                "total_sueldos" DECIMAL(10,2),
                "total_gravado" DECIMAL(10,2),
                "total_exento" DECIMAL(10,2),
                "nomina_id" INTEGER
            );
        `);

        // percepcions (singular model in go gets 's')
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."percepcions" (
                "id" SERIAL PRIMARY KEY,
                "tipo_percepcion" VARCHAR(255),
                "clave" VARCHAR(255),
                "concepto" VARCHAR(255),
                "importe_gravado" DECIMAL(10,2),
                "importe_exento" DECIMAL(10,2),
                "percepciones_id" INTEGER
            );
        `);

        // deducciones
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."deducciones" (
                "id" SERIAL PRIMARY KEY,
                "total_otras_deducciones" DECIMAL(10,2),
                "total_impuestos_retenidos" DECIMAL(10,2),
                "nomina_id" INTEGER
            );
        `);

        // deduccions (singular model in go gets 's')
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."deduccions" (
                "id" SERIAL PRIMARY KEY,
                "tipo_deduccion" VARCHAR(255),
                "clave" VARCHAR(255),
                "concepto" VARCHAR(255),
                "importe" DECIMAL(10,2),
                "deducciones_id" INTEGER
            );
        `);

        console.log("Tablas creadas exitosamente.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
