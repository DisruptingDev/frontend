const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Intentando agregar columna 'receptor_nomina_id' a la tabla 'comprobantes'...");
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."comprobantes" 
      ADD COLUMN IF NOT EXISTS "receptor_nomina_id" BIGINT;
    `);
    
    console.log("¡Columna agregada exitosamente en PostgreSQL!");
    
    // Consultar de nuevo para verificar
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comprobantes' AND column_name = 'receptor_nomina_id';
    `;
    console.log("Verificación final de columna:", result);
  } catch (error) {
    console.error("Error al alterar la BD:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
