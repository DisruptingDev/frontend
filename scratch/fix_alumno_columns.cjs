const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Aplicando columnas faltantes a la tabla 'Alumno' en Sandbox...");

    // Agregamos las columnas fiscales a la tabla Alumno
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Alumno" 
      ADD COLUMN IF NOT EXISTS "monto_mensualidad" DECIMAL,
      ADD COLUMN IF NOT EXISTS "rfc" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "nombre_fiscal" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "regimen_fiscal" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "uso_cfdi" VARCHAR(255),
      ADD COLUMN IF NOT EXISTS "domicilio_fiscal" VARCHAR(255);
    `);

    console.log("✅ Columnas agregadas exitosamente a 'Alumno'.");

  } catch (error) {
    console.error("❌ Error al aplicar cambios en la BD:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
