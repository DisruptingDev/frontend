/**
 * Servicio para el módulo de Descarga Masiva de Facturas SAT (Prodigia PAC).
 * Administra Razones Sociales, Peticiones SAT, Solicitud y Verificación de Metadata y Multicomprobantes,
 * y Consulta de Comprobante Individual.
 */

const getBaseUrl = () => {
  return (
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.sandbox.wisefacturacion.com'
  ).replace(/\/+$/, '');
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

  const headers = {
    'Content-Type': 'application/json',
  };

  let authToken = token;
  if (!authToken && typeof window !== 'undefined') {
    authToken = sessionStorage.getItem('authToken') || localStorage.getItem('authToken') || '';
  }

  if (authToken) {
    const cleanToken = authToken.replace(/^Bearer\s+/i, '').trim();
    headers['Authorization'] = `Bearer ${cleanToken}`;
  }

  console.log(`[descargaMasivaService] POST ${cleanEndpoint} -> Payload:`, data);

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
      console.error(`[descargaMasivaService] ERROR ${response.status} en ${endpoint}:`, responseData);
      const errorMessage =
        (typeof responseData === 'object' &&
          (responseData.Error || responseData.error || responseData.mensaje || responseData.message)) ||
        (typeof responseData === 'string' && responseData) ||
        `Error HTTP ${response.status}: ${response.statusText}`;
      const err = new Error(errorMessage);
      err.responseData = responseData;
      err.status = response.status;
      err.payload = data;
      throw err;
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
   * @param {Object} params - ListarRazonesSocialesRequest
   * @param {string} token
   */
  async listarRazonesSociales(params = {}, token = '') {
    return apiRequest('/razon-social/listar', params, token);
  },

  /**
   * Crea / da de alta una razón social en el servicio SAT
   * @param {Object} data - CrearRazonSocialRequest { razonSocial, fechaInicioSync, maxComprobantesMensual, celular, fiel, ciec, sync }
   * @param {string} token
   */
  async crearRazonSocial(data, token = '') {
    const payload = {
      razonSocial: data.razonSocial || data.razon_social || '',
      fechaInicioSync: data.fechaInicioSync || data.fecha_inicio_sync || '2024-01-01',
      maxComprobantesMensual: String(data.maxComprobantesMensual || data.max_comprobantes || '5000'),
      celular: data.celular || '',
      sync: String(data.sync !== undefined ? data.sync : '1'),
    };
    if (data.fiel) {
      payload.fiel = {
        pfx: data.fiel.pfx || data.fiel.PFX || '',
        passPfx: data.fiel.passPfx || data.fiel.PassPFX || '',
      };
    }
    if (data.ciec) {
      payload.ciec = {
        rfc: data.ciec.rfc || data.ciec.RFC || '',
        passCiec: data.ciec.passCiec || data.ciec.PassCIEC || '',
      };
    }
    return apiRequest('/razon-social/crear', payload, token);
  },

  /**
   * Actualiza una razón social (Certificados / PFX)
   * @param {Object} data - ActualizarRazonSocialRequest { rfc, razon_social: { pfx, passPfx, certificado } }
   * @param {string} token
   */
  async actualizarRazonSocial(data, token = '') {
    const payload = {
      rfc: data.rfc || data.RFC || '',
      razon_social: {
        pfx: data.razon_social?.pfx || data.pfx || '',
        passPfx: data.razon_social?.passPfx || data.passPfx || '',
        certificado: data.razon_social?.certificado || data.certificado || '',
      },
    };
    return apiRequest('/razon-social/actualizar', payload, token);
  },

  /**
   * Elimina / desvincula una razón social
   * @param {Object} data - EliminarRazonSocialRequest { rfc }
   * @param {string} token
   */
  async eliminarRazonSocial(data, token = '') {
    const payload = {
      rfc: data.rfc || data.RFC || '',
    };
    return apiRequest('/razon-social/eliminar', payload, token);
  },

  // ==========================================
  // 2. Sincronización y Peticiones SAT
  // ==========================================

  /**
   * Dispara sincronización con SAT/Prodigia
   * @param {Object} data - SincronizarSATRequest { rfc, habilitado }
   * @param {string} token
   */
  async sincronizarSAT(data = {}, token = '') {
    const payload = {
      rfc: data.rfc || data.RFC || '',
      habilitado: String(data.habilitado !== undefined ? data.habilitado : 'true'),
    };
    return apiRequest('/sat/sincronizar', payload, token);
  },

  /**
   * Lista el historial y estado actual de peticiones ante el SAT
   * @param {Object} params - PeticionesSATRequest { rfc, limit }
   * @param {string} token
   */
  async listarPeticionesSAT(params = {}, token = '') {
    const payload = {
      rfc: params.rfc || params.RFC || '',
      limit: String(params.limit || '50'),
    };
    return apiRequest('/sat/peticiones', payload, token);
  },

  // ==========================================
  // 3. Metadata SAT
  // ==========================================

  /**
   * Solicita paquete de metadata al SAT
   * @param {Object} data - MetadataSolicitarRequest { rfc: []string, tipoPeticion, fechaInicio, fechaFin, montoMinimo, montoMaximo }
   * @param {string} token
   */
  async solicitarMetadata(data, token = '') {
    const rfcList = Array.isArray(data.rfc) ? data.rfc : [data.rfc || data.RFC].filter(Boolean);
    const payload = {
      rfc: rfcList,
      tipoPeticion: data.tipoPeticion || data.peticion || data.tipo || 'emitidos',
      fechaInicio: (data.fechaInicio || data.fecha_inicio || '').split('T')[0],
      fechaFin: (data.fechaFin || data.fecha_fin || '').split('T')[0],
      montoMinimo: String(data.montoMinimo || data.montoMin || '0'),
      montoMaximo: String(data.montoMaximo || data.montoMax || '0'),
    };
    return apiRequest('/metadata/solicitar', payload, token);
  },

  /**
   * Verifica estatus de solicitud de metadata
   * @param {Object} data - VerificarSolicitudRequest { solicitud }
   * @param {string} token
   */
  async verificarMetadata(data, token = '') {
    const payload = {
      solicitud: data.solicitud || data.id_solicitud || data.id || '',
    };
    return apiRequest('/metadata/verificar', payload, token);
  },

  // ==========================================
  // 4. Multicomprobantes (Paquetes XML)
  // ==========================================

  /**
   * Solicita descarga masiva de comprobantes XML al SAT
   * @param {Object} data - MultiComprobantesRequest { fechaInicio, fechaFin, rfc: []string, peticion, uuid?, tipo?, serie?, montoMin?, montoMax? }
   * @param {string} token
   */
  async solicitarMulticomprobantes(data, token = '') {
    const rfcList = Array.isArray(data.rfc) ? data.rfc : [data.rfc || data.RFC].filter(Boolean);
    const payload = {
      fechaInicio: (data.fechaInicio || data.fecha_inicio || '').split('T')[0],
      fechaFin: (data.fechaFin || data.fecha_fin || '').split('T')[0],
      rfc: rfcList,
      peticion: data.peticion || data.tipoPeticion || data.tipo || 'emitidos',
    };
    if (data.uuid) payload.uuid = data.uuid;
    if (data.tipo) payload.tipo = data.tipo;
    if (data.serie) payload.serie = data.serie;
    if (data.montoMin !== undefined) payload.montoMin = String(data.montoMin);
    if (data.montoMax !== undefined) payload.montoMax = String(data.montoMax);

    return apiRequest('/multicomprobantes/solicitar', payload, token);
  },

  /**
   * Verifica estado del paquete masivo de XMLs
   * @param {Object} data - VerificarSolicitudRequest { solicitud }
   * @param {string} token
   */
  async verificarMulticomprobantes(data, token = '') {
    const payload = {
      solicitud: data.solicitud || data.id_solicitud || data.id || '',
    };
    return apiRequest('/multicomprobantes/verificar', payload, token);
  },

  // ==========================================
  // 5. Comprobante Individual
  // ==========================================

  /**
   * Obtiene un comprobante individual por UUID
   * @param {Object} data - ComprobanteRequest { contratoTimbrado, uuid }
   * @param {string} token
   */
  async obtenerComprobante(data, token = '') {
    const payload = {
      contratoTimbrado: data.contratoTimbrado || data.contrato || '',
      uuid: data.uuid || '',
    };
    return apiRequest('/comprobante', payload, token);
  },
};

export default descargaMasivaService;
