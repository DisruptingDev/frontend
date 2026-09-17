/**
 * Servicio para el módulo de Descarga Masiva de Facturas SAT (Prodigia PAC).
 * Administra Razones Sociales, Peticiones SAT, Solicitud y Verificación de Metadata y Multicomprobantes,
 * y Consulta de Comprobante Individual.
 */

const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_DESCARGA_MASIVA_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.sandbox.wisefacturacion.com'
  ).replace(/\/+$/, '');
};

const getPrefix = () => {
  const customPrefix = process.env.NEXT_PUBLIC_DESCARGA_MASIVA_PREFIX;
  if (customPrefix !== undefined) {
    return customPrefix ? `/${customPrefix.replace(/^\/+|\/+$/g, '')}` : '';
  }
  return '/api/descarga-masiva';
};

/**
 * Realiza una petición HTTP con reintento ante prefijo alternativo si es necesario.
 */
const apiRequest = async (endpoint, data = {}, token = '') => {
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  let requestUrl;
  if (typeof window !== 'undefined') {
    // En el navegador, siempre usar el proxy interno de Next.js para evitar bloqueos de CORS
    requestUrl = `/api/descarga-masiva${cleanEndpoint}`;
  } else {
    const baseUrl = getBaseUrl();
    requestUrl = `${baseUrl}${cleanEndpoint}`;
  }

  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
  }

  if (authToken) {
    const cleanToken = authToken.replace(/^Bearer\s+/i, '').trim();
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  try {
    let response = await fetch(requestUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    if (!response.ok) {
      const errorMessage =
        (typeof responseData === 'object' &&
          (responseData.Error || responseData.error || responseData.mensaje || responseData.message)) ||
        (typeof responseData === 'string' && responseData) ||
        `Error HTTP ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    return responseData;
  } catch (error) {
    console.error(`Error en apiRequest (${endpoint}):`, error);
    throw error;
  }
};

export const descargaMasivaService = {
  // ==========================================
  // 1. Gestión de Razón Social
  // ==========================================

  /**
   * Lista las razones sociales registradas para descarga masiva SAT
   * @param {Object} params - Filtros opcionales (ej. { rfc: '...' })
   * @param {string} token
   */
  async listarRazonesSociales(params = {}, token = '') {
    return apiRequest('/razon-social/listar', params, token);
  },

  /**
   * Crea / da de alta una razón social en el servicio SAT
   * @param {Object} data - { rfc, razon_social, ... }
   * @param {string} token
   */
  async crearRazonSocial(data, token = '') {
    return apiRequest('/razon-social/crear', data, token);
  },

  /**
   * Actualiza una razón social
   * @param {Object} data
   * @param {string} token
   */
  async actualizarRazonSocial(data, token = '') {
    return apiRequest('/razon-social/actualizar', data, token);
  },

  /**
   * Elimina / desvincula una razón social
   * @param {Object} data - { id o rfc }
   * @param {string} token
   */
  async eliminarRazonSocial(data, token = '') {
    return apiRequest('/razon-social/eliminar', data, token);
  },

  // ==========================================
  // 2. Sincronización y Peticiones SAT
  // ==========================================

  /**
   * Dispara sincronización con SAT/Prodigia
   * @param {Object} data - { rfc, ... }
   * @param {string} token
   */
  async sincronizarSAT(data = {}, token = '') {
    return apiRequest('/sat/sincronizar', data, token);
  },

  /**
   * Lista el historial y estado actual de peticiones ante el SAT
   * @param {Object} params - { rfc, estatus, ... }
   * @param {string} token
   */
  async listarPeticionesSAT(params = {}, token = '') {
    return apiRequest('/sat/peticiones', params, token);
  },

  // ==========================================
  // 3. Metadata SAT
  // ==========================================

  /**
   * Solicita paquete de metadata al SAT
   * @param {Object} data - { rfc, fecha_inicio, fecha_fin, tipo: 'emitidas'|'recibidas', rfc_contraparte, ... }
   * @param {string} token
   */
  async solicitarMetadata(data, token = '') {
    return apiRequest('/metadata/solicitar', data, token);
  },

  /**
   * Verifica estatus y obtiene el contenido de metadata
   * @param {Object} data - { id_solicitud, rfc, ... }
   * @param {string} token
   */
  async verificarMetadata(data, token = '') {
    return apiRequest('/metadata/verificar', data, token);
  },

  // ==========================================
  // 4. Multicomprobantes (Paquetes XML)
  // ==========================================

  /**
   * Solicita descarga masiva de comprobantes XML al SAT
   * @param {Object} data - { rfc, fecha_inicio, fecha_fin, tipo, tipo_comprobante, ... }
   * @param {string} token
   */
  async solicitarMulticomprobantes(data, token = '') {
    return apiRequest('/multicomprobantes/solicitar', data, token);
  },

  /**
   * Verifica estado del paquete masivo de XMLs y obtiene enlaces/paquetes
   * @param {Object} data - { id_solicitud, rfc, ... }
   * @param {string} token
   */
  async verificarMulticomprobantes(data, token = '') {
    return apiRequest('/multicomprobantes/verificar', data, token);
  },

  // ==========================================
  // 5. Comprobante Individual
  // ==========================================

  /**
   * Obtiene un comprobante individual por UUID
   * @param {Object} data - { uuid, rfc }
   * @param {string} token
   */
  async obtenerComprobante(data, token = '') {
    return apiRequest('/comprobante', data, token);
  },
};

export default descargaMasivaService;
