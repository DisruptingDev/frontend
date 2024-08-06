export default function validarConcepto(concepto) {
    try {
        if (concepto.ClaveProdServ !== "Default") {
            concepto.ClaveProdServ = JSON.parse(concepto.ClaveProdServ);
        }
        if (concepto.ClaveUnidad !== "Default") {
            concepto.ClaveUnidad = JSON.parse(concepto.ClaveUnidad);
        }
    } catch (e) {
        return { isValid: false, message: 'Invalid JSON in ClaveProdServ or ClaveUnidad' };
    }

    const requiredFields = ['Descripcion', 'Cantidad', 'ValorUnitario', 'Descuento', 'Subtotal'];
    for (let field of requiredFields) {
        if (!concepto[field]) {
            return { isValid: false, message: `${field} is required and cannot be empty` };
        }
    }

    // Validar estructura de impuestos
    const impuestosFields = ['Tasa', 'BaseImpuesto', 'Monto', 'ObjetoImpuesto', 'Impuesto'];
    for (let i = 0; i < concepto.Impuestos.length; i++) {
        const impuestos = concepto.Impuestos[i];
        for (let field of impuestosFields) {
            if (impuestos[field] === undefined || impuestos[field] === '' || impuestos[field] === 'Default') {
                return { isValid: false, message: `Impuestos field ${field} in item ${i} is required and cannot be empty, undefined or Default` };
            }
        }
    }

    return { isValid: true, message: 'Concepto is valid' };
}
