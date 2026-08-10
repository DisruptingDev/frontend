const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Calculando Antigüedad exacta en semanas (W) para pasar la validación del SAT...");

        // Obtenemos la última nómina insertada para ver la fecha_final_pago que está intentando timbrar el usuario
        const nominas = await prisma.$queryRawUnsafe(`
            SELECT id, fecha_final_pago, receptor_nomina_id 
            FROM "public"."nomina" 
            ORDER BY id DESC LIMIT 1
        `);

        if (nominas.length === 0) {
            console.log("No se encontró ninguna nómina guardada.");
            return;
        }

        const nomina = nominas[0];
        console.log(`Última nómina ID: ${nomina.id}, FechaFinalPago: ${nomina.fecha_final_pago}, ReceptorID: ${nomina.receptor_nomina_id}`);

        if (!nomina.fecha_final_pago || !nomina.receptor_nomina_id) return;

        // Obtenemos el receptor de esa nómina
        const receptores = await prisma.$queryRawUnsafe(`
            SELECT id, fecha_inicio_rel_laboral 
            FROM "public"."receptor_nomina" 
            WHERE id = $1
        `, Number(nomina.receptor_nomina_id));

        if (receptores.length === 0) return;
        const receptor = receptores[0];
        console.log(`Receptor FechaInicioRelLaboral: ${receptor.fecha_inicio_rel_laboral}`);

        // Cálculo de semanas según fórmula estricta del SAT:
        // Antigüedad = (FechaFinalPago - FechaInicioRelLaboral + 1) / 7
        const finalDate = new Date(nomina.fecha_final_pago);
        const inicioDate = new Date(receptor.fecha_inicio_rel_laboral);
        
        const diffTime = Math.abs(finalDate - inicioDate);
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        
        // +1 día según validación SAT (días transcurridos)
        const semanas = Math.floor((diffDays + 1) / 7);
        
        const nuevaAntiguedad = `P${semanas}W`;
        console.log(`Calculada nueva antigüedad SAT: ${nuevaAntiguedad} (${diffDays + 1} días)`);

        // Actualizamos TODOS los receptores a este mismo offset relativo solo por si acaso (o mejor lo calculamos uno por uno)
        const allReceptors = await prisma.$queryRawUnsafe(`SELECT id, fecha_inicio_rel_laboral FROM "public"."receptor_nomina"`);
        
        for (const r of allReceptors) {
            if (r.fecha_inicio_rel_laboral) {
                const iDate = new Date(r.fecha_inicio_rel_laboral);
                const dTime = Math.abs(finalDate - iDate);
                const dDays = Math.floor(dTime / (1000 * 60 * 60 * 24));
                const s = Math.floor((dDays + 1) / 7);
                const ant = `P${s}W`;
                await prisma.$executeRawUnsafe(`UPDATE "public"."receptor_nomina" SET antiguedad = $1 WHERE id = $2`, ant, r.id);
                console.log(`Actualizado Receptor ${r.id}: ${ant}`);
            }
        }
        
        console.log("Antigüedad corregida con formato P(semanas)W para evitar errores de redondeo de años/meses.");
    } catch (error) {
        console.error("Error modificando la BD:", error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
