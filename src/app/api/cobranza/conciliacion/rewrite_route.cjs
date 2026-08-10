const fs = require('fs');

let content = fs.readFileSync('c:/Users/macal/Wise/frontend/src/app/api/cobranza/conciliacion/route.js', 'utf-8');

const oldConfirmarMasivo = `            if (action === 'CONFIRMAR_MASIVO') {
                const { asignaciones } = body;
                if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
                    return NextResponse.json({ error: 'No hay asignaciones para procesar.' }, { status: 400 });
                }

                const emisor = await obtenerOGenerarEmisorPredeterminado(emisor_id);
                const procesados = [];

                for (const asig of asignaciones) {
                    const { alumno_id, monto, fecha_pago, referencia_bancaria, descripcion } = asig;
                    if (!alumno_id) continue;

                    const alumnoObj = await prisma.alumno.findUnique({
                        where: { id: BigInt(alumno_id) },
                        include: { receptor: true, programa_academico: true }
                    });

                    if (!alumnoObj) continue;

                    let cargoEncontrado = await prisma.cargoAlumno.findFirst({
                        where: { alumno_id: alumnoObj.id, estatus: { in: ['PENDIENTE', 'PARCIAL'] } },
                        include: { producto: true }
                    });

                    if (!cargoEncontrado) {
                        const concDef = await prisma.conceptoCobro.findFirst({ where: { nombre: 'Colegiatura' } });
                        const concId = concDef ? concDef.id : BigInt(1);
                        const refBanc = referencia_bancaria || \`MANUAL-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`;

                        cargoEncontrado = await prisma.cargoAlumno.create({
                            data: {
                                alumno_id: alumnoObj.id,
                                concepto_id: concId,
                                codigo_ficha: \`M\${String(Math.floor(Math.random()*90000+10000))}\`,
                                referencia_bancaria: refBanc,
                                monto_total: Number(monto),
                                monto_pagado: Number(monto),
                                monto_pendiente: 0,
                                fecha_emision: new Date(),
                                fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
                                estatus: 'PAGADO',
                                grupo_id: grupo_id ? BigInt(grupo_id) : alumnoObj.grupo_id
                            }
                        });
                    }

                    let receptorId = alumnoObj.receptor_id;
                    let receptorObj = alumnoObj.receptor;

                    if (!receptorId || !receptorObj) {
                        let receptorGenerico = await prisma.receptors.findFirst({ where: { rfc: 'XAXX010101000' } });
                        if (!receptorGenerico) {
                            receptorGenerico = await prisma.receptors.create({
                                data: {
                                    rfc: 'XAXX010101000',
                                    nombre: 'PUBLICO EN GENERAL',
                                    domicilio_fiscal_receptor: emisor.lugar_expedicion || '01000',
                                    regimen_fiscal_receptor: '616',
                                    uso_cfdi: 'S01'
                                }
                            });
                        }
                        receptorId = receptorGenerico.id;
                        receptorObj = receptorGenerico;
                    }

                    const { serie, folio } = await obtenerSiguienteFolioSerie(emisor.id);

                    const comprobanteAuto = await prisma.comprobantes.create({
                        data: {
                            emisor_id: emisor.id,
                            receptor_id: receptorId,
                            grupo_id: emisor.grupo_id,
                            version: '4.0',
                            serie: serie,
                            folio: folio,
                            fecha: getFechaLocalSAT(),
                            forma_pago: '03',
                            metodo_pago: 'PUE',
                            moneda: 'MXN',
                            tipo_cambio: '1',
                            exportacion: '01',
                            tipo_de_comprobante: 'I',
                            uso_cfdi: receptorObj.uso_cfdi || 'S01',
                            lugar_expedicion: emisor.lugar_expedicion || '01000',
                            sub_total: Number(monto),
                            sub_total_string: String(Number(monto).toFixed(2)),
                            total: Number(monto),
                            total_string: String(Number(monto).toFixed(2)),
                            descuento: 0,
                            descuento_string: '0',
                            estatus: 'PENDIENTE'
                        }
                    });

                    const eInfo = {
                        producto: cargoEncontrado.producto?.nombre || 'MENSUALIDAD',
                        carrera: alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL',
                        nombre: \`\${alumnoObj.nombre} \${alumnoObj.apellido_paterno} \${alumnoObj.apellido_materno || ''}\`.trim(),
                        curp: alumnoObj.curp || 'N/A',
                        matricula: alumnoObj.matricula || 'N/A',
                        rvoe: alumnoObj.programa_academico?.rvoe || 'N/A'
                    };
                    const dateForMonth = fecha_pago ? new Date(fecha_pago) : new Date();
                    const currentMonth = dateForMonth.toLocaleString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
                    const descConcepto = \`PAGO A \${eInfo.producto} DE \${eInfo.carrera} REALIZADO EL MES DE \${currentMonth} , DEL ESTUDIANTE \${eInfo.nombre}, CURP: \${eInfo.curp}, MATRICULA: \${eInfo.matricula}, PROGRAMA CON RVOE SEP NO. \${eInfo.rvoe}\`.toUpperCase();

                    await crearEstructuraCompletaCFDI({
                        comprobante: comprobanteAuto,
                        emisor,
                        receptor: receptorObj,
                        descripcionConcepto: descConcepto,
                        monto: Number(monto),
                        grupoId: emisor.grupo_id
                    });

                    await prisma.pagoAlumno.create({
                        data: {
                            alumno_id: alumnoObj.id,
                            cargo_id: cargoEncontrado.id,
                            fecha_pago: fecha_pago ? new Date(fecha_pago) : new Date(),
                            monto: Number(monto),
                            referencia_bancaria: referencia_bancaria || \`MANUAL-\${Date.now()}\`,
                            metodo_pago: '03',
                            estado_conciliacion: 'CONCILIADO',
                            comprobante_id: comprobanteAuto.id,
                            grupo_id: grupo_id ? BigInt(grupo_id) : emisor.grupo_id
                        }
                    });

                    procesados.push({
                        alumno_nombre: \`\${alumnoObj.nombre} \${alumnoObj.apellido_paterno}\`,
                        comprobante_folio: \`\${serie}-\${folio}\`
                    });
                }

                return NextResponse.json({
                    mensaje: \`Se han guardado y generado \${procesados.length} pre-facturas exitosamente.\`,
                    total_procesados: procesados.length,
                    procesados
                }, { status: 200 });
            }`;

const newConfirmarMasivo = `            if (action === 'CONFIRMAR_MASIVO') {
                const { asignaciones } = body;
                if (!Array.isArray(asignaciones) || asignaciones.length === 0) {
                    return NextResponse.json({ error: 'No hay asignaciones para procesar.' }, { status: 400 });
                }

                const emisor = await obtenerOGenerarEmisorPredeterminado(emisor_id);
                const procesados = [];

                for (const asig of asignaciones) {
                    const { alumno_id, monto, fecha_pago, referencia_bancaria, descripcion, cargos_ids } = asig;
                    if (!alumno_id) continue;

                    const alumnoObj = await prisma.alumno.findUnique({
                        where: { id: BigInt(alumno_id) },
                        include: { receptor: true, programa_academico: true }
                    });
                    if (!alumnoObj) continue;

                    let montoRestante = Number(monto);
                    let cargosAplicados = [];
                    
                    // Si el usuario seleccionó cargos específicos, los buscamos
                    if (cargos_ids && Array.isArray(cargos_ids) && cargos_ids.length > 0) {
                        const cargosSeleccionados = await prisma.cargoAlumno.findMany({
                            where: { id: { in: cargos_ids.map(id => BigInt(id)) } },
                            include: { producto: true },
                            orderBy: { id: 'asc' }
                        });
                        
                        for (const cargo of cargosSeleccionados) {
                            if (montoRestante <= 0) break;
                            const pendiente = Number(cargo.monto_pendiente);
                            if (pendiente <= 0) continue;
                            
                            const aplicar = Math.min(pendiente, montoRestante);
                            montoRestante -= aplicar;
                            
                            const nuevoPagado = Number(cargo.monto_pagado) + aplicar;
                            const nuevoPendiente = Number(cargo.monto_total) - nuevoPagado;
                            const nuevoEstatus = nuevoPendiente <= 0 ? 'PAGADO' : 'PARCIAL';
                            
                            await prisma.cargoAlumno.update({
                                where: { id: cargo.id },
                                data: {
                                    monto_pagado: nuevoPagado,
                                    monto_pendiente: nuevoPendiente,
                                    estatus: nuevoEstatus
                                }
                            });
                            
                            cargosAplicados.push({ cargo, montoAplicado: aplicar });
                        }
                    } else {
                        // Si no se seleccionó cargo (quizás no había pendientes), intentar con el más antiguo si existe
                        let cargoEncontrado = await prisma.cargoAlumno.findFirst({
                            where: { alumno_id: alumnoObj.id, estatus: { in: ['PENDIENTE', 'PARCIAL'] } },
                            include: { producto: true },
                            orderBy: { id: 'asc' }
                        });
                        if (cargoEncontrado) {
                            const pendiente = Number(cargoEncontrado.monto_pendiente);
                            const aplicar = Math.min(pendiente, montoRestante);
                            montoRestante -= aplicar;
                            
                            const nuevoPagado = Number(cargoEncontrado.monto_pagado) + aplicar;
                            const nuevoPendiente = Number(cargoEncontrado.monto_total) - nuevoPagado;
                            const nuevoEstatus = nuevoPendiente <= 0 ? 'PAGADO' : 'PARCIAL';
                            
                            await prisma.cargoAlumno.update({
                                where: { id: cargoEncontrado.id },
                                data: { monto_pagado: nuevoPagado, monto_pendiente: nuevoPendiente, estatus: nuevoEstatus }
                            });
                            
                            cargosAplicados.push({ cargo: cargoEncontrado, montoAplicado: aplicar });
                        }
                    }
                    
                    // Si sobró monto (Saldo a favor)
                    if (montoRestante > 0) {
                        const concDef = await prisma.conceptoCobro.findFirst({ where: { nombre: 'Colegiatura' } });
                        const concId = concDef ? concDef.id : BigInt(1);
                        
                        // Creamos un cargo virtual negativo para representar el saldo a favor
                        const cargoSaldoAFavor = await prisma.cargoAlumno.create({
                            data: {
                                alumno_id: alumnoObj.id,
                                concepto_id: concId,
                                codigo_ficha: \`SAF-\${String(Math.floor(Math.random()*90000+10000))}\`,
                                referencia_bancaria: \`SAF-\${referencia_bancaria || Date.now()}\`,
                                monto_total: -montoRestante,
                                monto_pagado: 0,
                                monto_pendiente: -montoRestante,
                                fecha_emision: new Date(),
                                fecha_vencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // Válido por 1 año
                                estatus: 'PENDIENTE', // PENDIENTE para que descuente en futuros adeudos
                                grupo_id: grupo_id ? BigInt(grupo_id) : alumnoObj.grupo_id
                            }
                        });
                        
                        cargosAplicados.push({ cargo: cargoSaldoAFavor, montoAplicado: montoRestante, esSaldoAFavor: true });
                    }
                    
                    // Receptor 
                    let receptorId = alumnoObj.receptor_id;
                    let receptorObj = alumnoObj.receptor;

                    if (!receptorId || !receptorObj) {
                        let receptorGenerico = await prisma.receptors.findFirst({ where: { rfc: 'XAXX010101000' } });
                        if (!receptorGenerico) {
                            receptorGenerico = await prisma.receptors.create({
                                data: {
                                    rfc: 'XAXX010101000',
                                    nombre: 'PUBLICO EN GENERAL',
                                    domicilio_fiscal_receptor: emisor.lugar_expedicion || '01000',
                                    regimen_fiscal_receptor: '616',
                                    uso_cfdi: 'S01'
                                }
                            });
                        }
                        receptorId = receptorGenerico.id;
                        receptorObj = receptorGenerico;
                    }

                    const { serie, folio } = await obtenerSiguienteFolioSerie(emisor.id);

                    const comprobanteAuto = await prisma.comprobantes.create({
                        data: {
                            emisor_id: emisor.id,
                            receptor_id: receptorId,
                            grupo_id: emisor.grupo_id,
                            version: '4.0',
                            serie: serie,
                            folio: folio,
                            fecha: getFechaLocalSAT(),
                            forma_pago: '03',
                            metodo_pago: 'PUE',
                            moneda: 'MXN',
                            tipo_cambio: '1',
                            exportacion: '01',
                            tipo_de_comprobante: 'I',
                            uso_cfdi: receptorObj.uso_cfdi || 'S01',
                            lugar_expedicion: emisor.lugar_expedicion || '01000',
                            sub_total: Number(monto),
                            sub_total_string: String(Number(monto).toFixed(2)),
                            total: Number(monto),
                            total_string: String(Number(monto).toFixed(2)),
                            descuento: 0,
                            descuento_string: '0',
                            estatus: 'PENDIENTE'
                        }
                    });

                    const carreraStr = alumnoObj.programa_academico?.nombre || alumnoObj.carrera || 'GENERAL';
                    const nombreStr = \`\${alumnoObj.nombre} \${alumnoObj.apellido_paterno} \${alumnoObj.apellido_materno || ''}\`.trim();
                    const dateForMonth = fecha_pago ? new Date(fecha_pago) : new Date();
                    const currentMonth = dateForMonth.toLocaleString('es-MX', { month: 'long', year: 'numeric' }).toUpperCase();
                    
                    const descConcepto = \`PAGO DE MULTIPLES FICHAS / SALDO A FAVOR DE \${carreraStr} REALIZADO EL MES DE \${currentMonth} , DEL ESTUDIANTE \${nombreStr}, CURP: \${alumnoObj.curp || 'N/A'}, MATRICULA: \${alumnoObj.matricula || 'N/A'}, PROGRAMA CON RVOE SEP NO. \${alumnoObj.programa_academico?.rvoe || 'N/A'}\`.toUpperCase();

                    await crearEstructuraCompletaCFDI({
                        comprobante: comprobanteAuto,
                        emisor,
                        receptor: receptorObj,
                        descripcionConcepto: descConcepto,
                        monto: Number(monto),
                        grupoId: emisor.grupo_id
                    });

                    // Registrar cada pago contra los cargos
                    for (const { cargo, montoAplicado } of cargosAplicados) {
                        await prisma.pagoAlumno.create({
                            data: {
                                alumno_id: alumnoObj.id,
                                cargo_id: cargo.id,
                                fecha_pago: fecha_pago ? new Date(fecha_pago) : new Date(),
                                monto: montoAplicado,
                                referencia_bancaria: referencia_bancaria || \`MANUAL-\${Date.now()}\`,
                                metodo_pago: '03',
                                estado_conciliacion: 'CONCILIADO',
                                comprobante_id: comprobanteAuto.id,
                                grupo_id: grupo_id ? BigInt(grupo_id) : emisor.grupo_id
                            }
                        });
                    }

                    procesados.push({
                        alumno_nombre: \`\${alumnoObj.nombre} \${alumnoObj.apellido_paterno}\`,
                        comprobante_folio: \`\${serie}-\${folio}\`
                    });
                }

                return NextResponse.json({
                    mensaje: \`Se han guardado y generado \${procesados.length} pre-facturas exitosamente.\`,
                    total_procesados: procesados.length,
                    procesados
                }, { status: 200 });
            }`;

const startIndex = content.indexOf("if (action === 'CONFIRMAR_MASIVO') {");
if (startIndex !== -1) {
    const endIndex = content.indexOf("return NextResponse.json({ error: 'Acción no reconocida en conciliación.' }, { status: 400 });", startIndex);
    content = content.substring(0, startIndex) + newConfirmarMasivo + "\\n\\n            " + content.substring(endIndex);
    fs.writeFileSync('c:/Users/macal/Wise/frontend/src/app/api/cobranza/conciliacion/route.js', content);
    console.log("Success route.js updated");
} else {
    console.log("Not found");
}
