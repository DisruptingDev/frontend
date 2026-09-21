import { NextResponse } from 'next/server';

export async function POST(request, context) {
  // En Next.js 15, context.params es una Promesa
  const resolvedParams = context?.params ? await context.params : {};
  const pathParam = resolvedParams.path;
  const pathArray = Array.isArray(pathParam) ? pathParam : pathParam ? [pathParam] : [];

  // Extracción limpia del path
  let endpointPath = pathArray.length > 0 ? '/' + pathArray.join('/') : '';
  if (!endpointPath || endpointPath === '/') {
    const pathname = request.nextUrl?.pathname || new URL(request.url).pathname;
    endpointPath = pathname.replace(/^\/api\/descarga-masiva/, '');
  }
  if (!endpointPath.startsWith('/')) {
    endpointPath = '/' + endpointPath;
  }

  // Se utiliza exclusivamente NEXT_PUBLIC_API_URL o API_URL ya configurados en el .env / Vercel
  const baseRaw =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_URL ||
    'https://api.wisefacturacion.com';

  const baseUrl = (baseRaw.startsWith('http') ? baseRaw : `https://${baseRaw}`).replace(/\/+$/, '');
  const targetUrl = `${baseUrl}/api/descargamasiva${endpointPath}`;

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
      const cleanToken = authHeader.replace(/^Bearer\s+/i, '').trim();
      headers['Authorization'] = `Bearer ${cleanToken}`;
    }

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

    console.log(`[Proxy Descarga Masiva] ${targetUrl} (Status ${response.status}):`, responseData);

    if (typeof responseData === 'object' && responseData !== null) {
      responseData._proxy_target_url = targetUrl;
    }

    return NextResponse.json(responseData, { status: response.status });
  } catch (error) {
    console.error(`[Proxy Descarga Masiva] Error conectando a ${targetUrl}:`, error.message);
    return NextResponse.json(
      {
        Error: `Error interno de conexión con el backend: ${error.message}`,
        targetUrl,
      },
      { status: 502 }
    );
  }
}
