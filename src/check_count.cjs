const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.programaAcademico.count().then(c => console.log('Count:', c)).finally(() => p.$disconnect());
