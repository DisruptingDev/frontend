import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { serializeBigIntsAndDecimals } from '@/lib/services/servicioFacturacion';

export async function GET(request, { params }) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json({ error: 'ID no proporcionado' }, { status: 400 });
        }

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

        if (!comprobante) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        const emisorObj = comprobante.emisors || {
            id: 1,
            rfc: '',
            nombre: 'Razón Social Emisora',
            regimen_fiscal: '601',
            lugar_expedicion: '01000'
        };

        const receptorObj = comprobante.receptors || {
            id: 1,
            rfc: 'XAXX010101000',
            nombre: 'PUBLICO EN GENERAL',
            domicilio_fiscal_receptor: '01000',
            regimen_fiscal_receptor: '616',
            uso_cfdi: 'S01'
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
                Descripcion: c.descripcion || 'Colegiatura y Servicios Educativos Integrales',
                ValorUnitario: Number(c.valor_unitario || c.importe || comprobante.total || 0),
                Importe: Number(c.importe || comprobante.total || 0),
                Descuento: 0,
                ObjetoImpuesto: c.objeto_imp || '02',
                Impuestos: { Retenciones: retenciones, Traslados: traslados }
            };
        });

        if (itemsLista.length === 0) {
            itemsLista = [{
                ID: '1',
                Cantidad: 1,
                ClaveProdServ: '',
                ClaveUnidad: 'E48',
                Unidad: 'Servicio',
                Descripcion: 'Colegiatura y Servicios Educativos Integrales',
                ValorUnitario: Number(comprobante.total || 0),
                Importe: Number(comprobante.total || 0),
                Descuento: 0,
                ObjetoImpuesto: '02',
                Impuestos: { Retenciones: [], Traslados: [] }
            }];
        }

        const responseData = {
            factura: {
                ID: comprobante.id.toString(),
                EmisorID: emisorObj.id?.toString(),
                Emisor: {
                    Rfc: emisorObj.rfc || '',
                    Nombre: emisorObj.nombre || 'Razón Social Emisora',
                    RegimenFiscal: emisorObj.regimen_fiscal || '601',
                    LugarExpedicion: emisorObj.lugar_expedicion || '01000',
                    Calle: emisorObj.calle || '',
                    NumeroExterior: emisorObj.numero_exterior || '',
                    NumeroInterior: emisorObj.numero_interior || '',
                    Colonia: emisorObj.colonia || '',
                    Municipio: emisorObj.municipio || '',
                    Estado: emisorObj.estado || ''
                },
                ReceptorID: receptorObj.id?.toString(),
                Receptor: {
                    Rfc: receptorObj.rfc || 'XAXX010101000',
                    Nombre: receptorObj.nombre || 'PUBLICO EN GENERAL',
                    DomicilioFiscalReceptor: receptorObj.domicilio_fiscal_receptor || '01000',
                    RegimenFiscalReceptor: receptorObj.regimen_fiscal_receptor || '616',
                    LugarExpedicion: emisorObj.lugar_expedicion || '01000'
                },
                Serie: comprobante.serie || 'F',
                Folio: comprobante.folio || comprobante.id.toString(),
                Fecha: comprobante.fecha ? new Date(comprobante.fecha).toISOString() : new Date().toISOString(),
                TipoDeComprobante: comprobante.tipo_comprobante || 'I',
                MetodoPago: comprobante.metodo_pago || 'PUE',
                FormaPago: comprobante.forma_pago || '03',
                UsoCFDI: comprobante.uso_cfdi || receptorObj.uso_cfdi || 'S01',
                Conceptos: {
                    ListaConceptos: itemsLista
                },
                InformacionGlobal: {
                    Anio: '',
                    Meses: '',
                    Periodicidad: ''
                }
            },
            uso_cfdi: { Descripcion: comprobante.uso_cfdi || 'Sin efectos fiscales' },
            metodo_pago: { Descripcion: 'Pago en una sola exhibición' },
            forma_pago: { Descripcion: 'Transferencia electrónica de fondos' }
        };

        return NextResponse.json(serializeBigIntsAndDecimals(responseData));
    } catch (error) {
        console.error('Error en GET /api/facturas/ObtenerFactura/[id]:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
