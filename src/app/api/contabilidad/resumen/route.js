import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import JSZip from 'jszip';
import { parseCFDIXml } from '@/lib/services/cfdiParser';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const rfc = searchParams.get('rfc') || '';
  const fechaInicio = searchParams.get('fechaInicio') || searchParams.get('fecha_inicio') || '';
  const fechaFin = searchParams.get('fechaFin') || searchParams.get('fecha_fin') || '';

  if (!rfc) {
    return NextResponse.json({ error: 'Debe especificar el RFC de la empresa.' }, { status: 400 });
  }

  try {
    const fIniDate = fechaInicio ? new Date(`${fechaInicio}T00:00:00`) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const fFinDate = fechaFin ? new Date(`${fechaFin}T23:59:59`) : new Date();

    // 1. Obtener Facturas Recibidas (Gastos / Proveedores)
    const facturasRecibidas = await prisma.contabilidad_facturas_recibidas.findMany({
      where: {
        rfc_receptor: rfc.toUpperCase().trim(),
        fecha: {
          gte: fIniDate,
          lte: fFinDate,
        },
        estatus: 'Vigente',
      },
      orderBy: { fecha: 'desc' },
    });

    // 2. Obtener Facturas Emitidas (Ingresos de Wise)
    const emisorDb = await prisma.emisors.findFirst({
      where: { rfc: rfc.toUpperCase().trim() },
    });

    let facturasEmitidas = [];
    if (emisorDb) {
      // Filtrar comprobantes timbrados del emisor (con UUID fiscal válido ante el SAT y no cancelados)
      const comps = await prisma.comprobantes.findMany({
        where: {
          emisor_id: emisorDb.id,
          estatus: { notIn: ['Cancelado', 'cancelado', 'CANCELADO'] },
          uuid: { not: null },
        },
        include: {
          receptors: true,
        },
        orderBy: { fecha: 'desc' },
      });

      // Filtrar únicamente los timbrados reales con UUID asignado y en el rango de fechas
      facturasEmitidas = comps.filter((c) => {
        if (!c.uuid || typeof c.uuid !== 'string' || c.uuid.trim().length < 10) return false;
        if (!c.fecha) return false;
        const d = new Date(c.fecha);
        return d >= fIniDate && d <= fFinDate;
      }).map((c) => {
        let base16 = 0;
        let iva16 = 0;
        let sub = parseFloat(c.sub_total || c.sub_total_string || 0);
        let tot = parseFloat(c.total || c.total_string || 0);

        // Si tenemos el xml_timbrado, parsear para mayor exactitud
        if (c.xml_timbrado) {
          try {
            const parsed = parseCFDIXml(c.xml_timbrado);
            base16 = parsed.base_16;
            iva16 = parsed.iva_16;
            sub = parsed.subtotal || sub;
            tot = parsed.total || tot;
          } catch {}
        } else if (tot > sub) {
          iva16 = parseFloat((tot - sub).toFixed(2));
          base16 = sub;
        }

        return {
          id: c.id ? c.id.toString() : null,
          uuid: c.uuid,
          folio: c.folio || '',
          serie: c.serie || '',
          fecha: c.fecha,
          rfc_receptor: c.receptors?.rfc || '',
          nombre_receptor: c.receptors?.nombre || c.receptors?.razon_social || '',
          subtotal: sub,
          total: tot,
          iva_16: iva16,
          base_16: base16,
          tipo_comprobante: c.tipo_de_comprobante || 'I',
          metodo_pago: c.metodo_pago || 'PUE',
          estatus: c.estatus || 'Vigente',
        };
      });
    }

    // 3. Cálculos de IVA y Balance
    const totalRecibidasSubtotal = facturasRecibidas.reduce((acc, f) => acc + parseFloat(f.subtotal || 0), 0);
    const totalRecibidasTotal = facturasRecibidas.reduce((acc, f) => acc + parseFloat(f.total || 0), 0);
    const ivaAcreditable16 = facturasRecibidas
      .filter((f) => f.es_deducible)
      .reduce((acc, f) => acc + parseFloat(f.iva_16 || 0), 0);
    const ivaAcreditable8 = facturasRecibidas
      .filter((f) => f.es_deducible)
      .reduce((acc, f) => acc + parseFloat(f.iva_8 || 0), 0);
    const totalIvaAcreditable = parseFloat((ivaAcreditable16 + ivaAcreditable8).toFixed(2));

    const totalEmitidasSubtotal = facturasEmitidas.reduce((acc, f) => acc + parseFloat(f.subtotal || 0), 0);
    const totalEmitidasTotal = facturasEmitidas.reduce((acc, f) => acc + parseFloat(f.total || 0), 0);
    const totalIvaTrasladado = parseFloat(facturasEmitidas.reduce((acc, f) => acc + parseFloat(f.iva_16 || 0), 0).toFixed(2));

    const diferenciaIva = parseFloat((totalIvaTrasladado - totalIvaAcreditable).toFixed(2));
    const ivaAPagar = diferenciaIva > 0 ? diferenciaIva : 0;
    const ivaAFavor = diferenciaIva < 0 ? Math.abs(diferenciaIva) : 0;

    // Retenciones en recibidas
    const totalIvaRetenido = facturasRecibidas.reduce((acc, f) => acc + parseFloat(f.iva_retenido || 0), 0);
    const totalIsrRetenido = facturasRecibidas.reduce((acc, f) => acc + parseFloat(f.isr_retenido || 0), 0);

    return NextResponse.json({
      ok: true,
      periodo: {
        fecha_inicio: fIniDate.toISOString().split('T')[0],
        fecha_fin: fFinDate.toISOString().split('T')[0],
      },
      balance_iva: {
        iva_trasladado: totalIvaTrasladado,
        iva_acreditable: totalIvaAcreditable,
        iva_a_pagar: ivaAPagar,
        iva_a_favor: ivaAFavor,
        iva_retenido: totalIvaRetenido,
        isr_retenido: totalIsrRetenido,
        resultado_tipo: diferenciaIva > 0 ? 'A_PAGAR' : diferenciaIva < 0 ? 'A_FAVOR' : 'CERO',
      },
      totales: {
        emitidas: {
          cantidad: facturasEmitidas.length,
          subtotal: parseFloat(totalEmitidasSubtotal.toFixed(2)),
          total: parseFloat(totalEmitidasTotal.toFixed(2)),
          iva: totalIvaTrasladado,
        },
        recibidas: {
          cantidad: facturasRecibidas.length,
          subtotal: parseFloat(totalRecibidasSubtotal.toFixed(2)),
          total: parseFloat(totalRecibidasTotal.toFixed(2)),
          iva: totalIvaAcreditable,
        },
      },
      recibidas: facturasRecibidas.map((f) => ({
        ...f,
        id: f.id.toString(),
        subtotal: parseFloat(f.subtotal),
        total: parseFloat(f.total),
        iva_16: parseFloat(f.iva_16),
        base_16: parseFloat(f.base_16),
        iva_8: parseFloat(f.iva_8),
        base_8: parseFloat(f.base_8),
        base_0: parseFloat(f.base_0),
        base_exento: parseFloat(f.base_exento),
        iva_retenido: parseFloat(f.iva_retenido),
        isr_retenido: parseFloat(f.isr_retenido),
      })),
      emitidas: facturasEmitidas,
    }, { status: 200 });
  } catch (error) {
    console.error('[API Contabilidad Resumen Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST: Sincroniza e importa automáticamente los XMLs de paquetes descargados del SAT
 * para la empresa y el periodo seleccionado.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { rfc, fechaInicio, fechaFin, forzarTodos } = body;

    const targetRfc = (rfc || '').toUpperCase().trim();
    if (!targetRfc) {
      return NextResponse.json({ error: 'Debe especificar el RFC.' }, { status: 400 });
    }

    // Buscar solicitudes del SAT que tengan paquete_zip_base64 disponible
    const whereSol = {
      rfc: targetRfc,
      paquete_zip_base64: { not: null },
    };

    const solicitudes = await prisma.sat_solicitudes_descarga.findMany({
      where: whereSol,
      orderBy: { created_at: 'desc' },
      take: 20,
    });

    let importadas = 0;
    let omitidas = 0;
    const zip = new JSZip();

    for (const sol of solicitudes) {
      if (!sol.paquete_zip_base64) continue;
      try {
        const content = await zip.loadAsync(sol.paquete_zip_base64, { base64: true });
        for (const [filename, fileObj] of Object.entries(content.files)) {
          if (fileObj.dir || !filename.toLowerCase().endsWith('.xml')) continue;
          const xmlText = await fileObj.async('text');
          try {
            const parsed = parseCFDIXml(xmlText);
            // Solo registrar si es una factura RECIBIDA por la empresa (Receptor = targetRfc)
            if (parsed.rfc_receptor === targetRfc && parsed.uuid) {
              await prisma.contabilidad_facturas_recibidas.upsert({
                where: { uuid: parsed.uuid },
                update: {
                  nombre_receptor: parsed.nombre_receptor,
                  nombre_emisor: parsed.nombre_emisor,
                  subtotal: parsed.subtotal,
                  total: parsed.total,
                  base_16: parsed.base_16,
                  iva_16: parsed.iva_16,
                  base_8: parsed.base_8,
                  iva_8: parsed.iva_8,
                  base_0: parsed.base_0,
                  base_exento: parsed.base_exento,
                  iva_retenido: parsed.iva_retenido,
                  isr_retenido: parsed.isr_retenido,
                  xml_content: parsed.xml_content,
                  updated_at: new Date(),
                },
                create: {
                  uuid: parsed.uuid,
                  rfc_receptor: parsed.rfc_receptor,
                  nombre_receptor: parsed.nombre_receptor,
                  rfc_emisor: parsed.rfc_emisor,
                  nombre_emisor: parsed.nombre_emisor,
                  fecha: parsed.fecha,
                  fecha_timbrado: parsed.fecha_timbrado,
                  serie: parsed.serie,
                  folio: parsed.folio,
                  tipo_comprobante: parsed.tipo_comprobante,
                  metodo_pago: parsed.metodo_pago,
                  forma_pago: parsed.forma_pago,
                  moneda: parsed.moneda,
                  tipo_cambio: parsed.tipo_cambio,
                  subtotal: parsed.subtotal,
                  descuento: parsed.descuento,
                  total: parsed.total,
                  base_16: parsed.base_16,
                  iva_16: parsed.iva_16,
                  base_8: parsed.base_8,
                  iva_8: parsed.iva_8,
                  base_0: parsed.base_0,
                  base_exento: parsed.base_exento,
                  iva_retenido: parsed.iva_retenido,
                  isr_retenido: parsed.isr_retenido,
                  ieps: parsed.ieps,
                  es_deducible: true,
                  estatus: 'Vigente',
                  xml_content: parsed.xml_content,
                },
              });
              importadas++;
            } else {
              omitidas++;
            }
          } catch (eXml) {
            console.warn(`Error parseando XML ${filename}:`, eXml.message);
          }
        }
      } catch (eZip) {
        console.warn(`Error leyendo ZIP de solicitud ${sol.id_solicitud}:`, eZip.message);
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Sincronización completada. Se procesaron e indexaron ${importadas} factura(s) recibida(s).`,
      importadas,
      omitidas,
    }, { status: 200 });
  } catch (error) {
    console.error('[API Contabilidad Importar Error]:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
