import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function DELETE(request) {
    try {

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: "ID de factura no proporcionado" }, { status: 400 });
        }

        const facturaId = BigInt(id);

        // 1. Verificar que la factura exista y no esté timbrada ni cancelada
        const factura = await prisma.comprobantes.findUnique({
            where: { id: facturaId },
            select: {
                uuid: true,
                estatus: true,
                tipo_de_comprobante: true
            }
        });

        if (!factura) {
            return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 });
        }

        // Reglas de negocio: No borrar timbradas ni canceladas
        if (factura.uuid || factura.estatus === "TIMBRADA") {
            return NextResponse.json({ error: "No se puede eliminar una factura timbrada" }, { status: 400 });
        }

        if (factura.estatus === "CANCELADA") {
            return NextResponse.json({ error: "No se puede eliminar una factura cancelada" }, { status: 400 });
        }

        // 2. Ejecutar borrado en transacción para asegurar integridad
        await prisma.$transaction(async (tx) => {
            console.log(`[DELETE] Iniciando limpieza para factura ${facturaId}`);

            // A) Limpiar acuse_cancelacions y cfdi_relacionados (no tienen relaciones en Prisma pero sí en la DB)
            const acuseDelete = await tx.acuse_cancelacions.deleteMany({
                where: { comprobante_id: facturaId }
            });
            if (acuseDelete.count > 0) console.log(`[DELETE] Borrados ${acuseDelete.count} acuses de cancelación`);

            const relacion_containers = await tx.cfdi_relacionados.findMany({
                where: { comprobante_id: facturaId },
                select: { id: true }
            });

            if (relacion_containers.length > 0) {
                const relIds = relacion_containers.map(r => r.id);
                await tx.cfdi_relacionado.deleteMany({
                    where: { cfdi_relacionados_id: { in: relIds } }
                });
                const relDelete = await tx.cfdi_relacionados.deleteMany({
                    where: { id: { in: relIds } }
                });
                console.log(`[DELETE] Borrados ${relDelete.count} contenedores de CFDI relacionado`);
            }

            // B) Si es una nómina, debemos limpiar las tablas relacionadas que no tienen Cascade Delete configurado en Prisma
            if (factura.tipo_de_comprobante === 'N') {
                console.log(`[DELETE] Procesando como nómina...`);
                // Obtener los IDs de nómina asociados a este comprobante a través de complementos
                const nominas = await tx.nomina.findMany({
                    where: {
                        complementos: {
                            comprobante_id: facturaId
                        }
                    },
                    select: { id: true }
                });

                if (nominas.length > 0) {
                    const nominaIds = nominas.map(n => n.id);
                    console.log(`[DELETE] Encontradas ${nominaIds.length} nóminas asociadas`);

                    // 1. Obtener IDs de contenedores para borrar sus detalles
                    const [percepciones, deducciones, otrosPagos] = await Promise.all([
                        tx.percepciones.findMany({ where: { nomina_id: { in: nominaIds } }, select: { id: true } }),
                        tx.deducciones.findMany({ where: { nomina_id: { in: nominaIds } }, select: { id: true } }),
                        tx.otros_pagos.findMany({ where: { nomina_id: { in: nominaIds } }, select: { id: true } })
                    ]);

                    const pIds = percepciones.map(p => p.id);
                    const dIds = deducciones.map(d => d.id);
                    const oIds = otrosPagos.map(o => o.id);

                    // 2. Borrar detalles (orden: hijos primero)
                    if (pIds.length > 0) {
                        await tx.percepciones_detalle.deleteMany({ where: { percepciones_id: { in: pIds } } });
                    }
                    if (dIds.length > 0) {
                        await tx.deducciones_detalle.deleteMany({ where: { deducciones_id: { in: dIds } } });
                    }
                    if (oIds.length > 0) {
                        await tx.otros_pagos_detalle.deleteMany({ where: { otros_pagos_id: { in: oIds } } });
                    }

                    // 3. Borrar contenedores
                    await tx.percepciones.deleteMany({ where: { nomina_id: { in: nominaIds } } });
                    await tx.deducciones.deleteMany({ where: { nomina_id: { in: nominaIds } } });
                    await tx.otros_pagos.deleteMany({ where: { nomina_id: { in: nominaIds } } });

                    // 4. Borrar emisor_nomina 
                    await tx.emisor_nomina.deleteMany({ where: { nomina_id: { in: nominaIds } } });

                    // 5. Desvincular receptor_nomina (regla de negocio: no borrarlo)
                    await tx.receptor_nomina.updateMany({
                        where: { nomina_id: { in: nominaIds } },
                        data: { nomina_id: null }
                    });

                    // 6. Borrar la nómina principal
                    await tx.nomina.deleteMany({ where: { id: { in: nominaIds } } });
                    console.log(`[DELETE] Limpieza de nómina completada`);
                }
            }

            // 3. Eliminar el comprobante principal
            // Prisma se encargará de las cascadas configuradas (Conceptos, Complementos, InformacionGlobal, etc.)
            await tx.comprobantes.delete({
                where: { id: facturaId }
            });
            console.log(`[DELETE] Comprobante ${facturaId} eliminado exitosamente`);
        });

        return serializeResponse({ message: "Factura y relaciones eliminadas correctamente" });
    } catch (error) {
        console.error("Error al eliminar la factura directamente:", error);
        return serializeResponse({
            error: "Error interno al eliminar la factura",
            details: error.message
        }, 500);
    }
}

// Helper para manejar BigInt en la respuesta JSON
function serializeResponse(data, status = 200) {
    return new NextResponse(
        JSON.stringify(data, (key, value) =>
            typeof value === 'bigint' ? value.toString() : value
        ),
        {
            status,
            headers: { 'Content-Type': 'application/json' }
        }
    );
}
