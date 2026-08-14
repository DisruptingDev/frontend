import prisma from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let grupoId = searchParams.get('grupo_id') || searchParams.get('grupoId') || request.headers.get('x-grupo-id');
        if (!grupoId && request.headers.get('authorization')) {
            try {
                const tokenStr = request.headers.get('authorization').replace('Bearer ', '');
                const parsed = JSON.parse(Buffer.from(tokenStr.split('.')[1], 'base64').toString());
                grupoId = parsed.grupo_id || parsed.grupoId || parsed.GrupoID || null;
            } catch (e) {}
        }

        const isSuperUser = searchParams.get('is_superadmin') === 'true' || 
                            searchParams.get('super_user') === 'true' || 
                            request.headers.get('x-super-user') === 'true' ||
                            grupoId === 'ALL' || grupoId === 'TODOS';

        // Build the where clause
        const where = {
            uuid: {
                not: null, // Ensure it is stamped (has UUID)
            },
            fecha_timbrado: {
                not: null,
            },
            tipo_de_comprobante: {
                not: 'N', // Exclude Payroll invoices
            },
            NOT: [
                { uuid: "" },
                { fecha_timbrado: "" }
            ]
        };

        if (!isSuperUser && grupoId) {
            try {
                where.grupo_id = BigInt(grupoId);
            } catch (err) {}
        } else if (!isSuperUser) {
            where.grupo_id = BigInt(-1); // Force empty if no valid ID for normal user
        }

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
        console.error("Error counting stamped invoices:", error);
        return NextResponse.json({ error: "Error fetching data" }, { status: 500 });
    }
}
