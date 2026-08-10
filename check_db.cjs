const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Conectando a la base de datos facturacion_test (31.220.31.152)...");
        
        const total = await prisma.comprobantes.count();
        console.log("Total de comprobantes (Facturas) en la BD:", total);

        const timbradas = await prisma.comprobantes.count({
            where: { estatus: 'TIMBRADO' }
        });
        console.log("Total con estatus 'TIMBRADO':", timbradas);

        const pendientes = await prisma.comprobantes.count({
            where: { estatus: 'PENDIENTE' }
        });
        console.log("Total con estatus 'PENDIENTE':", pendientes);

        const conUUID = await prisma.comprobantes.count({
            where: { uuid: { not: null } }
        });
        console.log("Total con UUID oficial del SAT:", conUUID);

        const nominas = await prisma.comprobantes.count({
            where: { tipo_de_comprobante: 'N' }
        });
        console.log("Total de Nóminas (Tipo N):", nominas);

        // Ultimas 5 facturas
        const ultimas = await prisma.comprobantes.findMany({
            take: 10,
            orderBy: { id: 'desc' },
            select: { id: true, serie: true, folio: true, estatus: true, uuid: true, tipo_de_comprobante: true }
        });
        
        console.log("\nÚltimos 10 comprobantes insertados en la base de datos:");
        console.table(ultimas);

    } catch (error) {
        console.error("Error consultando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
