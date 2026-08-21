require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkCols() {
  const compCols = await prisma.$queryRawUnsafe("SELECT table_name, column_name FROM information_schema.columns WHERE table_name IN ('Conceptos', 'Concepto', 'impuestos', 'traslados', 'comprobantes') ORDER BY table_name, ordinal_position;");
  console.log(compCols);
}

checkCols().then(() => prisma.$disconnect()).catch(console.error);
