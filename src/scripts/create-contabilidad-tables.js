import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function initTable() {
  await p.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS public.contabilidad_facturas_recibidas (
      id BIGSERIAL PRIMARY KEY,
      uuid VARCHAR(36) NOT NULL UNIQUE,
      rfc_receptor VARCHAR(13) NOT NULL,
      nombre_receptor VARCHAR(255),
      rfc_emisor VARCHAR(13) NOT NULL,
      nombre_emisor VARCHAR(255),
      fecha TIMESTAMP(3) NOT NULL,
      fecha_timbrado TIMESTAMP(3),
      serie VARCHAR(50),
      folio VARCHAR(50),
      tipo_comprobante VARCHAR(10) DEFAULT 'I',
      metodo_pago VARCHAR(10),
      forma_pago VARCHAR(10),
      moneda VARCHAR(10) DEFAULT 'MXN',
      tipo_cambio NUMERIC(14, 4) DEFAULT 1.0,
      subtotal NUMERIC(16, 2) DEFAULT 0,
      descuento NUMERIC(16, 2) DEFAULT 0,
      total NUMERIC(16, 2) NOT NULL,
      base_16 NUMERIC(16, 2) DEFAULT 0,
      iva_16 NUMERIC(16, 2) DEFAULT 0,
      base_8 NUMERIC(16, 2) DEFAULT 0,
      iva_8 NUMERIC(16, 2) DEFAULT 0,
      base_0 NUMERIC(16, 2) DEFAULT 0,
      base_exento NUMERIC(16, 2) DEFAULT 0,
      iva_retenido NUMERIC(16, 2) DEFAULT 0,
      isr_retenido NUMERIC(16, 2) DEFAULT 0,
      ieps NUMERIC(16, 2) DEFAULT 0,
      es_deducible BOOLEAN DEFAULT TRUE,
      estatus VARCHAR(20) DEFAULT 'Vigente',
      xml_content TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await p.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_contab_rec_rfc_fecha ON public.contabilidad_facturas_recibidas(rfc_receptor, fecha)
  `);

  await p.$executeRawUnsafe(`
    CREATE INDEX IF NOT EXISTS idx_contab_rec_emisor ON public.contabilidad_facturas_recibidas(rfc_emisor)
  `);

  console.log('Tabla contabilidad_facturas_recibidas creada exitosamente!');
}

initTable()
  .catch(console.error)
  .finally(() => p.$disconnect());
