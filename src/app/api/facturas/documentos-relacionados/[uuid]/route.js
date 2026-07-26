import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

function serializeBigInts(obj) {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'bigint') return obj.toString();
    if (Array.isArray(obj)) return obj.map(serializeBigInts);
    if (typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, serializeBigInts(value)])
        );
    }
    return obj;
}

export async function GET(request, { params }) {
    try {
        if (!process.env.DATABASE_URL) {
            return NextResponse.json({
                error: 'No se encuentra configurada la variable DATABASE_URL en el archivo frontend/.env. Por favor, especifique la cadena de conexión a PostgreSQL.'
            }, { status: 500 });
        }

        const resolvedParams = params instanceof Promise ? await params : params;
        const uuid = resolvedParams?.uuid;

        if (!uuid) {
            return NextResponse.json({ error: 'UUID es requerido' }, { status: 400 });
        }

        const uuidVariants = Array.from(new Set([uuid, uuid.toLowerCase(), uuid.toUpperCase()]));

        // 1. Buscar si esta factura es una Factura Madre (PPD) que recibió pagos
        const relacionesMadre = await prisma.docto_relacionados.findMany({
            where: {
                id_documento: {
                    in: uuidVariants
                }
            },
            include: {
                Pago: {
                    include: {
                        Pagos: {
                            include: {
                                complementos: {
                                    include: {
                                        comprobantes: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        let result = [];

        if (relacionesMadre.length > 0) {
            result = relacionesMadre.map(rel => {
                const comprobante = rel.Pago?.Pagos?.complementos?.comprobantes;
                if (!comprobante) return null;

                return {
                    id: comprobante.id,
                    folio: comprobante.folio || 'Sin Folio',
                    serie: comprobante.serie || '',
                    uuid: comprobante.uuid || 'Sin timbrar',
                    estatus: comprobante.estatus === 'Cancelada' ? 'Cancelada' : (comprobante.uuid ? 'Timbrada' : 'No timbrada'),
                    fecha: comprobante.fecha,
                    montoPagado: rel.imp_pagado != null ? Number(rel.imp_pagado) : 0,
                    monedaDR: rel.moneda_dr,
                    numParcialidad: rel.num_parcialidad != null ? Number(rel.num_parcialidad) : 1,
                    saldoAnterior: rel.imp_saldo_ant != null ? Number(rel.imp_saldo_ant) : 0,
                    saldoInsoluto: rel.imp_saldo_insoluto != null ? Number(rel.imp_saldo_insoluto) : 0
                };
            }).filter(Boolean);
        } else {
            // 2. Si no es Factura Madre, verificar si esta factura es un Complemento de Pago (Tipo P) que liquida a Facturas Madres
            const compPago = await prisma.comprobantes.findFirst({
                where: {
                    uuid: {
                        in: uuidVariants
                    }
                },
                include: {
                    complementos: {
                        include: {
                            Pagos: {
                                include: {
                                    Pago: {
                                        include: {
                                            docto_relacionados: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });

            if (compPago && compPago.complementos && compPago.complementos.length > 0) {
                const doctosRel = [];
                compPago.complementos.forEach(comp => {
                    comp.Pagos?.forEach(pagos => {
                        pagos.Pago?.forEach(pago => {
                            pago.docto_relacionados?.forEach(dr => {
                                doctosRel.push(dr);
                            });
                        });
                    });
                });

                if (doctosRel.length > 0) {
                    const uuidsRel = Array.from(new Set(doctosRel.map(dr => dr.id_documento).filter(Boolean)));

                    const facturasMadre = await prisma.comprobantes.findMany({
                        where: {
                            uuid: {
                                in: uuidsRel
                            }
                        }
                    });

                    const mapaMadres = new Map(facturasMadre.map(f => [f.uuid, f]));

                    result = doctosRel.map(rel => {
                        const fMadre = mapaMadres.get(rel.id_documento);
                        return {
                            id: fMadre ? fMadre.id : rel.id,
                            folio: fMadre?.folio || rel.folio || 'Sin Folio',
                            serie: fMadre?.serie || rel.serie || '',
                            uuid: rel.id_documento || 'Sin timbrar',
                            estatus: fMadre ? (fMadre.estatus === 'Cancelada' ? 'Cancelada' : 'Timbrada') : 'Timbrada',
                            fecha: fMadre?.fecha || compPago.fecha,
                            montoPagado: rel.imp_pagado != null ? Number(rel.imp_pagado) : 0,
                            monedaDR: rel.moneda_dr,
                            numParcialidad: rel.num_parcialidad != null ? Number(rel.num_parcialidad) : 1,
                            saldoAnterior: rel.imp_saldo_ant != null ? Number(rel.imp_saldo_ant) : 0,
                            saldoInsoluto: rel.imp_saldo_insoluto != null ? Number(rel.imp_saldo_insoluto) : 0
                        };
                    });
                }
            }
        }

        return NextResponse.json(serializeBigInts(result), { status: 200 });

    } catch (error) {
        console.error('Error fetching related documents:', error);
        return NextResponse.json({ error: 'Error al consultar los documentos relacionados: ' + error.message }, { status: 500 });
    }
}
