import validarConcepto from "./ValidarConcepto.js"
import separarImpuestos from "./SepararImpuestos.js"

export default function CrearConcepto(getValues, impuestos) {

    let concepto = {
        Nombre: getValues("Nombre"),
        ClaveProdServ: getValues("ClaveProdServ"),
        ClaveUnidad: getValues("ClaveUnidad"),
        Unidad: getValues("Unidad"),
        Descripcion: getValues("Descripcion"),
        Cantidad: getValues("Cantidad"),
        ValorUnitario: parseFloat(getValues("ValorUnitario")),
        Descuento: parseFloat(getValues("Descuento")) || 0,
        Subtotal: getValues("Subtotal"),
        ObjetoImpuesto: getValues("ObjetoImpuesto"),
        Impuestos: getValues("ObjetoImpuesto") === "01" ? [] : impuestos,

        Retenciones: [],
        Traslados: [],
        TotalRetenciones: 0,
        TotalTraslados: 0
    };

    const resultado = validarConcepto(concepto);

    if (resultado.isValid) {
        if(concepto.ObjetoImpuesto !== "01"){
            concepto = separarImpuestos(concepto)
        }
        
    } else {
        return "Error"
    }

    return concepto
}
