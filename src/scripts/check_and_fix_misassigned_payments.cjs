const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== INSPECCIONANDO PAGOS Y CARGOS ===");
        const pagos = await prisma.pagoAlumno.findMany({
            include: { Alumno: true, CargoAlumno: true }
        });
        console.log("Pagos totales:", pagos.length);
        pagos.forEach(p => {
            console.log(`Pago ID: ${p.id}, Alumno ID: ${p.alumno_id}, Alumno: ${p.Alumno?.nombre} ${p.Alumno?.apellido_paterno}, Pago Grupo: ${p.grupo_id}, Alumno Grupo: ${p.Alumno?.grupo_id}, Cargo ID: ${p.cargo_id}, Monto: ${p.monto}`);
        });

        const cargos = await prisma.cargoAlumno.findMany({
            include: { Alumno: true }
        });
        console.log("\nCargos totales:", cargos.length);
        cargos.forEach(c => {
            console.log(`Cargo ID: ${c.id}, Alumno ID: ${c.alumno_id}, Alumno: ${c.Alumno?.nombre} ${c.Alumno?.apellido_paterno}, Cargo Grupo: ${c.grupo_id}, Alumno Grupo: ${c.Alumno?.grupo_id}, Estatus: ${c.estatus}, Pendiente: ${c.monto_pendiente}`);
        });

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
