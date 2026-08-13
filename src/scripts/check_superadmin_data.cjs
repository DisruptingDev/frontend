const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== COMPROBANTES (Facturas y Pre-facturas) ===");
        const comp = await prisma.comprobantes.findMany({
            select: { id: true, serie: true, folio: true, estatus: true, grupo_id: true, emisor_id: true, receptor_id: true, total: true, emisors: true }
        });
        console.log("Total Comprobantes:", comp.length);
        console.table(comp.slice(0, 15).map(c => ({
            id: c.id.toString(),
            serie: c.serie,
            folio: c.folio,
            estatus: c.estatus,
            grupo_id: c.grupo_id ? c.grupo_id.toString() : 'NULL',
            emisor_id: c.emisor_id ? c.emisor_id.toString() : 'NULL',
            emisor_nombre: c.emisors?.nombre || 'N/A',
            total: Number(c.total)
        })));

        console.log("\n=== ALUMNOS ===");
        const alumnos = await prisma.alumno.findMany({
            select: { id: true, matricula: true, nombre: true, apellido_paterno: true, grupo_id: true, emisor_id: true }
        });
        console.table(alumnos.map(a => ({
            id: a.id.toString(),
            matricula: a.matricula,
            nombre: `${a.nombre} ${a.apellido_paterno}`,
            grupo_id: a.grupo_id ? a.grupo_id.toString() : 'NULL',
            emisor_id: a.emisor_id ? a.emisor_id.toString() : 'NULL'
        })));

        console.log("\n=== CARGOS ALUMNO (Fichas) ===");
        const cargos = await prisma.cargoAlumno.findMany({
            select: { id: true, folio_ficha: true, alumno_id: true, grupo_id: true, estatus: true, monto_total: true }
        });
        console.table(cargos.map(c => ({
            id: c.id.toString(),
            folio: c.folio_ficha,
            alumno_id: c.alumno_id ? c.alumno_id.toString() : 'NULL',
            grupo_id: c.grupo_id ? c.grupo_id.toString() : 'NULL',
            estatus: c.estatus,
            monto: Number(c.monto_total)
        })));

        console.log("\n=== EMISORES ===");
        const emisores = await prisma.emisors.findMany({
            select: { id: true, rfc: true, nombre: true, grupo_id: true }
        });
        console.table(emisores.map(e => ({
            id: e.id.toString(),
            rfc: e.rfc,
            nombre: e.nombre,
            grupo_id: e.grupo_id ? e.grupo_id.toString() : 'NULL'
        })));

    } catch (e) {
        console.error("Error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
