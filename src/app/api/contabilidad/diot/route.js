import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Generador del archivo oficial DIOT (Declaración Informativa de Operaciones con Terceros)
 * Estructura de tuberías (|) del SAT:
 * Campo 1: Tipo de tercero (04 = Proveedor Nacional, 05 = Proveedor Extranjero, 15 = Global)
 * Campo 2: Tipo de operación (03 = Prestación de Servicios Profesionales, 06 = Arrendamiento, 85 = Otros)
 * Campo 3: RFC del Proveedor
 * Campo 4: Número de ID Fiscal (extranjeros)
 * Campo 5: Nombre del extranjero
 * Campo 6: País de residencia (extranjeros)
 * Campo 7: Nacionalidad
 * Campo 8: Valor de los actos o actividades pagados a la tasa del 16% de IVA
 * Campo 9: Valor de los actos o actividades pagados a la tasa del 16% de IVA no acreditables
 * Campo 10: Valor de los actos o actividades pagados a la tasa del 8% de IVA (estímulo región fronteriza)
 * Campo 11: Valor de los actos o actividades pagados a la tasa del 8% de IVA no acreditables
 * Campo 12: Valor de los actos de importación de bienes y servicios al 16%
 * Campo 13: Valor de los actos de importación de bienes y servicios al 16% no acreditables
 * Campo 14: Valor de los actos de importación exentos
 * Campo 15: Valor de los actos o actividades pagados a la tasa del 0% de IVA
 * Campo 16: Valor de los actos o actividades pagados por los que no se pagará el IVA (Exentos)
 * Campo 17: IVA Retenido por el contribuyente
 * Campo 18: IVA correspondiente a las devoluciones, descuentos y bonificaciones sobre compras
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rfc = searchParams.get('rfc') || '';
  const fechaInicio = searchParams.get('fechaInicio') || searchParams.get('fecha_inicio') || '';
  const fechaFin = searchParams.get('fechaFin') || searchParams.get('fecha_fin') || '';
  const format = searchParams.get('format') || 'json'; // 'json' o 'txt'

  if (!rfc) {
    return NextResponse.json({ error: 'Debe especificar el RFC de la empresa.' }, { status: 400 });
  }

  try {
    const fIniDate = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fFinDate = fechaFin ? new Date(`${fechaFin}T23:59:59`) : new Date();

    const facturas = await prisma.contabilidad_facturas_recibidas.findMany({
      where: {
        rfc_receptor: rfc.toUpperCase().trim(),
        fecha: {
          gte: fIniDate,
          lte: fFinDate,
        },
        estatus: 'Vigente',
      },
      orderBy: { rfc_emisor: 'asc' },
    });

    // Agrupar por RFC Emisor (Proveedor)
    const agrupado = {};
    for (const f of facturas) {
      const rfcProv = (f.rfc_emisor || '').toUpperCase().trim();
      if (!rfcProv) continue;

      if (!agrupado[rfcProv]) {
        agrupado[rfcProv] = {
          rfc: rfcProv,
          nombre: f.nombre_emisor || rfcProv,
          total_facturas: 0,
          tipo_tercero: rfcProv.length === 12 || rfcProv.length === 13 ? '04' : '05',
          tipo_operacion: '85', // 85 = Otros (predeterminado)
          base_16: 0,
          iva_16: 0,
          base_8: 0,
          iva_8: 0,
          base_0: 0,
          base_exento: 0,
          iva_retenido: 0,
          isr_retenido: 0,
          total: 0,
        };
      }

      agrupado[rfcProv].total_facturas += 1;
      agrupado[rfcProv].base_16 += parseFloat(f.base_16 || 0);
      agrupado[rfcProv].iva_16 += parseFloat(f.iva_16 || 0);
      agrupado[rfcProv].base_8 += parseFloat(f.base_8 || 0);
      agrupado[rfcProv].iva_8 += parseFloat(f.iva_8 || 0);
      agrupado[rfcProv].base_0 += parseFloat(f.base_0 || 0);
      agrupado[rfcProv].base_exento += parseFloat(f.base_exento || 0);
      agrupado[rfcProv].iva_retenido += parseFloat(f.iva_retenido || 0);
      agrupado[rfcProv].isr_retenido += parseFloat(f.isr_retenido || 0);
      agrupado[rfcProv].total += parseFloat(f.total || 0);
    }

    const proveedores = Object.values(agrupado).map((p) => ({
      ...p,
      base_16: Math.round(p.base_16),
      iva_16: Math.round(p.iva_16),
      base_8: Math.round(p.base_8),
      iva_8: Math.round(p.iva_8),
      base_0: Math.round(p.base_0),
      base_exento: Math.round(p.base_exento),
      iva_retenido: Math.round(p.iva_retenido),
      isr_retenido: Math.round(p.isr_retenido),
      total: Math.round(p.total),
    }));

    // Si solicita el archivo .txt oficial para el SAT
    if (format === 'txt') {
      const lineas = proveedores.map((p) => {
        // En la DIOT del SAT los montos van en enteros redondeados
        const col1_tipoTercero = p.tipo_tercero;
        const col2_tipoOperacion = p.tipo_operacion;
        const col3_rfc = p.rfc;
        const col4_idFiscal = '';
        const col5_nombreExtranjero = '';
        const col6_pais = '';
        const col7_nacionalidad = '';
        const col8_base16 = p.base_16 > 0 ? String(p.base_16) : '';
        const col9_base16NoAcred = '';
        const col10_base8 = p.base_8 > 0 ? String(p.base_8) : '';
        const col11_base8NoAcred = '';
        const col12_import16 = '';
        const col13_import16NoAcred = '';
        const col14_importExenta = '';
        const col15_base0 = p.base_0 > 0 ? String(p.base_0) : '';
        const col16_baseExento = p.base_exento > 0 ? String(p.base_exento) : '';
        const col17_ivaRetenido = p.iva_retenido > 0 ? String(p.iva_retenido) : '';
        const col18_devoluciones = '';

        return [
          col1_tipoTercero,
          col2_tipoOperacion,
          col3_rfc,
          col4_idFiscal,
          col5_nombreExtranjero,
          col6_pais,
          col7_nacionalidad,
          col8_base16,
          col9_base16NoAcred,
          col10_base8,
          col11_base8NoAcred,
          col12_import16,
          col13_import16NoAcred,
          col14_importExenta,
          col15_base0,
          col16_baseExento,
          col17_ivaRetenido,
          col18_devoluciones,
        ].join('|') + '|';
      });

      const txtContent = lineas.join('\r\n');
      return new Response(txtContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="DIOT_${rfc}_${fechaInicio}_${fechaFin}.txt"`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      rfc,
      periodo: { fechaInicio, fechaFin },
      total_proveedores: proveedores.length,
      proveedores,
    }, { status: 200 });
  } catch (error) {
    console.error('[API DIOT Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
