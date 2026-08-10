const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
  let univ = await prisma.emisors.findFirst({ where: { rfc: 'UHI950412XX1' } });
  
  if (!univ) {
      console.log('Creando emisora Universidad...');
      univ = await prisma.emisors.create({
          data: {
              rfc: 'UHI950412XX1',
              nombre: 'UNIVERSIDAD HISPANOAMERICANA S.C.',
              regimen_fiscal: '601',
              lugar_expedicion: '01000'
          }
      });
  }
  
  if (univ) {
      const res = await prisma.comprobantes.updateMany({
          where: { estatus: { in: ['PENDIENTE', 'BORRADOR'] }, emisor_id: { not: univ.id } },
          data: { emisor_id: univ.id }
      });
      console.log('Pre-facturas actualizadas para usar Universidad:', res.count);
  }
}
check().catch(console.error).finally(() => { prisma.$disconnect(); });
