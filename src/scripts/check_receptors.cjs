const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const receptors = await prisma.receptors.findMany();
        console.log("=== RECEPTORES EN LA BASE DE DATOS ===");
        console.table(receptors.map(r => ({
            id: r.id.toString(),
            rfc: r.rfc,
            nombre: r.nombre,
            grupo_id: r.grupo_id ? r.grupo_id.toString() : 'NULL'
        })));

        const comprobantes = await prisma.comprobantes.findMany({
            include: { receptors: true, PagoAlumno: { include: { alumno: true } } }
        });
        console.log("\n=== COMPROBANTES CON SU RECEPTOR Y ALUMNO ===");
        console.table(comprobantes.map(c => ({
            id: c.id.toString(),
            serie: c.serie,
            folio: c.folio,
            estatus: c.estatus,
            receptor_id: c.receptor_id ? c.receptor_id.toString() : 'NULL',
            receptor_rfc: c.receptors?.rfc,
            receptor_nombre: c.receptors?.nombre,
            alumno: c.PagoAlumno?.[0]?.alumno ? `${c.PagoAlumno[0].alumno.nombre} ${c.PagoAlumno[0].alumno.apellido_paterno}` : 'SIN ALUMNO'
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
