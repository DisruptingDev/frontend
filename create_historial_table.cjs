const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creating HistorialMontoAlumno table...");
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "HistorialMontoAlumno" (
                "id" BIGSERIAL NOT NULL,
                "alumno_id" BIGINT NOT NULL,
                "monto_anterior" DECIMAL,
                "monto_nuevo" DECIMAL NOT NULL,
                "motivo_cambio" TEXT,
                "fecha_cambio" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT "HistorialMontoAlumno_pkey" PRIMARY KEY ("id")
            );
        `);
        console.log("Table created.");

        console.log("Adding foreign key...");
        await prisma.$executeRawUnsafe(`
            DO $$
            BEGIN
                IF NOT EXISTS (
                    SELECT 1
                    FROM pg_constraint
                    WHERE conname = 'HistorialMontoAlumno_alumno_id_fkey'
                ) THEN
                    ALTER TABLE "HistorialMontoAlumno" 
                    ADD CONSTRAINT "HistorialMontoAlumno_alumno_id_fkey" 
                    FOREIGN KEY ("alumno_id") REFERENCES "Alumno"("id") ON DELETE CASCADE ON UPDATE CASCADE;
                END IF;
            END;
            $$;
        `);
        console.log("Foreign key added.");

        console.log("Setting default monto_personalizado for existing students...");
        await prisma.$executeRawUnsafe(`
            UPDATE "Alumno" 
            SET "monto_personalizado" = 2500 
            WHERE "monto_personalizado" IS NULL;
        `);
        console.log("Existing students updated.");

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
