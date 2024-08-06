
export default function SepararImpuestos(concepto) {
    let impuestos = concepto.Impuestos
    let retenciones = []
    let traslados = []
    let totalRetenciones = 0
    let totalTraslados = 0

    for (let impuesto of impuestos) {
        let impuestos_struct = JSON.parse(impuesto.Impuesto) 

        if (impuestos_struct.Tipo === "Traslado") {
            traslados.push(impuesto) 
            totalTraslados += impuesto.Monto
        }
        else {
            retenciones.push(impuesto) 
            totalRetenciones += impuesto.Monto
        }
    }

    concepto.Retenciones = retenciones
    concepto.Traslados = traslados
    concepto.TotalRetenciones = totalRetenciones
    concepto.TotalTraslados = totalTraslados

    return concepto
}
