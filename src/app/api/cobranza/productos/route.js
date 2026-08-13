import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const defaultProductos = [
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
  { nombre: 'Reinscripción', concepto_utilizado: 'REINSCRIPCIÓN' }
];

export async function GET() {
  try {
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
    } catch (e) {}

    let productos = await prisma.productoFicha.findMany({
      orderBy: { id: 'asc' }
    });

    if (productos.length === 0) {
      for (const prod of defaultProductos) {
        await prisma.$executeRawUnsafe(`
          INSERT INTO "public"."ProductoFicha" ("nombre", "concepto_utilizado")
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, prod.nombre, prod.concepto_utilizado);
      }
      productos = await prisma.productoFicha.findMany({
        orderBy: { id: 'asc' }
      });
    }

    const serialized = productos.map(p => ({
      ...p,
      id: p.id.toString(),
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(defaultProductos.map((p, i) => ({ id: (i + 1).toString(), ...p })), { status: 200 });
  }
}
