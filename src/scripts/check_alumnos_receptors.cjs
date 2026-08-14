const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const alumnos = await prisma.alumno.findMany({
            include: { receptors: true }
        });
        console.log("=== ALUMNOS Y SUS RECEPTORES ===");
        console.table(alumnos.map(a => ({
            id: a.id.toString(),
            matricula: a.matricula,
            nombre: `${a.nombre} ${a.apellido_paterno}`,
            grupo_id: a.grupo_id ? a.grupo_id.toString() : 'NULL',
            requiere_factura: a.requiere_factura,
            receptor_id: a.receptor_id ? a.receptor_id.toString() : 'NULL',
            receptor_rfc: a.receptors?.rfc || 'N/A',
            receptor_nombre: a.receptors?.nombre || 'N/A',
            receptor_grupo_id: a.receptors?.grupo_id ? a.receptors.grupo_id.toString() : 'NULL'
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
