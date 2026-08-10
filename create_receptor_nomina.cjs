const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Conectando a la base de datos para crear la tabla 'receptor_nomina'...");
        
        // Creamos receptor_nomina y receptor_nominas por si Gorm pluraliza
        const tableQuery = `
            "id" SERIAL PRIMARY KEY,
            "curp" VARCHAR(255),
            "num_seguridad_social" VARCHAR(255),
            "fecha_inicio_rel_laboral" VARCHAR(255),
            "antiguedad" VARCHAR(255),
            "tipo_contrato" VARCHAR(255),
            "tipo_jornada" VARCHAR(255),
            "tipo_regimen" VARCHAR(255),
            "num_empleado" VARCHAR(255),
            "departamento" VARCHAR(255),
            "puesto" VARCHAR(255),
            "riesgo_puesto" VARCHAR(255),
            "periodicidad_pago" VARCHAR(255),
            "cuenta_bancaria" VARCHAR(255),
            "banco" VARCHAR(255),
            "salario_base_cot_apor" DECIMAL(10,2),
            "salario_diario_integrado" DECIMAL(10,2),
            "clave_ent_fed" VARCHAR(255),
            "receptor_id" INTEGER,
            "emisor_nomina_id" INTEGER,
            "nomina_id" INTEGER
        `;

        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "public"."receptor_nomina" (${tableQuery});`);
        console.log("Tabla 'receptor_nomina' creada exitosamente.");

        await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "public"."receptor_nominas" (${tableQuery});`);
        console.log("Tabla 'receptor_nominas' creada exitosamente.");

    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
