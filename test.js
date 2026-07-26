import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const uuid = 'test-uuid';
        const relaciones = await prisma.docto_relacionados.findMany({
            where: {
                id_documento: uuid
            },
            include: {
                Pago: {
                    include: {
                        Pagos: {
                            include: {
                                complementos: {
                                    include: {
                                        comprobantes: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });
        console.log(relaciones);
    } catch (err) {
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

main();
