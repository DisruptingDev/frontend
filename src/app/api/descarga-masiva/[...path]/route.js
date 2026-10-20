import { NextResponse } from 'next/server';
import forge from 'node-forge';
import {
  cargarCredencialesFiel,
  autenticarConSat,
  solicitarDescargaSat,
  verificarSolicitudSat,
  descargarPaqueteSat
} from '@/lib/services/satWsDescargaService';

export async function POST(request, context) {
  const resolvedParams = context?.params ? await context.params : {};
  const pathParam = resolvedParams.path;
  const pathArray = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];

  let endpoint = pathArray.join('/').toLowerCase();

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // =========================================================================
    // 0. CONVERTIR CER + KEY (FIEL) A PFX EN SERVIDOR
    // =========================================================================
    if (endpoint === 'fiel/convertir' || endpoint === 'convertir-fiel') {
      const { cer, key, password } = body;
      if (!cer || !key || !password) {
        return NextResponse.json({
          error: 'Debe proporcionar certificado (.cer), llave (.key) y contraseña de la FIEL.'
        }, { status: 400 });
      }

      const { cert, privateKey, serialNumber } = cargarCredencialesFiel(cer, key, password);

      const p12Asn1 = forge.pkcs12.toPkcs12Asn1(privateKey, [cert], password, {
        generateLocalKeyId: true,
        friendlyName: 'FIEL SAT Certificate',
        algorithm: '3des'
      });

      const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
      const pfxBase64 = forge.util.encode64(p12Der);

      return NextResponse.json({
        pfxBase64,
        serialNumber
      }, { status: 200 });
    }

    // =========================================================================
    // 1. SOLICITAR DESCARGA DIRECTA AL SAT (CFDI o METADATA)
    // =========================================================================
    if (
      endpoint === 'metadata/solicitar' ||
      endpoint === 'solicitar' ||
      endpoint === 'multicomprobantes' ||
      endpoint.endsWith('solicitar')
    ) {
      const {
        rfc,
        cer,
        key,
        password,
        fechaInicio,
        fechaFin,
        peticion,
        tipoPeticion
      } = body;

      const rfcSolicitante = Array.isArray(rfc) ? rfc[0] : (rfc || '');
      if (!rfcSolicitante) {
        return NextResponse.json({ error: 'Debe especificar el RFC solicitante.' }, { status: 400 });
      }

      if (!cer || !key || !password) {
        return NextResponse.json({
          error: 'Para solicitar descarga directa al SAT, es necesario proporcionar los archivos de la e.firma (.cer, .key) y la contraseña de la clave privada.'
        }, { status: 400 });
      }

      // Determinar si es Emitidos o Recibidos
      const tipoFlujo = (peticion || tipoPeticion || 'emitidos').toLowerCase();
      const tipoSolicitudSat = tipoFlujo.includes('recib') ? 'Recibidos' : 'Emitidos';
      const esMetadata = endpoint.includes('metadata');
      const tipoDescargaSat = esMetadata ? 'Metadata' : 'CFDI';

      // Enviar solicitud de descarga directa al SAT
      const paramsSat = {
        rfcSolicitante,
        fechaInicio,
        fechaFin,
        tipoDescarga: tipoDescargaSat,
        tipoSolicitud: tipoSolicitudSat,
        cerInput: cer,
        keyInput: key,
        password
      };

      if (tipoSolicitudSat === 'Emitidos') {
        paramsSat.rfcEmisor = rfcSolicitante;
      } else {
        paramsSat.rfcReceptor = rfcSolicitante;
      }

      const resSat = await solicitarDescargaSat(paramsSat);

      return NextResponse.json({
        codigo: 5000,
        solicitud: resSat.id_solicitud,
        id_solicitud: resSat.id_solicitud,
        mensaje: resSat.mensaje,
        estado: 'Aceptada'
      }, { status: 200 });
    }

    // =========================================================================
    // 2. VERIFICAR ESTATUS DE LA SOLICITUD EN EL SAT
    // =========================================================================
    if (
      endpoint === 'metadata/verificar' ||
      endpoint === 'verificar' ||
      endpoint.endsWith('verificar')
    ) {
      const {
        solicitud,
        id_solicitud,
        rfc,
        cer,
        key,
        password
      } = body;

      const idSol = solicitud || id_solicitud;
      const rfcSol = Array.isArray(rfc) ? rfc[0] : (rfc || '');

      if (!idSol || !rfcSol) {
        return NextResponse.json({ error: 'Se requiere el ID de solicitud y el RFC del solicitante.' }, { status: 400 });
      }

      if (!cer || !key || !password) {
        return NextResponse.json({
          error: 'Credenciales de e.firma requeridas (.cer, .key y contraseña) para consultar al SAT.'
        }, { status: 400 });
      }

      const resVerifica = await verificarSolicitudSat({
        idSolicitud: idSol,
        cerInput: cer,
        keyInput: key,
        password
      });

      return NextResponse.json({
        codigo: 5000,
        id_solicitud: idSol,
        estado_solicitud: resVerifica.estado_solicitud,
        estado: resVerifica.estado_texto,
        mensaje: resVerifica.mensaje || `Estado SAT: ${resVerifica.estado_texto}`,
        numero_cfdis: resVerifica.numero_cfdis,
        ids_paquetes: resVerifica.ids_paquetes
      }, { status: 200 });
    }

    // =========================================================================
    // 3. DESCARGAR PAQUETES ZIP DE COMPROBANTES DEL SAT
    // =========================================================================
    if (
      endpoint === 'descargar' ||
      endpoint.endsWith('descargar') ||
      endpoint.includes('paquete')
    ) {
      const {
        id_paquete,
        idPaquete,
        rfc,
        cer,
        key,
        password
      } = body;

      const targetPaquete = id_paquete || idPaquete;
      const rfcSol = Array.isArray(rfc) ? rfc[0] : (rfc || '');

      if (!targetPaquete || !rfcSol) {
        return NextResponse.json({ error: 'Se requiere el ID de paquete y RFC.' }, { status: 400 });
      }

      if (!cer || !key || !password) {
        return NextResponse.json({
          error: 'Credenciales de e.firma requeridas (.cer, .key y contraseña) para descargar del SAT.'
        }, { status: 400 });
      }

      const resDescarga = await descargarPaqueteSat({
        idPaquete: targetPaquete,
        cerInput: cer,
        keyInput: key,
        password
      });

      return NextResponse.json({
        codigo: 5000,
        id_paquete: targetPaquete,
        paquete_b64: resDescarga.paquete_zip_base64
      }, { status: 200 });
    }

    // =========================================================================
    // 4. FALLBACK HACIA EL BACKEND REMOTO (si aplica otra función secundaria)
    // =========================================================================
    const baseRaw =
      process.env.NEXT_PUBLIC_API_URL ||
      process.env.API_URL ||
      'https://api.wisefacturacion.com';

    const baseUrl = (baseRaw.startsWith('http') ? baseRaw : `https://${baseRaw}`).replace(/\/+$/, '');
    const targetUrl = `${baseUrl}/api/descargamasiva/${endpoint}`;

    const authHeader = request.headers.get('authorization') || '';
    const headers = { 'Content-Type': 'application/json' };
    if (authHeader) headers['Authorization'] = authHeader;

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    const data = await response.json().catch(() => ({}));
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error(`[Descarga Masiva SAT Error]:`, error);
    return NextResponse.json(
      {
        error: error.message || 'Error al procesar la operación de descarga masiva con el SAT.',
        codigo: 400
      },
      { status: 400 }
    );
  }
}
