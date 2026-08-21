require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAlumno() {
  const alumnos = await prisma.alumno.findMany({
    take: 5,
    include: {
      programa_academico: true,
      receptor: true
    }
  });
  console.log(JSON.stringify(alumnos, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

checkAlumno().then(() => prisma.$disconnect()).catch(console.error);
