/**
 * Catálogos Oficiales del SAT (CFDI 4.0) para Cobranza y Facturación
 * Formato estándar: clave - descripcion
 */

export const REGIMENES_FISCALES = [
    { clave: '601', descripcion: '601 - General de Ley Personas Morales' },
    { clave: '603', descripcion: '603 - Personas Morales con Fines no Lucrativos' },
    { clave: '605', descripcion: '605 - Sueldos y Salarios e Ingresos por Prestación de Servicios Personales' },
    { clave: '606', descripcion: '606 - Arrendamiento' },
    { clave: '607', descripcion: '607 - Régimen de Enajenación o Adquisición de Bienes' },
    { clave: '608', descripcion: '608 - Demás ingresos' },
    { clave: '610', descripcion: '610 - Residentes en el Extranjero sin Establecimiento Permanente en México' },
    { clave: '611', descripcion: '611 - Ingresos por Dividendos (socios y accionistas)' },
    { clave: '612', descripcion: '612 - Personas Físicas con Actividades Empresariales y Profesionales' },
    { clave: '614', descripcion: '614 - Ingresos por intereses' },
    { clave: '615', descripcion: '615 - Régimen de los ingresos por obtención de premios' },
    { clave: '616', descripcion: '616 - Sin obligaciones fiscales' },
    { clave: '621', descripcion: '621 - Incorporación Fiscal' },
    { clave: '625', descripcion: '625 - Régimen Simplificado de Confianza (RESICO Personas Físicas)' },
    { clave: '626', descripcion: '626 - Régimen Simplificado de Confianza (RESICO Personas Morales)' }
];

export const USOS_CFDI = [
    { clave: 'D10', descripcion: 'D10 - Pagos por servicios educativos (colegiaturas)' },
    { clave: 'S01', descripcion: 'S01 - Sin efectos fiscales' },
    { clave: 'G01', descripcion: 'G01 - Adquisición de mercancías' },
    { clave: 'G02', descripcion: 'G02 - Devoluciones, descuentos o bonificaciones' },
    { clave: 'G03', descripcion: 'G03 - Gastos en general' },
    { clave: 'P01', descripcion: 'P01 - Por definir' },
    { clave: 'CP01', descripcion: 'CP01 - Pagos' },
    { clave: 'CN01', descripcion: 'CN01 - Nómina' }
];

export function getDescripcionRegimen(clave) {
    const reg = REGIMENES_FISCALES.find(r => r.clave === String(clave).trim());
    return reg ? reg.descripcion : `${clave} - Régimen Fiscal`;
}

export function getDescripcionUsoCFDI(clave) {
    const uso = USOS_CFDI.find(u => u.clave === String(clave).trim());
    return uso ? uso.descripcion : `${clave} - Uso de CFDI`;
}
