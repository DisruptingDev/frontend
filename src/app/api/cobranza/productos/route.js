import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const productos = await prisma.productoFicha.findMany({
      orderBy: { id: 'asc' }
    });
    
    // Serializar BigInts antes de enviar
    const serialized = productos.map(p => ({
      ...p,
      id: p.id.toString(),
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 });
  }
}
