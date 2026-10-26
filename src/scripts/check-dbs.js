import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();
async function main() {
  const dbs = await p.$queryRawUnsafe('SELECT datname FROM pg_database WHERE datistemplate = false;');
  console.log('DATABASES:', dbs);
  const curr = await p.$queryRawUnsafe('SELECT current_database(), current_schema();');
  console.log('CURRENT:', curr);
}
main().catch(console.error).finally(() => process.exit(0));
