const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    console.log("Iniciando validación de la base de datos contra el esquema de Prisma...");

    // 1. Obtener todas las columnas reales de la base de datos
    const dbColumns = await prisma.$queryRaw`
      SELECT 
        table_name, 
        column_name, 
        data_type 
      FROM 
        information_schema.columns 
      WHERE 
        table_schema = 'public'
      ORDER BY 
        table_name, 
        column_name;
    `;

    // Organizar columnas por tabla
    const dbSchema = {};
    dbColumns.forEach(c => {
      const tbl = c.table_name;
      if (!dbSchema[tbl]) dbSchema[tbl] = [];
      dbSchema[tbl].push(c.column_name);
    });

    // 2. Definir las columnas críticas mapeadas en Prisma para las tablas principales
    const expectedSchema = {
      comprobantes: [
        'id', 'version', 'serie', 'folio', 'fecha', 'sello', 'forma_pago', 'no_certificado',
        'certificado', 'condiciones_de_pago', 'sub_total', 'descripcion', 'moneda', 'tipo_cambio',
        'total', 'tipo_de_comprobante', 'exportacion', 'metodo_pago', 'lugar_expedicion', 'confirmacion',
        'emisor_id', 'receptor_id', 'grupo_id', 'uso_cfdi', 'sello_sat', 'qr_code', 'fecha_timbrado',
        'cadena_original_sat', 'estatus', 'xml_cancelacion', 'estatus_pagos', 'descuento',
        'sub_total_string', 'total_string', 'descuento_string', 'xml_timbrado', 'receptor_nomina_id'
      ],
      receptor_nomina: [
        'id', 'rfc', 'nombre', 'domicilio_fiscal_receptor', 'regimen_fiscal_receptor', 'curp',
        'num_seguridad_social', 'fecha_inicio_rel_laboral', 'antiguedad', 'tipo_contrato',
        'tipo_jornada', 'tipo_regimen', 'num_empleado', 'departamento', 'puesto', 'riesgo_puesto',
        'periodicidad_pago', 'cuenta_bancaria', 'banco', 'salario_base_cot_apor', 'salario_diario_integrado',
        'clave_ent_fed', 'sindicalizado', 'correo', 'emisor_nomina_id', 'grupo_id'
      ],
      receptor_nominas: [
        'id', 'curp', 'num_seguridad_social', 'fecha_inicio_rel_laboral', 'antiguedad',
        'tipo_contrato', 'tipo_jornada', 'tipo_regimen', 'num_empleado', 'departamento',
        'puesto', 'riesgo_puesto', 'periodicidad_pago', 'cuenta_bancaria', 'banco',
        'salario_base_cot_apor', 'salario_diario_integrado', 'clave_ent_fed', 'receptor_id',
        'emisor_nomina_id', 'nomina_id', 'rfc', 'nombre', 'domicilio_fiscal_receptor',
        'residencia_fiscal', 'num_reg_id_trib', 'regimen_fiscal_receptor', 'uso_cfdi',
        'grupo_id', 'calle', 'numero_exterior', 'numero_interior', 'colonia', 'municipio',
        'estado', 'email', 'sindicalizado', 'correo'
      ],
      emisor_nomina: [
        'id', 'registro_patronal', 'rfc_patron_origen', 'emisor_id'
      ],
      emisor_nominas: [
        'id', 'registro_patronal', 'rfc_patron_origen', 'emisor_id', 'nomina_id'
      ],
      nomina: [
        'id', 'version', 'tipo_nomina', 'fecha_pago', 'fecha_inicial_pago', 'fecha_final_pago',
        'num_dias_pagados', 'total_percepciones', 'total_deducciones', 'total_otros_pagos',
        'emisor_nomina_id', 'receptor_nomina_id', 'complemento_id'
      ],
      nominas: [
        'id', 'version', 'tipo_nomina', 'fecha_pago', 'fecha_inicial_pago', 'fecha_final_pago',
        'num_dias_pagados', 'total_percepciones', 'total_deducciones', 'total_otros_pagos',
        'emisor_nomina_id', 'receptor_nomina_id', 'complemento_id'
      ],
      Alumno: [
        'id', 'nombre', 'matricula', 'grupo_id', 'email', 'monto_mensualidad', 'carrera',
        'programa_academico_id', 'rfc', 'nombre_fiscal', 'regimen_fiscal', 'uso_cfdi',
        'domicilio_fiscal', 'estatus', 'created_at', 'updated_at'
      ],
      CargoAlumno: [
        'id', 'alumno_id', 'concepto_id', 'referencia_bancaria', 'monto_total', 'monto_pagado',
        'monto_pendiente', 'fecha_emision', 'fecha_vencimiento', 'estatus', 'grupo_id',
        'created_at', 'updated_at', 'codigo_ficha', 'detalles_items', 'producto_id'
      ],
      PagoAlumno: [
        'id', 'alumno_id', 'cargo_id', 'archivo_bancario_id', 'grupo_id', 'fecha_pago', 'monto',
        'referencia_bancaria', 'metodo_pago', 'estado_conciliacion', 'comprobante_id', 'created_at'
      ]
    };

    console.log("\n--- RESULTADO DE COMPARACIÓN ---");
    let discrepanciesFound = false;

    for (const [table, expectedColumns] of Object.entries(expectedSchema)) {
      const actualColumns = dbSchema[table];
      
      if (!actualColumns) {
        console.error(`❌ ERROR: La tabla "${table}" no existe en la base de datos.`);
        discrepanciesFound = true;
        continue;
      }

      const missing = expectedColumns.filter(col => !actualColumns.includes(col));
      
      if (missing.length > 0) {
        console.warn(`⚠️ ADVERTENCIA: A la tabla "${table}" le faltan las siguientes columnas: [ ${missing.join(', ')} ]`);
        discrepanciesFound = true;
      } else {
        console.log(`✅ OK: Tabla "${table}" tiene todas las columnas requeridas.`);
      }
    }

    if (!discrepanciesFound) {
      console.log("\n🎉 EXCELENTE: Todas las tablas críticas están sincronizadas correctamente con el esquema.");
    } else {
      console.log("\n⚠️ ATENCIÓN: Se encontraron discrepancias. Debes corregirlas antes de pasar a producción.");
    }

  } catch (error) {
    console.error("Error validando el esquema:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
