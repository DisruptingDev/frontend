import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import JSZip from 'jszip';
import { parseCFDIXml } from '@/lib/services/cfdiParser';

export async function POST(request) {
  try {
    const body = await request.json();
    const { id_solicitud, xmls, zipBase64, rfc } = body;

    const targetRfc = (rfc || '').toUpperCase().trim();
    let listaXMLs = [];

    // Caso A: Si enviaron id_solicitud, obtener el paquete ZIP de la BD
    if (id_solicitud) {
      const sol = await prisma.sat_solicitudes_descarga.findUnique({
        where: { id_solicitud },
      });
      if (sol?.paquete_zip_base64) {
        const zip = new JSZip();
        const zipContent = await zip.loadAsync(sol.paquete_zip_base64, { base64: true });
        for (const [filename, fileObj] of Object.entries(zipContent.files)) {
          if (!fileObj.dir && filename.toLowerCase().endsWith('.xml')) {
            const content = await fileObj.async('text');
            listaXMLs.push({ filename, content });
          }
        }
      }
    }

    // Caso B: Si enviaron zipBase64 directo
    if (listaXMLs.length === 0 && zipBase64) {
      const zip = new JSZip();
      const rawBase64 = zipBase64.includes(',') ? zipBase64.split(',')[1] : zipBase64;
      const zipContent = await zip.loadAsync(rawBase64, { base64: true });
      for (const [filename, fileObj] of Object.entries(zipContent.files)) {
        if (!fileObj.dir && filename.toLowerCase().endsWith('.xml')) {
          const content = await fileObj.async('text');
          listaXMLs.push({ filename, content });
        }
      }
    }

    // Caso C: Si enviaron array de XMLs
    if (listaXMLs.length === 0 && Array.isArray(xmls)) {
      listaXMLs = xmls.map((x, idx) => ({
        filename: x.filename || `comprobante_${idx + 1}.xml`,
        content: x.content || x.xml || (typeof x === 'string' ? x : ''),
      }));
    }

    if (listaXMLs.length === 0) {
      return NextResponse.json({
        ok: false,
        error: 'No se encontraron archivos XML válidos para procesar.',
        importadas: 0,
        detalles: [],
      }, { status: 400 });
    }

    let importadas = 0;
    let omitidas = 0;
    const detalles = [];

    for (const item of listaXMLs) {
      if (!item.content || !item.content.includes('<')) {
        detalles.push({
          filename: item.filename,
          estado: 'error',
          mensaje: 'Contenido XML vacío o corrupto.',
        });
        continue;
      }

      try {
        const parsed = parseCFDIXml(item.content);
        if (!parsed.uuid) {
          detalles.push({
            filename: item.filename,
            estado: 'error',
            mensaje: 'No se encontró el UUID fiscal en el XML.',
          });
          continue;
        }

        // Si se especificó un RFC objetivo, verificar que sea el receptor o registrar la factura
        const rfcReceptor = (parsed.rfc_receptor || targetRfc || '').toUpperCase().trim();
        if (!rfcReceptor) {
          detalles.push({
            filename: item.filename,
            estado: 'error',
            mensaje: 'No se pudo determinar el RFC receptor del CFDI.',
          });
          continue;
        }

        // Upsert en la tabla especializada de facturas recibidas de contabilidad
        await prisma.contabilidad_facturas_recibidas.upsert({
          where: { uuid: parsed.uuid },
          update: {
            nombre_receptor: parsed.nombre_receptor,
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
            estatus: parsed.estatus || 'Vigente',
            xml_content: parsed.xml_content,
            updated_at: new Date(),
          },
          create: {
            uuid: parsed.uuid,
            rfc_receptor: rfcReceptor,
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
            estatus: parsed.estatus || 'Vigente',
            xml_content: parsed.xml_content,
            created_at: new Date(),
            updated_at: new Date(),
          },
        });

        importadas++;
        detalles.push({
          filename: item.filename,
          uuid: parsed.uuid,
          emisor: parsed.rfc_emisor,
          total: parsed.total,
          estado: 'exito',
          mensaje: `Guardada para cálculos contables (${parsed.uuid})`,
        });
      } catch (errXml) {
        console.warn(`[importar-recibidas XML Error ${item.filename}]:`, errXml.message);
        detalles.push({
          filename: item.filename,
          estado: 'error',
          mensaje: errXml.message || 'Error al procesar XML',
        });
        omitidas++;
      }
    }

    return NextResponse.json({
      ok: true,
      mensaje: `Se importaron ${importadas} factura(s) a contabilidad.`,
      importadas,
      omitidas,
      total: listaXMLs.length,
      detalles,
    }, { status: 200 });
  } catch (error) {
    console.error('[API importar-recibidas General Error]:', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
}
