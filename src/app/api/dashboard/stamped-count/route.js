import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        // Build the where clause
        const where = {
            uuid: {
                not: null, // Ensure it is stamped (has UUID)
            },
            fecha_timbrado: {
                not: null,
            },
        };

        if (startDate && endDate) {
            // Assuming fecha_timbrado is stored as 'YYYY-MM-DD...' string
            // We'll use string comparison which works for ISO formats
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
        console.error("Error counting stamped invoices:", error);
        return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
    }
}
