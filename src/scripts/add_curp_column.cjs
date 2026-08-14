const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addCurpColumn() {
    try {
        console.log("Adding curp column to Alumno table if not exists...");
        await prisma.$executeRawUnsafe(`ALTER TABLE "Alumno" ADD COLUMN IF NOT EXISTS "curp" TEXT;`);
        console.log("Column curp added successfully.");
    } catch (e) {
        console.error("Error adding curp column:", e);
    } finally {
        await prisma.$disconnect();
    }
}

addCurpColumn();
