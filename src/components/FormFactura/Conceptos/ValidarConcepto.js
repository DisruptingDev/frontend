export default function validarConcepto(concepto) {
    // try {
    //     if (concepto.ClaveProdServ !== "Default") {
    //         concepto.ClaveProdServ = JSON.parse(concepto.ClaveProdServ);
    //     }
    //     if (concepto.ClaveUnidad !== "Default") {
    //         concepto.ClaveUnidad = JSON.parse(concepto.ClaveUnidad);
    //     }
    // } catch (e) {
    //     return { isValid: false, message: 'Invalid JSON in ClaveProdServ or ClaveUnidad' };
    // }
    console.log("Concepto validar", concepto.ObjetoImpuesto);
    const requiredFields = ['Descripcion', 'Cantidad', 'ValorUnitario', 'Descuento', 'Subtotal', 'ObjetoImpuesto'];
    for (let field of requiredFields) {
        if (field === 'Descuento') {
            // Permitir que Descuento sea 0
            if (concepto[field] === undefined || concepto[field] === null || concepto[field] === '') {
                return { isValid: false, message: `${field} is required and cannot be empty or undefined` };
            }
        } else {
            // Para otros campos, aplicar la validación general
            if (!concepto[field] && concepto[field] !== 0) {
                return { isValid: false, message: `${field} is required and cannot be empty` };
            }
        }
    }

    // Validar estructura de impuestos
    if (concepto.ObjetoImpuesto !== "01") {
        const impuestosFields = ['Tasa', 'BaseImpuesto', 'Monto', 'Impuesto'];
        for (let i = 0; i < concepto.Impuestos.length; i++) {
            const impuestos = concepto.Impuestos[i];
            for (let field of impuestosFields) {
                if (impuestos[field] === undefined || impuestos[field] === '' || impuestos[field] === 'Default') {
                    return { isValid: false, message: `Impuestos field ${field} in item ${i} is required and cannot be empty, undefined or Default` };
                }
            }
        }
    }


    return { isValid: true, message: 'Concepto is valid' };
}
