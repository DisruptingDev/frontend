require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const comp = await prisma.comprobantes.findUnique({
    where: { id: 1677n },
    include: {
      emisors: true,
      receptors: true,
      Conceptos: {
        include: {
          Concepto: true
        }
      }
    }
  });

  console.log('=== EMISOR NOMBRE ===', comp.emisors.nombre);
  console.log('=== EMISOR RFC ===', comp.emisors.rfc);
  console.log('=== RECEPTOR NOMBRE ===', comp.receptors.nombre);
  console.log('=== RECEPTOR RFC ===', comp.receptors.rfc);
  for (const ch of comp.Conceptos) {
    for (const c of ch.Concepto) {
      console.log('=== CONCEPTO DESCRIPCION ===', c.descripcion);
    }
  }

  const str = JSON.stringify(comp, (k,v) => typeof v === 'bigint' ? v.toString() : v);
  const matches = str.match(/.{0,30}&.{0,30}/g);
  console.log('=== MATCHES WITH & ===', matches);
}

run().finally(() => prisma.$disconnect()).catch(console.error);
