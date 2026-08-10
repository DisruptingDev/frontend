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
            NOT: [
                { uuid: "" },
                { fecha_timbrado: "" }
            ]
        };

        if (startDate && endDate) {
            // Append time suffix to include records stamped up to the end of the selected day
            const end = endDate.includes('T') ? endDate : `${endDate}T23:59:59`;
            const start = startDate.includes('T') ? startDate : `${startDate}T00:00:00`;
            where.fecha_timbrado = {
                ...where.fecha_timbrado,
                gte: start,
                lte: end,
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
