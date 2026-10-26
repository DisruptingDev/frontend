import { PrismaClient } from '@prisma/client';

const databases = ['facturacion_test', 'Facturacion', 'facturacion_prod'];

async function initTable() {
  for (const db of databases) {
    console.log(`Aplicando tabla en BD: ${db}...`);
    const p = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://Facturacion:qRHCZyCj0jbbKundGR3Ny13KsM646UQhkE5efiC4w2gScGAxbY@31.220.31.152:5432/${db}?schema=public`
        }
      }
    });

    try {
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

      // Secciones y permisos (solo si la tabla seccion_permisos existe en esa BD)
      await p.$executeRawUnsafe(`
        DO $$
        DECLARE
            v_seccion_id BIGINT;
        BEGIN
            IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'seccion_permisos') THEN
                SELECT id INTO v_seccion_id FROM public.seccion_permisos WHERE clave = 'CONTABILIDAD_FISCAL';
                IF v_seccion_id IS NULL THEN
                    INSERT INTO public.seccion_permisos (clave, descripcion, created_at, updated_at)
                    VALUES ('CONTABILIDAD_FISCAL', 'Módulo de Contabilidad Fiscal, IVA y DIOT', NOW(), NOW())
                    RETURNING id INTO v_seccion_id;
                END IF;

                INSERT INTO public.permisos (clave, descripcion, seccion_id, created_at, updated_at)
                VALUES 
                    ('CONTABILIDAD_ACCESO', 'Acceso general al módulo de Contabilidad Fiscal e IVA', v_seccion_id, NOW(), NOW()),
                    ('CONTABILIDAD_CALCULO_IVA', 'Consultar cálculo de IVA (Trasladado vs Acreditable, a Favor o a Pagar)', v_seccion_id, NOW(), NOW()),
                    ('CONTABILIDAD_DIOT_GENERAR', 'Generar y exportar la declaración informativa DIOT (.txt oficial SAT)', v_seccion_id, NOW(), NOW()),
                    ('CONTABILIDAD_IMPORTAR_XML', 'Sincronizar y procesar facturas recibidas de gastos desde el SAT', v_seccion_id, NOW(), NOW())
                ON CONFLICT (clave) DO NOTHING;
            END IF;
        END $$;
      `);

      console.log(`[OK] Tabla y permisos listos en: ${db}`);
    } catch (err) {
      console.error(`[Error] en ${db}:`, err.message);
    } finally {
      await p.$disconnect();
    }
  }
}

initTable()
  .catch(console.error);
