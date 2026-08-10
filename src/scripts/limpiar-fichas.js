const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Iniciando limpieza de fichas de pago (CargoAlumno)...');
    
    // 1. Limpiar pagos asociados a fichas si existen
    const totalPagos = await prisma.pagoAlumno.deleteMany({});
    console.log(`- Se eliminaron ${totalPagos.count} registros de PagoAlumno.`);

    // 2. Limpiar comprobantes pre-factura generados automáticamente si existen
    const totalComprobantes = await prisma.comprobantes.deleteMany({});
    console.log(`- Se eliminaron ${totalComprobantes.count} registros de pre-facturas / Comprobantes.`);

    // 3. Limpiar todas las fichas de pago (CargoAlumno)
    const totalCargos = await prisma.cargoAlumno.deleteMany({});
    console.log(`- Se eliminaron ${totalCargos.count} fichas de pago (CargoAlumno).`);

    console.log('✅ Limpieza completada exitosamente. Base de datos lista para empezar desde cero.');
}

main()
    .catch((e) => {
        console.error('Error durante la limpieza:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
