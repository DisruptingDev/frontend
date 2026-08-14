const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== TODOS LOS ALUMNOS Y SUS GRUPOS ===");
        const alumnos = await prisma.alumno.findMany({
            include: { receptors: true, emisors: true, grupos: true }
        });
        console.table(alumnos.map(a => ({
            id: a.id.toString(),
            matricula: a.matricula,
            nombre: `${a.nombre} ${a.apellido_paterno}`,
            grupo_id: a.grupo_id ? a.grupo_id.toString() : 'NULL',
            grupo_nombre: a.grupos?.nombre || 'N/A',
            estatus: a.estatus,
            requiere_factura: a.requiere_factura,
            emisor_id: a.emisor_id ? a.emisor_id.toString() : 'NULL'
        })));

        console.log("\n=== TODOS LOS USUARIOS Y SUS GRUPOS ===");
        const usuarios = await prisma.usuarios.findMany({
            include: { grupos: true }
        });
        console.table(usuarios.map(u => ({
            id: u.id.toString(),
            nombre: u.nombre,
            correo: u.correo,
            grupo_id: u.grupo_id ? u.grupo_id.toString() : 'NULL',
            grupo_nombre: u.grupos?.nombre || 'N/A',
            is_superadmin: u.is_superadmin
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
