require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testRegular(id) {
  const comprobante = await prisma.comprobantes.findUnique({
    where: { id: BigInt(id) },
    include: {
      emisors: true,
      receptors: true,
      Conceptos: {
        include: {
          Concepto: {
            include: {
              impuestos: {
                include: {
                  traslados: true,
                  retencions: true
                }
              }
            }
          }
        }
      }
    }
  });

  const extraerClaveSAT = (str, def = '') => {
    if (!str) return def;
    const clean = String(str).trim();
    return clean.split(' ')[0] || clean.substring(0, 4) || def;
  };

  const conceptosHeader = comprobante.Conceptos?.[0];
  const conceptosList = conceptosHeader?.Concepto || [];

  let itemsLista = conceptosList.map(c => {
    const retenciones = [];
    const traslados = [];
    if (c.impuestos && c.impuestos.length > 0) {
      c.impuestos.forEach(imp => {
        if (imp.retencions) {
          imp.retencions.forEach(ret => {
            retenciones.push({
              Base: Number(ret.base || c.importe || 0),
              ImpuestoCatalogoID: ret.impuesto_catalogo_id || 1,
              ImpuestoClave: ret.impuesto_clave || '001',
              TasaCatalogoID: ret.tasa_catalogo_id || 1,
              TasaOCuota: Number(ret.tasa_o_cuota || 0),
              Importe: Number(ret.importe || 0),
              TipoFactor: ret.tipo_factor || 'Tasa',
              ImpuestoCatalogo: { Impuesto: 'ISR', Tipo: 'Federal' }
            });
          });
        }
        if (imp.traslados) {
          imp.traslados.forEach(tras => {
            traslados.push({
              Base: Number(tras.base || c.importe || 0),
              ImpuestoCatalogoID: tras.impuesto_catalogo_id || 2,
              ImpuestoClave: tras.impuesto_clave || '002',
              TasaCatalogoID: tras.tasa_catalogo_id || (tras.tipo_factor === 'Exento' ? 4 : 21),
              TasaOCuota: Number(tras.tasa_o_cuota || 0),
              Importe: Number(tras.importe || 0),
              Tipo: tras.tipo_factor || 'Tasa',
              TipoFactor: tras.tipo_factor || 'Tasa',
              ImpuestoCatalogo: { Impuesto: 'IVA', Tipo: 'Federal' }
            });
          });
        }
      });
    }

    return {
      ID: c.id?.toString(),
      Cantidad: Number(c.cantidad || 1),
      ClaveProdServ: c.clave_prod_serv || '',
      ClaveUnidad: c.clave_unidad || 'E48',
      Unidad: c.unidad || 'Servicio',
      Descripcion: c.descripcion || '',
      ValorUnitario: Number(c.valor_unitario || c.importe || comprobante.total || 0),
      Importe: Number(c.importe || comprobante.total || 0),
      Descuento: Number(c.descuento || 0),
      ObjetoImpuesto: c.objeto_imp || '02',
      Impuestos: { Retenciones: retenciones, Traslados: traslados }
    };
  });

  const responseData = {
    factura: {
      ID: comprobante.id.toString(),
      EmisorID: comprobante.emisors?.id?.toString(),
      Emisor: {
        Rfc: comprobante.emisors?.rfc || '',
        Nombre: comprobante.emisors?.nombre || '',
        RegimenFiscal: extraerClaveSAT(comprobante.emisors?.regimen_fiscal, '601'),
        LugarExpedicion: comprobante.emisors?.lugar_expedicion || '01000',
        Calle: comprobante.emisors?.calle || '',
        NumeroExterior: comprobante.emisors?.numero_exterior || '',
        NumeroInterior: comprobante.emisors?.numero_interior || '',
        Colonia: comprobante.emisors?.colonia || '',
        Municipio: comprobante.emisors?.municipio || '',
        Estado: comprobante.emisors?.estado || ''
      },
      ReceptorID: comprobante.receptors?.id?.toString(),
      Receptor: {
        Rfc: comprobante.receptors?.rfc || 'XAXX010101000',
        Nombre: comprobante.receptors?.nombre || 'PUBLICO EN GENERAL',
        DomicilioFiscalReceptor: comprobante.receptors?.domicilio_fiscal_receptor || comprobante.emisors?.lugar_expedicion || '01000',
        RegimenFiscalReceptor: extraerClaveSAT(comprobante.receptors?.regimen_fiscal_receptor, '616'),
        LugarExpedicion: comprobante.emisors?.lugar_expedicion || '01000'
      },
      Serie: comprobante.serie || 'F',
      Folio: comprobante.folio || comprobante.id.toString(),
      Fecha: comprobante.fecha ? new Date(comprobante.fecha).toISOString() : new Date().toISOString(),
      TipoDeComprobante: comprobante.tipo_comprobante || 'I',
      MetodoPago: extraerClaveSAT(comprobante.metodo_pago, 'PUE'),
      FormaPago: extraerClaveSAT(comprobante.forma_pago, '03'),
      UsoCFDI: extraerClaveSAT(comprobante.uso_cfdi || comprobante.receptors?.uso_cfdi, 'S01'),
      Conceptos: {
        ListaConceptos: itemsLista
      }
    }
  };

  console.log('=== TEST RESULT FOR REGULAR FACTURA ID ' + id + ' ===');
  console.log('Emisor:', responseData.factura.Emisor.Nombre, responseData.factura.Emisor.Rfc);
  console.log('Receptor:', responseData.factura.Receptor.Nombre, responseData.factura.Receptor.Rfc);
  console.log('Conceptos:', responseData.factura.Conceptos.ListaConceptos);
}

testRegular('1277').then(() => prisma.$disconnect()).catch(console.error);
