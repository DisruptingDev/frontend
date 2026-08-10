const fs = require('fs');

let routeContent = fs.readFileSync('c:/Users/macal/Wise/frontend/src/app/api/cobranza/conciliacion/route.js', 'utf-8');

const oldCasoBStart = "const cargosPendientes = await prisma.cargoAlumno.findMany({";
const oldCasoBEnd = "        return NextResponse.json(responseData, { status: 200 });";

const newCasoB = `        const todosLosAlumnos = await prisma.alumno.findMany({
            where: { estatus: 'ACTIVO' },
            include: { receptor: true, programa_academico: true }
        });

        const cargosPendientes = await prisma.cargoAlumno.findMany({
            where: { estatus: { in: ['PENDIENTE', 'PARCIAL'] } },
            include: { producto: true }
        });

        let conciliadosCount = 0;
        let pendientesCount = 0;
        let montoTotal = 0;
        const pagosProcesados = [];

        for (const mov of movimientos) {
            montoTotal += mov.monto;

            let alumnoEncontrado = null;
            let metodoMatcheo = null;
            const refMov = (mov.referenciaLimpia || mov.referencia || '').toUpperCase();
            const descUpper = (mov.descripcion || '').toUpperCase();

            // 1. Matcheo directo con Alumnos por CLABE o Referencia Personal
            alumnoEncontrado = todosLosAlumnos.find(a => {
                const clabeAlu = a.clabe_interbancaria ? a.clabe_interbancaria.trim().toUpperCase() : '';
                const refPagoAlu = a.referencia_pago ? a.referencia_pago.trim().toUpperCase() : '';
                const idsAlu = a.ids_alumno ? a.ids_alumno.split(',').map(i => i.trim().toUpperCase()).filter(Boolean) : [];

                if (clabeAlu && (refMov.includes(clabeAlu) || descUpper.includes(clabeAlu))) return true;
                if (refPagoAlu && (refMov === refPagoAlu || descUpper.includes(refPagoAlu))) return true;
                for (const idPlan of idsAlu) {
                    if (idPlan && (refMov.includes(idPlan) || descUpper.includes(idPlan))) return true;
                }
                return false;
            });

            if (alumnoEncontrado) {
                const identificador = alumnoEncontrado.clabe_interbancaria || alumnoEncontrado.referencia_pago || alumnoEncontrado.ids_alumno;
                metodoMatcheo = \`Identificador Único (\${identificador})\`;
            }

            // 2. Matcheo buscando la referencia en CargosPendientes (si pagó una ficha en específico)
            if (!alumnoEncontrado) {
                const cargoMatcheado = cargosPendientes.find(c => {
                    const codFicha = c.codigo_ficha ? c.codigo_ficha.toUpperCase() : '';
                    return (codFicha && codFicha === refMov) ||
                           c.referencia_bancaria === mov.referenciaLimpia ||
                           c.referencia_bancaria === mov.referencia ||
                           (codFicha && descUpper.includes(codFicha)) ||
                           descUpper.includes(c.referencia_bancaria);
                });

                if (cargoMatcheado) {
                    alumnoEncontrado = todosLosAlumnos.find(a => a.id === cargoMatcheado.alumno_id);
                    if (alumnoEncontrado) {
                        metodoMatcheo = \`Código/Referencia Ficha (\${cargoMatcheado.referencia_bancaria})\`;
                    }
                }
            }

            // 3. Matcheo por Nombre de Alumno en Descripción SPEI
            if (!alumnoEncontrado && mov.descripcion) {
                alumnoEncontrado = todosLosAlumnos.find(a => {
                    const nombreCompleto = \`\${a.nombre} \${a.apellido_paterno}\`.toUpperCase();
                    return descUpper.includes(nombreCompleto) || descUpper.includes(a.nombre.toUpperCase());
                });
                if (alumnoEncontrado) metodoMatcheo = 'Coincidencia Nombre Alumno SPEI';
            }

            if (alumnoEncontrado) {
                conciliadosCount++;
                
                const alumnoCargosPendientes = cargosPendientes.filter(cp => cp.alumno_id === alumnoEncontrado.id);

                let montoDisponible = mov.monto;
                const cargosSeleccionadosSugeridos = [];
                for (const cargo of alumnoCargosPendientes) {
                    if (montoDisponible <= 0) break;
                    cargosSeleccionadosSugeridos.push(cargo.id.toString());
                    montoDisponible -= Number(cargo.monto_pendiente);
                }

                pagosProcesados.push({
                    id_tmp: \`MOV-\${conciliadosCount}\`,
                    fecha_pago: mov.fecha,
                    monto: mov.monto,
                    referencia_bancaria: mov.referencia || \`REF-\${Date.now()}\`,
                    descripcion: mov.descripcion || '',
                    linea: mov.linea,
                    alumno_id: alumnoEncontrado.id.toString(),
                    cargos_sugeridos: cargosSeleccionadosSugeridos,
                    alumno_nombre: \`\${alumnoEncontrado.nombre} \${alumnoEncontrado.apellido_paterno}\`,
                    alumno_matricula: alumnoEncontrado.matricula,
                    metodo_matcheo: metodoMatcheo,
                    requiere_factura: alumnoEncontrado.requiere_factura,
                    estado_conciliacion: 'SUGERIDO',
                    cargos_pendientes: serializeBigIntsAndDecimals(alumnoCargosPendientes)
                });
            } else {
                pendientesCount++;
                pagosProcesados.push({
                    id_tmp: \`MOV-REV-\${pendientesCount}\`,
                    referencia_bancaria: mov.referencia || 'SIN_REF',
                    monto: mov.monto,
                    fecha_pago: mov.fecha,
                    descripcion: mov.descripcion,
                    estado_conciliacion: 'REVISION',
                    linea: mov.linea
                });
            }
        }

        const responseData = {
            mensaje: \`Conciliación bancaria procesada. \${conciliadosCount} movimientos conciliados y \${pendientesCount} sin coincidencia.\`,
            resumen: {
                total_movimientos: movimientos.length,
                conciliados: conciliadosCount,
                pendientes_revision: pendientesCount,
                monto_total: montoTotal
            },
            pagos: pagosProcesados
        };
        
        return NextResponse.json(responseData, { status: 200 });`;

const startIndex = routeContent.indexOf(oldCasoBStart);
const endIndex = routeContent.indexOf(oldCasoBEnd, startIndex) + oldCasoBEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
    routeContent = routeContent.substring(0, startIndex) + newCasoB + routeContent.substring(endIndex);
    fs.writeFileSync('c:/Users/macal/Wise/frontend/src/app/api/cobranza/conciliacion/route.js', routeContent);
    console.log("route.js updated successfully");
} else {
    console.log("Could not find blocks in route.js");
}

let pageContent = fs.readFileSync('c:/Users/macal/Wise/frontend/src/app/Cobranza/Conciliacion/page.jsx', 'utf-8');

pageContent = pageContent.replace(
    /if \(p\.estado_conciliacion === 'SUGERIDO' && p\.cargo_id_sugerido\) \{\s*initCargosSelec\[idx\] = \[p\.cargo_id_sugerido\];\s*\}/g,
    "if (p.estado_conciliacion === 'SUGERIDO' && p.cargos_sugeridos) { initCargosSelec[idx] = p.cargos_sugeridos; }"
);

fs.writeFileSync('c:/Users/macal/Wise/frontend/src/app/Cobranza/Conciliacion/page.jsx', pageContent);
console.log("page.jsx updated successfully");
