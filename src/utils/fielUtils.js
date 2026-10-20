import forge from 'node-forge';

// Registrar OIDs y mapeos de algoritmos requeridos para desencriptar llaves .key del SAT México
if (forge && forge.pki && forge.pki.oids) {
  forge.pki.oids['1.2.840.113549.1.5.3'] = 'des-EDE3-CBC';
  forge.pki.oids['des-EDE3-CBC'] = '1.2.840.113549.1.5.3';
  forge.pki.oids['1.3.14.3.2.7'] = 'desCBC';
  forge.pki.oids['desCBC'] = '1.3.14.3.2.7';
  forge.pki.oids['2.16.840.1.101.3.4.1.2'] = 'aes128-CBC';
  forge.pki.oids['aes128-CBC'] = '2.16.840.1.101.3.4.1.2';
  forge.pki.oids['2.16.840.1.101.3.4.1.22'] = 'aes192-CBC';
  forge.pki.oids['aes192-CBC'] = '2.16.840.1.101.3.4.1.22';
  forge.pki.oids['2.16.840.1.101.3.4.1.42'] = 'aes256-CBC';
  forge.pki.oids['aes256-CBC'] = '2.16.840.1.101.3.4.1.42';

  if (forge.cipher && forge.cipher.algorithms) {
    const c3des = forge.cipher.algorithms['3DES-CBC'];
    if (c3des) {
      forge.cipher.algorithms['des-EDE3-CBC'] = c3des;
      forge.cipher.algorithms['DES-EDE3-CBC'] = c3des;
      forge.cipher.algorithms['des-ede3-cbc'] = c3des;
    }
    const caes = forge.cipher.algorithms['AES-CBC'];
    if (caes) {
      forge.cipher.algorithms['aes128-CBC'] = caes;
      forge.cipher.algorithms['AES-128-CBC'] = caes;
      forge.cipher.algorithms['aes192-CBC'] = caes;
      forge.cipher.algorithms['AES-192-CBC'] = caes;
      forge.cipher.algorithms['aes256-CBC'] = caes;
      forge.cipher.algorithms['AES-256-CBC'] = caes;
    }
  }
}

/**
 * Convierte un buffer a binary string compatible con node-forge
 */
function bufferToBinaryString(buffer) {
  if (!buffer) return '';
  if (typeof buffer === 'string') return buffer;
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return forge.util.createBuffer(bytes).getBytes();
}

/**
 * Obtiene candidatos de contraseñas (raw, trim, UTF-8 encoded)
 */
function getPasswordCandidates(password) {
  const candidates = [];
  if (typeof password !== 'string') return [''];

  const add = (p) => {
    if (p !== undefined && p !== null && !candidates.includes(p)) {
      candidates.push(p);
    }
  };

  add(password);
  add(password.trim());

  try {
    const utf8 = forge.util.encodeUtf8(password);
    add(utf8);
    add(utf8.trim());
  } catch (e) {}

  return candidates;
}

/**
 * Desencripta de forma robusta una llave privada .key probando variantes de contraseña y formatos
 */
function robustDecryptPrivateKey(keyBinary, password) {
  if (!keyBinary) return null;

  const passCandidates = getPasswordCandidates(password);
  const pemKey = `-----BEGIN ENCRYPTED PRIVATE KEY-----\n${forge.util.encode64(keyBinary)}\n-----END ENCRYPTED PRIVATE KEY-----`;

  for (const pwd of passCandidates) {
    // 1. Desencriptar vía PEM (soporta PKCS#8 Cifrado y Legacy OpenSSL)
    try {
      const pk = forge.pki.decryptRsaPrivateKey(pemKey, pwd);
      if (pk && pk.n) return { privateKey: pk, matchedPassword: pwd };
    } catch (e) {}

    // 2. Desencriptar vía ASN.1 DER directo (decryptPrivateKeyInfo -> privateKeyFromAsn1)
    try {
      const keyAsn1 = forge.asn1.fromDer(keyBinary);
      const decAsn1 = forge.pki.decryptPrivateKeyInfo(keyAsn1, pwd);
      if (decAsn1) {
        const pk = forge.pki.privateKeyFromAsn1(decAsn1);
        if (pk && pk.n) return { privateKey: pk, matchedPassword: pwd };
      }
    } catch (e) {}

    // 3. Clave ASN.1 DER sin contraseña (por si no requiere clave)
    try {
      const keyAsn1 = forge.asn1.fromDer(keyBinary);
      const pk = forge.pki.privateKeyFromAsn1(keyAsn1);
      if (pk && pk.n) return { privateKey: pk, matchedPassword: pwd };
    } catch (e) {}
  }

  return null;
}

