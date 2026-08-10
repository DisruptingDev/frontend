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
                        Concepto: true
                    }
                },
                PagoAlumno: {
                    include: {
                        alumno: true,
                        cargo: true
                    }
                }
            }
        });

        if (!comprobante) {
            return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 });
        }

        const emisorObj = comprobante.emisors || {
            id: 1,
            rfc: 'UHI950412XX1',
            nombre: 'UNIVERSIDAD HISPANOAMERICANA S.C.',
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

        let itemsLista = conceptosList.map(c => ({
            ID: c.id?.toString(),
            Cantidad: Number(c.cantidad || 1),
            ClaveProdServ: c.clave_prod_serv || '86121500',
            ClaveUnidad: c.clave_unidad || 'E48',
            Unidad: c.unidad || 'Servicio',
            Descripcion: c.descripcion || 'Colegiatura y Servicios Educativos Integrales',
            ValorUnitario: Number(c.valor_unitario || c.importe || comprobante.total || 0),
            Importe: Number(c.importe || comprobante.total || 0),
            Descuento: 0,
            ObjetoImpuesto: c.objeto_imp || '01',
            Impuestos: { Retenciones: [], Traslados: [] }
        }));

        if (itemsLista.length === 0) {
            itemsLista = [{
                ID: '1',
                Cantidad: 1,
                ClaveProdServ: '86121500',
                ClaveUnidad: 'E48',
                Unidad: 'Servicio',
                Descripcion: 'Colegiatura y Servicios Educativos Integrales',
                ValorUnitario: Number(comprobante.total || 0),
                Importe: Number(comprobante.total || 0),
                Descuento: 0,
                ObjetoImpuesto: '01',
                Impuestos: { Retenciones: [], Traslados: [] }
            }];
        }

        const responseData = {
            factura: {
                ID: comprobante.id.toString(),
                EmisorID: emisorObj.id?.toString(),
                Emisor: {
                    Rfc: emisorObj.rfc || 'UHI950412XX1',
                    Nombre: emisorObj.nombre || 'UNIVERSIDAD HISPANOAMERICANA S.C.',
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
