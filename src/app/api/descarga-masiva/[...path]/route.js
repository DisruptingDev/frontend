import { NextResponse } from 'next/server';
import forge from 'node-forge';
import JSZip from 'jszip';
import prisma from '@/lib/prisma';
import {
  cargarCredencialesFiel,
  autenticarConSat,
  solicitarDescargaSat,
  verificarSolicitudSat,
  descargarPaqueteSat
} from '@/lib/services/satWsDescargaService';

async function extraerComprobantesDeZip(zipBase64) {
  if (!zipBase64) return [];
  try {
    const zip = new JSZip();
    const content = await zip.loadAsync(zipBase64, { base64: true });
    const comprobantes = [];

    for (const [filename, fileObj] of Object.entries(content.files)) {
      if (fileObj.dir) continue;
      const lower = filename.toLowerCase();

      // Caso 1: Archivo TXT de Metadata del SAT
      if (lower.endsWith('.txt')) {
        const text = await fileObj.async('text');
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length >= 2) {
          const header = lines[0].split('~');
          for (let i = 1; i < lines.length; i++) {
            const cols = lines[i].split('~');
            const row = {};
            header.forEach((h, idx) => { row[h] = cols[idx] || ''; });
            comprobantes.push({
              uuid: row.Uuid || '',
              UUID: row.Uuid || '',
              rfc_emisor: row.RfcEmisor || '',
              RfcEmisor: row.RfcEmisor || '',
              nombre_emisor: row.NombreEmisor || '',
              NombreEmisor: row.NombreEmisor || '',
              rfc_receptor: row.RfcReceptor || '',
              RfcReceptor: row.RfcReceptor || '',
              nombre_receptor: row.NombreReceptor || '',
              NombreReceptor: row.NombreReceptor || '',
              total: parseFloat(row.Monto || 0),
              Total: parseFloat(row.Monto || 0),
              fecha_emision: row.FechaEmision || '',
              fecha_certificacion: row.FechaCertificacionSat || '',
              pac: row.PacCertifico || '',
              efecto: row.EfectoComprobante || 'I',
              estatus: row.Estatus === '1' ? 'Vigente' : 'Cancelado',
              fecha_cancelacion: row.FechaCancelacion || '',
              tipo_origen: 'metadata'
            });
          }
        }
      }

      // Caso 2: Archivo XML directo
      if (lower.endsWith('.xml')) {
        const xmlText = await fileObj.async('text');
        // Parsear atributos básicos del comprobante mediante regex ligero
        const uuidMatch = xmlText.match(/UUID=["']([^"']+)["']/i);
        const totalMatch = xmlText.match(/Total=["']([^"']+)["']/i);
        const rfcEmisorMatch = xmlText.match(/<cfdi:Emisor[^>]*Rfc=["']([^"']+)["']/i) || xmlText.match(/Rfc=["']([^"']+)["']/i);
        const nomEmisorMatch = xmlText.match(/<cfdi:Emisor[^>]*Nombre=["']([^"']+)["']/i);
        const rfcReceptorMatch = xmlText.match(/<cfdi:Receptor[^>]*Rfc=["']([^"']+)["']/i);
        const nomReceptorMatch = xmlText.match(/<cfdi:Receptor[^>]*Nombre=["']([^"']+)["']/i);
        const fechaMatch = xmlText.match(/Fecha=["']([^"']+)["']/i);
        const efectoMatch = xmlText.match(/TipoDeComprobante=["']([^"']+)["']/i);

        comprobantes.push({
          uuid: uuidMatch ? uuidMatch[1] : filename.replace(/\.xml$/i, ''),
          UUID: uuidMatch ? uuidMatch[1] : filename.replace(/\.xml$/i, ''),
          rfc_emisor: rfcEmisorMatch ? rfcEmisorMatch[1] : '',
          RfcEmisor: rfcEmisorMatch ? rfcEmisorMatch[1] : '',
          nombre_emisor: nomEmisorMatch ? nomEmisorMatch[1] : '',
          NombreEmisor: nomEmisorMatch ? nomEmisorMatch[1] : '',
          rfc_receptor: rfcReceptorMatch ? rfcReceptorMatch[1] : '',
          RfcReceptor: rfcReceptorMatch ? rfcReceptorMatch[1] : '',
          nombre_receptor: nomReceptorMatch ? nomReceptorMatch[1] : '',
          NombreReceptor: nomReceptorMatch ? nomReceptorMatch[1] : '',
          total: totalMatch ? parseFloat(totalMatch[1]) : 0,
          Total: totalMatch ? parseFloat(totalMatch[1]) : 0,
          fecha_emision: fechaMatch ? fechaMatch[1] : '',
          efecto: efectoMatch ? efectoMatch[1] : 'I',
          estatus: 'Vigente',
          xml: xmlText,
          tipo_origen: 'xml'
        });
      }
    }

    return comprobantes;
  } catch (err) {
    console.warn('[extraerComprobantesDeZip Error]:', err.message);
    return [];
  }
}

