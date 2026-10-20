import forge from 'node-forge';
import crypto from 'crypto';

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

const SAT_URLS = {
  AUTENTICA: 'https://cfdidescargamasivasolicitud.clouda.sat.gob.mx/Autenticacion/Autenticacion.svc',
  SOLICITA: 'https://cfdidescargamasivasolicitud.clouda.sat.gob.mx/SolicitaDescargaService.svc',
  VERIFICA: 'https://cfdidescargamasivasolicitud.clouda.sat.gob.mx/VerificaSolicitudDescargaService.svc',
  DESCARGA: 'https://cfdidescargamasiva.clouda.sat.gob.mx/DescargaMasivaService.svc'
};

const SOAP_ACTIONS = {
  AUTENTICA: 'http://DescargaMasivaTerceros.gob.mx/IAutenticacion/Autentica',
  SOLICITA: 'http://DescargaMasivaTerceros.sat.gob.mx/ISolicitaDescargaService/SolicitaDescarga',
  VERIFICA: 'http://DescargaMasivaTerceros.sat.gob.mx/IVerificaSolicitudDescargaService/VerificaSolicitudDescarga',
  DESCARGA: 'http://DescargaMasivaTerceros.sat.gob.mx/IDescargaMasivaService/Descargar'
};

/**
 * Convierte buffer o string a objeto de certificado y llave privada de node-forge
 */
export function cargarCredencialesFiel(cerInput, keyInput, password) {
  let cerDer;
  if (typeof cerInput === 'string') {
    // Si viene en base64 o binary
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
  for (const p of passwordsToTry) {
    try {
      privateKey = forge.pki.decryptRsaPrivateKey(keyDer, p);
      if (privateKey) break;
    } catch {}
    try {
      const keyAsn1 = forge.asn1.fromDer(keyDer);
      privateKey = forge.pki.decryptPrivateKeyInfo(keyAsn1, p);
      if (privateKey) break;
    } catch {}
  }

  if (!privateKey) {
    throw new Error('No se pudo desencriptar la llave privada (.key). Verifique la contraseña de la FIEL.');
  }

  const certDerBytes = forge.asn1.toDer(certAsn1).getBytes();
  const certBase64 = forge.util.encode64(certDerBytes);

  // Extraer serial number e Issuer
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
 * Crea sobre SOAP firmado con WS-Security para obtener el Token de Acceso
 */
export async function autenticarConSat({ cerInput, keyInput, password }) {
  const { cert, privateKey, certBase64 } = cargarCredencialesFiel(cerInput, keyInput, password);

  const now = new Date();
  const created = now.toISOString();
  const expires = new Date(now.getTime() + 5 * 60 * 1000).toISOString();
  const tokenId = `uuid-${crypto.randomUUID()}-1`;

  const canonicalTimestamp = `<u:Timestamp xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" u:Id="_0"><u:Created>${created}</u:Created><u:Expires>${expires}</u:Expires></u:Timestamp>`;

  // Digest del Timestamp
  const mdSha1 = forge.md.sha1.create();
  mdSha1.update(canonicalTimestamp, 'utf8');
  const digestValue = forge.util.encode64(mdSha1.digest().getBytes());

  const canonicalSignedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI="#_0"><Transforms><Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

  const mdSign = forge.md.sha1.create();
  mdSign.update(canonicalSignedInfo, 'utf8');
  const signatureBytes = privateKey.sign(mdSign);
  const signatureValue = forge.util.encode64(signatureBytes);

  const soapEnvelope = `<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:u="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd">
  <s:Header>
    <o:Security s:mustUnderstand="1" xmlns:o="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
      <u:Timestamp u:Id="_0">
        <u:Created>${created}</u:Created>
        <u:Expires>${expires}</u:Expires>
      </u:Timestamp>
      <o:BinarySecurityToken u:Id="${tokenId}" ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" EncodingType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-soap-message-security-1.0#Base64Binary">${certBase64}</o:BinarySecurityToken>
      <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
        <SignedInfo>
          <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
          <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
          <Reference URI="#_0">
            <Transforms>
              <Transform Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            </Transforms>
            <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
            <DigestValue>${digestValue}</DigestValue>
          </Reference>
        </SignedInfo>
        <SignatureValue>${signatureValue}</SignatureValue>
        <KeyInfo>
          <o:SecurityTokenReference>
            <o:Reference ValueType="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-x509-token-profile-1.0#X509v3" URI="#${tokenId}" />
          </o:SecurityTokenReference>
        </KeyInfo>
      </Signature>
    </o:Security>
  </s:Header>
  <s:Body>
    <Autentica xmlns="http://DescargaMasivaTerceros.gob.mx" />
  </s:Body>
</s:Envelope>`;

  const response = await fetch(SAT_URLS.AUTENTICA, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': SOAP_ACTIONS.AUTENTICA,
    },
    body: soapEnvelope
  });

  const resText = await response.text();
  const tokenMatch = resText.match(/<token[^>]*>([^<]+)<\/token>/i) || resText.match(/token="([^"]+)"/i);
  
  if (!tokenMatch) {
    const faultMatch = resText.match(/<faultstring[^>]*>([^<]+)<\/faultstring>/i);
    const errDetail = faultMatch ? faultMatch[1] : resText;
    throw new Error(`Error en autenticación SAT: ${errDetail}`);
  }

  return tokenMatch[1];
}

