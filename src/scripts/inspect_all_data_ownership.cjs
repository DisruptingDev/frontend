const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== INSPECCIÓN COMPLETA DE ALUMNOS, CARGOS, FACTURAS Y PAGOS ===");
        
        const alumnos = await prisma.alumno.findMany({
            include: {
                receptors: true,
                CargoAlumno: true,
                PagoAlumno: true
            }
        });

        alumnos.forEach(a => {
            console.log(`\n--------------------------------------------------`);
            console.log(`ALUMNO ID: ${a.id}, Matrícula: ${a.matricula}`);
            console.log(`Nombre: ${a.nombre} ${a.apellido_paterno} ${a.apellido_materno || ''}`);
            console.log(`Estatus: ${a.estatus}, Requiere Factura: ${a.requiere_factura}`);
            console.log(`Alumno Grupo ID: ${a.grupo_id}, Receptor ID: ${a.receptor_id}, Receptor Grupo ID: ${a.receptors?.grupo_id}`);
            console.log(`Cargos (${a.CargoAlumno.length}):`);
            a.CargoAlumno.forEach(c => {
                console.log(`  - Cargo ID: ${c.id}, Código: ${c.codigo_ficha}, Grupo: ${c.grupo_id}, Estatus: ${c.estatus}, Monto Total: ${c.monto_total}, Pendiente: ${c.monto_pendiente}`);
            });
            console.log(`Pagos (${a.PagoAlumno.length}):`);
            a.PagoAlumno.forEach(p => {
                console.log(`  - Pago ID: ${p.id}, Cargo ID: ${p.cargo_id}, Comprobante ID: ${p.comprobante_id}, Grupo: ${p.grupo_id}, Monto: ${p.monto}`);
            });
        });

        console.log("\n=== PRE-FACTURAS Y FACTURAS (COMPROBANTES) ===");
        const comprobantes = await prisma.comprobantes.findMany({
            include: { receptors: true, emisors: true }
        });
        comprobantes.forEach(c => {
            console.log(`Comprobante ID: ${c.id}, Serie-Folio: ${c.serie}-${c.folio}, Estatus: ${c.estatus}, Grupo ID: ${c.grupo_id}, Emisor: ${c.emisors?.nombre} (Grupo ${c.emisors?.grupo_id}), Receptor: ${c.receptors?.nombre} (Grupo ${c.receptors?.grupo_id})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
