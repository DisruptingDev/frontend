require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  const timbradas = await prisma.comprobantes.findMany({
    where: { estatus: 'TIMBRADO' },
    orderBy: { id: 'desc' },
    take: 5,
    include: {
      Conceptos: {
        include: {
          Concepto: {
            include: {
              impuestos: {
                include: { traslados: true, retencions: true }
              }
            }
          }
        }
      }
    }
  });
  console.log('TIMBRADAS FOUND:', timbradas.length);
  for (const t of timbradas) {
    console.log('--- Comprobante ID:', t.id.toString(), 'Folio:', t.folio, 'Serie:', t.serie, 'UUID:', t.uuid);
    for (const ch of t.Conceptos) {
      for (const c of ch.Concepto) {
        console.log('  Concepto:', c.descripcion, 'ObjetoImp:', c.objeto_imp);
        for (const imp of c.impuestos) {
          console.log('    Traslados:', JSON.stringify(imp.traslados, (k,v)=>typeof v==='bigint'?v.toString():v, 2));
        }
      }
    }
  }
}

check().finally(() => prisma.$disconnect()).catch(console.error);
