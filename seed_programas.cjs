require('dotenv').config({ path: __dirname + '/.env' });
require('dotenv').config({ path: __dirname + '/../.env' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const programas = [
  { nombre: 'BACHILLERATO', rvoe: '529257234' },
  { nombre: 'P.T. EN SEGURIDAD INDUSTRIAL', rvoe: '526256021' },
  { nombre: 'P.T. EN COSMETOLOGIA Y ESTETICA INTEGRAL', rvoe: '526256022' },
  { nombre: 'P.T. EN CONTABILIDAD Y R.H.', rvoe: '526256023' },
  { nombre: 'LIC. EN EDUCACION', rvoe: '528218117' },
  { nombre: 'LIC. ADMINISTRACIÓN Y ESTRATÉGIAS DE NEG', rvoe: '528219116' },
  { nombre: 'LIC. EN COMUNICACIÓN Y TECNOLOGIAS DE LA INFORMACION', rvoe: '528218120' },
  { nombre: 'LIC. EN MERCADOTECNIA Y VENTAS', rvoe: '528218118' },
  { nombre: 'LIC. EN DERECHO', rvoe: '528218119' },
  { nombre: 'ING. EN GESTION DE PROCESOS INDUSTRIALES', rvoe: '528218121' },
  { nombre: 'MTRIA. EN EDUCACION', rvoe: '529219058' },
  { nombre: 'MTRIA. EN PROCESOS INDUSTRIALES', rvoe: '529219057' },
  { nombre: 'MTRIA. EN DIRECDCION RECURSOS HUMANOS', rvoe: '529219056' },
  { nombre: 'MTRIA. EN SEGURIDAD INDUSTRIAL', rvoe: '529229138' },
  { nombre: 'MTRIA. EN MEC. ALT. DE SOLUCION DE CONTROVERSIAS', rvoe: '529229139' },
  { nombre: 'MTRIA. EN DESARROLLO HUMANO', rvoe: '529229140' },
  { nombre: 'MTRIA. EN DESARROLLO HUMANO CON C.I. LYAE', rvoe: '529229137' },
  { nombre: 'DOC. EN ADMINISTRACION E INN. EDUCATIVA', rvoe: '529239151' },
  { nombre: 'DOC. EN ADMINISTARCION', rvoe: '529239150' },
];

async function main() {
  console.log('Iniciando sincronización de programas académicos...');
  
  // 1. Asegurar esquema en BD usando executeRawUnsafe
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "public"."ProgramaAcademico" (
        "id" BIGSERIAL PRIMARY KEY,
        "nombre" TEXT NOT NULL,
        "rvoe" TEXT,
        "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
        "updated_at" TIMESTAMPTZ(6)
      );
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."Alumno" 
      ADD COLUMN IF NOT EXISTS "programa_academico_id" BIGINT;
    `);

    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."ConceptoCobro" 
      ADD COLUMN IF NOT EXISTS "programa_academico_id" BIGINT;
    `);
    
    console.log("Tablas creadas/actualizadas exitosamente.");
  } catch (err) {
    console.error("Error al crear la tabla ProgramaAcademico o alterar columnas:", err);
  }

  for (const prog of programas) {
    const query = await prisma.$queryRawUnsafe(`SELECT * FROM "public"."ProgramaAcademico" WHERE "rvoe" = $1 LIMIT 1`, prog.rvoe);
    
    if (query.length === 0) {
      await prisma.$executeRawUnsafe(`
        INSERT INTO "public"."ProgramaAcademico" ("nombre", "rvoe")
        VALUES ($1, $2)
      `, prog.nombre, prog.rvoe);
      console.log(`Creado: ${prog.nombre} - ${prog.rvoe}`);
    } else {
      console.log(`Ya existe: ${prog.nombre} - ${prog.rvoe}`);
    }
  }
  
  // Mapear carreras
  const alumnos = await prisma.$queryRawUnsafe(`SELECT "id", "matricula", "carrera" FROM "public"."Alumno" WHERE "carrera" IS NOT NULL`);
  
  const allProgs = await prisma.$queryRawUnsafe(`SELECT "id", "nombre" FROM "public"."ProgramaAcademico"`);

  for (const alumno of alumnos) {
    if (alumno.carrera) {
      const carreraUpper = alumno.carrera.toUpperCase();
      const prog = allProgs.find(p => p.nombre.includes(carreraUpper) || carreraUpper.includes(p.nombre));
      
      if (prog) {
        await prisma.$executeRawUnsafe(`
          UPDATE "public"."Alumno" SET "programa_academico_id" = $1 WHERE "id" = $2
        `, prog.id, alumno.id);
        console.log(`Alumno ${alumno.matricula}: asignado a ${prog.nombre}`);
      }
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
