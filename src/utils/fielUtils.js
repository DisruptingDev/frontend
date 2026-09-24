import forge from 'node-forge';

/**
 * Convierte un ArrayBuffer a binary string compatible con node-forge
 */
function arrayBufferToBinaryString(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return binary;
}

/**
 * Convierte los archivos FIEL (.cer y .key) del SAT + Contraseña en un string Base64 en formato PFX (PKCS#12).
 *
 * @param {ArrayBuffer} cerBuffer - Buffer del archivo Certificado (.cer en formato DER)
 * @param {ArrayBuffer} keyBuffer - Buffer del archivo Llave Privada (.key en formato DER EncryptedPrivateKeyInfo)
 * @param {string} password - Contraseña de la FIEL / Llave Privada
 * @returns {{ pfxBase64: string, serialNumber?: string, rfc?: string }} Objeto con el PFX en Base64 y metadatos opcionales
 */
export function generarPfxDesdeFiel(cerBuffer, keyBuffer, password) {
  if (!cerBuffer) {
    throw new Error('Es necesario seleccionar el archivo Certificado (.cer).');
  }
  if (!keyBuffer) {
    throw new Error('Es necesario seleccionar el archivo Llave Privada (.key).');
  }
  if (!password) {
    throw new Error('Es necesario ingresar la contraseña de la FIEL.');
  }

  try {
    // 1. Convertir Buffers a String Binario
    const cerBinary = arrayBufferToBinaryString(cerBuffer);
    const keyBinary = arrayBufferToBinaryString(keyBuffer);

    // 2. Parse Certificado .cer (ASN.1 DER format)
    let cert;
    try {
      const cerAsn1 = forge.asn1.fromDer(cerBinary);
      cert = forge.pki.certificateFromAsn1(cerAsn1);
    } catch (e) {
      throw new Error(`El archivo Certificado (.cer) no tiene un formato DER válido del SAT: ${e.message}`);
    }

    // 3. Desencriptar Llave Privada .key (EncryptedPrivateKeyInfo PKCS#8)
    let privateKey;
    try {
      const keyAsn1 = forge.asn1.fromDer(keyBinary);
      privateKey = forge.pki.decryptPrivateKeyInfo(keyAsn1, password);
    } catch (e) {
      // Error al desencriptar o parsear ASN.1
      throw new Error(`No se pudo desencriptar la llave privada (.key). Verifique que la contraseña sea correcta: ${e.message}`);
    }

    if (!privateKey) {
      throw new Error('Contraseña de la FIEL incorrecta o el archivo .key no pudo ser desencriptado.');
    }

    // 4. Extraer metadatos útiles si están disponibles
    let serialNumber = '';
    try {
      serialNumber = cert.serialNumber || '';
    } catch (e) {
      console.warn('No se pudo extraer número de serie del certificado:', e);
    }

    // 5. Generar la estructura PKCS#12 / PFX
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], password, {
      generateLocalKeyId: true,
      friendlyName: 'FIEL SAT Certificate',
      algorithm: '3des', // Compatible con PAC Prodigia
    });

    // 6. Exportar ASN.1 a DER y luego a Base64
    const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
    const p12Base64 = forge.util.encode64(p12Der);

    return {
      pfxBase64: p12Base64,
      serialNumber,
    };
  } catch (err) {
    console.error('[fielUtils] Error al generar PFX:', err);
    throw err;
  }
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
      const base64 = result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(new Error(`Error al leer archivo ${file.name}: ${err.message}`));
    reader.readAsDataURL(file);
  });
}