/**
 * Solicita Descarga Masiva (CFDI o Metadata)
 */
export async function solicitarDescargaSat({
  tokenSat,
  rfcSolicitante,
  fechaInicio,
  fechaFin,
  tipoDescarga = 'CFDI', // 'CFDI' o 'Metadata'
  tipoSolicitud = 'Emitidos', // 'Emitidos' o 'Recibidos'
  rfcEmisor,
  rfcReceptor,
  cerInput,
  keyInput,
  password
}) {
  const { privateKey, certBase64, serialNumber } = cargarCredencialesFiel(cerInput, keyInput, password);

  // Formato fechas SAT: AAAA-MM-DDTHH:MM:SS
  const fIni = fechaInicio.includes('T') ? fechaInicio : `${fechaInicio}T00:00:00`;
  const fFin = fechaFin.includes('T') ? fechaFin : `${fechaFin}T23:59:59`;

  const emisorAttr = rfcEmisor ? ` RfcEmisor="${rfcEmisor}"` : '';
  const receptorAttr = rfcReceptor ? ` RfcReceptor="${rfcReceptor}"` : '';

  const canonicalSolicitud = `<des:solicitaDescarga xmlns:des="http://DescargaMasivaTerceros.sat.gob.mx"${emisorAttr}${receptorAttr} FechaFinal="${fFin}" FechaInicial="${fIni}" RfcSolicitante="${rfcSolicitante}" TipoDescargaMasiva="${tipoDescarga}" TipoSolicitud="${tipoSolicitud}"></des:solicitaDescarga>`;

  const mdSha1 = forge.md.sha1.create();
  mdSha1.update(canonicalSolicitud, 'utf8');
  const digestValue = forge.util.encode64(mdSha1.digest().getBytes());

  const canonicalSignedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

  const mdSign = forge.md.sha1.create();
  mdSign.update(canonicalSignedInfo, 'utf8');
  const signatureBytes = privateKey.sign(mdSign);
  const signatureValue = forge.util.encode64(signatureBytes);

  const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:des="http://DescargaMasivaTerceros.sat.gob.mx" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">
  <soapenv:Header/>
  <soapenv:Body>
    <des:SolicitaDescarga>
      <des:solicitud${emisorAttr}${receptorAttr} FechaFinal="${fFin}" FechaInicial="${fIni}" RfcSolicitante="${rfcSolicitante}" TipoDescargaMasiva="${tipoDescarga}" TipoSolicitud="${tipoSolicitud}">
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
            <Reference URI="">
              <Transforms>
                <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
              </Transforms>
              <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
              <DigestValue>${digestValue}</DigestValue>
            </Reference>
          </SignedInfo>
          <SignatureValue>${signatureValue}</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509IssuerSerial>
                <X509IssuerName>SAT</X509IssuerName>
                <X509SerialNumber>${serialNumber}</X509SerialNumber>
              </X509IssuerSerial>
              <X509Certificate>${certBase64}</X509Certificate>
            </X509Data>
          </KeyInfo>
        </Signature>
      </des:solicitud>
    </des:SolicitaDescarga>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch(SAT_URLS.SOLICITA, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': SOAP_ACTIONS.SOLICITA,
      'Authorization': `WRAP access_token="${tokenSat}"`
    },
    body: soapEnvelope
  });

  const resText = await response.text();
  const idMatch = resText.match(/IdSolicitud="([^"]+)"/i);
  const codEstatusMatch = resText.match(/CodEstatus="([^"]+)"/i);
  const mensajeMatch = resText.match(/Mensaje="([^"]+)"/i);

  if (!idMatch) {
    throw new Error(`SAT rechazó la solicitud (Código: ${codEstatusMatch?.[1] || 'Error'}): ${mensajeMatch?.[1] || resText}`);
  }

  return {
    id_solicitud: idMatch[1],
    codigo_estatus: codEstatusMatch ? codEstatusMatch[1] : '5000',
    mensaje: mensajeMatch ? mensajeMatch[1] : 'Solicitud aceptada por el SAT'
  };
}