export async function GET(request, context) {
  let endpoint = '';
  try {
    const resolvedParams = context?.params ? await Promise.resolve(context.params) : {};
    const pathParam = resolvedParams.path;
    const pathArray = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
    endpoint = pathArray.join('/').toLowerCase();
  } catch {}

  if (request?.url) {
    try {
      const parsedUrl = new URL(request.url);
      const match = parsedUrl.pathname.match(/\/api\/descarga-masiva\/(.+)/i);
      if (match && match[1]) {
        const urlEndpoint = match[1].toLowerCase().replace(/^\/+|\/+$/g, '');
        if (!endpoint || endpoint !== urlEndpoint) {
          endpoint = urlEndpoint;
        }
      }
    } catch {}
  }

  endpoint = (endpoint || '').replace(/^\/+|\/+$/g, '');
  console.log(`[Descarga Masiva Proxy GET] Endpoint recibido: "${endpoint}"`);

  const { searchParams } = new URL(request.url);
  const rfcFilter = searchParams.get('rfc');

  // Listar empresas con FIEL guardada
  if (endpoint === 'fiel/listar' || endpoint === 'fiel' || endpoint.endsWith('fiel/listar')) {
    try {
      const empresasFiel = await prisma.sat_empresas_fiel.findMany({
        select: {
          id: true,
          rfc: true,
          razon_social: true,
          no_certificado: true,
          vigente_hasta: true,
          created_at: true,
          updated_at: true
        },
        orderBy: { created_at: 'desc' }
      });

      return NextResponse.json({
        ok: true,
        empresas: empresasFiel.map(e => ({
          ...e,
          id: e.id ? e.id.toString() : null
        }))
      }, { status: 200 });
    } catch (err) {
      console.error('[Descarga Masiva GET fiel/listar Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  // Listar peticiones registradas
  if (endpoint === 'sat/peticiones' || endpoint === 'peticiones') {
    try {
      const whereClause = {};
      if (rfcFilter && rfcFilter !== 'todos') {
        whereClause.rfc = rfcFilter;
      }

      const lista = await prisma.sat_solicitudes_descarga.findMany({
        where: whereClause,
        orderBy: { created_at: 'desc' },
        take: 100
      });

      return NextResponse.json({
        ok: true,
        peticiones: lista.map(item => ({
          id: item.id_solicitud,
          id_solicitud: item.id_solicitud,
          solicitud: item.id_solicitud,
          rfc: item.rfc,
          tipo: item.tipo_descarga,
          tipo_descarga: item.tipo_descarga,
          tipo_flujo: item.tipo_solicitud,
          direccion: item.tipo_solicitud,
          fecha_inicio: item.fecha_inicio,
          fecha_fin: item.fecha_fin,
          estatus: item.estado_texto,
          estado: item.estado_texto,
          estado_solicitud: item.estado_solicitud,
          codigo_estatus: item.codigo_estatus,
          numero_cfdis: item.numero_cfdis,
          mensaje: item.mensaje,
          ids_paquetes: item.ids_paquetes,
          zip_base64: item.paquete_zip64 || item.paquete_zip_base64 || null,
          fecha_solicitud: item.created_at
        }))
      }, { status: 200 });
    } catch (err) {
      console.error('[Descarga Masiva GET sat/peticiones Error]:', err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }

  return NextResponse.json({ error: 'Endpoint GET no encontrado' }, { status: 404 });
}

export async function POST(request, context) {
  let endpoint = '';
  try {
    const resolvedParams = context?.params ? await Promise.resolve(context.params) : {};
    const pathParam = resolvedParams.path;
    const pathArray = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];
    endpoint = pathArray.join('/').toLowerCase();
  } catch {}

  if (request?.url) {
    try {
      const parsedUrl = new URL(request.url);
      const match = parsedUrl.pathname.match(/\/api\/descarga-masiva\/(.+)/i);
      if (match && match[1]) {
        const urlEndpoint = match[1].toLowerCase().replace(/^\/+|\/+$/g, '');
        if (!endpoint || endpoint !== urlEndpoint) {
          endpoint = urlEndpoint;
        }
      }
    } catch {}
  }

  // Quitar slash inicial y final
  endpoint = (endpoint || '').replace(/^\/+|\/+$/g, '');
  console.log(`[Descarga Masiva Proxy POST] Endpoint recibido: "${endpoint}"`);

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    // =========================================================================
    // 0. GESTIÓN DE EMPRESAS Y FIEL EN BASE DE DATOS
    // =========================================================================

    // A) Guardar o actualizar FIEL de una empresa
    if (endpoint === 'fiel/guardar' || endpoint === 'guardar-fiel') {
      const { rfc, razonSocial, razon_social, cer, key, password } = body;
      const targetRfc = (rfc || '').toUpperCase().trim();
      const targetNombre = razonSocial || razon_social || '';

      if (!targetRfc || !cer || !key || !password) {
        return NextResponse.json({
          error: 'Debe proporcionar RFC, certificado (.cer), llave (.key) y contraseña de la FIEL.'
        }, { status: 400 });
      }

      // Validar y desencriptar la FIEL para asegurar que funciona y extraer vigencia y no. de certificado
      const { cert, serialNumber } = cargarCredencialesFiel(cer, key, password);
      const vigenteHasta = cert.validity?.notAfter || null;

      // Limpiar certificados a base64 limpio
      const cleanCer = cer.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
      const cleanKey = key.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');

      const guardado = await prisma.sat_empresas_fiel.upsert({
        where: { rfc: targetRfc },
        update: {
          razon_social: targetNombre || undefined,
          cer_base64: cleanCer,
          key_base64: cleanKey,
          password_fiel: password,
          no_certificado: serialNumber || null,
          vigente_hasta: vigenteHasta,
          updated_at: new Date()
        },
        create: {
          rfc: targetRfc,
          razon_social: targetNombre || targetRfc,
          cer_base64: cleanCer,
          key_base64: cleanKey,
          password_fiel: password,
          no_certificado: serialNumber || null,
          vigente_hasta: vigenteHasta,
          created_at: new Date(),
          updated_at: new Date()
        }
      });

      return NextResponse.json({
        ok: true,
        mensaje: `FIEL de la empresa ${targetRfc} guardada en base de datos exitosamente.`,
        empresa: {
          id: guardado.id ? guardado.id.toString() : null,
          rfc: guardado.rfc,
          razon_social: guardado.razon_social,
          no_certificado: guardado.no_certificado,
          vigente_hasta: guardado.vigente_hasta
        }
      }, { status: 200 });
    }

    // B) Listar empresas con FIEL guardada
    if (endpoint === 'fiel/listar' || endpoint === 'fiel') {
      try {
        const empresasFiel = await prisma.sat_empresas_fiel.findMany({
          select: {
            id: true,
            rfc: true,
            razon_social: true,
            no_certificado: true,
            vigente_hasta: true,
            created_at: true,
            updated_at: true
          },
          orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({
          codigo: 200,
          ok: true,
          empresas: empresasFiel.map(e => ({
            ...e,
            id: e.id ? e.id.toString() : null
          }))
        }, { status: 200 });
      } catch (fielListErr) {
        console.error('[fiel/listar Error]:', fielListErr.message);
        return NextResponse.json({ codigo: 200, ok: true, empresas: [] }, { status: 200 });
      }
    }

    // C) Listar razones sociales (utilizado por GestionEmpresasTab)
    if (
      endpoint === 'razon-social/listar' ||
      endpoint === 'razon_social/listar' ||
      endpoint.endsWith('razon-social/listar') ||
      endpoint.endsWith('razonsocial/listar')
    ) {
      try {
        const empresasFiel = await prisma.sat_empresas_fiel.findMany({
          select: {
            id: true,
            rfc: true,
            razon_social: true,
            no_certificado: true,
            vigente_hasta: true,
            created_at: true,
            updated_at: true
          },
          orderBy: { created_at: 'desc' }
        });

        return NextResponse.json({
          codigo: 200,
          ok: true,
          razonesSociales: empresasFiel.map(e => ({
            id: e.id ? e.id.toString() : null,
            rfc: e.rfc,
            Rfc: e.rfc,
            razon_social: e.razon_social,
            RazonSocial: e.razon_social,
            no_certificado: e.no_certificado,
            vigente_hasta: e.vigente_hasta,
            sync: '1',
            estatus: 'Activa con FIEL Directa SAT'
          }))
        }, { status: 200 });
      } catch (rsListErr) {
        console.error('[razon-social/listar Error]:', rsListErr.message);
        return NextResponse.json({ codigo: 200, ok: true, razonesSociales: [] }, { status: 200 });
      }
    }

    // D) Crear/Actualizar Razón Social desde GestionEmpresasTab
    if (endpoint === 'razon-social/crear' || endpoint === 'razon-social/actualizar') {
      const {
        rfc,
        razonSocial,
        razon_social,
        fiel,
        cer,
        key,
        password
      } = body;

      const targetRfc = (rfc || body.ciec?.rfc || '').toUpperCase().trim();
      const targetNombre = razonSocial || (typeof razon_social === 'string' ? razon_social : '') || targetRfc;
      const fielObj = fiel || (typeof razon_social === 'object' ? razon_social : null) || {};

      const cerInput = cer || fielObj.certificado || fielObj.cer;
      const keyInput = key || fielObj.key;
      const passInput = password || fielObj.passPfx || fielObj.password;

      if (targetRfc && cerInput && keyInput && passInput) {
        try {
          const { cert, serialNumber } = cargarCredencialesFiel(cerInput, keyInput, passInput);
          const vigenteHasta = cert.validity?.notAfter || null;
          const cleanCer = cerInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
          const cleanKey = keyInput.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');

          await prisma.sat_empresas_fiel.upsert({
            where: { rfc: targetRfc },
            update: {
              razon_social: targetNombre,
              cer_base64: cleanCer,
              key_base64: cleanKey,
              password_fiel: passInput,
              no_certificado: serialNumber || null,
              vigente_hasta: vigenteHasta,
              updated_at: new Date()
            },
            create: {
              rfc: targetRfc,
              razon_social: targetNombre,
              cer_base64: cleanCer,
              key_base64: cleanKey,
              password_fiel: passInput,
              no_certificado: serialNumber || null,
              vigente_hasta: vigenteHasta,
              created_at: new Date(),
              updated_at: new Date()
            }
          });

          return NextResponse.json({
            codigo: 200,
            ok: true,
            mensaje: `Empresa ${targetRfc} dada de alta y vinculada directamente con el SAT.`
          }, { status: 200 });
        } catch (fielErr) {
          return NextResponse.json({
            codigo: 400,
            error: `Error al validar e.firma: ${fielErr.message}`
          }, { status: 400 });
        }
      }

      // Si no vienen los archivos en crudo pero ya existe en DB, responder exitoso
      if (targetRfc) {
        const existe = await prisma.sat_empresas_fiel.findUnique({ where: { rfc: targetRfc } });
        if (existe) {
          return NextResponse.json({
            codigo: 200,
            ok: true,
            mensaje: `Empresa ${targetRfc} ya cuenta con FIEL activa en el sistema.`
          }, { status: 200 });
        }
      }

      return NextResponse.json({
        codigo: 200,
        ok: true,
        mensaje: `Empresa ${targetRfc || 'seleccionada'} procesada exitosamente.`
      }, { status: 200 });
    }

    // =========================================================================
    // 1. BANDEJA DE PETICIONES Y HISTORIAL SAT (BD LOCAL)
    // =========================================================================
    if (
      endpoint === 'sat/peticiones' ||
      endpoint === 'peticiones' ||
      endpoint.endsWith('peticiones')
    ) {
      const rfcFiltro = body.rfc || '';
      const whereClause = {};
      if (rfcFiltro && rfcFiltro !== 'todos') {
        whereClause.rfc = rfcFiltro;
      }

      try {
        const lista = await prisma.sat_solicitudes_descarga.findMany({
          where: whereClause,
          orderBy: { created_at: 'desc' },
          take: 100
        });

        return NextResponse.json({
          codigo: 200,
          ok: true,
          peticiones: lista.map(item => ({
            id: item.id_solicitud,
            id_solicitud: item.id_solicitud,
            solicitud: item.id_solicitud,
            folio: item.id_solicitud,
            rfc: item.rfc,
            tipo: item.tipo_descarga,
            tipo_descarga: item.tipo_descarga,
            tipo_flujo: item.tipo_solicitud,
            direccion: item.tipo_solicitud,
            fecha_inicio: item.fecha_inicio,
            fecha_fin: item.fecha_fin,
            estatus: item.estado_texto,
            estado: item.estado_texto,
            estado_solicitud: item.estado_solicitud,
            codigo_estatus: item.codigo_estatus,
            numero_cfdis: item.numero_cfdis,
            mensaje: item.mensaje,
            ids_paquetes: item.ids_paquetes,
            zip_base64: item.paquete_zip_base64 || null,
            fecha_solicitud: item.created_at
          }))
        }, { status: 200 });
      } catch (dbErr) {
        console.error('[Descarga Masiva sat/peticiones DB Error]:', dbErr.message);
        return NextResponse.json({
          codigo: 200,
          ok: true,
          peticiones: [],
          mensaje: 'No se pudieron recuperar peticiones previas: ' + dbErr.message
        }, { status: 200 });
      }
    }

    // Sincronizar / actualizar todas las peticiones pendientes con el SAT
    if (endpoint === 'sat/sincronizar' || endpoint === 'sincronizar') {
      const rfcTarget = body.rfc || '';
      const whereClause = {
        estado_texto: {
          in: ['Aceptada', 'En Proceso']
        }
      };
      if (rfcTarget && rfcTarget !== 'todos') {
        whereClause.rfc = rfcTarget;
      }

      try {
        const pendientes = await prisma.sat_solicitudes_descarga.findMany({
          where: whereClause,
          take: 15
        });

        let actualizadas = 0;
        for (const pend of pendientes) {
          try {
            const empFiel = await prisma.sat_empresas_fiel.findUnique({
              where: { rfc: pend.rfc }
            });
            if (!empFiel) continue;

            const resVerifica = await verificarSolicitudSat({
              idSolicitud: pend.id_solicitud,
              cerInput: empFiel.cer_base64,
              keyInput: empFiel.key_base64,
              password: empFiel.password_fiel
            });

            let paqueteZipB64 = pend.paquete_zip_base64 || null;
            if (resVerifica.estado_solicitud === 3 && resVerifica.ids_paquetes?.length > 0 && !paqueteZipB64) {
              try {
                const idPrimerPaquete = resVerifica.ids_paquetes[0];
                const resDescarga = await descargarPaqueteSat({
                  idPaquete: idPrimerPaquete,
                  cerInput: empFiel.cer_base64,
                  keyInput: empFiel.key_base64,
                  password: empFiel.password_fiel
                });
                paqueteZipB64 = resDescarga.paquete_zip_base64;
              } catch (downErr) {
                console.warn(`[Auto-descarga paquete en sync]: ${downErr.message}`);
              }
            }

            await prisma.sat_solicitudes_descarga.update({
              where: { id_solicitud: pend.id_solicitud },
              data: {
                estado_solicitud: resVerifica.estado_solicitud,
                estado_texto: resVerifica.estado_texto,
                codigo_estatus: String(resVerifica.codigo_estatus),
                numero_cfdis: resVerifica.numero_cfdis,
                mensaje: resVerifica.mensaje,
                ids_paquetes: resVerifica.ids_paquetes || [],
                paquete_zip_base64: paqueteZipB64 || undefined,
                updated_at: new Date()
              }
            });
            actualizadas++;
          } catch (e) {
            console.warn(`[Sync SAT]: No se pudo actualizar ${pend.id_solicitud}: ${e.message}`);
          }
        }

        return NextResponse.json({
          codigo: 200,
          ok: true,
          mensaje: `Sincronización completada. ${actualizadas} solicitud(es) consultadas con el SAT.`
        }, { status: 200 });
      } catch (dbErr) {
        console.error('[Descarga Masiva sat/sincronizar DB Error]:', dbErr.message);
        return NextResponse.json({
          codigo: 200,
          ok: true,
          mensaje: 'Sincronización ejecutada (sin registros pendientes por procesar).'
        }, { status: 200 });
      }
    }

    // =========================================================================
    // 2. CONVERTIR CER + KEY (FIEL) A PFX EN SERVIDOR
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
    // 3. SOLICITAR DESCARGA DIRECTA AL SAT (CFDI o METADATA)
    // =========================================================================
    if (
      endpoint === 'metadata/solicitar' ||
      endpoint === 'solicitar' ||
      endpoint === 'multicomprobantes' ||
      endpoint === 'multicomprobantes/solicitar' ||
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
        tipoPeticion,
        rfcContraparte,
        tipo,
        estadoComprobante
      } = body;

      const rfcSolicitante = Array.isArray(rfc) ? rfc[0] : (rfc || '');
      if (!rfcSolicitante) {
        return NextResponse.json({ error: 'Debe especificar el RFC solicitante.' }, { status: 400 });
      }

      // Si no envió los archivos en la llamada, buscar la FIEL guardada en la base de datos
      let cerFinal = cer;
      let keyFinal = key;
      let passFinal = password;

      if (!cerFinal || !keyFinal || !passFinal) {
        const empresaFiel = await prisma.sat_empresas_fiel.findUnique({
          where: { rfc: rfcSolicitante }
        });
        if (empresaFiel) {
          cerFinal = empresaFiel.cer_base64;
          keyFinal = empresaFiel.key_base64;
          passFinal = empresaFiel.password_fiel;
        }
      }

      if (!cerFinal || !keyFinal || !passFinal) {
        return NextResponse.json({
          error: `No se encontraron credenciales de e.firma (FIEL) para la empresa ${rfcSolicitante}. Por favor adjunte los archivos .cer y .key o vincúlela en Gestión de Empresas.`
        }, { status: 400 });
      }

      // Si el usuario subió cer y key frescos en la solicitud y no estaban en DB, guardarlos/actualizarlos
      try {
        const cleanCer = cerFinal.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
        const cleanKey = keyFinal.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
        const { cert, serialNumber } = cargarCredencialesFiel(cleanCer, cleanKey, passFinal);
        const vigenteHasta = cert.validity?.notAfter || null;

        await prisma.sat_empresas_fiel.upsert({
          where: { rfc: rfcSolicitante },
          update: {
            cer_base64: cleanCer,
            key_base64: cleanKey,
            password_fiel: passFinal,
            no_certificado: serialNumber || null,
            vigente_hasta: vigenteHasta,
            updated_at: new Date()
          },
          create: {
            rfc: rfcSolicitante,
            razon_social: rfcSolicitante,
            cer_base64: cleanCer,
            key_base64: cleanKey,
            password_fiel: passFinal,
            no_certificado: serialNumber || null,
            vigente_hasta: vigenteHasta,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      } catch (fielSaveErr) {
        console.warn('[FIEL Auto-save warning]:', fielSaveErr.message);
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
        cerInput: cerFinal,
        keyInput: keyFinal,
        password: passFinal,
        estadoComprobante,
        tipoComprobante: tipo
      };

      if (tipoSolicitudSat === 'Emitidos') {
        paramsSat.rfcEmisor = rfcSolicitante;
        if (rfcContraparte) paramsSat.rfcReceptor = rfcContraparte;
      } else {
        paramsSat.rfcReceptor = rfcSolicitante;
        if (rfcContraparte) paramsSat.rfcEmisor = rfcContraparte;
      }

      const resSat = await solicitarDescargaSat(paramsSat);

      // Guardar solicitud en la tabla sat_solicitudes_descarga
      try {
        await prisma.sat_solicitudes_descarga.upsert({
          where: { id_solicitud: resSat.id_solicitud },
          update: {
            rfc: rfcSolicitante,
            tipo_descarga: tipoDescargaSat,
            tipo_solicitud: tipoSolicitudSat,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado_solicitud: 1,
            estado_texto: 'Aceptada',
            codigo_estatus: String(resSat.codigo_estatus || 5000),
            mensaje: resSat.mensaje || 'Solicitud aceptada por el SAT',
            updated_at: new Date()
          },
          create: {
            id_solicitud: resSat.id_solicitud,
            rfc: rfcSolicitante,
            tipo_descarga: tipoDescargaSat,
            tipo_solicitud: tipoSolicitudSat,
            fecha_inicio: fechaInicio,
            fecha_fin: fechaFin,
            estado_solicitud: 1,
            estado_texto: 'Aceptada',
            codigo_estatus: String(resSat.codigo_estatus || 5000),
            mensaje: resSat.mensaje || 'Solicitud aceptada por el SAT',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      } catch (dbErr) {
        console.error('[Error guardando solicitud en BD]:', dbErr);
      }

      return NextResponse.json({
        codigo: 5000,
        solicitud: resSat.id_solicitud,
        id_solicitud: resSat.id_solicitud,
        mensaje: resSat.mensaje,
        estado: 'Aceptada'
      }, { status: 200 });
    }

    // =========================================================================
    // 4. VERIFICAR ESTATUS DE LA SOLICITUD EN EL SAT
    // =========================================================================
    if (
      endpoint === 'metadata/verificar' ||
      endpoint === 'multicomprobantes/verificar' ||
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
      if (!idSol) {
        return NextResponse.json({ error: 'Se requiere el ID de solicitud.' }, { status: 400 });
      }

      // Buscar en BD la solicitud para inferir el RFC si no fue enviado
      let rfcSol = Array.isArray(rfc) ? rfc[0] : (rfc || '');
      let solRecord = null;
      if (!rfcSol) {
        solRecord = await prisma.sat_solicitudes_descarga.findUnique({
          where: { id_solicitud: idSol }
        });
        if (solRecord) {
          rfcSol = solRecord.rfc;
        }
      }

      if (!rfcSol) {
        return NextResponse.json({ error: 'Se requiere el RFC de la empresa solicitante.' }, { status: 400 });
      }

      // Buscar FIEL en BD si no se enviaron archivos
      let cerFinal = cer;
      let keyFinal = key;
      let passFinal = password;

      if (!cerFinal || !keyFinal || !passFinal) {
        const empresaFiel = await prisma.sat_empresas_fiel.findUnique({
          where: { rfc: rfcSol }
        });
        if (empresaFiel) {
          cerFinal = empresaFiel.cer_base64;
          keyFinal = empresaFiel.key_base64;
          passFinal = empresaFiel.password_fiel;
        }
      }

      if (!cerFinal || !keyFinal || !passFinal) {
        return NextResponse.json({
          error: `Credenciales de e.firma no encontradas para ${rfcSol}. Adjunte .cer, .key y contraseña o vincule la empresa.`
        }, { status: 400 });
      }

      const resVerifica = await verificarSolicitudSat({
        idSolicitud: idSol,
        cerInput: cerFinal,
        keyInput: keyFinal,
        password: passFinal
      });

      // Si la solicitud ya está Terminada y tiene paquetes, y aún no tenemos el ZIP en BD, descargarlo de una vez
      let paqueteZipB64 = solRecord?.paquete_zip_base64 || null;
      if (resVerifica.estado_solicitud === 3 && resVerifica.ids_paquetes?.length > 0 && !paqueteZipB64) {
        try {
          const idPrimerPaquete = resVerifica.ids_paquetes[0];
          const resDescarga = await descargarPaqueteSat({
            idPaquete: idPrimerPaquete,
            cerInput: cerFinal,
            keyInput: keyFinal,
            password: passFinal
          });
          paqueteZipB64 = resDescarga.paquete_zip_base64;
        } catch (downErr) {
          console.warn(`[Auto-descarga paquete aviso]: ${downErr.message}`);
        }
      }

      // Actualizar registro en BD
      try {
        await prisma.sat_solicitudes_descarga.upsert({
          where: { id_solicitud: idSol },
          update: {
            rfc: rfcSol,
            estado_solicitud: resVerifica.estado_solicitud,
            estado_texto: resVerifica.estado_texto,
            codigo_estatus: String(resVerifica.codigo_estatus),
            numero_cfdis: resVerifica.numero_cfdis,
            mensaje: resVerifica.mensaje,
            ids_paquetes: resVerifica.ids_paquetes || [],
            paquete_zip_base64: paqueteZipB64 || undefined,
            updated_at: new Date()
          },
          create: {
            id_solicitud: idSol,
            rfc: rfcSol,
            tipo_descarga: 'CFDI',
            tipo_solicitud: 'Emitidos',
            estado_solicitud: resVerifica.estado_solicitud,
            estado_texto: resVerifica.estado_texto,
            codigo_estatus: String(resVerifica.codigo_estatus),
            numero_cfdis: resVerifica.numero_cfdis,
            mensaje: resVerifica.mensaje,
            ids_paquetes: resVerifica.ids_paquetes || [],
            paquete_zip_base64: paqueteZipB64 || null,
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      } catch (dbErr) {
        console.error('[Error actualizando verificacion en BD]:', dbErr);
      }

      // Extraer comprobantes para previsualización inmediata
      const comprobantesExtraidos = await extraerComprobantesDeZip(paqueteZipB64);

      return NextResponse.json({
        codigo: 5000,
        id_solicitud: idSol,
        solicitud: idSol,
        estado_solicitud: resVerifica.estado_solicitud,
        estado: resVerifica.estado_texto,
        mensaje: resVerifica.mensaje || `Estado SAT: ${resVerifica.estado_texto}`,
        numero_cfdis: resVerifica.numero_cfdis || comprobantesExtraidos.length,
        ids_paquetes: resVerifica.ids_paquetes,
        zip_base64: paqueteZipB64,
        comprobantes: comprobantesExtraidos
      }, { status: 200 });
    }

    // =========================================================================
    // 5. DESCARGAR PAQUETES ZIP DE COMPROBANTES DEL SAT
    // =========================================================================
    if (
      endpoint === 'descargar' ||
      endpoint.endsWith('descargar') ||
      endpoint.includes('paquete')
    ) {
      const {
        id_paquete,
        idPaquete,
        id_solicitud,
        solicitud,
        rfc,
        cer,
        key,
        password
      } = body;

      let targetPaquete = id_paquete || idPaquete;
      let rfcSol = Array.isArray(rfc) ? rfc[0] : (rfc || '');
      const idSol = id_solicitud || solicitud;

      // Si no tenemos id_paquete pero tenemos id_solicitud, buscarlo en BD
      if (!targetPaquete && idSol) {
        const sol = await prisma.sat_solicitudes_descarga.findUnique({
          where: { id_solicitud: idSol }
        });
        if (sol) {
          if (!rfcSol) rfcSol = sol.rfc;
          if (sol.paquete_zip_base64) {
            return NextResponse.json({
              codigo: 5000,
              id_paquete: (sol.ids_paquetes && sol.ids_paquetes[0]) || targetPaquete || idSol,
              paquete_b64: sol.paquete_zip_base64,
              zip_base64: sol.paquete_zip_base64
            }, { status: 200 });
          }
          if (Array.isArray(sol.ids_paquetes) && sol.ids_paquetes.length > 0) {
            targetPaquete = sol.ids_paquetes[0];
          }
        }
      }

      if (!targetPaquete) {
        return NextResponse.json({ error: 'Se requiere el ID de paquete del SAT para descargar.' }, { status: 400 });
      }

      // Buscar FIEL en BD si no se enviaron archivos
      let cerFinal = cer;
      let keyFinal = key;
      let passFinal = password;

      if (!cerFinal || !keyFinal || !passFinal) {
        if (!rfcSol && idSol) {
          const sol = await prisma.sat_solicitudes_descarga.findUnique({ where: { id_solicitud: idSol } });
          if (sol) rfcSol = sol.rfc;
        }

        if (rfcSol) {
          const empresaFiel = await prisma.sat_empresas_fiel.findUnique({ where: { rfc: rfcSol } });
          if (empresaFiel) {
            cerFinal = empresaFiel.cer_base64;
            keyFinal = empresaFiel.key_base64;
            passFinal = empresaFiel.password_fiel;
          }
        } else {
          // Tomar la primera FIEL disponible si no hay RFC explícito
          const primeraFiel = await prisma.sat_empresas_fiel.findFirst();
          if (primeraFiel) {
            cerFinal = primeraFiel.cer_base64;
            keyFinal = primeraFiel.key_base64;
            passFinal = primeraFiel.password_fiel;
          }
        }
      }

      if (!cerFinal || !keyFinal || !passFinal) {
        return NextResponse.json({
          error: 'Credenciales de e.firma requeridas (.cer, .key y contraseña) para descargar el paquete del SAT.'
        }, { status: 400 });
      }

      const resDescarga = await descargarPaqueteSat({
        idPaquete: targetPaquete,
        cerInput: cerFinal,
        keyInput: keyFinal,
        password: passFinal
      });

      // Guardar el ZIP en la tabla de solicitudes si corresponde
      if (idSol) {
        try {
          await prisma.sat_solicitudes_descarga.update({
            where: { id_solicitud: idSol },
            data: {
              paquete_zip_base64: resDescarga.paquete_zip_base64,
              updated_at: new Date()
            }
          });
        } catch {}
      }

      // Extraer comprobantes para previsualización inmediata si el llamante los requiere
      const comprobantesExtraidos = await extraerComprobantesDeZip(resDescarga.paquete_zip_base64);

      return NextResponse.json({
        codigo: 5000,
        id_paquete: targetPaquete,
        paquete_b64: resDescarga.paquete_zip_base64,
        zip_base64: resDescarga.paquete_zip_base64,
        comprobantes: comprobantesExtraidos
      }, { status: 200 });
    }

    // =========================================================================
    // 6. FALLBACK HACIA EL BACKEND REMOTO
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

    // Si la respuesta del backend remoto o PAC devolvió una solicitud exitosa, guardarla en sat_solicitudes_descarga local
    const idSolExito = data?.solicitud || data?.id_solicitud || data?.id || data?.folio || data?.peticion_id;
    if (idSolExito && typeof idSolExito === 'string') {
      try {
        const rfcSol = (Array.isArray(body?.rfc) ? body.rfc[0] : (body?.rfc || '')).toUpperCase().trim();
        const tipoDesc = (endpoint.includes('meta') ? 'Metadata' : 'CFDI');
        const petStr = String(body?.peticion || body?.tipoPeticion || '').toLowerCase();
        const tipoSol = petStr.includes('recib') ? 'Recibidos' : 'Emitidos';

        await prisma.sat_solicitudes_descarga.upsert({
          where: { id_solicitud: idSolExito },
          update: {
            rfc: rfcSol || undefined,
            tipo_descarga: tipoDesc,
            tipo_solicitud: tipoSol,
            fecha_inicio: body?.fechaInicio || body?.fecha_inicio || undefined,
            fecha_fin: body?.fechaFin || body?.fecha_fin || undefined,
            estado_texto: data?.estado || data?.mensaje || 'Aceptada',
            updated_at: new Date()
          },
          create: {
            id_solicitud: idSolExito,
            rfc: rfcSol || 'N/A',
            tipo_descarga: tipoDesc,
            tipo_solicitud: tipoSol,
            fecha_inicio: body?.fechaInicio || body?.fecha_inicio || '',
            fecha_fin: body?.fechaFin || body?.fecha_fin || '',
            estado_solicitud: 1,
            estado_texto: data?.estado || data?.mensaje || 'Aceptada',
            mensaje: data?.mensaje || 'Solicitud generada ante el SAT',
            created_at: new Date(),
            updated_at: new Date()
          }
        });
      } catch (errSave) {
        console.warn('[Proxy Fallback]: No se pudo persistir solicitud en DB local:', errSave.message);
      }
    }

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
