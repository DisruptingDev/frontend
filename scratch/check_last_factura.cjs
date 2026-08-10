const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const rawFacturas = await prisma.$queryRaw`
      SELECT 
        id, 
        total_string, 
        sub_total_string, 
        descuento_string 
      FROM 
        comprobantes 
      ORDER BY 
        id DESC 
      LIMIT 1;
    `;

    if (rawFacturas.length > 0) {
      const lastId = rawFacturas[0].id;
      
      const rawRetencionesTotal = await prisma.$queryRaw`
        SELECT 
          id, 
          importe_string 
        FROM 
          retencions 
        WHERE 
          impuestos_id IN (
            SELECT id FROM impuestos WHERE concepto_id IN (
              SELECT id FROM "Concepto" WHERE conceptos_id IN (
                SELECT id FROM "Conceptos" WHERE comprobante_id = ${lastId}
              )
            )
          );
      `;
      console.log("RETENCIONES ASOCIADAS:");
      console.log(rawRetencionesTotal);
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
