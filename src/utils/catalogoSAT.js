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

export const FORMAS_PAGO = [
    { clave: '01', descripcion: '01 - Efectivo' },
    { clave: '02', descripcion: '02 - Cheque nominativo' },
    { clave: '03', descripcion: '03 - Transferencia electrónica de fondos' },
    { clave: '04', descripcion: '04 - Tarjeta de crédito' },
    { clave: '05', descripcion: '05 - Monedero electrónico' },
    { clave: '06', descripcion: '06 - Dinero electrónico' },
    { clave: '08', descripcion: '08 - Vales de despensa' },
    { clave: '12', descripcion: '12 - Dación en pago' },
    { clave: '13', descripcion: '13 - Pago por subrogación' },
    { clave: '14', descripcion: '14 - Pago por consignación' },
    { clave: '15', descripcion: '15 - Condonación' },
    { clave: '17', descripcion: '17 - Compensación' },
    { clave: '23', descripcion: '23 - Novación' },
    { clave: '24', descripcion: '24 - Confusión' },
    { clave: '25', descripcion: '25 - Remisión de deuda' },
    { clave: '26', descripcion: '26 - Prescripción o caducidad' },
    { clave: '27', descripcion: '27 - A satisfacción del acreedor' },
    { clave: '28', descripcion: '28 - Tarjeta de débito' },
    { clave: '29', descripcion: '29 - Tarjeta de servicios' },
    { clave: '30', descripcion: '30 - Aplicación de anticipos' },
    { clave: '31', descripcion: '31 - Intermediario pagos' },
    { clave: '99', descripcion: '99 - Por definir' }
];

export const METODOS_PAGO = [
    { clave: 'PUE', descripcion: 'PUE - Pago en una sola exhibición' },
    { clave: 'PPD', descripcion: 'PPD - Pago en parcialidades o diferido' }
];

export function getDescripcionRegimen(clave) {
    if (!clave) return 'Sin régimen fiscal';
    const reg = REGIMENES_FISCALES.find(r => r.clave === String(clave).trim());
    return reg ? reg.descripcion : `${clave} - Régimen Fiscal`;
}

export function getDescripcionUsoCFDI(clave) {
    if (!clave) return 'S01 - Sin efectos fiscales';
    const uso = USOS_CFDI.find(u => u.clave === String(clave).trim());
    return uso ? uso.descripcion : `${clave} - Uso de CFDI`;
}

export function getDescripcionFormaPago(clave) {
    if (!clave) return '03 - Transferencia electrónica de fondos';
    const fp = FORMAS_PAGO.find(f => f.clave === String(clave).trim());
    return fp ? fp.descripcion : `${clave} - Forma de Pago`;
}

export function getDescripcionMetodoPago(clave) {
    if (!clave) return 'PUE - Pago en una sola exhibición';
    const mp = METODOS_PAGO.find(m => m.clave.toUpperCase() === String(clave).trim().toUpperCase());
    return mp ? mp.descripcion : `${clave} - Método de Pago`;
}

