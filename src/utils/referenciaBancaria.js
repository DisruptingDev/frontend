/**
 * Utilidad para la generación y validación de referencias bancarias únicas
 * (Algoritmo Estándar Módulo 10 para Bancos de México: BBVA, Banamex, Santander, Banorte)
 */

/**
 * Calcula el dígito verificador Módulo 10 con ponderación 2,1,2,1...
 * @param {string} cadenaNumerica 
 * @returns {number}
 */
export function calcularDigitoVerificadorModulo10(cadenaNumerica) {
    const digitos = cadenaNumerica.replace(/\D/g, '').split('').map(Number);
    let suma = 0;

    let ponderador = 2;
    for (let i = digitos.length - 1; i >= 0; i--) {
        let mult = digitos[i] * ponderador;
        if (mult > 9) {
            mult = Math.floor(mult / 10) + (mult % 10);
        }
        suma += mult;
        ponderador = ponderador === 2 ? 1 : 2;
    }

    const residuo = suma % 10;
    return residuo === 0 ? 0 : 10 - residuo;
}

/**
 * Genera una referencia bancaria única estructurada:
 * [Matrícula Numérica] + [AñoMesDía YYMMDD] + [ConceptoID 2d] + [Dígito Verificador]
 * 
 * @param {Object} params
 * @param {string} params.matricula - Matrícula o ID del Alumno
 * @param {Date|string} params.fechaVencimiento - Fecha límite de pago
 * @param {number|string} params.conceptoId - ID del concepto de cobro
 * @returns {string} Referencia bancaria válida
 */
export function generarReferenciaBancaria({ matricula, fechaVencimiento, conceptoId }) {
    // 1. Sanitizar matrícula a solo números (si tiene letras, convierte caracteres a código ASCII módulo 10)
    const matriculaLimpia = String(matricula)
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .split('')
        .map(char => {
            if (/\d/.test(char)) return char;
            return (char.charCodeAt(0) % 10).toString();
        })
        .join('')
        .padStart(8, '0')
        .slice(-8);

    // 2. Formatear Fecha YYMMDD
    const dateObj = new Date(fechaVencimiento);
    const year = String(dateObj.getFullYear()).slice(-2);
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const fechaFormatted = `${year}${month}${day}`;

    // 3. Formatear ID de Concepto (2 dígitos)
    const conceptoFormatted = String(conceptoId).padStart(2, '0').slice(-2);

    // 4. Cadena Base (Matrícula 8d + Fecha 6d + Concepto 2d = 16d)
    const cadenaBase = `${matriculaLimpia}${fechaFormatted}${conceptoFormatted}`;

    // 5. Calcular Dígito Verificador Módulo 10
    const dv = calcularDigitoVerificadorModulo10(cadenaBase);

    return `${cadenaBase}${dv}`;
}

/**
 * Valida la integridad de una referencia bancaria
 * @param {string} referencia 
 * @returns {boolean}
 */
export function validarReferenciaBancaria(referencia) {
    if (!referencia || typeof referencia !== 'string') return false;
    const refLimpia = referencia.trim();
    if (refLimpia.length < 5) return false;

    const base = refLimpia.slice(0, -1);
    const dvEsperado = Number(refLimpia.slice(-1));
    const dvCalculado = calcularDigitoVerificadorModulo10(base);

    return dvEsperado === dvCalculado;
}
