import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function serializeBigIntsAndDecimals(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (typeof obj === 'object') {
        if (obj.d && Array.isArray(obj.d) && obj.s !== undefined) {
            return obj.toString();
        }
        if (typeof obj.toNumber === 'function') {
            return obj.toString();
        }
        if (Array.isArray(obj)) return obj.map(serializeBigIntsAndDecimals);
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigIntsAndDecimals(value)])
        );
    }
    return obj;
}

// GET: Generar Reporte Mensual de Pagos y/o Historial Específico de un Alumno
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const mesPeriodo = searchParams.get('mes_periodo'); // YYYY-MM
        const alumnoId = searchParams.get('alumno_id');
        const grupoId = searchParams.get('grupo_id');

        // =========================================================================
        // CASO 1: HISTORIAL DE PAGOS INDIVIDUAL DE UN ALUMNO
        // =========================================================================
        if (alumnoId) {
            const alumno = await prisma.alumno.findUnique({
                where: { id: BigInt(alumnoId) },
                include: { receptor: true, emisor: true, historial_montos: { orderBy: { fecha_cambio: 'desc' } } }
            });

            if (!alumno) {
                return NextResponse.json({ error: 'Alumno no encontrado' }, { status: 404 });
            }

            const pagos = await prisma.pagoAlumno.findMany({
                where: { alumno_id: BigInt(alumnoId) },
                include: {
                    cargo: { include: { concepto: true } },
                    comprobante: true
                },
                orderBy: { fecha_pago: 'desc' }
            });

            const cargos = await prisma.cargoAlumno.findMany({
                where: { alumno_id: BigInt(alumnoId) },
                include: { concepto: true },
                orderBy: { fecha_vencimiento: 'desc' }
            });

            let totalPagado = 0;
            pagos.forEach(p => totalPagado += Number(p.monto));

            let totalPendiente = 0;
            cargos.forEach(c => totalPendiente += Number(c.monto_pendiente));

            return NextResponse.json({
                alumno: serializeBigIntsAndDecimals(alumno),
                resumen: {
                    total_pagado: totalPagado,
                    total_pendiente: totalPendiente,
                    total_pagos_realizados: pagos.length,
                    total_fichas_emitidas: cargos.length
                },
                pagos: serializeBigIntsAndDecimals(pagos),
                cargos: serializeBigIntsAndDecimals(cargos)
            }, { status: 200 });
        }

        // =========================================================================
        // CASO 2: REPORTE DE PAGOS MENSUAL EJECUTIVO Y EXPORTABLE
        // =========================================================================
        const periodo = mesPeriodo || new Date().toISOString().slice(0, 7);
        const [year, month] = periodo.split('-').map(Number);

        const fechaInicio = new Date(year, month - 1, 1);
        const fechaFin = new Date(year, month, 0, 23, 59, 59);

        const wherePagos = {
            fecha_pago: {
                gte: fechaInicio,
                lte: fechaFin
            }
        };
        if (grupoId) wherePagos.grupo_id = BigInt(grupoId);

        const pagosMes = await prisma.pagoAlumno.findMany({
            where: wherePagos,
            include: {
                alumno: { include: { receptor: true } },
                cargo: { include: { concepto: true } },
                comprobante: true
            },
            orderBy: { fecha_pago: 'desc' }
        });

        let montoTotalMes = 0;
        let montoPagosRFC = 0;
        let montoPagosGlobal = 0;

        const pagosReporte = pagosMes.map(p => {
            const montoVal = Number(p.monto);
            montoTotalMes += montoVal;

            const tieneRFC = p.alumno?.requiere_factura && p.alumno?.receptor?.rfc;
            if (tieneRFC) {
                montoPagosRFC += montoVal;
            } else {
                montoPagosGlobal += montoVal;
            }

            return {
                id: p.id.toString(),
                fecha_pago: p.fecha_pago,
                referencia_bancaria: p.referencia_bancaria,
                monto: montoVal,
                matricula: p.alumno?.matricula || 'N/A',
                alumno_nombre: p.alumno ? `${p.alumno.nombre} ${p.alumno.apellido_paterno} ${p.alumno.apellido_materno || ''}`.trim() : 'Pago Directo',
                carrera: p.alumno?.carrera || 'General',
                concepto: p.cargo?.concepto?.nombre || 'Colegiatura Mensual',
                requiere_factura: Boolean(tieneRFC),
                rfc_receptor: p.alumno?.receptor?.rfc || 'XAXX010101000',
                razon_social: p.alumno?.receptor?.nombre || 'PUBLICO EN GENERAL',
                serie_folio_factura: p.comprobante ? `${p.comprobante.serie}-${p.comprobante.folio}` : 'PENDIENTE',
                estado_conciliacion: p.estado_conciliacion
            };
        });

        return NextResponse.json({
            periodo,
            resumen_mensual: {
                monto_total_recaudado: montoTotalMes,
                monto_pagos_rfc: montoPagosRFC,
                monto_pagos_publico_general: montoPagosGlobal,
                total_transacciones: pagosMes.length
            },
            pagos: pagosReporte
        }, { status: 200 });

    } catch (error) {
        console.error('Error generando reporte de cobranza:', error);
        return NextResponse.json({ error: 'Error al generar reporte de cobranza: ' + error.message }, { status: 500 });
    }
}
