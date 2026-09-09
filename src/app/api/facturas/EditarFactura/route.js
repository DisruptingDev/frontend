import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import {
    serializeBigIntsAndDecimals,
    obtenerOGenerarEmisorPredeterminado,
    crearEstructuraCompletaCFDI
} from '@/lib/services/servicioFacturacion';

export async function PUT(request) {
    try {
        const body = await request.json();
        const { Factura, comprobante_id, items } = body;

        // Extraer id de comprobante
        const idFactura = comprobante_id || body.id || Factura?.ID || body.ID;

        if (!idFactura) {
            return NextResponse.json({ error: 'Debe especificar el ID de la factura a editar.' }, { status: 400 });
        }

        const comprobante = await prisma.comprobantes.findUnique({
            where: { id: BigInt(idFactura) },
            include: { emisors: true, receptors: true }
        });

        if (!comprobante) {
            return NextResponse.json({ error: 'La factura/pre-factura no existe.' }, { status: 404 });
        }

        if (comprobante.estatus === 'TIMBRADO') {
            return NextResponse.json({ error: 'No se puede editar una factura timbrada ante el SAT.' }, { status: 400 });
        }

        const emisor = await obtenerOGenerarEmisorPredeterminado(body.emisor_id || comprobante.emisor_id);

        let receptorId = comprobante.receptor_id;
        let receptorObj = comprobante.receptors;

        const receptorRfc = (Factura?.Receptor?.Rfc || body.receptor_rfc || receptorObj?.rfc || 'XAXX010101000').toUpperCase().trim();
        const receptorNombre = (Factura?.Receptor?.Nombre || body.receptor_nombre || receptorObj?.nombre || 'PUBLICO EN GENERAL').toUpperCase().trim();
        const usoCfdi = Factura?.UsoCFDI || body.uso_cfdi || comprobante.uso_cfdi || 'S01';

        let receptorExiste = await prisma.receptors.findFirst({
            where: { rfc: receptorRfc }
        });

        if (!receptorExiste) {
            receptorExiste = await prisma.receptors.create({
                data: {
                    rfc: receptorRfc,
                    nombre: receptorNombre,
                    domicilio_fiscal_receptor: emisor.lugar_expedicion || '01000',
                    regimen_fiscal_receptor: '616',
                    uso_cfdi: usoCfdi
                }
            });
        } else {
            receptorExiste = await prisma.receptors.update({
                where: { id: receptorExiste.id },
                data: {
                    nombre: receptorNombre,
                    uso_cfdi: usoCfdi
                }
            });
        }

        receptorId = receptorExiste.id;
        receptorObj = receptorExiste;

        // Extraer lista de conceptos / partidas
        let itemsList = items || [];
        if (itemsList.length === 0 && Factura?.Conceptos?.ListaConceptos) {
            itemsList = Factura.Conceptos.ListaConceptos.map(c => ({
                concepto: c.Descripcion,
                monto: Number(c.ValorUnitario || c.Importe || 0),
                clave_prod_serv: c.ClaveProdServ || '86121500'
            }));
        }

        const totalCalculado = itemsList.length > 0
            ? itemsList.reduce((acc, curr) => acc + Number(curr.monto || 0), 0)
            : Number(body.monto || comprobante.total || 0);

        const comprobanteActualizado = await prisma.comprobantes.update({
            where: { id: BigInt(idFactura) },
            data: {
                emisor_id: emisor.id,
                receptor_id: receptorId,
                uso_cfdi: usoCfdi,
                sub_total: totalCalculado,
                total: totalCalculado
            }
        });

        const impuestosLocales = Factura?.Complemento?.ImpuestosLocales || Factura?.impuestosLocales || [];

        await crearEstructuraCompletaCFDI({
            comprobante: comprobanteActualizado,
            emisor,
            receptor: receptorObj,
            descripcionConcepto: itemsList[0]?.concepto || body.descripcion_concepto || 'Colegiatura y Servicios Educativos Integrales',
            monto: totalCalculado,
            grupoId: emisor.grupo_id,
            claveProdServ: itemsList[0]?.clave_prod_serv || body.clave_prod_serv || '86121500',
            items: itemsList,
            impuestosLocales: impuestosLocales
        });

        return NextResponse.json({
            mensaje: `Factura/Pre-factura ${comprobante.serie}-${comprobante.folio} actualizada exitosamente.`,
            comprobante: serializeBigIntsAndDecimals(comprobanteActualizado)
        }, { status: 200 });

    } catch (error) {
        console.error('Error en PUT /api/facturas/EditarFactura:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
