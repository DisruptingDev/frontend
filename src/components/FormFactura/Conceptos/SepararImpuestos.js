
export default function SepararImpuestos(concepto) {
    let impuestos = concepto.Impuestos || [];
    let retenciones = [];
    let traslados = [];
    let totalRetenciones = 0;
    let totalTraslados = 0;

    for (let impuesto of impuestos) {
        const monto = parseFloat(impuesto.Monto || impuesto.Importe || 0) || 0;
        const tipoNorm = String(impuesto.Tipo || impuesto.tipo || '').toLowerCase();
        const nombreNorm = String(impuesto.NombreImpuesto || impuesto.Impuesto || '').toUpperCase();
        const claveNorm = String(impuesto.ImpuestoClave || '').trim();

        // Es retención si explícitamente se marca como tal, o si es ISR (001) o retención de IVA
        const esRetencion = tipoNorm === 'retencion' || (tipoNorm !== 'traslado' && (nombreNorm.includes('ISR') || claveNorm === '001'));

        if (!esRetencion) {
            traslados.push({
                ...impuesto,
                Tipo: 'Traslado'
            });
            totalTraslados += monto;
        } else {
            retenciones.push({
                ...impuesto,
                Tipo: 'Retencion'
            });
            totalRetenciones += monto;
        }
    }

    concepto.Retenciones = retenciones;
    concepto.Traslados = traslados;
    concepto.TotalRetenciones = totalRetenciones;
    concepto.TotalTraslados = totalTraslados;

    return concepto;
}
