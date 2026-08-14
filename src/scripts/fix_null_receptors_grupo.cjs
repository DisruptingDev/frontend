const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== VINCULANDO GRUPO_ID A RECEPTORES Y ALUMNOS HUÉRFANOS ===");
        
        // 1. Obtener todos los alumnos que tienen receptor vinculado
        const alumnos = await prisma.alumno.findMany({
            include: { receptors: true }
        });

        for (const a of alumnos) {
            if (a.receptors && a.grupo_id && !a.receptors.grupo_id) {
                console.log(`Asignando grupo_id ${a.grupo_id} al Receptor ${a.receptors.id} (${a.receptors.nombre} - ${a.receptors.rfc})...`);
                await prisma.receptors.update({
                    where: { id: a.receptors.id },
                    data: { grupo_id: a.grupo_id }
                });
            }
        }

        // 2. Si hay alumnos o receptores del usuario sin grupo_id, asignar al grupo principal activo
        const receptor256 = await prisma.receptors.findUnique({ where: { id: 256n } });
        if (receptor256 && !receptor256.grupo_id) {
            console.log("Asignando grupo_id 48 (o 3) al receptor 256...");
            // Si el alumno 5 es de UNIMCO o SuperAdmin, le asignamos el grupo correspondiente
            const alumno5 = await prisma.alumno.findFirst({ where: { receptor_id: 256n } });
            const targetGrupoId = alumno5?.grupo_id || 48n; // Finanzas UNIMCO grupo_id 48
            await prisma.receptors.update({
                where: { id: 256n },
                data: { grupo_id: targetGrupoId }
            });
            if (alumno5 && !alumno5.grupo_id) {
                await prisma.alumno.update({
                    where: { id: alumno5.id },
                    data: { grupo_id: targetGrupoId }
                });
            }
        }

        console.log("Migración de receptores huérfanos completada.");
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
