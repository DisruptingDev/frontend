import forge from 'node-forge';

// Registrar OIDs y mapeos de algoritmos faltantes requeridos para desencriptar llaves .key del SAT México
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
 * Convierte un buffer o string a binary string compatible con node-forge
 */
function arrayBufferToBinaryString(buffer) {
  if (!buffer) return '';
  if (typeof buffer === 'string') return buffer;
  let bytes;
  if (buffer instanceof ArrayBuffer) {
    bytes = new Uint8Array(buffer);
  } else if (ArrayBuffer.isView(buffer)) {
    bytes = new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
  } else if (typeof buffer === 'object' && buffer.data) {
    bytes = new Uint8Array(buffer.data);
  } else {
    bytes = new Uint8Array(buffer);
  }
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
 * @returns {{ pfxBase64: string, serialNumber?: string }} Objeto con el PFX en Base64 y metadatos opcionales
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

    // 3. Desencriptar Llave Privada .key (EncryptedPrivateKeyInfo PKCS#8 / PKCS#5)
    let privateKey = null;

    try {
      const keyAsn1 = forge.asn1.fromDer(keyBinary);

      // Intentar 1: Desencriptar ASN.1 EncryptedPrivateKeyInfo (PKCS#8 Cifrado del SAT)
      try {
        const decryptedAsn1 = forge.pki.decryptPrivateKeyInfo(keyAsn1, password);
        if (decryptedAsn1) {
          privateKey = forge.pki.privateKeyFromAsn1(decryptedAsn1);
        }
      } catch (errDecrypt) {
        console.warn('[fielUtils] decryptPrivateKeyInfo falló, probando alternativas:', errDecrypt.message);
      }

      // Intentar 2: Si ya era una llave sin cifrar en ASN.1 DER
      if (!privateKey) {
        try {
          privateKey = forge.pki.privateKeyFromAsn1(keyAsn1);
        } catch (errDirect) {
          // Ignorar
        }
      }
    } catch (eDer) {
      console.warn('[fielUtils] Error al procesar formato DER de la llave privada:', eDer.message);
    }

    // Intentar 3: Formato PEM cifrado o plano (por si la llave fue convertida a PEM)
    if (!privateKey) {
      try {
        const keyText = arrayBufferToBinaryString(keyBuffer);
        if (keyText.includes('PRIVATE KEY')) {
          try {
            privateKey = forge.pki.decryptRsaPrivateKey(keyText, password);
          } catch (ePemDec) {
            privateKey = forge.pki.privateKeyFromPem(keyText);
          }
        }
      } catch (ePem) {
        // Ignorar
      }
    }

    if (!privateKey) {
      throw new Error('Contraseña de la FIEL incorrecta o la llave privada (.key) no corresponde a la clave ingresada.');
    }

    // 4. Validar que la llave privada y el certificado coincidan
    if (cert && cert.publicKey && privateKey && cert.publicKey.n && privateKey.n) {
      if (cert.publicKey.n.toString(16) !== privateKey.n.toString(16)) {
        throw new Error('El archivo de Certificado (.cer) y la Llave Privada (.key) no corresponden a la misma e.firma / FIEL.');
      }
    }

    // 5. Extraer metadatos del certificado
    let serialNumber = '';
    try {
      serialNumber = cert.serialNumber || '';
    } catch (e) {
      console.warn('No se pudo extraer número de serie del certificado:', e);
    }

    // 6. Generar la estructura PKCS#12 / PFX
    const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], password, {
      generateLocalKeyId: true,
      friendlyName: 'FIEL SAT Certificate',
      algorithm: '3des', // Compatible con PAC Prodigia
    });

    // 7. Exportar ASN.1 a DER y luego a Base64
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
      const base64 = typeof result === 'string' && result.includes(',') ? result.split(',')[1] : result;
      resolve(base64);
    };
    reader.onerror = (err) => reject(new Error(`Error al leer archivo ${file.name}: ${err.message}`));
    reader.readAsDataURL(file);
  });
}
