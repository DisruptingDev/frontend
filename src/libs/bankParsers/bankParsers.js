import * as XLSX from 'xlsx';

function normalizar(str) {
    if (!str) return '';
    return String(str)
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .trim();
}

function parseMonto(val) {
    if (val === null || val === undefined) return 0;
    if (typeof val === 'number') return val;
    const str = String(val).replace(/[^0-9.-]/g, '');
    const num = parseFloat(str);
    return isNaN(num) ? 0 : Math.abs(num);
}

function parseFecha(val) {
    if (!val) return new Date();
    if (val instanceof Date) return isNaN(val.getTime()) ? new Date() : val;
    if (typeof val === 'number') {
        const d = new Date(Math.round((val - 25569) * 86400 * 1000));
        return isNaN(d.getTime()) ? new Date() : d;
    }
    const str = String(val).trim();
    if (str.includes('/')) {
        const parts = str.split('/');
        if (parts[0].length === 4) {
            const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
            if (!isNaN(d.getTime())) return d;
        } else if (parts[2]) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            const d = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            if (!isNaN(d.getTime())) return d;
        }
    }
    if (str.includes('-')) {
        const parts = str.split('-');
        if (parts[0].length === 4) {
            const d = new Date(`${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`);
            if (!isNaN(d.getTime())) return d;
        } else if (parts[2]) {
            const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
            const d = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`);
            if (!isNaN(d.getTime())) return d;
        }
    }
    const parsed = new Date(str);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
}

function limpiarReferencia(val) {
    if (!val) return '';
    let str = String(val).trim();
    str = str.replace(/^[^a-zA-Z0-9]+/, '').replace(/[^a-zA-Z0-9]+$/, '').trim();
    return str;
}

export function parseGenerico(fileBuffer) {
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    const registros = [];
    if (!rawData || rawData.length === 0) return registros;

    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(15, rawData.length); i++) {
        const rowStr = (rawData[i] || []).map(normalizar).join(' ');
        if (rowStr.includes('referencia') || rowStr.includes('abono') || rowStr.includes('monto') || rowStr.includes('importe') || rowStr.includes('descripcion')) {
            headerRowIndex = i;
            break;
        }
    }

    const headers = (rawData[headerRowIndex] || []).map(normalizar);
    
    let refCol = headers.findIndex(h => h.includes('referencia') || h.includes('ref') || h.includes('clave') || h.includes('clabe') || h.includes('autorizacion'));
    let montoCol = headers.findIndex(h => h.includes('abono') || h.includes('monto') || h.includes('importe') || h.includes('deposito'));
    let fechaCol = headers.findIndex(h => h.includes('fecha'));
    let descCol = headers.findIndex(h => h.includes('concepto') || h.includes('descripcion') || h.includes('detalle') || h.includes('observaciones') || h.includes('beneficiario') || h.includes('nombre'));

    for (let i = headerRowIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || row.length === 0) continue;

        const refRaw = refCol !== -1 ? String(row[refCol] || '') : '';
        const refClean = limpiarReferencia(refRaw);
        const montoVal = montoCol !== -1 ? parseMonto(row[montoCol]) : 0;
        const fechaVal = fechaCol !== -1 ? parseFecha(row[fechaCol]) : new Date();
        
        let descVal = descCol !== -1 ? String(row[descCol] || '').trim() : '';

        // Si no se encontró columna de descripción explícita, concatenar celdas de texto de la fila
        if (!descVal) {
            descVal = row.filter(c => typeof c === 'string' && c.length > 5).join(' ');
        }
        if (!descVal) descVal = 'Depósito Bancario';

        if (montoVal > 0) {
            registros.push({
                linea: i + 1,
                fecha: fechaVal,
                referencia: refClean,
                referencia_raw: refRaw,
                monto: montoVal,
                descripcion: descVal,
                texto_completo: row.join(' ')
            });
        }
    }

    return registros;
}

export function parseBBVA(content) {
    if (content instanceof ArrayBuffer) {
        return parseGenerico(content);
    }

    const text = String(content);
    const lines = text.split(/\r?\n/);
    const registros = [];

    lines.forEach((line, index) => {
        if (!line || line.trim().length === 0) return;
        const refMatch = line.match(/\b\d{10,18}\b/);
        const montoMatch = line.match(/\b\d+\.\d{2}\b/);

        if (refMatch && montoMatch) {
            registros.push({
                linea: index + 1,
                fecha: new Date(),
                referencia: refMatch[0],
                referencia_raw: refMatch[0],
                monto: parseFloat(montoMatch[0]),
                descripcion: line.trim()
            });
        }
    });

    return registros;
}

export function parseArchivoBancario(fileBuffer, banco = 'GENERICO') {
    switch (banco.toUpperCase()) {
        case 'BBVA':
            return parseBBVA(fileBuffer);
        case 'GENERICO':
        case 'BANAMEX':
        case 'SANTANDER':
        case 'BANORTE':
        default:
            return parseGenerico(fileBuffer);
    }
}

export const parseExcelFile = parseGenerico;

