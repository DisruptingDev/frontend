import forge from 'node-forge';
import crypto from 'crypto';
import {
  Fiel,
  HttpsWebClient,
  FielRequestBuilder,
  Service,
  QueryParameters,
  DateTimePeriod,
  DownloadType,
  RequestType,
  RfcMatch,
  DocumentStatus,
  DocumentType
} from '@nodecfdi/sat-ws-descarga-masiva';

// Registrar OIDs para llaves privadas PKCS#8 del SAT
if (forge && forge.pki && forge.pki.oids) {
  forge.pki.oids['1.2.840.113549.1.5.3'] = 'des-EDE3-CBC';
  forge.pki.oids['des-EDE3-CBC'] = '1.2.840.113549.1.5.3';
  forge.pki.oids['1.3.14.3.2.7'] = 'desCBC';
  forge.pki.oids['desCBC'] = '1.3.14.3.2.7';
  forge.pki.oids['2.16.840.1.101.3.4.1.2'] = 'aes128-CBC';
  forge.pki.oids['aes128-CBC'] = '2.16.840.1.101.3.4.1.2';
  forge.pki.oids['2.16.840.1.101.3.4.1.42'] = 'aes256-CBC';
  forge.pki.oids['aes256-CBC'] = '2.16.840.1.101.3.4.1.42';
}

/**
 * Convierte buffer o string a objeto de certificado y llave privada de node-forge
 * (Utilizado principalmente para conversión a PFX en el servidor)
 */
