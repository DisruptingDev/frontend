import { PrismaClient } from '@prisma/client';
import { parseCFDIXml } from '../lib/services/cfdiParser.js';

const p = new PrismaClient();

async function main() {
  const c = await p.comprobantes.findFirst({
    where: { xml_timbrado: { not: null } }
  });

  console.log('UUID en tabla:', c.uuid);
  const parsed = parseCFDIXml(c.xml_timbrado);
  console.log('UUID parseado:', parsed.uuid || c.uuid);
  console.log('Fecha:', parsed.fecha);
  console.log('Emisor:', parsed.rfc_emisor, parsed.nombre_emisor);
  console.log('Receptor:', parsed.rfc_receptor, parsed.nombre_receptor);
  console.log('Subtotal:', parsed.subtotal, 'IVA 16%:', parsed.iva_16, 'Total:', parsed.total);
}

main().catch(console.error).finally(() => process.exit(0));
