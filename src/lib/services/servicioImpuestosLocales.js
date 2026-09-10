import prisma from '@/lib/prisma';

export async function sincronizarImpuestosLocales(comprobanteId, impuestosLocalesRaw) {
    if (!comprobanteId) return false;
    const compId = BigInt(comprobanteId);

    // Normalizar la lista de impuestos locales si viene de diferentes formatos
    let flatList = [];
    if (Array.isArray(impuestosLocalesRaw)) {
        flatList = impuestosLocalesRaw;
    } else if (impuestosLocalesRaw && typeof impuestosLocalesRaw === 'object') {
        const traslados = impuestosLocalesRaw.TrasladosLocales || impuestosLocalesRaw.traslado_locals || [];
        const retenciones = impuestosLocalesRaw.RetencionesLocales || impuestosLocalesRaw.retencion_locals || [];
        
        if (Array.isArray(traslados)) {
            traslados.forEach(t => flatList.push({
                Tipo: 'Traslado',
                Nombre: t.ImpLocTrasladado || t.Nombre || 'ISH',
                Tasa: Number(t.TasadeTraslado ?? t.Tasa ?? 0),
                Importe: Math.abs(Number(t.Importe ?? t.importe ?? 0))
            }));
        }
        if (Array.isArray(retenciones)) {
            retenciones.forEach(r => flatList.push({
                Tipo: 'Retencion',
                Nombre: r.ImpLocRetenido || r.Nombre || 'Impuesto Cedular',
                Tasa: Number(r.TasadeRetencion ?? r.Tasa ?? 0),
                Importe: Math.abs(Number(r.Importe ?? r.importe ?? 0))
            }));
        }
    }

    try {
        // 1. Asegurar o crear el complemento para este comprobante
        let compDB = await prisma.complementos.findFirst({
            where: { comprobante_id: compId }
        });
        if (!compDB) {
            compDB = await prisma.complementos.create({
                data: { comprobante_id: compId }
            });
        }

        // 2. Limpiar impuestos locales previos si existen
        const prevImpuestosLocales = await prisma.$queryRaw`
            SELECT id FROM impuestos_locales WHERE complemento_id = ${compDB.id}
        `;
        if (prevImpuestosLocales && prevImpuestosLocales.length > 0) {
            for (const il of prevImpuestosLocales) {
                await prisma.$executeRaw`DELETE FROM traslado_locals WHERE impuestos_locales_id = ${il.id}`;
                await prisma.$executeRaw`DELETE FROM retencion_locals WHERE impuestos_locales_id = ${il.id}`;
                await prisma.$executeRaw`DELETE FROM impuestos_locales WHERE id = ${il.id}`;
            }
        }

        // 3. Si vienen impuestos locales, insertarlos
        if (flatList.length > 0) {
            let totalTraslados = 0;
            let totalRetenciones = 0;

            flatList.forEach(i => {
                const importe = Math.abs(Number(i.Importe || 0));
                if (i.Tipo === 'Traslado') totalTraslados += importe;
                if (i.Tipo === 'Retencion') totalRetenciones += importe;
            });

            const ilResult = await prisma.$queryRaw`
                INSERT INTO impuestos_locales (version, totalde_retenciones, totalde_traslados, complemento_id)
                VALUES ('1.0', ${totalRetenciones.toFixed(2)}, ${totalTraslados.toFixed(2)}, ${compDB.id})
                RETURNING id
            `;

            if (ilResult && ilResult.length > 0) {
                const ilId = ilResult[0].id;
                for (const i of flatList) {
                    const tasa = Number(i.Tasa || 0);
                    const importe = Math.abs(Number(i.Importe || 0));
                    const nombre = String(i.Nombre || (i.Tipo === 'Traslado' ? 'ISH' : 'Impuesto Cedular')).trim();

                    if (i.Tipo === 'Traslado') {
                        await prisma.$executeRaw`
                            INSERT INTO traslado_locals (imp_loc_trasladado, tasade_traslado, importe, impuestos_locales_id)
                            VALUES (${nombre}, ${tasa.toFixed(2)}, ${importe.toFixed(2)}, ${ilId})
                        `;
                    } else if (i.Tipo === 'Retencion') {
                        await prisma.$executeRaw`
                            INSERT INTO retencion_locals (imp_loc_retenido, tasade_retencion, importe, impuestos_locales_id)
                            VALUES (${nombre}, ${tasa.toFixed(2)}, ${importe.toFixed(2)}, ${ilId})
                        `;
                    }
                }
            }
        }
        return true;
    } catch (e) {
        console.error(`[sincronizarImpuestosLocales] Error al sincronizar impuestos locales para comprobante ${comprobanteId}:`, e);
        return false;
    }
}
