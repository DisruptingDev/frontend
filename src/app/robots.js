// c:/Users/macal/OneDrive/Documentos/Wise/Landing-front/frontend/src/app/robots.js
import { NextResponse } from 'next/server';

export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/private/'], // Bloquea rutas que no quieres que se indexen
      },
    ],
    sitemap: 'https://your-domain.com/sitemap.xml', // Reemplaza con tu dominio
  };
}
