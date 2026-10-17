import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request, context) {
    const resolvedParams = context?.params ? await context.params : {};
    const url = new URL(request.url);
    const idParam = resolvedParams.id || url.searchParams.get('id');

    if (!idParam) {
        return NextResponse.json({ error: "ID de factura no proporcionado" }, { status: 400 });
    }

    try {
        let idBigInt = null;
        try {
            idBigInt = BigInt(idParam);
        } catch {
            idBigInt = null;
        }

        const orConditions = [];
        if (idBigInt !== null) {
            orConditions.push({ id: idBigInt });
        }
        orConditions.push({ folio: String(idParam) });

        // 1. Buscar si la factura existe en la base de datos local
        const factura = await prisma.comprobantes.findFirst({
            where: { OR: orConditions },
            select: {
                id: true,
                uuid: true,
                estatus: true,
                tipo_de_comprobante: true
            }
        });

        if (factura) {
            const facturaId = factura.id;
            const tieneUuid = Boolean(factura.uuid && String(factura.uuid).trim().length > 10);
            const estatusUpper = String(factura.estatus || '').trim().toUpperCase();

            // Reglas de negocio: No borrar timbradas ni canceladas
            if (tieneUuid || estatusUpper === "TIMBRADA") {
                return NextResponse.json({ error: "No se puede eliminar una factura timbrada" }, { status: 400 });
            }

            if (estatusUpper === "CANCELADA") {
                return NextResponse.json({ error: "No se puede eliminar una factura cancelada" }, { status: 400 });
            }

            // Ejecutar borrado seguro en transacción
            await prisma.$transaction(async (tx) => {
                console.log(`[DELETE] Limpiando comprobante ${facturaId}`);

                // A) Acuses y CFDI relacionados
                await tx.acuse_cancelacions.deleteMany({
                    where: { comprobante_id: facturaId }
                }).catch(() => {});

                const relacion_containers = await tx.cfdi_relacionados.findMany({
                    where: { comprobante_id: facturaId },
                    select: { id: true }
                }).catch(() => []);

                if (relacion_containers && relacion_containers.length > 0) {
                    const relIds = relacion_containers.map(r => r.id);
                    await tx.cfdi_relacionado.deleteMany({
                        where: { cfdi_relacionados_id: { in: relIds } }
                    }).catch(() => {});
                    await tx.cfdi_relacionados.deleteMany({
                        where: { id: { in: relIds } }
                    }).catch(() => {});
                }

                // B) Si es nómina
                if (factura.tipo_de_comprobante === 'N') {
                    const nominas = await tx.nomina.findMany({
                        where: {
                            complementos: {
                                comprobante_id: facturaId
                            }
                        },
                        select: { id: true }
                    }).catch(() => []);

                    if (nominas && nominas.length > 0) {
                        const nominaIds = nominas.map(n => n.id);
                        const [percepciones, deducciones, otrosPagos] = await Promise.all([
                            tx.percepciones.findMany({ where: { nomina_id: { in: nominaIds } }, select: { id: true } }).catch(() => []),
                            tx.deducciones.findMany({ where: { nomina_id: { in: nominaIds } }, select: { id: true } }).catch(() => []),
                            tx.otros_pagos.findMany({ where: { nomina_id: { in: nominaIds } }, select: { id: true } }).catch(() => [])
                        ]);

                        const pIds = (percepciones || []).map(p => p.id);
                        const dIds = (deducciones || []).map(d => d.id);
                        const oIds = (otrosPagos || []).map(o => o.id);

                        if (pIds.length > 0) await tx.percepciones_detalle.deleteMany({ where: { percepciones_id: { in: pIds } } }).catch(() => {});
                        if (dIds.length > 0) await tx.deducciones_detalle.deleteMany({ where: { deducciones_id: { in: dIds } } }).catch(() => {});
                        if (oIds.length > 0) await tx.otros_pagos_detalle.deleteMany({ where: { otros_pagos_id: { in: oIds } } }).catch(() => {});

                        await tx.percepciones.deleteMany({ where: { nomina_id: { in: nominaIds } } }).catch(() => {});
                        await tx.deducciones.deleteMany({ where: { nomina_id: { in: nominaIds } } }).catch(() => {});
                        await tx.otros_pagos.deleteMany({ where: { nomina_id: { in: nominaIds } } }).catch(() => {});

                        await tx.emisor_nomina.deleteMany({ where: { nomina_id: { in: nominaIds } } }).catch(() => {});
                        await tx.receptor_nomina.updateMany({
                            where: { nomina_id: { in: nominaIds } },
                            data: { nomina_id: null }
                        }).catch(() => {});

                        await tx.nomina.deleteMany({ where: { id: { in: nominaIds } } }).catch(() => {});
                    }
                }

                // C) Desvincular o revertir PagoAlumno
                const pagosAsociados = await tx.pagoAlumno.findMany({
                    where: { comprobante_id: facturaId },
                    include: { cargo: true }
                }).catch(() => []);

                if (pagosAsociados && pagosAsociados.length > 0) {
                    for (const pago of pagosAsociados) {
                        if (!pago.cargo) continue;
                        const cargo = pago.cargo;
                        const montoARevertir = Number(pago.monto || 0);

                        const nuevoPagado = Math.max(0, Number(cargo.monto_pagado || 0) - montoARevertir);
                        const nuevoPendiente = Number(cargo.monto_total || 0) - nuevoPagado;

                        let nuevoEstatus = 'PENDIENTE';
                        if (nuevoPendiente <= 0) nuevoEstatus = 'PAGADO';
                        else if (nuevoPendiente < Number(cargo.monto_total || 0)) nuevoEstatus = 'PARCIAL';

                        await tx.cargoAlumno.update({
                            where: { id: cargo.id },
                            data: {
                                monto_pagado: nuevoPagado,
                                monto_pendiente: nuevoPendiente,
                                estatus: nuevoEstatus
                            }
                        }).catch(() => {});
                    }

                    await tx.pagoAlumno.deleteMany({
                        where: { comprobante_id: facturaId }
                    }).catch(() => {});
                }

                // D) Borrar el comprobante (cascadas limpian complementos, conceptos, etc.)
                await tx.comprobantes.delete({
                    where: { id: facturaId }
                });
                console.log(`[DELETE] Factura ${facturaId} eliminada exitosamente en BD local`);
            });

            return NextResponse.json({ message: "Factura eliminada correctamente" }, { status: 200 });
        }

        // 2. Si no existe en la BD local, delegar al backend de respaldo
        const baseRaw = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || 'https://api.sandbox.wisefacturacion.com';
        const baseUrl = (baseRaw.startsWith('http') ? baseRaw : `https://${baseRaw}`).replace(/\/+$/, '');
        const targetUrl = `${baseUrl}/api/facturas/EliminarFactura/${idParam}`;

        const authHeader = request.headers.get('authorization') || '';
        const headers = { 'Content-Type': 'application/json' };
        if (authHeader) headers['Authorization'] = authHeader;

        const backendRes = await fetch(targetUrl, {
            method: 'DELETE',
            headers
        });

        if (backendRes.ok) {
            let resJson = {};
            try {
                resJson = await backendRes.json();
            } catch {
                resJson = { message: "Factura eliminada correctamente en backend externo" };
            }
            return NextResponse.json(resJson, { status: 200 });
        }

        let backendErrorMsg = "No se pudo eliminar la factura.";
        try {
            const errData = await backendRes.json();
            backendErrorMsg = errData?.error || errData?.Error || errData?.message || backendErrorMsg;
        } catch {
            try {
                const errTxt = await backendRes.text();
                if (errTxt && errTxt.length < 200) backendErrorMsg = errTxt;
            } catch {}
        }

        return NextResponse.json({ error: backendErrorMsg }, { status: backendRes.status || 400 });
    } catch (error) {
        console.error("Error al procesar eliminación de factura:", error);
        return NextResponse.json({
            error: "Error interno al eliminar la factura: " + error.message
        }, { status: 500 });
    }
}
