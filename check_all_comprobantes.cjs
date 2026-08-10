require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAllComprobantes() {
  try {
    const list = await prisma.comprobantes.findMany({
      where: { estatus: 'PENDIENTE' },
      select: {
        id: true,
        serie: true,
        folio: true,
        sub_total: true,
        sub_total_string: true,
        total: true,
        total_string: true,
        descuento: true,
        descuento_string: true,
        exportacion: true,
        estatus: true
      }
    });

    console.log("=== COMPROBANTE PENDIENTES EN BASE DE DATOS ===");
    console.table(list);

  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

checkAllComprobantes();
