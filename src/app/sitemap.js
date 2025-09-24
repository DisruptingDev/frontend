// c:/Users/macal/OneDrive/Documentos/Wise/Landing-front/frontend/src/app/sitemap.js

// Reemplaza esta URL base con el dominio de tu aplicación
const BASE_URL = 'https://your-domain.com';

export default async function sitemap() {
  // Lista de rutas estáticas principales
  const staticRoutes = [
    '/',
    '/Privacidad',
    '/IniciaSesion',
    '/RegistroEmisores',
    '/RegistroClientes',
    '/ConfirmacionCorreo',
  ].map((route) => ({
    url: `${BASE_URL}${route}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'monthly',
    priority: route === '/' ? 1 : 0.8,
  }));

  // Aquí podrías añadir rutas dinámicas en el futuro
  // Por ejemplo, fetching de productos, artículos de blog, etc.
  // const dynamicRoutes = ...

  return [...staticRoutes];
}
