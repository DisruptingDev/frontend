export function CalculosFinales(conceptos) {
    let subtotalfinal = 0
    let descuentofinal = 0
    let retencionesfinal = 0
    let trasladosfinal = 0
    let totalfinal = 0

    for (let concepto of conceptos) {
        console.log(concepto);
        subtotalfinal += concepto.Subtotal
        descuentofinal += concepto.Descuento
        retencionesfinal += concepto.TotalRetenciones
        trasladosfinal += concepto.TotalTraslados
        totalfinal += concepto.Subtotal - concepto.TotalRetenciones + concepto.TotalTraslados
    } 

    return {
        SubTotalFinal: subtotalfinal,
        DescuentoFinal: descuentofinal,
        RetencionesFinal: retencionesfinal,
        TrasladosFinal: trasladosfinal,
        TotalFinal: totalfinal
    }
}

