const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const result = await prisma.$queryRaw`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comprobantes' 
      ORDER BY column_name;
    `;
    console.log("COLUMNAS EXISTENTES EN 'comprobantes':");
    console.log(result);
  } catch (error) {
    console.error("Error al consultar la BD:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
