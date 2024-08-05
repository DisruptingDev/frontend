export default function CrearConcepto(getValues, impuestos) {

    console.log(impuestos);

    let claveProdServ = getValues("ClaveProdServ")
    let claveUnidad = getValues("ClaveUnidad")

    if (claveProdServ !== "Default") {
        claveProdServ = JSON.parse(claveProdServ)
    }

    if (claveUnidad !== "Default") {
        claveUnidad = JSON.parse(claveUnidad)
    }

    const concepto = {
        ClaveProdServ: claveProdServ,
        ClaveUnidad: claveUnidad,
        Descripcion: getValues("Descripcion"),
        Cantidad: getValues("Cantidad"),
        ValorUnitario: getValues("ValorUnitario"),
        Descuento: getValues("Descuento"),
        Subtotal: getValues("Subtotal"),
        Impuestos: impuestos
    };

    return concepto
}
