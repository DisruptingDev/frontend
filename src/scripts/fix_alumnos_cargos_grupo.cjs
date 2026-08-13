const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== INSPECCIONANDO Y CORRIGIENDO CARGOS ===");
        const cargos = await prisma.cargoAlumno.findMany({
            include: { Alumno: true }
        });
        console.log("Cargos encontrados:", cargos.length);
        for (const c of cargos) {
            console.log(`Cargo ID: ${c.id}, alumno_id: ${c.alumno_id}, grupo_id: ${c.grupo_id}, Alumno grupo_id: ${c.Alumno?.grupo_id}`);
            if (c.Alumno && c.Alumno.grupo_id) {
                await prisma.cargoAlumno.update({
                    where: { id: c.id },
                    data: { grupo_id: c.Alumno.grupo_id }
                });
                console.log(`-> Actualizado Cargo ${c.id} con grupo_id ${c.Alumno.grupo_id}`);
            }
        }
    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
