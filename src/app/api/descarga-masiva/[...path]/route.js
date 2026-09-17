import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
  const pathArray = params.path || [];
  const endpointPath = '/' + pathArray.join('/');

  // URL del microservicio backend (puede ser configurada en .env)
  const backendBase =
    process.env.DESCARGA_MASIVA_BACKEND_URL ||
    process.env.NEXT_PUBLIC_DESCARGA_MASIVA_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'https://api.sandbox.wisefacturacion.com';

  const cleanBase = backendBase.replace(/\/+$/, '');
  // Si backendBase ya contiene /api/descargamasiva o un puerto específico, respetarlo; de lo contrario anexar /api/descargamasiva
  const prefix = cleanBase.includes('/api/descargamasiva') ? '' : '/api/descargamasiva';
  const targetUrl = `${cleanBase}${prefix}${endpointPath}`;

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

    console.log(`[Proxy Descarga Masiva] POST ${targetUrl}`);
    console.log(`[Proxy Descarga Masiva] Body enviado:`, JSON.stringify(body, null, 2));

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    let responseData;
    if (contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }

    console.log(`[Proxy Descarga Masiva] Backend status: ${response.status}`, responseData);

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error(`[Proxy Descarga Masiva] Error conectando con ${targetUrl}:`, error.message);
    return NextResponse.json(
      {
        error: `No se pudo conectar con el backend en ${targetUrl}. ${error.message}`,
        detalles: error.message,
        url_intentada: targetUrl,
      },
      { status: 502 }
    );
  }
}
