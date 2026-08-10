require('dotenv').config({ path: __dirname + '/.env' });
require('dotenv').config({ path: __dirname + '/../.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const productos = [
  { nombre: 'Mensualidad', concepto_utilizado: 'MATERIA' },
  { nombre: 'Materia Ordinaria', concepto_utilizado: 'MATERIA' },
  { nombre: 'Materia de Revalidación', concepto_utilizado: 'MATERIA' },
  { nombre: 'Materia de Adelanto', concepto_utilizado: 'MATERIA' },
  { nombre: 'Materia Recursada', concepto_utilizado: 'MATERIA' },
  { nombre: 'Constancia', concepto_utilizado: 'CONSTANCIA' },
  { nombre: 'Kardex', concepto_utilizado: 'KARDEX' },
  { nombre: 'Credencial', concepto_utilizado: 'CREDENCIAL' },
  { nombre: 'Abono a Titulación', concepto_utilizado: 'TITULACIÓN' },
  { nombre: 'Graduación', concepto_utilizado: 'GRADUACIÓN' },
  { nombre: 'Inscripción', concepto_utilizado: 'INSCRIPCIÓN' },
  { nombre: 'Reinscripción', concepto_utilizado: 'REINSCRIPCIÓN' },
];

async function main() {
  console.log('Iniciando carga de Productos para Fichas...');
  
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."ProductoFicha" (
        "id" BIGSERIAL PRIMARY KEY,
        "nombre" TEXT NOT NULL,
        "concepto_utilizado" TEXT,
        "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6)
      );
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."CargoAlumno" 
      ADD COLUMN IF NOT EXISTS "producto_id" BIGINT;
    `);

    console.log("Tabla ProductoFicha creada y CargoAlumno actualizado.");
  } catch (err) {
    console.error("Error alterando schema:", err);
  }

  for (const prod of productos) {
    const query = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."ProductoFicha" WHERE "nombre" = $1 LIMIT 1`, prod.nombre);
    
    if (query.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "public"."ProductoFicha" ("nombre", "concepto_utilizado")
        VALUES ($1, $2)
      `, prod.nombre, prod.concepto_utilizado);
      console.log(`Creado: ${prod.nombre}`);
    } else {
      console.log(`Ya existe: ${prod.nombre}`);
    }
  }

  console.log('Proceso finalizado.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