export function cargarCredencialesFiel(cerInput, keyInput, password) {
  let cerDer;
  if (typeof cerInput === 'string') {
    const clean = cerInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    cerDer = forge.util.decode64(clean);
  } else if (Buffer.isBuffer(cerInput)) {
    cerDer = cerInput.toString('binary');
  } else {
    throw new Error('Certificado (.cer) no válido');
  }

  const certAsn1 = forge.asn1.fromDer(cerDer);
  const cert = forge.pki.certificateFromAsn1(certAsn1);

  let keyDer;
  if (typeof keyInput === 'string') {
    const clean = keyInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    keyDer = forge.util.decode64(clean);
  } else if (Buffer.isBuffer(keyInput)) {
    keyDer = keyInput.toString('binary');
  } else {
    throw new Error('Llave (.key) no válida');
  }

  let privateKey = null;
  const passwordsToTry = [password, password.trim()];

  // 1. Intentar con Node.js crypto nativo (Soporta PKCS#8 PBES2 / AES / 3DES modernos del SAT)
  let rawKeyBuffer = null;
  try {
    if (Buffer.isBuffer(keyInput)) {
      rawKeyBuffer = keyInput;
    } else if (typeof keyInput === 'string') {
      const clean = keyInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
      rawKeyBuffer = Buffer.from(clean, 'base64');
    }
  } catch {}

  if (rawKeyBuffer) {
    for (const p of passwordsToTry) {
      try {
        const nodeKey = crypto.createPrivateKey({
          key: rawKeyBuffer,
          format: 'der',
          type: 'pkcs8',
          passphrase: p
        });

        const pemString = nodeKey.export({
          type: 'pkcs1',
          format: 'pem'
        });

        privateKey = forge.pki.privateKeyFromPem(pemString);
        if (privateKey) break;
      } catch (errNode) {}
    }
  }

  // 2. Si falló crypto nativo, intentar los fallbacks de node-forge
  if (!privateKey) {
    const pemKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${forge.util.encode64(keyDer)}\n-----END ENCRYPTED PRIVATE KEY-----`;
    for (const p of passwordsToTry) {
      try {
        privateKey = forge.pki.decryptRsaPrivateKey(pemKey, p);
        if (privateKey) break;
      } catch {}
      try {
        privateKey = forge.pki.decryptRsaPrivateKey(keyDer, p);
        if (privateKey) break;
      } catch {}
      try {
        const keyAsn1 = forge.asn1.fromDer(keyDer);
        const decAsn1 = forge.pki.decryptPrivateKeyInfo(keyAsn1, p);
        if (decAsn1) {
          privateKey = forge.pki.privateKeyFromAsn1(decAsn1);
          if (privateKey) break;
        }
      } catch {}
    }
  }

  if (!privateKey) {
    throw new Error('No se pudo desencriptar la llave privada (.key). Verifique la contraseña de la FIEL.');
  }

  const certDerBytes = forge.asn1.toDer(certAsn1).getBytes();
  const certBase64 = forge.util.encode64(certDerBytes);

  let issuerName = '';
  try {
    issuerName = cert.issuer.attributes.map(a => `${a.shortName || a.name}=${a.value}`).join(', ');
  } catch {}

  return {
    cert,
    privateKey,
    certBase64,
    serialNumber: cert.serialNumber || '',
    issuerName
  };
}

/**
 * Crea una instancia de Service del SAT oficial usando @nodecfdi/sat-ws-descarga-masiva
 */
export function crearSatService(cerInput, keyInput, password) {
  let cerBinary;
  if (Buffer.isBuffer(cerInput)) {
    cerBinary = cerInput.toString('binary');
  } else if (typeof cerInput === 'string') {
    const clean = cerInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    cerBinary = Buffer.from(clean, 'base64').toString('binary');
  }

  let keyBinary;
  if (Buffer.isBuffer(keyInput)) {
    keyBinary = keyInput.toString('binary');
  } else if (typeof keyInput === 'string') {
    const clean = keyInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    keyBinary = Buffer.from(clean, 'base64').toString('binary');
  }

  const fiel = Fiel.create(cerBinary, keyBinary, password);
  if (!fiel.isValid()) {
    throw new Error('La FIEL proporcionada no es válida o ha expirado.');
  }

  const webClient = new HttpsWebClient();
  const requestBuilder = new FielRequestBuilder(fiel);
  const service = new Service(requestBuilder, webClient);

  return { service, fiel };
}

/**
 * Autentica ante el Web Service del SAT y obtiene un Token WRAP
 */
export async function autenticarConSat({ cerInput, keyInput, password }) {
  try {
    const { service } = crearSatService(cerInput, keyInput, password);
    const token = await service.authenticate();
    return token.getValue();
  } catch (err) {
    throw new Error(`Error en autenticación SAT: ${err.message}`);
  }
}

/**
 * Solicita descarga masiva directa al Web Service oficial del SAT
 */
export async function solicitarDescargaSat({
  cerInput,
  keyInput,
  password,
  rfcSolicitante,
  fechaInicio,
  fechaFin,
  tipoDescarga = 'CFDI', // 'CFDI' o 'Metadata'
  tipoSolicitud = 'Emitidos', // 'Emitidos' o 'Recibidos'
  rfcEmisor = null,
  rfcReceptor = null,
  estadoComprobante = null,
  tipoComprobante = null
}) {
  const { service } = crearSatService(cerInput, keyInput, password);

  // Formato y periodo de fechas
  const fIni = fechaInicio.includes(' ') ? fechaInicio : `${fechaInicio} 00:00:00`;
  const fFin = fechaFin.includes(' ') ? fechaFin : `${fechaFin} 23:59:59`;
  const period = DateTimePeriod.createFromValues(fIni, fFin);

  const downloadType = tipoSolicitud.toLowerCase().includes('recib')
    ? new DownloadType('received')
    : new DownloadType('issued');

  const requestType = tipoDescarga.toLowerCase().includes('meta')
    ? new RequestType('metadata')
    : new RequestType('xml');

  let qp = QueryParameters.create()
    .withPeriod(period)
    .withDownloadType(downloadType)
    .withRequestType(requestType);

  // Filtro de Estado del Comprobante:
  // Regla del Web Service del SAT: Al descargar archivos XML de comprobantes Recibidos,
  // el SAT prohíbe terminantemente solicitar cancelados (error 301 / 5012).
  // Por lo tanto, si la descarga es de XML (CFDI), siempre debe ser 'active' (Vigentes).
  const esRecibidos = tipoSolicitud.toLowerCase().includes('recib');
  const esXml = !tipoDescarga.toLowerCase().includes('meta');

  if (esXml && esRecibidos) {
    qp = qp.withDocumentStatus(new DocumentStatus('active'));
  } else if (estadoComprobante && estadoComprobante !== 'todos') {
    if (estadoComprobante === 'vigentes') {
      qp = qp.withDocumentStatus(new DocumentStatus('active'));
    } else if (estadoComprobante === 'cancelados') {
      qp = qp.withDocumentStatus(new DocumentStatus('cancelled'));
    }
  }

  // Filtro de Tipo de Comprobante (Ingreso, Egreso, Traslado, Nómina, Pago)
  if (tipoComprobante && tipoComprobante !== 'todos') {
    const tiposMap = {
      'I': 'ingreso',
      'E': 'egreso',
      'T': 'traslado',
      'N': 'nomina',
      'P': 'pago'
    };
    const tipoValor = tiposMap[tipoComprobante.toUpperCase()] || tipoComprobante.toLowerCase();
    try {
      qp = qp.withDocumentType(new DocumentType(tipoValor));
    } catch (e) {
      console.warn('[SAT withDocumentType warning]:', e.message);
    }
  }

  // Si hay filtro de contraparte RFC
  const rfcContraparte = tipoSolicitud.toLowerCase().includes('recib') ? rfcEmisor : rfcReceptor;
  if (rfcContraparte && rfcContraparte !== rfcSolicitante) {
    qp = qp.withRfcMatch(RfcMatch.create(rfcContraparte));
  }

  const queryResult = await service.query(qp);
  const status = queryResult.getStatus();

  if (!status.isAccepted()) {
    throw new Error(`El SAT no aceptó la solicitud: [${status.getCode()}] ${status.getMessage()}`);
  }

  return {
    codigo_estatus: status.getCode(),
    id_solicitud: queryResult.getRequestId(),
    mensaje: status.getMessage() || 'Solicitud Aceptada'
  };
}

/**
 * Consulta el estatus de la solicitud de descarga en el SAT
 */
export async function verificarSolicitudSat({
  cerInput,
  keyInput,
  password,
  idSolicitud
}) {
  const { service } = crearSatService(cerInput, keyInput, password);

  const verifyResult = await service.verify(idSolicitud);
  const status = verifyResult.getStatus();

  if (!status.isAccepted()) {
    throw new Error(`El SAT rechazó la verificación: [${status.getCode()}] ${status.getMessage()}`);
  }

  const statusRequest = verifyResult.getStatusRequest();
  const estadoNum = statusRequest.getValue(); // 1: Aceptada, 2: En Proceso, 3: Terminada, 4: Error, 5: Rechazada, 6: Vencida

  const estadosTexto = {
    1: 'Aceptada',
    2: 'En Proceso',
    3: 'Terminada',
    4: 'Error',
    5: 'Rechazada',
    6: 'Vencida'
  };

  return {
    estado_solicitud: estadoNum,
    estado_texto: estadosTexto[estadoNum] || 'Desconocido',
    codigo_estatus: status.getCode(),
    codigo_estado_solicitud: verifyResult.getCodeRequest().getValue(),
    numero_cfdis: verifyResult.getNumberCfdis(),
    mensaje: status.getMessage() || `Estado SAT: ${estadosTexto[estadoNum]}`,
    ids_paquetes: verifyResult.getPackageIds() || []
  };
}

/**
 * Descarga paquete ZIP de comprobantes del SAT
 */
export async function descargarPaqueteSat({
  cerInput,
  keyInput,
  password,
  idPaquete
}) {
  const { service } = crearSatService(cerInput, keyInput, password);

  const downloadResult = await service.download(idPaquete);
  const status = downloadResult.getStatus();

  if (!status.isAccepted()) {
    throw new Error(`Error al descargar paquete del SAT: [${status.getCode()}] ${status.getMessage()}`);
  }

  return {
    id_paquete: idPaquete,
    codigo_estatus: status.getCode(),
    paquete_zip_base64: downloadResult.getPackageContent()
  };
}