/**
 * Verifica el estatus de la solicitud (según el PDF "Servicio Web de Verificación")
 */
export async function verificarSolicitudSat({
  tokenSat,
  idSolicitud,
  rfcSolicitante,
  cerInput,
  keyInput,
  password
}) {
  const { privateKey, certBase64, serialNumber } = cargarCredencialesFiel(cerInput, keyInput, password);

  const canonicalVerifica = `<des:peticionDescarga xmlns:des="http://DescargaMasivaTerceros.sat.gob.mx" IdSolicitud="${idSolicitud}" RfcSolicitante="${rfcSolicitante}"></des:peticionDescarga>`;

  const mdSha1 = forge.md.sha1.create();
  mdSha1.update(canonicalVerifica, 'utf8');
  const digestValue = forge.util.encode64(mdSha1.digest().getBytes());

  const canonicalSignedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

  const mdSign = forge.md.sha1.create();
  mdSign.update(canonicalSignedInfo, 'utf8');
  const signatureBytes = privateKey.sign(mdSign);
  const signatureValue = forge.util.encode64(signatureBytes);

  const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:des="http://DescargaMasivaTerceros.sat.gob.mx" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">
  <soapenv:Header/>
  <soapenv:Body>
    <des:VerificaSolicitudDescarga>
      <des:solicitud IdSolicitud="${idSolicitud}" RfcSolicitante="${rfcSolicitante}">
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
            <Reference URI="">
              <Transforms>
                <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
              </Transforms>
              <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
              <DigestValue>${digestValue}</DigestValue>
            </Reference>
          </SignedInfo>
          <SignatureValue>${signatureValue}</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509IssuerSerial>
                <X509IssuerName>SAT</X509IssuerName>
                <X509SerialNumber>${serialNumber}</X509SerialNumber>
              </X509IssuerSerial>
              <X509Certificate>${certBase64}</X509Certificate>
            </X509Data>
          </KeyInfo>
        </Signature>
      </des:solicitud>
    </des:VerificaSolicitudDescarga>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch(SAT_URLS.VERIFICA, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': SOAP_ACTIONS.VERIFICA,
      'Authorization': `WRAP access_token="${tokenSat}"`
    },
    body: soapEnvelope
  });

  const resText = await response.text();
  const estadoMatch = resText.match(/EstadoSolicitud="([^"]+)"/i);
  const codEstatusMatch = resText.match(/CodEstatus="([^"]+)"/i);
  const codigoEstadoSolMatch = resText.match(/CodigoEstadoSolicitud="([^"]+)"/i);
  const numeroCfdisMatch = resText.match(/NumeroCFDIs="([^"]+)"/i);
  const mensajeMatch = resText.match(/Mensaje="([^"]+)"/i);

  // Extraer todos los IdsPaquetes
  const idsPaquetes = [];
  const regexPaquetes = /<IdsPaquetes[^>]*>([^<]+)<\/IdsPaquetes>/gi;
  let match;
  while ((match = regexPaquetes.exec(resText)) !== null) {
    idsPaquetes.push(match[1]);
  }

  const estadoNum = estadoMatch ? parseInt(estadoMatch[1], 10) : 0;
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
    codigo_estatus: codEstatusMatch ? codEstatusMatch[1] : '',
    codigo_estado_solicitud: codigoEstadoSolMatch ? codigoEstadoSolMatch[1] : '',
    numero_cfdis: numeroCfdisMatch ? parseInt(numeroCfdisMatch[1], 10) : 0,
    mensaje: mensajeMatch ? mensajeMatch[1] : '',
    ids_paquetes: idsPaquetes
  };
}

