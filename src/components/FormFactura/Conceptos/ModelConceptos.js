import validarConcepto from "./ValidarConcepto.js"
import separarImpuestos from "./SepararImpuestos.js"

export default function CrearConcepto(getValues, impuestos) {

    let concepto = {
        ClaveProdServ: getValues("ClaveProdServ"),
        ClaveUnidad: getValues("ClaveUnidad"),
        Descripcion: getValues("Descripcion"),
        Cantidad: getValues("Cantidad"),
        ValorUnitario: parseFloat(getValues("ValorUnitario")),
        Descuento: parseFloat(getValues("Descuento")) || 0,
        Subtotal: getValues("Subtotal"),
        Impuestos: impuestos,

        Retenciones: [],
        Traslados: [],
        TotalRetenciones: 0,
        TotalTraslados: 0
    };
    console.log("Conceptos",concepto);

    const resultado = validarConcepto(concepto);

    if (resultado.isValid) {
        console.log('Concepto is valid:', concepto);
        concepto = separarImpuestos(concepto)
    } else {
        console.log('Validation failed:', resultado.message);
        return "Error"
    }

    return concepto
}
