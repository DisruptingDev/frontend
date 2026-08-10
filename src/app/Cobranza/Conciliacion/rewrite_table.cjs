const fs = require('fs');

let content = fs.readFileSync('c:/Users/macal/Wise/frontend/src/app/Cobranza/Conciliacion/page.jsx', 'utf-8');

const oldTableBodyStr = `                                                    <TableBody>
                                                        {resultado.pagos.map((item, idx) => (
                                                            <TableRow key={idx} hover selected={item.estado_conciliacion === 'REVISION'}>
                                                                <TableCell sx={{ fontFamily: 'monospace' }}>
                                                                    <Typography variant="body2" fontWeight="bold">{item.referencia_bancaria}</Typography>
                                                                    {item.descripcion && (
                                                                        <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                                                                            {item.descripcion}
                                                                        </Typography>
                                                                    )}
                                                                </TableCell>
                                                                <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                                    $\{parseMonto(item.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                </TableCell>
                                                                <TableCell>
                                                                    {item.estado_conciliacion === 'CONCILIADO' ? (
                                                                        <Chip
                                                                            label={item.metodo_matcheo ? \`CONCILIADO (\${item.metodo_matcheo})\` : 'CONCILIADO'}
                                                                            color="success"
                                                                            size="small"
                                                                            icon={<CheckIcon />}
                                                                        />
                                                                    ) : (
                                                                        <Chip label="⚠️ SIN MATCHEAR" color="warning" size="small" icon={<WarningIcon />} />
                                                                    )}
                                                                </TableCell>
                                                                <TableCell sx={{ minWidth: 260 }}>
                                                                    {item.estado_conciliacion === 'CONCILIADO' ? (
                                                                        <Box>
                                                                            <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                                                {item.alumno_nombre}
                                                                            </Typography>
                                                                            {item.comprobante_folio && (
                                                                                <Typography variant="caption" color="textSecondary">
                                                                                    Pre-factura {item.comprobante_folio}
                                                                                </Typography>
                                                                            )}
                                                                        </Box>
                                                                    ) : (
                                                                        /* ASIGNACIÓN INTERACTIVA DE ALUMNO PARA FILAS SIN MATCH */
                                                                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                                                            <FormControl size="small" sx={{ flexGrow: 1, minWidth: 180 }}>
                                                                                <InputLabel>Asignar Alumno...</InputLabel>
                                                                                <Select
                                                                                    value={alumnoSeleccionadoPorFila[idx] || ''}
                                                                                    label="Asignar Alumno..."
                                                                                    onChange={(e) => setAlumnoSeleccionadoPorFila({
                                                                                        ...alumnoSeleccionadoPorFila,
                                                                                        [idx]: e.target.value
                                                                                    })}
                                                                                >
                                                                                    {alumnos.map(al => (
                                                                                        <MenuItem key={al.id} value={al.id}>
                                                                                            {al.nombre} {al.apellido_paterno} ({al.matricula})
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                </Select>
                                                                            </FormControl>
                                                                            <Tooltip title="Asignar este pago al alumno seleccionado y generar su Pre-factura">
                                                                                <Button
                                                                                    variant="contained"
                                                                                    color="warning"
                                                                                    size="small"
                                                                                    disabled={asignandoFilaIdx === idx || !alumnoSeleccionadoPorFila[idx]}
                                                                                    onClick={() => handleAsignarAlumnoManual(item, idx)}
                                                                                    startIcon={asignandoFilaIdx === idx ? <CircularProgress size={14} color="inherit" /> : <PersonAddIcon />}
                                                                                    sx={{ textTransform: 'none', px: 1.5, whiteSpace: 'nowrap' }}
                                                                                >
                                                                                    {asignandoFilaIdx === idx ? 'Guardando...' : 'Asignar'}
                                                                                </Button>
                                                                            </Tooltip>
                                                                        </Box>
                                                                    )}
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </TableBody>`;

