const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creando tablas _detalle...");
        
        // percepciones_detalle
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."percepciones_detalle" (
                "id" SERIAL PRIMARY KEY,
                "tipo_percepcion" VARCHAR(255),
                "clave" VARCHAR(255),
                "concepto" VARCHAR(255),
                "importe_gravado" DECIMAL(10,2),
                "importe_exento" DECIMAL(10,2),
                "percepciones_id" INTEGER,
                "nomina_id" INTEGER
            );
        `);

        // deducciones_detalle
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."deducciones_detalle" (
                "id" SERIAL PRIMARY KEY,
                "tipo_deduccion" VARCHAR(255),
                "clave" VARCHAR(255),
                "concepto" VARCHAR(255),
                "importe" DECIMAL(10,2),
                "deducciones_id" INTEGER,
                "nomina_id" INTEGER
            );
        `);

        // otros_pagos_detalle (por si acaso)
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "public"."otros_pagos_detalle" (
                "id" SERIAL PRIMARY KEY,
                "tipo_otro_pago" VARCHAR(255),
                "clave" VARCHAR(255),
                "concepto" VARCHAR(255),
                "importe" DECIMAL(10,2),
                "otros_pagos_id" INTEGER,
                "nomina_id" INTEGER
            );
        `);

        console.log("Tablas _detalle creadas exitosamente.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
