import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request) {
    try {
        const { email } = await request.json();
        
        if (!email) {
            return NextResponse.json({ error: "Email requerido" }, { status: 400 });
        }

        const usuario = await prisma.usuarios.findFirst({
            where: { email: email },
            select: { grupo_id: true }
        });

        if (usuario) {
            return NextResponse.json({ 
                grupo_id: usuario.grupo_id ? usuario.grupo_id.toString() : null 
            });
        } else {
            return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 });
        }
    } catch (error) {
        console.error("Error en getUserGroup:", error);
        return NextResponse.json({ error: "Error interno" }, { status: 500 });
    }
}
