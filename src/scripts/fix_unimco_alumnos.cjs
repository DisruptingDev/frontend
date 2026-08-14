const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== RE-ASIGNANDO ALUMNOS AL GRUPO DE UNIMCO (GRUPO 48) ===");
        
        // Asignar Alumno 5 (Jose Eduardo Perz) y Alumno 4 (Edgar Lopez) a UNIMCO (grupo_id 48, emisor_id 71)
        const update5 = await prisma.alumno.update({
            where: { id: 5n },
            data: {
                grupo_id: 48n,
                emisor_id: 71n
            }
        });
        console.log("Alumno 5 actualizado a grupo_id 48 (UNIMCO), emisor_id 71.");

        const update4 = await prisma.alumno.update({
            where: { id: 4n },
            data: {
                grupo_id: 48n,
                emisor_id: 71n
            }
        });
        console.log("Alumno 4 actualizado a grupo_id 48 (UNIMCO), emisor_id 71.");

        // Actualizar también el receptor 256 (Idea.ly / RFC IDE250327V84) de Jose Eduardo Perz a grupo_id 48
        await prisma.receptors.update({
            where: { id: 256n },
            data: { grupo_id: 48n }
        });
        console.log("Receptor 256 (RFC IDE250327V84) actualizado a grupo_id 48.");

        // Actualizar comprobantes y pagos asociados de Alumno 5 y 4 a grupo_id 48
        await prisma.cargoAlumno.updateMany({
            where: { alumno_id: { in: [4n, 5n] } },
            data: { grupo_id: 48n }
        });
        await prisma.pagoAlumno.updateMany({
            where: { alumno_id: { in: [4n, 5n] } },
            data: { grupo_id: 48n }
        });
        await prisma.comprobantes.updateMany({
            where: { id: { in: [910n, 911n, 912n, 913n] } },
            data: { grupo_id: 48n, emisor_id: 71n }
        });
        console.log("Comprobantes y cargos asociados sincronizados con el grupo_id 48 de UNIMCO.");

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
