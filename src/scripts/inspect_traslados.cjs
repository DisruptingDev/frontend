require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function run() {
  const traslados = await prisma.traslados.findMany({
    take: 5,
    orderBy: { id: 'desc' }
  });
  console.log('Traslados:', traslados);
}
run().finally(() => prisma.$disconnect());