/**
 * Convierte los archivos FIEL (.cer y .key) del SAT + Contraseña en un string Base64 en formato PFX (PKCS#12).
 *
 * @param {ArrayBuffer} cerBuffer - Buffer del archivo Certificado (.cer en formato DER)
 * @param {ArrayBuffer} keyBuffer - Buffer del archivo Llave Privada (.key en formato DER EncryptedPrivateKeyInfo)
 * @param {string} password - Contraseña de la FIEL / Llave Privada
 * @returns {{ pfxBase64: string, serialNumber?: string }} Objeto con el PFX en Base64 y metadatos opcionales
 */
export async function generarPfxDesdeFiel(cerBuffer, keyBuffer, password) {
  if (!cerBuffer || (cerBuffer.byteLength !== undefined && cerBuffer.byteLength < 50)) {
    throw new Error('El archivo Certificado (.cer) seleccionado está vacío o no es válido.');
  }
  if (!keyBuffer || (keyBuffer.byteLength !== undefined && keyBuffer.byteLength < 50)) {
    throw new Error('El archivo Llave Privada (.key) seleccionado está vacío o no es válido.');
  }
  if (!password) {
    throw new Error('Es necesario ingresar la contraseña de la FIEL.');
  }

  // 1. Convertir Buffers a Strings Binarios y Base64
  const cerBinary = bufferToBinaryString(cerBuffer);
  const keyBinary = bufferToBinaryString(keyBuffer);
  const cerBase64 = forge.util.encode64(cerBinary);
  const keyBase64 = forge.util.encode64(keyBinary);

  // 2. Parse Certificado .cer (ASN.1 DER format)
  let cert;
  try {
    const cerAsn1 = forge.asn1.fromDer(cerBinary);
    cert = forge.pki.certificateFromAsn1(cerAsn1);
  } catch (e) {
    throw new Error(`El archivo Certificado (.cer) no tiene un formato DER válido del SAT: ${e.message}`);
  }

  // 3. Desencriptar Llave Privada .key localmente en navegador (si es soportada por node-forge)
  const decryptResult = robustDecryptPrivateKey(keyBinary, password);

  if (decryptResult && decryptResult.privateKey) {
    const { privateKey, matchedPassword } = decryptResult;
    let serialNumber = cert?.serialNumber || '';

    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], matchedPassword, {
      generateLocalKeyId: true,
      friendlyName: 'FIEL SAT Certificate',
      algorithm: '3des',
    });

    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Base64 = forge.util.encode64(p12Der);

    return {
      pfxBase64: p12Base64,
      serialNumber,
    };
  }

  // 4. Si el navegador no pudo desencriptar (ej. formato moderno PBES2/AES del SAT 2024-2026),
  // delegar la conversión al endpoint del servidor que usa Node.js crypto nativo
  try {
    const res = await fetch('/api/descarga-masiva/fiel/convertir', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cer: cerBase64,
        key: keyBase64,
        password: password
      })
    });

    const data = await res.json().catch(() => ({}));
    if (res.ok && data.pfxBase64) {
      return {
        pfxBase64: data.pfxBase64,
        serialNumber: data.serialNumber || cert?.serialNumber || ''
      };
    }

    if (data.error) {
      throw new Error(data.error);
    }
  } catch (servErr) {
    console.warn('[fielUtils] Fallback a servidor falló:', servErr.message);
  }

  throw new Error(
    'No se pudo desencriptar la llave privada (.key). Por favor verifique:\n' +
    '1) Que la contraseña sea la clave asignada a su FIEL (e.firma) y no del CSD (Sello Digital).\n' +
    '2) Que la contraseña no contenga espacios accidentales.\n' +
    '3) Que el archivo .key seleccionado corresponda al de su FIEL.'
  );
}

/**
 * Lee un File de un input HTML como ArrayBuffer
 * @param {File} file
 * @returns {Promise<ArrayBuffer>}
 */
export function readFileAsArrayBuffer(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(new Error(`Error al leer archivo ${file.name}: ${err.message}`));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Lee un File de un input HTML como Base64 String (sin prefix data URL)
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readFileAsBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(new Error(`Error al leer archivo ${file.name}: ${err.message}`));
    reader.readAsDataURL(file);
  });
}
