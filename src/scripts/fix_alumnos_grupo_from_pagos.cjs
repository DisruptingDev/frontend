const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== LINKING ALUMNOS HUÉRFANOS A SUS GRUPOS SEGÚN SUS PAGOS Y CARGOS ===");
        
        // 1. Alumno 4 (Edgar Lopez) tiene pagos y comprobantes con grupo_id 2
        const alumno4 = await prisma.alumno.findUnique({ where: { id: 4n } });
        if (alumno4 && !alumno4.grupo_id) {
            console.log("Asignando grupo_id 2 a Alumno 4 (Edgar Lopez)...");
            await prisma.alumno.update({
                where: { id: 4n },
                data: { grupo_id: 2n }
            });
        }

        // 2. Revisar cualquier otro alumno con grupo_id null y asignarle el grupo de sus cargos/pagos
        const alumnosNull = await prisma.alumno.findMany({
            where: { grupo_id: null },
            include: { PagoAlumno: true, CargoAlumno: true }
        });

        for (const a of alumnosNull) {
            const grupoPago = a.PagoAlumno.find(p => p.grupo_id)?.grupo_id;
            const grupoCargo = a.CargoAlumno.find(c => c.grupo_id)?.grupo_id;
            const targetGrupo = grupoPago || grupoCargo;
            if (targetGrupo) {
                console.log(`Asignando grupo_id ${targetGrupo} al Alumno ${a.id} (${a.nombre} ${a.apellido_paterno})...`);
                await prisma.alumno.update({
                    where: { id: a.id },
                    data: { grupo_id: targetGrupo }
                });
            }
        }

        console.log("Limpieza de grupos en Alumnos completada exitosamente.");
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
