const getBaseUrl = () => {
  return '';
};

export const contabilidadService = {
  /**
   * Obtiene el resumen contable, cálculo de IVA (emitidas vs recibidas) y listado de comprobantes
   */
  async obtenerResumen({ rfc, fechaInicio, fechaFin }, token = '') {
    const params = new URLSearchParams({
      rfc: rfc || '',
      fechaInicio: fechaInicio || '',
      fechaFin: fechaFin || '',
    });

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;
    if (!authToken && typeof window !== 'undefined') {
      authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken.replace(/^Bearer\s+/i, '').trim()}`;
    }

    const response = await fetch(`/api/contabilidad/resumen?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error ${response.status} al consultar contabilidad`);
    }

    return response.json();
  },

  /**
   * Dispara la sincronización y auto-ingesta de XMLs de los paquetes descargados del SAT
   */
  async sincronizarXMLs({ rfc, fechaInicio, fechaFin }, token = '') {
    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;
    if (!authToken && typeof window !== 'undefined') {
      authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken.replace(/^Bearer\s+/i, '').trim()}`;
    }

    const response = await fetch('/api/contabilidad/resumen', {
      method: 'POST',
      headers,
      body: JSON.stringify({ rfc, fechaInicio, fechaFin }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error ${response.status} al sincronizar facturas`);
    }

    return response.json();
  },

  /**
   * Obtiene el desglose agrupado para la DIOT
   */
  async obtenerDIOT({ rfc, fechaInicio, fechaFin }, token = '') {
    const params = new URLSearchParams({
      rfc: rfc || '',
      fechaInicio: fechaInicio || '',
      fechaFin: fechaFin || '',
      format: 'json',
    });

    const headers = { 'Content-Type': 'application/json' };
    let authToken = token;
    if (!authToken && typeof window !== 'undefined') {
      authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
    }
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken.replace(/^Bearer\s+/i, '').trim()}`;
    }

    const response = await fetch(`/api/contabilidad/diot?${params.toString()}`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || `Error ${response.status} al consultar datos de DIOT`);
    }

    return response.json();
  },

  /**
   * Descarga directa del archivo oficial .txt de la DIOT para cargar al SAT
   */
  descargarTxtDIOT({ rfc, fechaInicio, fechaFin }) {
    const params = new URLSearchParams({
      rfc: rfc || '',
      fechaInicio: fechaInicio || '',
      fechaFin: fechaFin || '',
      format: 'txt',
    });
    window.open(`/api/contabilidad/diot?${params.toString()}`, '_blank');
  },
};

export default contabilidadService;
