import validarConcepto from "./ValidarConcepto.js"
import separarImpuestos from "./SepararImpuestos.js"

export default function CrearConcepto(getValues, impuestos) {

    console.log("Creando concepto objeto impuesto", getValues("ObjetoImpuesto"));
    let concepto = {
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
    console.log("Conceptos",concepto);

    const resultado = validarConcepto(concepto);

    if (resultado.isValid) {
        console.log('Concepto is valid:', concepto);
        if(concepto.ObjetoImpuesto !== "01"){
            console.log("Separando impuestos");
            concepto = separarImpuestos(concepto)
        }
        
    } else {
        console.log('Validation failed:', resultado.message);
        return "Error"
    }

    return concepto
}
