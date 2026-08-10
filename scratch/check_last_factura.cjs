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
      console.log("ÚLTIMA FACTURA CREADA (ID:", lastId.toString(), "):");
      console.log(rawFacturas);
      
      const rawConceptos = await prisma.$queryRaw`
        SELECT 
          id, 
          descripcion, 
          importe_string, 
          valor_unitario_string, 
          descuento_string
        FROM 
          "Concepto"
        WHERE 
          conceptos_id IN (
            SELECT id FROM "Conceptos" WHERE comprobante_id = ${lastId}
          );
      `;
      console.log("CONCEPTOS ASOCIADOS:");
      console.log(rawConceptos);

      const rawTraslados = await prisma.$queryRaw`
        SELECT 
          id, 
          base_string, 
          importe_string, 
          tasa_o_cuota_string 
        FROM 
          traslados 
        WHERE 
          impuestos_id IN (
            SELECT id FROM impuestos WHERE concepto_id IN (
              SELECT id FROM "Concepto" WHERE conceptos_id IN (
                SELECT id FROM "Conceptos" WHERE comprobante_id = ${lastId}
              )
            )
          );
      `;
      console.log("TRASLADOS ASOCIADOS (CONCEPTOS):");
      console.log(rawTraslados);

      const rawConceptosTable = await prisma.$queryRaw`
        SELECT 
          id, 
          total_impuestos_trasladados_string, 
          total_impuestos_retenidos_string
        FROM 
          "Conceptos"
        WHERE 
          comprobante_id = ${lastId};
      `;
      console.log("TABLA 'Conceptos' (SUMAS):");
      console.log(rawConceptosTable);
    }
  } catch (error) {
    console.error("Error consultando la factura:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
