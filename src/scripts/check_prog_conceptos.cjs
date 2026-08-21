require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllConceptos() {
  const conceptos = await prisma.conceptoCobro.findMany({
    where: { programa_academico_id: { not: null } }
  });
  console.log(JSON.stringify(conceptos, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

checkAllConceptos().then(() => prisma.$disconnect()).catch(console.error);
