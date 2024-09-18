
export default function SepararImpuestos(concepto) {
    let impuestos = concepto.Impuestos;
    let retenciones = [];
    let traslados = [];
    let totalRetenciones = 0;
    let totalTraslados = 0;
    console.log("Impuestos: ", impuestos);

    for (let impuesto of impuestos) {
        // Asumiendo que "Tipo" es parte del objeto `impuesto`, no es necesario parsear "Impuesto"
        // Por ejemplo, "impuesto.Tipo" debería estar disponible directamente
        if (impuesto.Tipo === "Traslado") {
            traslados.push(impuesto);
            totalTraslados += parseFloat(impuesto.Monto);
        } else {
            retenciones.push(impuesto);
            totalRetenciones -= parseFloat(impuesto.Monto);
        }
    }

    concepto.Retenciones = retenciones;
    concepto.Traslados = traslados;
    concepto.TotalRetenciones = totalRetenciones;
    concepto.TotalTraslados = totalTraslados;

    return concepto;
}
