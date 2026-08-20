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

export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization');
    let grupo_id = null;

    if (authHeader && authHeader.includes('Bearer ')) {
      try {
        const tokenStr = authHeader.replace('Bearer ', '').trim();
        const payloadStr = Buffer.from(tokenStr.split('.')[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
        const parsed = JSON.parse(payloadStr);
        if (parsed.grupo_id || parsed.grupoId || parsed.GrupoID) {
          grupo_id = (parsed.grupo_id || parsed.grupoId || parsed.GrupoID).toString();
        } else {
          const email = parsed.email || parsed.correo || parsed.sub || parsed.username;
          const userId = parsed.id || parsed.user_id || parsed.usuario_id;
          const userWhere = [];
          if (userId) try { userWhere.push({ id: BigInt(userId) }); } catch(e){}
          if (email && typeof email === 'string' && email.includes('@')) {
            userWhere.push({ email: email.trim().toLowerCase() });
          }
          if (userWhere.length > 0) {
            const dbUser = await prisma.usuarios.findFirst({
              where: { OR: userWhere },
              select: { grupo_id: true }
            });
            if (dbUser && dbUser.grupo_id) grupo_id = dbUser.grupo_id.toString();
          }
        }
      } catch (e) {}
    }

    if (!grupo_id) {
        const { searchParams } = new URL(request.url);
        grupo_id = searchParams.get('grupo_id') || request.headers.get('x-grupo-id');
    }

    let whereClause = {};
    if (grupo_id && grupo_id !== 'ALL' && grupo_id !== 'TODOS') {
        whereClause = {
            OR: [
                { grupo_id: BigInt(grupo_id) },
                { grupo_id: null }
            ]
        };
    }

    let productos = await prisma.productoFicha.findMany({
      where: whereClause,
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
        where: whereClause,
        orderBy: { id: 'asc' }
      });
    }

    const serialized = productos.map(p => ({
      ...p,
      id: p.id.toString(),
      grupo_id: p.grupo_id ? p.grupo_id.toString() : null,
      created_at: p.created_at,
      updated_at: p.updated_at
    }));

    return NextResponse.json(serialized, { status: 200 });
  } catch (error) {
    console.error('Error fetching productos:', error);
    return NextResponse.json(defaultProductos.map((p, i) => ({ id: (i + 1).toString(), ...p })), { status: 200 });
  }
}
