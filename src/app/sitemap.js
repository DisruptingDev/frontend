// c:/Users/macal/OneDrive/Documentos/Wise/Landing-front/frontend/src/app/sitemap.js

// Reemplaza esta URL base con el dominio de tu aplicación
const BASE_URL = 'https://www.wisefacturacion.com';

export default async function sitemap() {
  // Lista de rutas estáticas principales
  const staticRoutes = [
    '/',
    '/multi-rfc',
    '/descarga-masiva-sat',
    '/timbrado-nomina',
    '/modulo-cobranza',
    '/modulo-contabilidad',
    '/folios-sin-costo',
    '/Privacidad',
    '/IniciaSesion',
    '/AltaUsuarios',
    '/RegistroEmisores',
    '/RegistroClientes',
    '/ConfirmacionCorreo',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'weekly',
    priority: route === '/' ? 1 : 0.85,
  }));

  // Aquí podrías añadir rutas dinámicas en el futuro
  // Por ejemplo, fetching de productos, artículos de blog, etc.
  // const dynamicRoutes = ...

  return [...staticRoutes];
}
