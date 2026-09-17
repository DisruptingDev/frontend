import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const pathArray = params.path || [];
  const endpointPath = '/' + pathArray.join('/');

  // URL base del backend desde variables de entorno
  const backendBase = (
    process.env.DESCARGA_MASIVA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DESCARGA_MASIVA_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.sandbox.wisefacturacion.com'
  ).replace(/\/+$/, '');

  // Determinar prefijos candidatos según el entorno (producción vs sandbox)
  // En producción (api.wisefacturacion.com) está en /api/buzontributario
  // En sandbox (api.sandbox.wisefacturacion.com) está en /api/descargamasiva
  let prefixes = [];
  if (process.env.DESCARGA_MASIVA_PREFIX) {
    prefixes = [process.env.DESCARGA_MASIVA_PREFIX];
  } else if (backendBase.includes('sandbox')) {
    prefixes = ['/api/descargamasiva', '/api/buzontributario', ''];
  } else {
    prefixes = ['/api/buzontributario', '/api/descargamasiva', ''];
  }

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

    for (const prefix of prefixes) {
      const cleanPrefix = prefix ? (prefix.startsWith('/') ? prefix : `/${prefix}`) : '';
      const targetUrl = `${backendBase}${cleanPrefix}${endpointPath}`;

      console.log(`[Proxy Descarga Masiva] Intentando POST: ${targetUrl}`);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      lastResponse = response;
      successfulUrl = targetUrl;

      // Si no es 404, encontramos el microservicio correcto
      if (response.status !== 404) {
        break;
      }
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
        error: `Error de conexión con el backend: ${error.message}`,
        detalles: error.message,
      },
      { status: 502 }
    );
  }
}
