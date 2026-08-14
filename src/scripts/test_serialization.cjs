const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (obj instanceof Date) {
        return isNaN(obj.getTime()) ? null : obj.toISOString();
    }
    if (typeof obj === 'object') {
        if (obj.d && Array.isArray(obj.d) && obj.s !== undefined) {
            return obj.toString();
        }
        if (typeof obj.toNumber === 'function') {
            return obj.toString();
        }
        if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigIntsAndDecimals(value)])
        );
    }
    return obj;
}

async function checkDb() {
    try {
        const alumnos = await prisma.alumno.findMany({
            where: { grupo_id: 2n },
            include: { receptors: true }
        });
        
        const alumnosFormatted = alumnos.map(a => ({
            ...a,
            receptor: a.receptors || null
        }));

        const serialized = serializeBigIntsAndDecimals(alumnosFormatted);
        console.log(JSON.stringify(serialized, null, 2));
    } catch (e) {
        console.error("Prisma error:", e.message);
    } finally {
        await prisma.$disconnect();
    }
}
checkDb();
