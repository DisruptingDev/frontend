import { PrismaClient } from '@prisma/client';

const databases = ['Facturacion', 'facturacion_prod'];

async function createTables() {
  for (const db of databases) {
    const p = new PrismaClient({
      datasources: {
        db: {
          url: `postgresql://Facturacion:qRHCZyCj0jbbKundGR3Ny13KsM646UQhkE5efiC4w2gScGAxbY@31.220.31.152:5432/${db}`
        }
      }
    });

    try {
      console.log(`Creating tables in database: ${db}...`);

      await p.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.sat_empresas_fiel (
          id BIGSERIAL PRIMARY KEY,
          rfc VARCHAR(13) NOT NULL UNIQUE,
          razon_social VARCHAR(255),
          cer_base64 TEXT NOT NULL,
          key_base64 TEXT NOT NULL,
          password_fiel TEXT NOT NULL,
          no_certificado VARCHAR(50),
          vigente_hasta TIMESTAMP(3),
          created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      await p.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS public.sat_solicitudes_descarga (
          id BIGSERIAL PRIMARY KEY,
          id_solicitud VARCHAR(100) NOT NULL UNIQUE,
          rfc VARCHAR(13) NOT NULL,
          tipo_solicitud VARCHAR(20) NOT NULL,
          tipo_descarga VARCHAR(20) NOT NULL,
          fecha_inicio VARCHAR(30) NOT NULL,
          fecha_fin VARCHAR(30) NOT NULL,
          estado_solicitud VARCHAR(20),
          codigo_estatus VARCHAR(20),
          estado_texto VARCHAR(50),
          numero_cfdis INTEGER DEFAULT 0,
          mensaje TEXT,
          ids_paquetes JSONB,
          paquete_zip_base64 TEXT,
          created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `);

      // Copiar la FIEL de IDEA.LY a las otras bases de datos para que esté sincronizada
      await p.$executeRawUnsafe(`
        INSERT INTO public.sat_empresas_fiel (rfc, razon_social, cer_base64, key_base64, password_fiel, no_certificado, vigente_hasta)
        VALUES (
          'IDE250327V84',
          'IDEA.LY SAS DE CV',
          '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',
          'CASA488733',
          '00001000000722516515',
          '2030-02-17 18:42:33'
        )
        ON CONFLICT (rfc) DO NOTHING;
      `);

      // Copiar las solicitudes existentes
      await p.$executeRawUnsafe(`
        INSERT INTO public.sat_solicitudes_descarga (id_solicitud, rfc, tipo_solicitud, tipo_descarga, fecha_inicio, fecha_fin, estado_solicitud, codigo_estatus, estado_texto, numero_cfdis, mensaje)
        VALUES 
        ('61bd2994-6faf-4fd2-950b-09cb772a85f7', 'IDE250327V84', 'emitidos', 'multicomprobantes', '2026-06-01', '2026-10-21', '3', '5000', 'Terminada', 0, 'Solicitud terminada.'),
        ('54dfb065-b83d-4594-890e-2a1ca3d6f66f', 'IDE250327V84', 'emitidos', 'multicomprobantes', '2026-06-01', '2026-10-21', '3', '5000', 'Terminada', 0, 'Solicitud terminada.'),
        ('e898e4d4-a82d-4eaa-9064-8947e0e520d3', 'IDE250327V84', 'emitidos', 'multicomprobantes', '2026-06-01', '2026-10-20', '1', '5000', 'Aceptada', 0, 'Solicitud Aceptada')
        ON CONFLICT (id_solicitud) DO NOTHING;
      `);

      console.log(`Success on ${db}!`);
      await p.$disconnect();
    } catch (e) {
      console.error(`Error on ${db}:`, e.message);
    }
  }
}
createTables();
