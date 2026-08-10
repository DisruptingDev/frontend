import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const programas = await prisma.programaAcademico.findMany({
      orderBy: { nombre: 'asc' }
    });
    const serializable = programas.map(p => ({
      ...p,
      id: p.id.toString(),
    }));
    return NextResponse.json(serializable);
  } catch (error) {
    console.error('Error fetching programas:', error);
    return NextResponse.json({ error: 'Error al obtener programas académicos' }, { status: 500 });
  }
}
