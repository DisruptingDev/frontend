import { PrismaClient } from '@prisma/client';

const databases = ['Facturacion', 'facturacion_prod', 'facturacion_test'];

async function check() {
  for (const db of databases) {
    const p = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://Facturacion:qRHCZyCj0jbbKundGR3Ny13KsM646UQhkE5efiC4w2gScGAxbY@31.220.31.152:5432/${db}`
        }
      }
    });
    try {
      const res = await p.$queryRawUnsafe("SELECT id, id_solicitud, rfc, created_at, estado_texto FROM public.sat_solicitudes_descarga ORDER BY id DESC LIMIT 5");
      console.log(`Database: ${db} -> Solicitudes:`, res);
      await p.$disconnect();
    } catch (e) {
      console.error(`Database: ${db} error:`, e.message);
    }
  }
}
check();
