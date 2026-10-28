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

    console.log(`[descargaMasivaService] POST ${cleanEndpoint} -> Status: ${response.status}, Data:`, responseData);

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

    // Validación del formato PadeResponse: Si el PAC devuelve un código de error de negocio (diferente de 200/201/0 y 5000 del SAT)
    if (typeof responseData === 'object' && responseData !== null) {
      const cod = responseData.codigo;
      const isSuccessCode = cod === 200 || cod === 201 || cod === 0 || cod === 5000 || cod === '5000' || responseData.ok === true || responseData.estado === 'Aceptada' || responseData.estado === 'Terminada';
      if (cod !== undefined && !isSuccessCode) {
        console.warn(`[descargaMasivaService] Error de negocio PAC (Código ${responseData.codigo}):`, responseData.mensaje);
        const errMsg = responseData.mensaje || `Error PAC/SAT (Código ${responseData.codigo})`;
        const err = new Error(errMsg);
        err.responseData = responseData;
        err.status = response.status;
        err.payload = data;
        throw err;
      }
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
    const isSyncActive = String(data.sync) === '1' || data.sync === true;

    const payload = {
      razonSocial: data.razonSocial || data.razon_social || '',
      fechaInicioSync: isSyncActive
        ? (data.fechaInicioSync || data.fecha_inicio_sync || '2024-01-01')
        : '0000-00-00',
      maxComprobantesMensual: String(data.maxComprobantesMensual || data.max_comprobantes || '5000'),
      celular: data.celular || '',
      sync: isSyncActive ? '1' : '0',
    };

    if (data.fiel && (data.fiel.pfx || data.fiel.PFX)) {
      payload.fiel = {
        pfx: data.fiel.pfx || data.fiel.PFX || '',
        passPfx: data.fiel.passPfx || data.fiel.PassPFX || '',
      };
    }

    if (data.ciec && (data.ciec.passCiec || data.ciec.PassCIEC)) {
      payload.ciec = {
        rfc: data.ciec.rfc || data.ciec.RFC || data.rfc || '',
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
    let petStr = (data.tipoPeticion || data.peticion || data.tipo || 'emitidos').toLowerCase();
    if (petStr === 'emitidas') petStr = 'emitidos';
    if (petStr === 'recibidas') petStr = 'recibidos';

    const payload = {
      rfc: rfcList,
      peticion: petStr,
      tipoPeticion: petStr,
      fechaInicio: (data.fechaInicio || data.fecha_inicio || '').split('T')[0],
      fechaFin: (data.fechaFin || data.fecha_fin || '').split('T')[0],
      montoMinimo: String(data.montoMinimo !== undefined ? data.montoMinimo : '0'),
      montoMaximo: String(data.montoMaximo !== undefined ? data.montoMaximo : '0'),
    };
    if (data.cer) payload.cer = data.cer;
    if (data.key) payload.key = data.key;
    if (data.password) payload.password = data.password;
    if (data.rfcContraparte) payload.rfcContraparte = data.rfcContraparte;
    if (data.estadoComprobante) payload.estadoComprobante = data.estadoComprobante;
    if (data.tipo && data.tipo !== 'todos') payload.tipo = data.tipo;

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
      rfc: data.rfc || data.RFC || '',
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
    let petStr = (data.peticion || data.tipoPeticion || data.tipo || 'emitidos').toLowerCase();
    if (petStr === 'emitidas') petStr = 'emitidos';
    if (petStr === 'recibidas') petStr = 'recibidos';

    const payload = {
      fechaInicio: (data.fechaInicio || data.fecha_inicio || '').split('T')[0],
      fechaFin: (data.fechaFin || data.fecha_fin || '').split('T')[0],
      rfc: rfcList,
      peticion: petStr,
      tipoPeticion: petStr,
    };

    if (data.cer) payload.cer = data.cer;
    if (data.key) payload.key = data.key;
    if (data.password) payload.password = data.password;
    if (data.rfcContraparte) payload.rfcContraparte = data.rfcContraparte;
    if (data.estadoComprobante) payload.estadoComprobante = data.estadoComprobante;

    if (data.uuid) payload.uuid = String(data.uuid);
    if (data.tipo && data.tipo !== 'todos') payload.tipo = String(data.tipo);
    if (data.serie) payload.serie = String(data.serie);
    if (data.montoMin && data.montoMin !== '0') payload.montoMin = String(data.montoMin);
    if (data.montoMax && data.montoMax !== '0') payload.montoMax = String(data.montoMax);

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
      rfc: data.rfc || data.RFC || '',
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

  // ==========================================
  // 6. Descarga Directa de Paquetes y Gestión FIEL
  // ==========================================

  /**
   * Descarga el paquete ZIP de comprobantes o metadata desde el SAT o BD local
   * @param {Object} data - { id_paquete, id_solicitud, rfc }
   * @param {string} token
   */
  async descargarPaquete(data, token = '') {
    return apiRequest('/descargar', data, token);
  },

  /**
   * Lista las empresas que ya tienen su FIEL almacenada en la base de datos
   * @param {string} token
   */
  async listarEmpresasFiel(token = '') {
    return apiRequest('/fiel/listar', {}, token);
  },

  /**
   * Guarda o actualiza la FIEL de una empresa en la base de datos
   * @param {Object} data - { rfc, razonSocial, cer, key, password }
   * @param {string} token
   */
  async guardarFiel(data, token = '') {
    return apiRequest('/fiel/guardar', data, token);
  },

  /**
   * Obtiene los logs y diagnóstico en vivo del SAT y la base de datos
   * @param {string} token
   */
  async obtenerDebugLogs(token = '') {
    return apiRequest('/debug-logs', {}, token);
  },
};

export default descargaMasivaService;
