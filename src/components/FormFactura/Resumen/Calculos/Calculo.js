export function CalculosFinales(conceptos, impuestosLocales = []) {
    let subtotalfinal = 0;
    let descuentofinal = 0;
    let retencionesfinal = 0;
    let trasladosfinal = 0;

    for (let concepto of conceptos) {
        subtotalfinal += Number(concepto.Subtotal || 0);
        descuentofinal += Number(concepto.Descuento || 0);
        retencionesfinal += Number(concepto.TotalRetenciones || 0);
        trasladosfinal += Number(concepto.TotalTraslados || 0);
    } 

    // Cálculo de Impuestos Locales (traslados y retenciones)
    let trasladosLocalesFinal = 0;
    let retencionesLocalesFinal = 0;

    if (Array.isArray(impuestosLocales) && impuestosLocales.length > 0) {
        for (let imp of impuestosLocales) {
            const monto = Math.abs(Number(imp.Importe || 0));
            if (imp.Tipo === 'Traslado') {
                trasladosLocalesFinal += monto;
            } else if (imp.Tipo === 'Retencion') {
                retencionesLocalesFinal += monto;
            }
        }
    }

    // Regla SAT CFDI 4.0 con complemento de Impuestos Locales
    const totalfinal = subtotalfinal - descuentofinal - retencionesfinal + trasladosfinal + trasladosLocalesFinal - retencionesLocalesFinal;

    return {
        SubTotalFinal: subtotalfinal,
        DescuentoFinal: descuentofinal,
        RetencionesFinal: retencionesfinal,
        TrasladosFinal: trasladosfinal,
        TrasladosLocalesFinal: trasladosLocalesFinal,
        RetencionesLocalesFinal: retencionesLocalesFinal,
        TotalFinal: totalfinal
    };
}


