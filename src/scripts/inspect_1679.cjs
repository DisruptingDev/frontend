require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comp = await prisma.comprobantes.findUnique({
    where: { id: 1679n },
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
  console.log(JSON.stringify(comp, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().then(() => prisma.$disconnect()).catch(console.error);
