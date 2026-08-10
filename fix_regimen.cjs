const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Corrigiendo RegimenFiscalReceptor a 605 en la base de datos de test...");
        
        await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nomina" SET regimen_fiscal_receptor = '605', uso_cfdi = 'CN01'`);
        await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nominas" SET regimen_fiscal_receptor = '605', uso_cfdi = 'CN01'`);

        console.log("Corrección de Regimen Fiscal completada.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
