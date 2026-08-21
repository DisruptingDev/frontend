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
          Concepto: {
            include: {
              impuestos: {
                include: {
                  traslados: true,
                  retencions: true
                }
              }
            }
          }
        }
      }
    }
  });

  console.log('=== FULL COMPROBANTE 1677 DATA ===');
  console.log(JSON.stringify(comp, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

run().finally(() => prisma.$disconnect()).catch(console.error);
