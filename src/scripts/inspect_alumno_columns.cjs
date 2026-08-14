const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspectColumns() {
    try {
        const columns = await prisma.$queryRaw`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'Alumno' OR table_name = 'alumno';
        `;
        console.log("Columns of Alumno table in Postgres:", columns);
    } catch (e) {
        console.error("Error inspecting columns:", e);
    } finally {
        await prisma.$disconnect();
    }
}

inspectColumns();
