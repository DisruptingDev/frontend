const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== TODOS LOS ALUMNOS ACTUALES EN LA BD ===");
        const alumnos = await prisma.alumno.findMany();
        console.table(alumnos.map(a => ({
            id: a.id.toString(),
            matricula: a.matricula,
            nombre: `${a.nombre} ${a.apellido_paterno} ${a.apellido_materno || ''}`.trim(),
            grupo_id: a.grupo_id ? a.grupo_id.toString() : 'NULL',
            estatus: a.estatus,
            carrera: a.carrera,
            semestre: a.semestre,
            requiere_factura: a.requiere_factura,
            receptor_id: a.receptor_id ? a.receptor_id.toString() : 'NULL',
            emisor_id: a.emisor_id ? a.emisor_id.toString() : 'NULL'
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