const newTableBodyStr = `                                                    <TableBody>
                                                        {resultado.pagos.map((item, idx) => {
                                                            const isSugerido = item.estado_conciliacion === 'SUGERIDO';
                                                            const alumnoIdActual = isSugerido ? item.alumno_id : alumnoSeleccionadoPorFila[idx];
                                                            
                                                            let cargosDisponibles = [];
                                                            if (isSugerido) {
                                                                cargosDisponibles = item.cargos_pendientes || [];
                                                            } else if (alumnoIdActual) {
                                                                cargosDisponibles = cargosPendientesGlobales.filter(c => c.alumno_id.toString() === alumnoIdActual.toString());
                                                            }

                                                            const seleccionadosIds = cargosSeleccionadosPorFila[idx] || [];
                                                            
                                                            let sumaMontoCargos = 0;
                                                            seleccionadosIds.forEach(id => {
                                                                const cargo = cargosDisponibles.find(c => c.id.toString() === id.toString());
                                                                if (cargo) sumaMontoCargos += parseMonto(cargo.monto_pendiente);
                                                            });

                                                            const deposito = parseMonto(item.monto);
                                                            const saldoAFavor = Math.max(0, deposito - sumaMontoCargos);

                                                            return (
                                                                <TableRow key={idx} hover selected={!isSugerido}>
                                                                    <TableCell sx={{ fontFamily: 'monospace' }}>
                                                                        <Typography variant="body2" fontWeight="bold">{item.referencia_bancaria}</Typography>
                                                                        {item.descripcion && (
                                                                            <Typography variant="caption" color="textSecondary" display="block" noWrap sx={{ maxWidth: 220 }}>
                                                                                {item.descripcion}
                                                                            </Typography>
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                                                                        $\${deposito.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                    </TableCell>
                                                                    <TableCell>
                                                                        {isSugerido ? (
                                                                            <Chip
                                                                                label={item.metodo_matcheo ? \`SUGERIDO (\${item.metodo_matcheo})\` : 'SUGERIDO'}
                                                                                color="success"
                                                                                size="small"
                                                                                icon={<CheckIcon />}
                                                                            />
                                                                        ) : (
                                                                            <Chip label="⚠️ REVISIÓN MANUAL" color="warning" size="small" icon={<WarningIcon />} />
                                                                        )}
                                                                    </TableCell>
                                                                    <TableCell sx={{ minWidth: 400 }}>
                                                                        {isSugerido ? (
                                                                            <Box sx={{ mb: 1 }}>
                                                                                <Typography variant="body2" fontWeight="bold" color="success.dark">
                                                                                    {item.alumno_nombre}
                                                                                </Typography>
                                                                                <Typography variant="caption" color="textSecondary">
                                                                                    Matrícula: {item.alumno_matricula}
                                                                                </Typography>
                                                                            </Box>
                                                                        ) : (
                                                                            <FormControl size="small" sx={{ width: '100%', mb: 1 }}>
                                                                                <InputLabel>Asignar Alumno...</InputLabel>
                                                                                <Select
                                                                                    value={alumnoSeleccionadoPorFila[idx] || ''}
                                                                                    label="Asignar Alumno..."
                                                                                    onChange={(e) => {
                                                                                        setAlumnoSeleccionadoPorFila({
                                                                                            ...alumnoSeleccionadoPorFila,
                                                                                            [idx]: e.target.value
                                                                                        });
                                                                                        // Al cambiar de alumno, limpiamos sus cargos seleccionados
                                                                                        setCargosSeleccionadosPorFila({
                                                                                            ...cargosSeleccionadosPorFila,
                                                                                            [idx]: []
                                                                                        });
                                                                                    }}
                                                                                >
                                                                                    {alumnos.map(al => (
                                                                                        <MenuItem key={al.id} value={al.id}>
                                                                                            {al.nombre} {al.apellido_paterno} ({al.matricula})
                                                                                        </MenuItem>
                                                                                    ))}
                                                                                </Select>
                                                                            </FormControl>
                                                                        )}

                                                                        {alumnoIdActual && (
                                                                            <Box sx={{ mt: 1, backgroundColor: '#f9f9f9', p: 1, borderRadius: 1 }}>
                                                                                <FormControl size="small" sx={{ width: '100%', mb: 1 }}>
                                                                                    <InputLabel>Fichas / Cargos a Pagar</InputLabel>
                                                                                    <Select
                                                                                        multiple
                                                                                        value={seleccionadosIds}
                                                                                        label="Fichas / Cargos a Pagar"
                                                                                        onChange={(e) => handleCargoSelectChange(idx, e)}
                                                                                        renderValue={(selected) => (
                                                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                                                {selected.map((value) => {
                                                                                                    const c = cargosDisponibles.find(cd => cd.id.toString() === value.toString());
                                                                                                    return <Chip key={value} label={c ? \`\${c.concepto?.nombre || 'Cargo'} ($\${parseMonto(c.monto_pendiente).toFixed(2)})\` : value} size="small" />;
                                                                                                })}
                                                                                            </Box>
                                                                                        )}
                                                                                    >
                                                                                        {cargosDisponibles.map(c => (
                                                                                            <MenuItem key={c.id} value={c.id.toString()}>
                                                                                                {c.concepto?.nombre || 'Colegiatura'} - $\${parseMonto(c.monto_pendiente).toFixed(2)} {c.codigo_ficha ? \`(\${c.codigo_ficha})\` : ''}
                                                                                            </MenuItem>
                                                                                        ))}
                                                                                        {cargosDisponibles.length === 0 && (
                                                                                            <MenuItem disabled value="">El alumno no tiene cargos pendientes</MenuItem>
                                                                                        )}
                                                                                    </Select>
                                                                                </FormControl>
                                                                                
                                                                                {saldoAFavor > 0 && seleccionadosIds.length > 0 && (
                                                                                    <Alert severity="info" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                        <Typography variant="caption" fontWeight="bold">
                                                                                            Se generará Saldo a Favor de $\${saldoAFavor.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                                                                        </Typography>
                                                                                    </Alert>
                                                                                )}
                                                                                {sumaMontoCargos > deposito && seleccionadosIds.length > 0 && (
                                                                                    <Alert severity="warning" sx={{ py: 0, px: 1, '& .MuiAlert-message': { p: 0.5 } }}>
                                                                                        <Typography variant="caption">
                                                                                            Faltarán $\${(sumaMontoCargos - deposito).toLocaleString('es-MX', { minimumFractionDigits: 2 })} para liquidar fichas
                                                                                        </Typography>
                                                                                    </Alert>
                                                                                )}
                                                                            </Box>
                                                                        )}
                                                                    </TableCell>
                                                                </TableRow>
                                                            );
                                                        })}
                                                    </TableBody>`;

// Reemplazar usando indexOf y substring para evitar problemas de RegExp
const startIndex = content.indexOf('<TableBody>');
if (startIndex !== -1) {
    const tableBodySlice = content.substring(startIndex, startIndex + 5000);
    const endIndex = content.indexOf('</TableBody>', startIndex) + 12;
    content = content.substring(0, startIndex) + newTableBodyStr + content.substring(endIndex);
    fs.writeFileSync('c:/Users/macal/Wise/frontend/src/app/Cobranza/Conciliacion/page.jsx', content);
    console.log("Success");
} else {
    console.log("TableBody not found");
}
