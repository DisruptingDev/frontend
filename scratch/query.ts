import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const perms = await prisma.permisos.findMany({
    where: {
      clave: { in: ['ver_emisores', 'editar_emisores', 'ver_roles', 'invitar_usuarios'] }
    }
  });
  console.log('Permisos:', perms);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