/**
 * Descarga paquete ZIP del SAT
 */
export async function descargarPaqueteSat({
  tokenSat,
  idPaquete,
  rfcSolicitante,
  cerInput,
  keyInput,
  password
}) {
  const { privateKey, certBase64, serialNumber } = cargarCredencialesFiel(cerInput, keyInput, password);

  const canonicalPeticion = `<des:peticionDescarga xmlns:des="http://DescargaMasivaTerceros.sat.gob.mx" IdPaquete="${idPaquete}" RfcSolicitante="${rfcSolicitante}"></des:peticionDescarga>`;

  const mdSha1 = forge.md.sha1.create();
  mdSha1.update(canonicalPeticion, 'utf8');
  const digestValue = forge.util.encode64(mdSha1.digest().getBytes());

  const canonicalSignedInfo = `<SignedInfo xmlns="http://www.w3.org/2000/09/xmldsig#"><CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#"></CanonicalizationMethod><SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1"></SignatureMethod><Reference URI=""><Transforms><Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"></Transform></Transforms><DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1"></DigestMethod><DigestValue>${digestValue}</DigestValue></Reference></SignedInfo>`;

  const mdSign = forge.md.sha1.create();
  mdSign.update(canonicalSignedInfo, 'utf8');
  const signatureBytes = privateKey.sign(mdSign);
  const signatureValue = forge.util.encode64(signatureBytes);

  const soapEnvelope = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:des="http://DescargaMasivaTerceros.sat.gob.mx" xmlns:xd="http://www.w3.org/2000/09/xmldsig#">
  <soapenv:Header/>
  <soapenv:Body>
    <des:PeticionDescargaMasiva>
      <des:peticionDescarga IdPaquete="${idPaquete}" RfcSolicitante="${rfcSolicitante}">
        <Signature xmlns="http://www.w3.org/2000/09/xmldsig#">
          <SignedInfo>
            <CanonicalizationMethod Algorithm="http://www.w3.org/2001/10/xml-exc-c14n#" />
            <SignatureMethod Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha1" />
            <Reference URI="">
              <Transforms>
                <Transform Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature" />
              </Transforms>
              <DigestMethod Algorithm="http://www.w3.org/2000/09/xmldsig#sha1" />
              <DigestValue>${digestValue}</DigestValue>
            </Reference>
          </SignedInfo>
          <SignatureValue>${signatureValue}</SignatureValue>
          <KeyInfo>
            <X509Data>
              <X509IssuerSerial>
                <X509IssuerName>SAT</X509IssuerName>
                <X509SerialNumber>${serialNumber}</X509SerialNumber>
              </X509IssuerSerial>
              <X509Certificate>${certBase64}</X509Certificate>
            </X509Data>
          </KeyInfo>
        </Signature>
      </des:peticionDescarga>
    </des:PeticionDescargaMasiva>
  </soapenv:Body>
</soapenv:Envelope>`;

  const response = await fetch(SAT_URLS.DESCARGA, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/xml;charset=UTF-8',
      'SOAPAction': SOAP_ACTIONS.DESCARGA,
      'Authorization': `WRAP access_token="${tokenSat}"`
    },
    body: soapEnvelope
  });

  const resText = await response.text();
  const paqueteMatch = resText.match(/<Paquete[^>]*>([^<]+)<\/Paquete>/i);
  const codEstatusMatch = resText.match(/CodEstatus="([^"]+)"/i);
  const mensajeMatch = resText.match(/Mensaje="([^"]+)"/i);

  if (!paqueteMatch) {
    throw new Error(`Error al descargar paquete del SAT: ${mensajeMatch?.[1] || resText}`);
  }

  return {
    id_paquete: idPaquete,
    codigo_estatus: codEstatusMatch ? codEstatusMatch[1] : '5000',
    paquete_zip_base64: paqueteMatch[1]
  };
}
