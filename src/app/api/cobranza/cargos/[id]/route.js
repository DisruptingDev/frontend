import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function DELETE(request, { params }) {
    try {
        const { id } = params;

        const cargo = await prisma.cargoAlumno.findUnique({
            where: { id: BigInt(id) }
        });

        if (!cargo) {
            return NextResponse.json({ error: 'Cargo/Ficha no encontrada.' }, { status: 404 });
        }

        if (cargo.estatus !== 'PENDIENTE') {
            return NextResponse.json({ error: 'Solo se pueden eliminar fichas con estatus PENDIENTE.' }, { status: 400 });
        }

        await prisma.cargoAlumno.delete({
            where: { id: BigInt(id) }
        });

        return NextResponse.json({ mensaje: 'Ficha eliminada exitosamente.' }, { status: 200 });
    } catch (error) {
        console.error('Error al eliminar cargo:', error);
        return NextResponse.json({ error: 'Error al eliminar el cargo: ' + error.message }, { status: 500 });
    }
}
