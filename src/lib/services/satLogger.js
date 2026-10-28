import fs from 'fs';
import path from 'path';

const memoryLogs = [];
const MAX_MEMORY_LOGS = 150;

const getLogFilePath = () => {
  try {
    if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
      return path.join('/tmp', 'sat_debug.log');
    }
    return path.join(process.cwd(), 'sat_debug.log');
  } catch {
    return null;
  }
};

/**
 * Registra un evento en el log persistente de Descarga Masiva del SAT
 * @param {string} nivel - 'INFO', 'WARN', 'ERROR', 'SAT_REQ', 'SAT_RES'
 * @param {string} accion - Nombre corto de la acción (ej: 'SOLICITUD_SAT', 'PRISMA_UPSERT')
 * @param {object|string} detalle - Datos o mensaje del evento
 */
export function logSatEvent(nivel, accion, detalle) {
  const timestamp = new Date().toISOString();
  let sanitizedDetalle = detalle;

  // Ocultar contraseñas o llaves privadas si vienen en el detalle
  if (typeof detalle === 'object' && detalle !== null) {
    try {
      sanitizedDetalle = JSON.parse(JSON.stringify(detalle));
      if (sanitizedDetalle.password) sanitizedDetalle.password = '***OCULTO***';
      if (sanitizedDetalle.password_fiel) sanitizedDetalle.password_fiel = '***OCULTO***';
      if (sanitizedDetalle.key && typeof sanitizedDetalle.key === 'string') {
        sanitizedDetalle.key = sanitizedDetalle.key.substring(0, 30) + '...[TRUNCADO]';
      }
      if (sanitizedDetalle.key_base64 && typeof sanitizedDetalle.key_base64 === 'string') {
        sanitizedDetalle.key_base64 = sanitizedDetalle.key_base64.substring(0, 30) + '...[TRUNCADO]';
      }
    } catch {
      sanitizedDetalle = String(detalle);
    }
  }

  const logEntry = {
    timestamp,
    nivel,
    accion,
    detalle: sanitizedDetalle
  };

  // 1. Guardar en memoria
  memoryLogs.unshift(logEntry);
  if (memoryLogs.length > MAX_MEMORY_LOGS) {
    memoryLogs.pop();
  }

  // 2. Guardar en archivo local sat_debug.log
  try {
    const filePath = getLogFilePath();
    if (filePath) {
      const line = `[${timestamp}] [${nivel}] [${accion}] ${typeof sanitizedDetalle === 'object' ? JSON.stringify(sanitizedDetalle) : sanitizedDetalle}\n`;
      fs.appendFileSync(filePath, line, 'utf8');
    }
  } catch (err) {
    console.warn('[satLogger File Error]:', err.message);
  }

  // 3. Imprimir en consola del servidor
  console.log(`[SAT-DEBUG] [${nivel}] [${accion}]:`, typeof sanitizedDetalle === 'object' ? JSON.stringify(sanitizedDetalle) : sanitizedDetalle);
}

/**
 * Obtiene los últimos logs en memoria
 */
export function getRecentLogs(limit = 50) {
  return memoryLogs.slice(0, limit);
}

/**
 * Limpia los logs en memoria y archivo
 */
export function clearLogs() {
  memoryLogs.length = 0;
  try {
    const filePath = getLogFilePath();
    if (filePath && fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, '', 'utf8');
    }
  } catch {}
}

