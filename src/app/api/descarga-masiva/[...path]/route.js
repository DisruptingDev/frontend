import { NextResponse } from 'next/server';

export async function POST(request, context) {
  // En Next.js 15, context.params es una Promesa
  const resolvedParams = context?.params ? await context.params : {};
  const pathParam = resolvedParams.path;
  const pathArray = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];

  // Extracción robusta de ruta con fallback a nextUrl.pathname
  let endpointPath = pathArray.length > 0 ? '/' + pathArray.join('/') : '';
  if (!endpointPath || endpointPath === '/') {
    const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
    endpointPath = pathname.replace(/^\/api\/descarga-masiva/, '');
  }
  if (!endpointPath.startsWith('/')) {
    endpointPath = '/' + endpointPath;
  }

  // URL base del backend desde variables de entorno
  const candidateBases = [
    process.env.DESCARGA_MASIVA_BACKEND_URL,
    process.env.NEXT_PUBLIC_DESCARGA_MASIVA_URL,
    process.env.NEXT_PUBLIC_API_URL,
    process.env.API_URL ? `https://${process.env.API_URL.replace(/^https?:\/\//, '')}` : null,
    'https://api.wisefacturacion.com',
    'https://api.sandbox.wisefacturacion.com',
  ]
    .filter(Boolean)
    .map((b) => b.replace(/\/+$/, ''));

  // Prefijos a probar
  const candidatePrefixes = process.env.DESCARGA_MASIVA_PREFIX
    ? [process.env.DESCARGA_MASIVA_PREFIX]
    : ['/api/buzontributario', '/api/descargamasiva', ''];

  try {
    let body = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const authHeader = request.headers.get('authorization') || '';
    const headers = {
      'Content-Type': 'application/json',
    };
    if (authHeader) {
      headers['Authorization'] = authHeader;
    }

    let lastResponse = null;
    let successfulUrl = '';
    let found = false;

    // Intentar candidatos hasta encontrar el microservicio que no devuelva 404 ni 502
    for (const base of candidateBases) {
      for (const prefix of candidatePrefixes) {
        const cleanPrefix = prefix ? (prefix.startsWith('/') ? prefix : `/${prefix}`) : '';
        const targetUrl = `${base}${cleanPrefix}${endpointPath}`;

        try {
          const response = await fetch(targetUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify(body),
          });

          lastResponse = response;
          successfulUrl = targetUrl;

          if (response.status !== 404 && response.status !== 502) {
            found = true;
            break;
          }
        } catch (fetchErr) {
          console.warn(`[Proxy Descarga Masiva] Error conectando a ${targetUrl}:`, fetchErr.message);
        }
      }
      if (found) break;
    }

    if (!lastResponse) {
      return NextResponse.json(
        { error: 'No se pudo conectar con ningún servidor de backend para Descarga Masiva.' },
        { status: 502 }
      );
    }

    const contentType = lastResponse.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await lastResponse.json();
    } else {
      responseData = await lastResponse.text();
    }

    console.log(`[Proxy Descarga Masiva] Resultado (${successfulUrl}) status: ${lastResponse.status}`);

    return NextResponse.json(responseData, { status: lastResponse.status });
  } catch (error) {
    console.error(`[Proxy Descarga Masiva] Error general:`, error.message);
    return NextResponse.json(
      {
        error: `Error interno de conexión: ${error.message}`,
        detalles: error.message,
      },
      { status: 502 }
    );
  }
}
