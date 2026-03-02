import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        const where = {
            uuid: {
                not: null,
            },
            fecha_timbrado: {
                not: null,
            },
            tipo_de_comprobante: 'N', // Only Payroll invoices
        };

        if (startDate && endDate) {
            where.fecha_timbrado = {
                ...where.fecha_timbrado,
                gte: startDate,
                lte: endDate,
            };
        }

        const count = await prisma.comprobantes.count({
            where: where,
        });

        return NextResponse.json({ count });
    } catch (error) {
        console.error("Error counting stamped payroll invoices:", error);
        return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
    }
}
