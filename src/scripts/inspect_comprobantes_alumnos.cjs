const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== COMPROBANTES Y SUS ALUMNOS / PAGOS ===");
        const pagos = await prisma.pagoAlumno.findMany({
            include: { Alumno: true, comprobantes: true, CargoAlumno: true }
        });
        console.table(pagos.map(p => ({
            pago_id: p.id.toString(),
            alumno_id: p.alumno_id.toString(),
            alumno_nombre: `${p.Alumno?.nombre} ${p.Alumno?.apellido_paterno}`,
            alumno_grupo: p.Alumno?.grupo_id ? p.Alumno.grupo_id.toString() : 'NULL',
            pago_grupo: p.grupo_id ? p.grupo_id.toString() : 'NULL',
            cargo_id: p.cargo_id ? p.cargo_id.toString() : 'NULL',
            comprobante_id: p.comprobante_id ? p.comprobante_id.toString() : 'NULL',
            comprobante_grupo: p.comprobantes?.grupo_id ? p.comprobantes.grupo_id.toString() : 'NULL',
            comprobante_serie_folio: p.comprobantes ? `${p.comprobantes.serie}-${p.comprobantes.folio}` : 'N/A'
        })));

        console.log("\n=== COMPROBANTES RECIENTES ===");
        const compRecientes = await prisma.comprobantes.findMany({
            orderBy: { id: 'desc' },
            take: 15,
            include: { emisors: true, receptors: true }
        });
        console.table(compRecientes.map(c => ({
            id: c.id.toString(),
            serie_folio: `${c.serie}-${c.folio}`,
            grupo_id: c.grupo_id ? c.grupo_id.toString() : 'NULL',
            emisor: c.emisors?.nombre,
            emisor_grupo: c.emisors?.grupo_id ? c.emisors.grupo_id.toString() : 'NULL',
            receptor: c.receptors?.nombre,
            receptor_grupo: c.receptors?.grupo_id ? c.receptors.grupo_id.toString() : 'NULL',
            total: c.total
        })));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
