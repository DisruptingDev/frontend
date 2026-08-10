const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Conectando a la base de datos para crear la tabla 'nomina'...");
        
        const tableQuery = `
            "id" SERIAL PRIMARY KEY,
            "version" VARCHAR(255),
            "tipo_nomina" VARCHAR(255),
            "fecha_pago" VARCHAR(255),
            "fecha_inicial_pago" VARCHAR(255),
            "fecha_final_pago" VARCHAR(255),
            "num_dias_pagados" DECIMAL(10,2),
            "total_percepciones" DECIMAL(10,2),
            "total_deducciones" DECIMAL(10,2),
            "total_otros_pagos" DECIMAL(10,2),
            "emisor_nomina_id" INTEGER,
            "receptor_nomina_id" INTEGER,
            "complemento_id" INTEGER
        `;

        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "public"."nomina" (${tableQuery});`);
        console.log("Tabla 'nomina' creada exitosamente.");

        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "public"."nominas" (${tableQuery});`);
        console.log("Tabla 'nominas' creada exitosamente.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
