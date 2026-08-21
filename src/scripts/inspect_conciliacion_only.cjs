require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
  const compConciliacion = await prisma.comprobantes.findFirst({
    where: { PagoAlumno: { some: {} } },
    orderBy: { id: 'desc' },
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

  console.log(JSON.stringify(compConciliacion, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

inspect().then(() => prisma.$disconnect()).catch(console.error);
