require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const comps = await prisma.comprobantes.findMany({
    take: 8,
    orderBy: { id: 'desc' },
    select: {
      id: true,
      serie: true,
      folio: true,
      total: true,
      estatus: true,
      uuid: true,
      fecha: true,
      emisors: { select: { id: true, nombre: true, rfc: true } },
      receptors: { select: { id: true, nombre: true, rfc: true } },
      Conceptos: {
        select: {
          Concepto: {
            select: {
              id: true,
              descripcion: true,
              cantidad: true,
              valor_unitario: true,
              importe: true
            }
          }
        }
      }
    }
  });
  console.log(JSON.stringify(comps, (k,v) => typeof v === 'bigint' ? v.toString() : v, 2));
}

main().then(() => prisma.$disconnect()).catch(console.error);
