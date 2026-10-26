import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function decodeJwtPayload(token) {
  if (!token) return null;
  try {
    const raw = token.startsWith('Bearer ') ? token.slice(7) : token;
    const parts = raw.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const jsonStr = Buffer.from(base64, 'base64').toString('utf8');
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

/**
 * GET /api/usuarios/wizard-status
 * 
 * Determina si el Wizard de bienvenida debe mostrarse o no.
 * Criterios para NO mostrar el wizard (mostrar = false):
 *  1. El usuario o grupo ya ha sido marcado explícitamente como completado.
 *  2. O el grupo ya tiene 1 o más empresas registradas (ya completó el paso inicial en algún dispositivo).
 */
export async function GET(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const payload = decodeJwtPayload(authHeader);

    const { searchParams } = new URL(request.url);
    let grupoId = searchParams.get('grupoId');

    if (!grupoId && payload) {
      grupoId = payload.grupo_id || payload.grupoId || payload.GrupoID;
    }

    if (!grupoId && payload?.email) {
      const user = await prisma.usuarios.findFirst({
        where: { email: payload.email },
        select: { id: true, grupo_id: true }
      });
      if (user?.grupo_id) {
        grupoId = user.grupo_id;
      }
    }

    if (!grupoId) {
      return NextResponse.json({
        mostrarWizard: false,
        motivo: 'No se pudo identificar el grupo'
      });
    }

    const gId = BigInt(grupoId);

    // 1. Revisar si el grupo ya tiene empresas registradas
    const totalEmisores = await prisma.emisors.count({
      where: { grupo_id: gId }
    });

    if (totalEmisores > 0) {
      return NextResponse.json({
        mostrarWizard: false,
        totalEmisores,
        motivo: 'El usuario ya cuenta con empresas registradas'
      });
    }

    // 2. Revisar si el grupo ya tiene folios o compras
    const grupo = await prisma.grupos.findUnique({
      where: { id: gId },
      select: {
        id: true,
        timbres_disponibles_paquetes: true,
        timbres_disponibles_plan: true
      }
    });

    const tieneTimbres = (grupo?.timbres_disponibles_paquetes || 0) > 0 || (grupo?.timbres_disponibles_plan || 0) > 0;
    if (tieneTimbres) {
      return NextResponse.json({
        mostrarWizard: false,
        motivo: 'El grupo ya tiene saldo o actividad registrada'
      });
    }

    // Si es un usuario 100% nuevo sin empresas ni folios
    return NextResponse.json({
      mostrarWizard: true,
      totalEmisores: 0,
      motivo: 'Usuario nuevo sin empresas'
    });

  } catch (error) {
    console.error('Error en /api/usuarios/wizard-status:', error);
    return NextResponse.json(
      { mostrarWizard: false, error: error.message },
      { status: 500 }
    );
  }
}
