const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Agregando campos estándar de receptor a 'receptor_nomina'...");
        
        const alterQuery = `
            ADD COLUMN IF NOT EXISTS "domicilio_fiscal_receptor" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "residencia_fiscal" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "num_reg_id_trib" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "regimen_fiscal_receptor" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "uso_cfdi" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "grupo_id" INTEGER,
            ADD COLUMN IF NOT EXISTS "calle" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "numero_exterior" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "numero_interior" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "colonia" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "municipio" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "estado" VARCHAR(255),
            ADD COLUMN IF NOT EXISTS "email" VARCHAR(255)
        `;

        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."receptor_nomina" ${alterQuery};`);
        console.log("Columnas agregadas a 'receptor_nomina'.");

        await prisma.$executeRawUnsafe(`ALTER TABLE "public"."receptor_nominas" ${alterQuery};`);
        console.log("Columnas agregadas a 'receptor_nominas'.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
