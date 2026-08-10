require('dotenv').config({ path: __dirname + '/.env' });
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const c = await prisma.cargoAlumno.count({ where: { estatus: { in: ['PENDIENTE', 'PARCIAL'] } } });
  console.log('Pending Cargos:', c);
  const a = await prisma.alumno.count();
  console.log('Total Alumnos:', a);
}

run().finally(() => prisma.$disconnect());
