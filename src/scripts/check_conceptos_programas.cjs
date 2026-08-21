require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkConceptos() {
  const conceptos = await prisma.conceptoCobro.findMany({
    take: 20,
    select: {
      id: true,
      nombre: true,
      clave_prod_serv: true,
      programa_academico_id: true,
      carrera: true,
      grupo_id: true
    }
  });

  const programas = await prisma.programaAcademico.findMany({
    take: 20,
    select: {
      id: true,
      nombre: true,
      rvoe: true
    }
  });

  console.log('=== CONCEPTOS COBRO ===');
  console.log(JSON.stringify(conceptos, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));

  console.log('=== PROGRAMAS ACADEMICOS ===');
  console.log(JSON.stringify(programas, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

checkConceptos().then(() => prisma.$disconnect()).catch(console.error);
